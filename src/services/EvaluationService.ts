import { randomUUID } from 'crypto';
import type { Logger } from 'pino';
import type { LearnerStateStore } from '../ports/LearnerStateStore.js';
import type { LearnerEventStore } from '../ports/LearnerEventStore.js';
import type { SubmissionStore } from '../ports/SubmissionStore.js';
import type { ContentRepository } from '../ports/ContentRepository.js';
import type { EvaluationEngine } from '../ports/EvaluationEngine.js';
import type { SubmissionEvaluation } from '../domain/learner/SubmissionEvaluation.js';
import { AppError } from '../domain/errors.js';
import { transitionNodeState } from '../domain/learner/state-machines.js';

export interface EvaluationServiceDeps {
  learnerStateStore: LearnerStateStore;
  learnerEventStore: LearnerEventStore;
  submissionStore: SubmissionStore;
  contentRepository: ContentRepository;
  evaluationEngine: EvaluationEngine;
  logger: Logger;
}

export class EvaluationService {
  private readonly store: LearnerStateStore;
  private readonly eventStore: LearnerEventStore;
  private readonly submissionStore: SubmissionStore;
  private readonly content: ContentRepository;
  private readonly engine: EvaluationEngine;
  private readonly logger: Logger;

  constructor({ learnerStateStore, learnerEventStore, submissionStore, contentRepository, evaluationEngine, logger }: EvaluationServiceDeps) {
    this.store = learnerStateStore;
    this.eventStore = learnerEventStore;
    this.submissionStore = submissionStore;
    this.content = contentRepository;
    this.engine = evaluationEngine;
    this.logger = logger.child({ service: 'EvaluationService' });
  }

  async evaluateSubmission(submissionId: string): Promise<SubmissionEvaluation> {
    const log = this.logger.child({ submissionId });

    const submission = await this.submissionStore.getSubmission(submissionId);
    if (!submission) throw new AppError('SESSION_NOT_FOUND', `Submission not found: ${submissionId}`);

    const node = await this.content.getNodeById(submission.nodeId);
    if (!node) throw new AppError('NODE_NOT_FOUND', `Node not found: ${submission.nodeId}`);

    const template = await this.content.getTemplateByNodeId(submission.nodeId);
    if (!template) throw new AppError('TEMPLATE_NOT_FOUND', `No template for node: ${submission.nodeId}`);

    // Check degraded mode
    const available = await this.engine.isAvailable();
    if (!available) {
      log.warn('Evaluation engine unavailable — degraded mode');
      // Return temporary unavailable evaluation (not persisted to avoid corrupt state)
      throw new AppError('EVALUATION_UNAVAILABLE', 'Evaluation engine is currently unavailable');
    }

    let evaluation: SubmissionEvaluation;
    try {
      evaluation = await this.engine.evaluate(submission, node, template);
    } catch (err) {
      log.error({ err }, 'Evaluation failed');
      await this.eventStore.appendEvent({
        id: randomUUID(),
        type: 'submission_failed',
        learnerId: submission.learnerId,
        sessionId: submission.sessionId,
        nodeId: submission.nodeId,
        timestamp: new Date(),
        payload: { submissionId, error: String(err) },
      });
      throw err;
    }

    const saved = await this.submissionStore.createEvaluation(evaluation);

    // Transition NodeState based on result
    const existingState = await this.store.getNodeState(submission.learnerId, submission.nodeId);
    if (existingState) {
      const now = new Date();
      let nextStatus = existingState.status;
      let passedAt = existingState.passedAt;

      if (evaluation.result === 'pass') {
        nextStatus = transitionNodeState(existingState.status, 'pass');
        passedAt = now;
      } else if (evaluation.result === 'remediation') {
        nextStatus = transitionNodeState(existingState.status, 'fail_remediation');
      }
      // 'fail' stays in studying

      await this.store.upsertNodeState({
        ...existingState,
        status: nextStatus,
        lastScore: evaluation.score,
        lastSubmissionId: submissionId,
        passedAt,
        updatedAt: now,
      });
    }

    const eventType = evaluation.result === 'pass' ? 'submission_passed' :
                      evaluation.result === 'remediation' ? 'remediation_assigned' :
                      'submission_failed';

    await this.eventStore.appendEvent({
      id: randomUUID(),
      type: eventType,
      learnerId: submission.learnerId,
      sessionId: submission.sessionId,
      nodeId: submission.nodeId,
      timestamp: new Date(),
      payload: { submissionId, result: evaluation.result, score: evaluation.score },
    });

    log.info({ result: evaluation.result, score: evaluation.score }, 'Evaluation completed');
    return saved;
  }
}
