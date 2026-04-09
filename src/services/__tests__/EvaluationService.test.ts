import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvaluationService } from '../EvaluationService.js';
import type { LearnerStateStore } from '../../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../../ports/LearnerEventStore.js';
import type { SubmissionStore } from '../../ports/SubmissionStore.js';
import type { ContentRepository } from '../../ports/ContentRepository.js';
import type { EvaluationEngine } from '../../ports/EvaluationEngine.js';
import type { Submission } from '../../domain/learner/Submission.js';
import type { NodeState } from '../../domain/learner/NodeState.js';
import type { SubmissionEvaluation } from '../../domain/learner/SubmissionEvaluation.js';
import pino from 'pino';

const logger = pino({ level: 'silent' });

const mockSubmission: Submission = {
  id: 'sub-1',
  learnerId: 'learner-1',
  sessionId: 'session-1',
  nodeId: 'node-1',
  templateId: 'tpl-1',
  rawAnswer: 'Answer',
  submittedAt: new Date(),
};

const mockNodeState: NodeState = {
  id: 'ns-1',
  learnerId: 'learner-1',
  nodeId: 'node-1',
  status: 'studying',
  masteryLevel: 'descriptive',
  attemptCount: 1,
  lastScore: null,
  lastSubmissionId: 'sub-1',
  nextReviewAt: null,
  passedAt: null,
  updatedAt: new Date(),
};

const mockEvaluation: SubmissionEvaluation = {
  submissionId: 'sub-1',
  evaluatorModel: 'test-model',
  result: 'pass',
  score: 0.9,
  rubricSlots: [],
  feedback: 'Good',
  missingPoints: [],
};

function makeStores() {
  const stateStore: LearnerStateStore = {
    upsertLearner: vi.fn(async (l) => l),
    getLearnerById: vi.fn(async () => null),
    getLearnerByDiscordId: vi.fn(async () => null),
    createSession: vi.fn(async (s) => ({ ...s, status: 'active', metadata: {}, startedAt: new Date(), updatedAt: new Date() })),
    getSession: vi.fn(async () => null),
    getActiveSession: vi.fn(async () => null),
    updateSessionStatus: vi.fn(async (id, status) => ({ id, learnerId: '', pillar: 'agents', currentNodeId: null, channelId: '', status, metadata: {}, startedAt: new Date(), updatedAt: new Date() })),
    getNodeState: vi.fn(async () => mockNodeState),
    upsertNodeState: vi.fn(async (ns) => ns),
    getNodeStatesForLearner: vi.fn(async () => []),
    getNodeStatesForSession: vi.fn(async () => []),
  };

  const eventStore: LearnerEventStore = {
    appendEvent: vi.fn(async (e) => e),
    getEventsForLearner: vi.fn(async () => []),
    getEventsForSession: vi.fn(async () => []),
    createReviewJob: vi.fn(async (j) => j),
    getPendingJobs: vi.fn(async () => []),
    updateJobStatus: vi.fn(async (id, status) => ({ id, learnerId: '', nodeId: '', jobType: 'review' as const, status, scheduledFor: new Date(), payload: {} })),
  };

  const submissionStore: SubmissionStore = {
    createSubmission: vi.fn(async (s) => s),
    getSubmission: vi.fn(async () => mockSubmission),
    getSubmissionsForNode: vi.fn(async () => []),
    createEvaluation: vi.fn(async (e) => e),
    getEvaluationForSubmission: vi.fn(async () => null),
  };

  const contentRepo: ContentRepository = {
    getNodeById: vi.fn(async () => ({
      id: 'node-1', pillar: 'agents', nodeType: 'concept', title: 'Test Node',
      summary: 'Summary', prerequisites: [], related: [], assessmentTemplateId: 'tpl-1',
      body: 'Body', masteryStageTarget: 'descriptive', teacherPromptMode: 'guided',
    })),
    getTemplateById: vi.fn(async () => null),
    getTemplateByNodeId: vi.fn(async () => ({
      id: 'tpl-1', nodeId: 'node-1', instructions: 'Instructions',
      requiredSlots: ['definition'], rubric: { pass: [], fail: [], remediation: [] },
    })),
    listNodesByPillar: vi.fn(async () => []),
    getPrerequisites: vi.fn(async () => []),
    getRelatedNodes: vi.fn(async () => []),
    validateContent: vi.fn(async () => []),
    exportSnapshot: vi.fn(async () => ({ nodes: [], templates: [], relations: [], exportedAt: new Date() })),
  };

  const evaluationEngine: EvaluationEngine = {
    evaluate: vi.fn(async () => mockEvaluation),
    isAvailable: vi.fn(async () => true),
  };

  return { stateStore, eventStore, submissionStore, contentRepo, evaluationEngine };
}

describe('EvaluationService', () => {
  let service: EvaluationService;
  let stores: ReturnType<typeof makeStores>;

  beforeEach(() => {
    stores = makeStores();
    service = new EvaluationService({
      learnerStateStore: stores.stateStore,
      learnerEventStore: stores.eventStore,
      submissionStore: stores.submissionStore,
      contentRepository: stores.contentRepo,
      evaluationEngine: stores.evaluationEngine,
      logger,
    });
  });

  it('evaluates a submission and returns result', async () => {
    const result = await service.evaluateSubmission('sub-1');
    expect(result.result).toBe('pass');
    expect(result.score).toBe(0.9);
  });

  it('transitions node state to passed on pass result', async () => {
    await service.evaluateSubmission('sub-1');
    const upsert = vi.mocked(stores.stateStore.upsertNodeState).mock.calls[0][0];
    expect(upsert.status).toBe('passed');
    expect(upsert.passedAt).toBeInstanceOf(Date);
  });

  it('transitions node state to remediation on remediation result', async () => {
    vi.mocked(stores.evaluationEngine.evaluate).mockResolvedValue({ ...mockEvaluation, result: 'remediation', score: 0.3 });
    await service.evaluateSubmission('sub-1');
    const upsert = vi.mocked(stores.stateStore.upsertNodeState).mock.calls[0][0];
    expect(upsert.status).toBe('remediation');
  });

  it('throws EVALUATION_UNAVAILABLE when engine is down', async () => {
    vi.mocked(stores.evaluationEngine.isAvailable).mockResolvedValue(false);
    await expect(service.evaluateSubmission('sub-1')).rejects.toMatchObject({ code: 'EVALUATION_UNAVAILABLE' });
  });

  it('emits submission_passed event on pass', async () => {
    await service.evaluateSubmission('sub-1');
    const event = vi.mocked(stores.eventStore.appendEvent).mock.calls[0][0];
    expect(event.type).toBe('submission_passed');
  });

  it('emits remediation_assigned event on remediation', async () => {
    vi.mocked(stores.evaluationEngine.evaluate).mockResolvedValue({ ...mockEvaluation, result: 'remediation', score: 0.3 });
    await service.evaluateSubmission('sub-1');
    const event = vi.mocked(stores.eventStore.appendEvent).mock.calls[0][0];
    expect(event.type).toBe('remediation_assigned');
  });
});
