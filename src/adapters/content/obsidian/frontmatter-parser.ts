import matter from 'gray-matter';
import type { Pillar, NodeType, MasteryStageTarget, TeacherPromptMode } from '../../../domain/content/types.js';

export interface NodeFrontmatter {
  id: string;
  pillar: Pillar;
  node_type: NodeType;
  title: string;
  summary: string;
  prerequisites: string[];
  related: string[];
  assessment_template: string;
  mastery_stage_target: MasteryStageTarget;
  teacher_prompt_mode: TeacherPromptMode;
}

export interface TemplateFrontmatter {
  id: string;
  nodeId: string;
  requiredSlots: string[];
  instructions: string;
  rubric: {
    passRules: string[];
    failRules: string[];
    remediationRules: string[];
  };
}

export interface ParsedFile<T> {
  frontmatter: T;
  body: string;
}

export function parseNodeFile(raw: string, filePath: string): ParsedFile<NodeFrontmatter> {
  const { data, content } = matter(raw);

  const requiredFields: (keyof NodeFrontmatter)[] = [
    'id', 'pillar', 'node_type', 'title', 'summary',
    'assessment_template', 'mastery_stage_target', 'teacher_prompt_mode',
  ];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      throw new Error(`Missing required frontmatter field "${field}" in ${filePath}`);
    }
  }

  return {
    frontmatter: {
      id: String(data['id']),
      pillar: data['pillar'] as Pillar,
      node_type: data['node_type'] as NodeType,
      title: String(data['title']),
      summary: String(data['summary']),
      prerequisites: Array.isArray(data['prerequisites']) ? data['prerequisites'].map(String) : [],
      related: Array.isArray(data['related']) ? data['related'].map(String) : [],
      assessment_template: String(data['assessment_template']),
      mastery_stage_target: data['mastery_stage_target'] as MasteryStageTarget,
      teacher_prompt_mode: data['teacher_prompt_mode'] as TeacherPromptMode,
    },
    body: content.trim(),
  };
}

export function parseTemplateFile(raw: string, filePath: string): ParsedFile<TemplateFrontmatter> {
  const { data, content } = matter(raw);

  const requiredFields = ['id', 'nodeId', 'requiredSlots', 'instructions', 'rubric'];
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      throw new Error(`Missing required frontmatter field "${field}" in ${filePath}`);
    }
  }

  if (!Array.isArray(data['requiredSlots']) || data['requiredSlots'].length === 0) {
    throw new Error(`requiredSlots must be a non-empty array in ${filePath}`);
  }

  const rubric = data['rubric'] as Record<string, unknown>;

  return {
    frontmatter: {
      id: String(data['id']),
      nodeId: String(data['nodeId']),
      requiredSlots: (data['requiredSlots'] as unknown[]).map(String),
      instructions: String(data['instructions']),
      rubric: {
        passRules: Array.isArray(rubric['passRules']) ? rubric['passRules'].map(String) : [],
        failRules: Array.isArray(rubric['failRules']) ? rubric['failRules'].map(String) : [],
        remediationRules: Array.isArray(rubric['remediationRules']) ? rubric['remediationRules'].map(String) : [],
      },
    },
    body: content.trim(),
  };
}
