import type { EvaluationEngine } from '../../ports/EvaluationEngine.js';
import type { Submission } from '../../domain/learner/Submission.js';
import type { SubmissionEvaluation } from '../../domain/learner/SubmissionEvaluation.js';
import type { KnowledgeNode } from '../../domain/content/KnowledgeNode.js';
import type { AssessmentTemplate } from '../../domain/content/AssessmentTemplate.js';
import { buildEvaluationPrompt } from './prompt-builder.js';
import { parseEvalOutput, ParseError } from './output-parser.js';
import { applyGuardrails } from './guardrails.js';
import { buildDegradedResult } from './degraded-mode.js';

interface LlmChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface LlmChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class LlmEvaluationEngine implements EvaluationEngine {
  private readonly llmUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: {
    llmUrl: string;
    model?: string | undefined;
    timeoutMs?: number | undefined;
  }) {
    this.llmUrl = options.llmUrl.replace(/\/$/, '');
    this.model = options.model ?? 'gemma4:e2b';
    this.timeoutMs = options.timeoutMs ?? 60_000;
  }

  async evaluate(
    submission: Submission,
    node: KnowledgeNode,
    template: AssessmentTemplate,
  ): Promise<SubmissionEvaluation> {
    const prompt = buildEvaluationPrompt(submission, node, template);

    const messages: LlmChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an educational evaluator. Return only valid JSON matching the requested schema. No markdown, no explanation.',
      },
      { role: 'user', content: prompt },
    ];

    let responseJson: LlmChatCompletionResponse;
    try {
      responseJson = await this.callLlm(messages);
    } catch (err) {
      // LLM backend unreachable — return degraded sentinel
      // Caller is responsible for preserving the submission
      const degraded = buildDegradedResult();
      throw Object.assign(
        new Error(`Evaluation unavailable: ${degraded.error}`),
        { code: degraded.error, available: degraded.available },
      );
    }

    const content = responseJson.choices[0]?.message.content ?? '';
    const evaluatorModel = responseJson.model;

    try {
      const raw = parseEvalOutput(content);
      return applyGuardrails(raw, submission.id, evaluatorModel);
    } catch (err) {
      if (err instanceof ParseError) {
        // Retry once on ParseError — small models sometimes produce bad JSON on first try
        let retryResponseJson: LlmChatCompletionResponse;
        try {
          retryResponseJson = await this.callLlm(messages);
        } catch {
          const degraded = buildDegradedResult();
          throw Object.assign(
            new Error(`Evaluation unavailable: ${degraded.error}`),
            { code: degraded.error, available: degraded.available },
          );
        }
        const retryContent = retryResponseJson.choices[0]?.message.content ?? '';
        const retryModel = retryResponseJson.model;
        const raw = parseEvalOutput(retryContent);
        return applyGuardrails(raw, submission.id, retryModel);
      }
      throw err;
    }
  }

  // Uses /v1/models (OpenAI-compatible) — works with Ollama, llama.cpp, and any OpenAI-compatible backend. Only checks response.ok, does not parse body (format differs between backends).
  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      try {
        const response = await fetch(`${this.llmUrl}/v1/models`, {
          signal: controller.signal,
        });
        return response.ok;
      } finally {
        clearTimeout(timer);
      }
    } catch {
      return false;
    }
  }

  private async callLlm(
    messages: LlmChatMessage[],
  ): Promise<LlmChatCompletionResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.llmUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.05,
          max_tokens: 512,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LLM backend responded with status ${response.status}`);
      }

      return (await response.json()) as LlmChatCompletionResponse;
    } finally {
      clearTimeout(timer);
    }
  }
}
