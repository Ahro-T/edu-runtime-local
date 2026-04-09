import type { EvaluationEngine } from '../../ports/EvaluationEngine.js';
import type { Submission } from '../../domain/learner/Submission.js';
import type { SubmissionEvaluation } from '../../domain/learner/SubmissionEvaluation.js';
import type { KnowledgeNode } from '../../domain/content/KnowledgeNode.js';
import type { AssessmentTemplate } from '../../domain/content/AssessmentTemplate.js';
import { buildEvaluationPrompt } from './prompt-builder.js';
import { parseEvalOutput, ParseError } from './output-parser.js';
import { applyGuardrails } from './guardrails.js';
import { buildDegradedResult } from './degraded-mode.js';

interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OllamaChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class OllamaEvaluationEngine implements EvaluationEngine {
  private readonly ollamaUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(options: {
    ollamaUrl: string;
    model?: string | undefined;
    timeoutMs?: number | undefined;
  }) {
    this.ollamaUrl = options.ollamaUrl.replace(/\/$/, '');
    this.model = options.model ?? 'gemma4:e2b';
    this.timeoutMs = options.timeoutMs ?? 60_000;
  }

  async evaluate(
    submission: Submission,
    node: KnowledgeNode,
    template: AssessmentTemplate,
  ): Promise<SubmissionEvaluation> {
    const prompt = buildEvaluationPrompt(submission, node, template);

    const messages: OllamaChatMessage[] = [
      {
        role: 'system',
        content:
          'You are an educational evaluator. Return only valid JSON matching the requested schema. No markdown, no explanation.',
      },
      { role: 'user', content: prompt },
    ];

    let responseJson: OllamaChatCompletionResponse;
    try {
      responseJson = await this.callOllama(messages);
    } catch (err) {
      // Ollama unreachable — return degraded sentinel
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
        let retryResponseJson: OllamaChatCompletionResponse;
        try {
          retryResponseJson = await this.callOllama(messages);
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

  async isAvailable(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5_000);
      try {
        const response = await fetch(`${this.ollamaUrl}/api/tags`, {
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

  private async callOllama(
    messages: OllamaChatMessage[],
  ): Promise<OllamaChatCompletionResponse> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.ollamaUrl}/v1/chat/completions`, {
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
        throw new Error(`Ollama responded with status ${response.status}`);
      }

      return (await response.json()) as OllamaChatCompletionResponse;
    } finally {
      clearTimeout(timer);
    }
  }
}
