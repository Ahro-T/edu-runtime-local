import type { FastifyInstance } from 'fastify';
import type { SubmissionService } from '../../services/SubmissionService.js';
import type { EvaluationService } from '../../services/EvaluationService.js';
export declare function submissionsRoutes(submissionService: SubmissionService, evaluationService: EvaluationService): (app: FastifyInstance) => Promise<void>;
//# sourceMappingURL=submissions.d.ts.map