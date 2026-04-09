import { eq } from 'drizzle-orm';
import { submissions, submissionEvaluations } from './schema.js';
import { AppError } from '../../domain/errors.js';
import { and } from 'drizzle-orm';
export class DrizzleSubmissionStore {
    db;
    logger;
    constructor(db, logger) {
        this.db = db;
        this.logger = logger;
    }
    async createSubmission(submission) {
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
        if (!row)
            throw new AppError('INTERNAL_ERROR', 'createSubmission returned no row');
        return this.mapSubmission(row);
    }
    async getSubmission(id) {
        const [row] = await this.db.select().from(submissions).where(eq(submissions.id, id));
        return row ? this.mapSubmission(row) : null;
    }
    async getSubmissionsForNode(learnerId, nodeId) {
        const rows = await this.db
            .select()
            .from(submissions)
            .where(and(eq(submissions.learnerId, learnerId), eq(submissions.nodeId, nodeId)));
        return rows.map((r) => this.mapSubmission(r));
    }
    async createEvaluation(evaluation) {
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
        if (!row)
            throw new AppError('INTERNAL_ERROR', 'createEvaluation returned no row');
        return this.mapEvaluation(row);
    }
    async getEvaluationForSubmission(submissionId) {
        const [row] = await this.db
            .select()
            .from(submissionEvaluations)
            .where(eq(submissionEvaluations.submissionId, submissionId));
        return row ? this.mapEvaluation(row) : null;
    }
    mapSubmission(row) {
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
    mapEvaluation(row) {
        return {
            submissionId: row.submissionId,
            evaluatorModel: row.evaluatorModel,
            result: row.result,
            score: row.score,
            rubricSlots: (row.rubricSlots ?? []),
            feedback: row.feedback,
            missingPoints: (row.missingPoints ?? []),
        };
    }
}
//# sourceMappingURL=DrizzleSubmissionStore.js.map