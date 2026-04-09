import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OllamaEvaluationEngine } from '../OllamaEvaluationEngine.js';
import type { Submission } from '../../../domain/learner/Submission.js';
import type { KnowledgeNode } from '../../../domain/content/KnowledgeNode.js';
import type { AssessmentTemplate } from '../../../domain/content/AssessmentTemplate.js';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const submission: Submission = {
  id: 'sub-1',
  learnerId: 'learner-1',
  sessionId: 'session-1',
  nodeId: 'node-1',
  templateId: 'template-1',
  rawAnswer: 'An agent is an autonomous entity that perceives and acts. It is important because...',
  submittedAt: new Date('2024-01-01T00:00:00Z'),
};

const node: KnowledgeNode = {
  id: 'node-1',
  pillar: 'agents',
  nodeType: 'concept',
  title: 'What is an Agent?',
  summary: 'Foundational concept of AI agents.',
  prerequisites: [],
  related: ['node-2'],
  assessmentTemplateId: 'template-1',
  masteryStageTarget: 'understanding',
  teacherPromptMode: 'guided',
  body: 'An agent is a system that perceives its environment and takes actions.',
};

const template: AssessmentTemplate = {
  id: 'template-1',
  nodeId: 'node-1',
  instructions: 'Explain what an agent is covering all required slots.',
  requiredSlots: ['definition', 'importance', 'relation', 'example', 'boundary'],
  rubric: {
    passRules: [
      { slot: 'definition', description: 'Clearly defines an agent.' },
      { slot: 'importance', description: 'Explains why agents matter.' },
    ],
    failRules: [
      { slot: 'definition', description: 'Missing core definition.' },
    ],
    remediationRules: [
      { slot: 'relation', description: 'Relation to prerequisite missing.' },
    ],
  },
};

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

function makePassResponse(): object {
  return {
    id: 'cmpl-1',
    model: 'gemma4:e2b',
    choices: [
      {
        message: {
          content: JSON.stringify({
            result: 'pass',
            score: 85,
            rubricSlots: {
              definition: { present: true, quality: 'strong' },
              importance: { present: true, quality: 'adequate' },
              relation: { present: true, quality: 'adequate' },
              example: { present: true, quality: 'adequate' },
              boundary: { present: true, quality: 'weak' },
            },
            feedback: 'Good answer overall.',
            missingPoints: [],
            confidence: 0.9,
          }),
        },
      },
    ],
  };
}

function makeBadJsonResponse(): object {
  return {
    id: 'cmpl-bad',
    model: 'gemma4:e2b',
    choices: [{ message: { content: 'not json at all!!!' } }],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('OllamaEvaluationEngine', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Health check calls /api/tags
  // -------------------------------------------------------------------------
  it('isAvailable calls /api/tags', async () => {
    const engine = new OllamaEvaluationEngine({ ollamaUrl: 'http://localhost:11434' });
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }));

    const available = await engine.isAvailable();

    expect(available).toBe(true);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      'http://localhost:11434/api/tags',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('isAvailable returns false when Ollama is unreachable', async () => {
    const engine = new OllamaEvaluationEngine({ ollamaUrl: 'http://localhost:11434' });
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const available = await engine.isAvailable();

    expect(available).toBe(false);
  });

  // -------------------------------------------------------------------------
  // No CF headers in any request
  // -------------------------------------------------------------------------
  it('does not send CF headers in chat completion requests', async () => {
    const engine = new OllamaEvaluationEngine({ ollamaUrl: 'http://localhost:11434' });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makePassResponse()), { status: 200 }),
    );

    await engine.evaluate(submission, node, template);

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const headers = (callArgs[1] as RequestInit).headers as Record<string, string>;
    expect(headers).not.toHaveProperty('CF-Access-Client-Id');
    expect(headers).not.toHaveProperty('CF-Access-Client-Secret');
  });

  it('does not send CF headers in health check requests', async () => {
    const engine = new OllamaEvaluationEngine({ ollamaUrl: 'http://localhost:11434' });
    vi.mocked(fetch).mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await engine.isAvailable();

    const callArgs = vi.mocked(fetch).mock.calls[0];
    const options = callArgs[1] as RequestInit;
    // Health check should only have signal, no headers with CF keys
    expect(options.headers).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // Successful evaluation flow
  // -------------------------------------------------------------------------
  it('returns pass evaluation with valid JSON response', async () => {
    const engine = new OllamaEvaluationEngine({ ollamaUrl: 'http://localhost:11434' });
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makePassResponse()), { status: 200 }),
    );

    const result = await engine.evaluate(submission, node, template);

    expect(result.result).toBe('pass');
    expect(result.submissionId).toBe('sub-1');
    expect(result.evaluatorModel).toBe('gemma4:e2b');
    expect(result.score).toBe(85);
    expect(result.rubricSlots).toHaveLength(5);
    expect(result).not.toHaveProperty('confidence');
  });

  // -------------------------------------------------------------------------
  // ParseError retry: first bad JSON, second good JSON → succeed
  // -------------------------------------------------------------------------
  it('retries once on ParseError and succeeds on second attempt', async () => {
    const engine = new OllamaEvaluationEngine({ ollamaUrl: 'http://localhost:11434' });
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(makeBadJsonResponse()), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(makePassResponse()), { status: 200 }),
      );

    const result = await engine.evaluate(submission, node, template);

    expect(result.result).toBe('pass');
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // ParseError double failure: both bad JSON → throw
  // -------------------------------------------------------------------------
  it('throws when both attempts return bad JSON', async () => {
    const engine = new OllamaEvaluationEngine({ ollamaUrl: 'http://localhost:11434' });
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify(makeBadJsonResponse()), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify(makeBadJsonResponse()), { status: 200 }),
      );

    await expect(engine.evaluate(submission, node, template)).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Timeout uses 60_000 default
  // -------------------------------------------------------------------------
  it('uses 60_000ms default timeout', () => {
    const engine = new OllamaEvaluationEngine({ ollamaUrl: 'http://localhost:11434' });
    // Access private field via any cast to verify default
    expect((engine as any).timeoutMs).toBe(60_000);
  });

  // -------------------------------------------------------------------------
  // Ollama unreachable → degraded
  // -------------------------------------------------------------------------
  it('throws with temporary-eval-unavailable code when Ollama is unreachable', async () => {
    const engine = new OllamaEvaluationEngine({ ollamaUrl: 'http://localhost:11434' });
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(engine.evaluate(submission, node, template)).rejects.toMatchObject({
      code: 'temporary-eval-unavailable',
      available: false,
    });
  });
});
