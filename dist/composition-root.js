import { DrizzleLearnerStateStore } from './adapters/db/DrizzleLearnerStateStore.js';
import { DrizzleSubmissionStore } from './adapters/db/DrizzleSubmissionStore.js';
import { DrizzleLearnerEventStore } from './adapters/db/DrizzleLearnerEventStore.js';
import { ObsidianContentRepository } from './adapters/content/obsidian/ObsidianContentRepository.js';
import { VllmEvaluationEngine } from './adapters/evaluation/VllmEvaluationEngine.js';
import { LearnerService } from './services/LearnerService.js';
import { SessionService } from './services/SessionService.js';
import { ContentService } from './services/ContentService.js';
import { SubmissionService } from './services/SubmissionService.js';
import { EvaluationService } from './services/EvaluationService.js';
import { AdvancementService } from './services/AdvancementService.js';
import { ReviewService } from './services/ReviewService.js';
import { DashboardService } from './services/DashboardService.js';
import { learnersRoutes } from './api/routes/learners.js';
import { sessionsRoutes } from './api/routes/sessions.js';
import { nodesRoutes } from './api/routes/nodes.js';
import { submissionsRoutes } from './api/routes/submissions.js';
import { reviewsRoutes } from './api/routes/reviews.js';
import { dashboardRoutes } from './api/routes/dashboard.js';
export function buildCompositionRoot(opts) {
    const { db, vaultPath, vllmUrl, logger } = opts;
    // Adapters
    const learnerStateStore = new DrizzleLearnerStateStore(db, logger);
    const submissionStore = new DrizzleSubmissionStore(db, logger);
    const learnerEventStore = new DrizzleLearnerEventStore(db, logger);
    const contentRepository = new ObsidianContentRepository(vaultPath, logger);
    const evaluationEngine = new VllmEvaluationEngine({ vllmUrl });
    // Services
    const learnerService = new LearnerService({ learnerStateStore, learnerEventStore, logger });
    const sessionService = new SessionService({ learnerStateStore, learnerEventStore, contentRepository, logger });
    const contentService = new ContentService({ learnerStateStore, contentRepository, logger });
    const submissionService = new SubmissionService({ learnerStateStore, learnerEventStore, submissionStore, contentRepository, logger });
    const evaluationService = new EvaluationService({ learnerStateStore, learnerEventStore, submissionStore, contentRepository, evaluationEngine, logger });
    const advancementService = new AdvancementService({ learnerStateStore, learnerEventStore, contentRepository, logger });
    const reviewService = new ReviewService({ learnerStateStore, learnerEventStore, logger });
    const dashboardService = new DashboardService({ learnerStateStore, learnerEventStore, submissionStore, contentRepository, logger });
    // Routes
    const routes = {
        learners: learnersRoutes(learnerService),
        sessions: sessionsRoutes(sessionService),
        nodes: nodesRoutes(contentService, advancementService),
        submissions: submissionsRoutes(submissionService, evaluationService),
        reviews: reviewsRoutes(reviewService),
        dashboard: dashboardRoutes(dashboardService),
    };
    return {
        services: {
            learnerService,
            sessionService,
            contentService,
            submissionService,
            evaluationService,
            advancementService,
            reviewService,
            dashboardService,
        },
        routes,
    };
}
//# sourceMappingURL=composition-root.js.map