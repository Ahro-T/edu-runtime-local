import type { Pillar, NodeType, MasteryStageTarget, TeacherPromptMode } from './types.js';

export interface KnowledgeNode {
  id: string;
  pillar: Pillar;
  nodeType: NodeType;
  title: string;
  summary: string;
  prerequisites: string[];
  related: string[];
  assessmentTemplateId: string;
  masteryStageTarget: MasteryStageTarget;
  teacherPromptMode: TeacherPromptMode;
  body: string;
}
