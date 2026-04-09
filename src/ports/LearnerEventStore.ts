import type { LearningEvent } from '../domain/learner/LearningEvent.js';

export interface LearnerEventStore {
  appendEvent(event: LearningEvent): Promise<LearningEvent>;
  getEventsForLearner(learnerId: string): Promise<LearningEvent[]>;
  getEventsForSession(sessionId: string): Promise<LearningEvent[]>;
}
