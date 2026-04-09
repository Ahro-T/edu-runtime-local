import { AppError } from '../domain/errors.js';
export class DashboardService {
    store;
    eventStore;
    submissionStore;
    logger;
    constructor({ learnerStateStore, learnerEventStore, submissionStore, contentRepository, logger }) {
        this.store = learnerStateStore;
        this.eventStore = learnerEventStore;
        this.submissionStore = submissionStore;
        this.logger = logger.child({ service: 'DashboardService' });
    }
    async getDashboard(learnerId) {
        const log = this.logger.child({ learnerId });
        const learner = await this.store.getLearnerById(learnerId);
        if (!learner)
            throw new AppError('LEARNER_NOT_FOUND', `Learner not found: ${learnerId}`);
        const [nodeStates, pendingReviews] = await Promise.all([
            this.store.getNodeStatesForLearner(learnerId),
            this.eventStore.getPendingJobs(learnerId),
        ]);
        // Get active sessions across all pillars
        const pillars = ['agents', 'harnesses', 'openclaw'];
        const sessionPromises = pillars.map((p) => this.store.getActiveSession(learnerId, p));
        const sessionsRaw = await Promise.all(sessionPromises);
        const activeSessions = sessionsRaw.filter((s) => s !== null);
        // Count total submissions for the learner (aggregate across all nodes)
        let totalSubmissions = 0;
        for (const ns of nodeStates) {
            const subs = await this.submissionStore.getSubmissionsForNode(learnerId, ns.nodeId);
            totalSubmissions += subs.length;
        }
        const passedNodes = nodeStates.filter((ns) => ns.status === 'passed' || ns.status === 'mastered').length;
        log.debug({ passedNodes, totalSubmissions }, 'Dashboard assembled');
        return {
            learner,
            activeSessions,
            nodeStates,
            pendingReviews,
            totalSubmissions,
            passedNodes,
        };
    }
}
//# sourceMappingURL=DashboardService.js.map