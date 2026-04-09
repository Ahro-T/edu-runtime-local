import type { Logger } from 'pino';
import type { DbClient } from './adapters/db/connection.js';
import { LearnerService } from './services/LearnerService.js';
import { SessionService } from './services/SessionService.js';
import { ContentService } from './services/ContentService.js';
import { SubmissionService } from './services/SubmissionService.js';
import { EvaluationService } from './services/EvaluationService.js';
import { AdvancementService } from './services/AdvancementService.js';
import { ReviewService } from './services/ReviewService.js';
import { DashboardService } from './services/DashboardService.js';
import type { ApiRoutes } from './api/server.js';
export interface CompositionRootOptions {
    db: DbClient;
    vaultPath: string;
    vllmUrl: string;
    logger: Logger;
}
export interface CompositionRoot {
    services: {
        learnerService: LearnerService;
        sessionService: SessionService;
        contentService: ContentService;
        submissionService: SubmissionService;
        evaluationService: EvaluationService;
        advancementService: AdvancementService;
        reviewService: ReviewService;
        dashboardService: DashboardService;
    };
    routes: ApiRoutes;
}
export declare function buildCompositionRoot(opts: CompositionRootOptions): CompositionRoot;
//# sourceMappingURL=composition-root.d.ts.map