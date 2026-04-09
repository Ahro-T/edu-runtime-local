export type Pillar = 'agents' | 'harnesses' | 'openclaw';

export type NodeType =
  | 'concept'
  | 'skill'
  | 'principle'
  | 'pattern'
  | 'tool'
  | 'workflow';

export type RelationType =
  | 'prerequisite-of'
  | 'related-to'
  | 'example-of'
  | 'implemented-by'
  | 'compared-with';

export type MasteryStageTarget = 'quiz' | 'descriptive' | 'explain' | 'apply';

export type TeacherPromptMode = 'guided' | 'socratic' | 'direct';
