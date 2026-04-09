import { eq } from 'drizzle-orm';
import type { DbClient } from './connection.js';
import { submissions, submissionEvaluations } from './schema.js';
import type { SubmissionStore } from '../../ports/SubmissionStore.js';
import type { Submission } from '../../domain/learner/Submission.js';
import type { SubmissionEvaluation, RubricSlotResult } from '../../domain/learner/SubmissionEvaluation.js';
import type { Logger } from '../../logger.js';
import { AppError } from '../../domain/errors.js';
import { and } from 'drizzle-orm';

export class DrizzleSubmissionStore implements SubmissionStore {
  constructor(
    private readonly db: DbClient,
    private readonly logger: Logger,
  ) {}

  async createSubmission(submission: Submission): Promise<Submission> {
    const [row] = await this.db
      .insert(submissions)
      .values({
        id: submission.id,
        learnerId: submission.learnerId,
        sessionId: submission.sessionId,
        nodeId: submission.nodeId,
        templateId: submission.templateId,
        rawAnswer: submission.rawAnswer,
        submittedAt: submission.submittedAt,
      })
      .returning();
    if (!row) throw new AppError('INTERNAL_ERROR', 'createSubmission returned no row');
    return this.mapSubmission(row);
  }

  async getSubmission(id: string): Promise<Submission | null> {
    const [row] = await this.db.select().from(submissions).where(eq(submissions.id, id));
    return row ? this.mapSubmission(row) : null;
  }

  async getSubmissionsForNode(learnerId: string, nodeId: string): Promise<Submission[]> {
    const rows = await this.db
      .select()
      .from(submissions)
      .where(and(eq(submissions.learnerId, learnerId), eq(submissions.nodeId, nodeId)));
    return rows.map((r) => this.mapSubmission(r));
  }

  async createEvaluation(evaluation: SubmissionEvaluation): Promise<SubmissionEvaluation> {
    const [row] = await this.db
      .insert(submissionEvaluations)
      .values({
        submissionId: evaluation.submissionId,
        evaluatorModel: evaluation.evaluatorModel,
        result: evaluation.result,
        score: evaluation.score,
        rubricSlots: evaluation.rubricSlots,
        feedback: evaluation.feedback,
        missingPoints: evaluation.missingPoints,
      })
      .returning();
    if (!row) throw new AppError('INTERNAL_ERROR', 'createEvaluation returned no row');
    return this.mapEvaluation(row);
  }

  async getEvaluationForSubmission(submissionId: string): Promise<SubmissionEvaluation | null> {
    const [row] = await this.db
      .select()
      .from(submissionEvaluations)
      .where(eq(submissionEvaluations.submissionId, submissionId));
    return row ? this.mapEvaluation(row) : null;
  }

  private mapSubmission(row: typeof submissions.$inferSelect): Submission {
    return {
      id: row.id,
      learnerId: row.learnerId,
      sessionId: row.sessionId,
      nodeId: row.nodeId,
      templateId: row.templateId,
      rawAnswer: row.rawAnswer,
      submittedAt: row.submittedAt,
    };
  }

  private mapEvaluation(row: typeof submissionEvaluations.$inferSelect): SubmissionEvaluation {
    return {
      submissionId: row.submissionId,
      evaluatorModel: row.evaluatorModel,
      result: row.result as SubmissionEvaluation['result'],
      score: row.score,
      rubricSlots: (row.rubricSlots ?? []) as RubricSlotResult[],
      feedback: row.feedback,
      missingPoints: (row.missingPoints ?? []) as string[],
    };
  }
}
