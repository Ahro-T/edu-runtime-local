import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VllmEvaluationEngine } from '../VllmEvaluationEngine.js';
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
// vLLM response helpers
// ---------------------------------------------------------------------------

function makePassResponse(overrides: Partial<{
  result: string;
  rubricSlots: Record<string, { present: boolean; quality: string }>;
  confidence: number;
}> = {}): object {
  return {
    id: 'cmpl-1',
    model: 'meta-llama/Llama-3-8b',
    choices: [
      {
        message: {
          content: JSON.stringify({
            result: overrides.result ?? 'pass',
            score: 85,
            rubricSlots: overrides.rubricSlots ?? {
              definition: { present: true, quality: 'strong' },
              importance: { present: true, quality: 'adequate' },
              relation: { present: true, quality: 'adequate' },
              example: { present: true, quality: 'adequate' },
              boundary: { present: true, quality: 'weak' },
            },
            feedback: 'Good answer overall.',
            missingPoints: [],
            confidence: overrides.confidence ?? 0.9,
          }),
        },
      },
    ],
  };
}

function makeFailResponse(): object {
  return {
    id: 'cmpl-2',
    model: 'meta-llama/Llama-3-8b',
    choices: [
      {
        message: {
          content: JSON.stringify({
            result: 'fail',
            score: 20,
            rubricSlots: {
              definition: { present: false, quality: 'missing' },
              importance: { present: false, quality: 'missing' },
              relation: { present: false, quality: 'missing' },
              example: { present: false, quality: 'missing' },
              boundary: { present: false, quality: 'missing' },
            },
            feedback: 'Answer does not address the topic.',
            missingPoints: ['definition', 'importance', 'relation', 'example', 'boundary'],
            confidence: 0.95,
          }),
        },
      },
    ],
  };
}

function makeRemediationResponse(): object {
  return {
    id: 'cmpl-3',
    model: 'meta-llama/Llama-3-8b',
    choices: [
      {
        message: {
          content: JSON.stringify({
            result: 'remediation',
            score: 50,
            rubricSlots: {
              definition: { present: true, quality: 'weak' },
              importance: { present: true, quality: 'weak' },
              relation: { present: false, quality: 'missing' },
              example: { present: false, quality: 'missing' },
              boundary: { present: false, quality: 'missing' },
            },
            feedback: 'Partial understanding. Prerequisite knowledge appears weak.',
            missingPoints: ['relation', 'example', 'boundary'],
            confidence: 0.75,
          }),
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VllmEvaluationEngine', () => {
  const engine = new VllmEvaluationEngine({
    vllmUrl: 'http://localhost:8000',
    model: 'meta-llama/Llama-3-8b',
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Happy path: pass
  // -------------------------------------------------------------------------
  it('returns pass evaluation when all slots present and result is pass', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makePassResponse()), { status: 200 }),
    );

    const result = await engine.evaluate(submission, node, template);

    expect(result.result).toBe('pass');
    expect(result.submissionId).toBe('sub-1');
    expect(result.evaluatorModel).toBe('meta-llama/Llama-3-8b');
    expect(result.score).toBe(85);
    expect(result.rubricSlots).toHaveLength(5);
    // confidence must NOT be present in persisted result
    expect(result).not.toHaveProperty('confidence');
  });

  // -------------------------------------------------------------------------
  // Happy path: fail
  // -------------------------------------------------------------------------
  it('returns fail evaluation when model returns fail', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeFailResponse()), { status: 200 }),
    );

    const result = await engine.evaluate(submission, node, template);

    expect(result.result).toBe('fail');
    expect(result.missingPoints).toHaveLength(5);
    expect(result).not.toHaveProperty('confidence');
  });

  // -------------------------------------------------------------------------
  // Happy path: remediation
  // -------------------------------------------------------------------------
  it('returns remediation evaluation when model returns remediation', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makeRemediationResponse()), { status: 200 }),
    );

    const result = await engine.evaluate(submission, node, template);

    expect(result.result).toBe('remediation');
    expect(result).not.toHaveProperty('confidence');
  });

  // -------------------------------------------------------------------------
  // CRITICAL guardrail: pass with missing slots MUST become remediation
  // -------------------------------------------------------------------------
  it('converts pass to remediation when required slots are absent', async () => {
    const passWithMissingSlots = makePassResponse({
      result: 'pass',
      rubricSlots: {
        definition: { present: true, quality: 'strong' },
        importance: { present: true, quality: 'adequate' },
        relation: { present: false, quality: 'missing' }, // MISSING
        example: { present: false, quality: 'missing' },  // MISSING
        boundary: { present: true, quality: 'weak' },
      },
      confidence: 0.9,
    });

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(passWithMissingSlots), { status: 200 }),
    );

    const result = await engine.evaluate(submission, node, template);

    expect(result.result).toBe('remediation');
  });

  it('allows pass when all slots are present', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(makePassResponse()), { status: 200 }),
    );

    const result = await engine.evaluate(submission, node, template);

    expect(result.result).toBe('pass');
  });

  // -------------------------------------------------------------------------
  // Guardrail: low confidence + failed relation => remediation
  // -------------------------------------------------------------------------
  it('converts pass to remediation on low confidence and missing relation', async () => {
    const lowConfidencePass = makePassResponse({
      result: 'pass',
      rubricSlots: {
        definition: { present: true, quality: 'strong' },
        importance: { present: true, quality: 'adequate' },
        relation: { present: false, quality: 'missing' }, // relation missing
        example: { present: true, quality: 'adequate' },
        boundary: { present: true, quality: 'adequate' },
      },
      confidence: 0.3, // low confidence
    });

    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(lowConfidencePass), { status: 200 }),
    );

    const result = await engine.evaluate(submission, node, template);

    expect(result.result).toBe('remediation');
  });

  // -------------------------------------------------------------------------
  // Malformed JSON from vLLM
  // -------------------------------------------------------------------------
  it('throws ParseError when vLLM returns malformed JSON', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'cmpl-bad',
          model: 'test',
          choices: [{ message: { content: 'not json at all!!!' } }],
        }),
        { status: 200 },
      ),
    );

    await expect(engine.evaluate(submission, node, template)).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // Timeout / vLLM down
  // -------------------------------------------------------------------------
  it('throws with temporary-eval-unavailable code when vLLM is unreachable', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(engine.evaluate(submission, node, template)).rejects.toMatchObject({
      code: 'temporary-eval-unavailable',
      available: false,
    });
  });

  it('throws when fetch times out', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(
      Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }),
    );

    await expect(engine.evaluate(submission, node, template)).rejects.toMatchObject({
      code: 'temporary-eval-unavailable',
    });
  });

  // -------------------------------------------------------------------------
  // isAvailable() health check
  // -------------------------------------------------------------------------
  it('isAvailable returns true when /health responds 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('ok', { status: 200 }));

    const available = await engine.isAvailable();

    expect(available).toBe(true);
  });

  it('isAvailable returns false when /health responds 503', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response('down', { status: 503 }));

    const available = await engine.isAvailable();

    expect(available).toBe(false);
  });

  it('isAvailable returns false when vLLM is unreachable', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('ECONNREFUSED'));

    const available = await engine.isAvailable();

    expect(available).toBe(false);
  });
});
