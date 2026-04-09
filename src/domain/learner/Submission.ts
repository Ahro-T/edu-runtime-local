export interface Submission {
  id: string;
  learnerId: string;
  sessionId: string;
  nodeId: string;
  templateId: string;
  rawAnswer: string;
  submittedAt: Date;
}
