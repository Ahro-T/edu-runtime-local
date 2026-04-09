import type { KnowledgeNode } from '../../../domain/content/KnowledgeNode.js';
import type { AssessmentTemplate } from '../../../domain/content/AssessmentTemplate.js';
import { VALID_PILLARS, VALID_NODE_TYPES, VALID_MASTERY_STAGES, VALID_TEACHER_MODES } from './constants.js';

export function validateVault(
  nodes: KnowledgeNode[],
  templates: AssessmentTemplate[],
): string[] {
  const errors: string[] = [];

  // Unique node ids
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    if (nodeIds.has(node.id)) {
      errors.push(`Duplicate node id: "${node.id}"`);
    }
    nodeIds.add(node.id);
  }

  // Unique template ids
  const templateIds = new Set<string>();
  for (const tpl of templates) {
    if (templateIds.has(tpl.id)) {
      errors.push(`Duplicate template id: "${tpl.id}"`);
    }
    templateIds.add(tpl.id);
  }

  for (const node of nodes) {
    // Valid pillar
    if (!VALID_PILLARS.includes(node.pillar as never)) {
      errors.push(`Node "${node.id}": invalid pillar "${node.pillar}"`);
    }

    // Valid node type
    if (!VALID_NODE_TYPES.includes(node.nodeType as never)) {
      errors.push(`Node "${node.id}": invalid node_type "${node.nodeType}"`);
    }

    // Valid mastery stage
    if (!VALID_MASTERY_STAGES.includes(node.masteryStageTarget as never)) {
      errors.push(`Node "${node.id}": invalid mastery_stage_target "${node.masteryStageTarget}"`);
    }

    // Valid teacher prompt mode
    if (!VALID_TEACHER_MODES.includes(node.teacherPromptMode as never)) {
      errors.push(`Node "${node.id}": invalid teacher_prompt_mode "${node.teacherPromptMode}"`);
    }

    // Prereq refs must resolve
    for (const prereqId of node.prerequisites) {
      if (!nodeIds.has(prereqId)) {
        errors.push(`Node "${node.id}": prerequisite "${prereqId}" does not exist`);
      }
    }

    // Related refs must resolve
    for (const relId of node.related) {
      if (!nodeIds.has(relId)) {
        errors.push(`Node "${node.id}": related node "${relId}" does not exist`);
      }
    }

    // Template ref must resolve
    if (!templateIds.has(node.assessmentTemplateId)) {
      errors.push(`Node "${node.id}": assessment_template "${node.assessmentTemplateId}" does not exist`);
    }
  }

  // Template nodeId must resolve back to a node
  for (const tpl of templates) {
    if (!nodeIds.has(tpl.nodeId)) {
      errors.push(`Template "${tpl.id}": nodeId "${tpl.nodeId}" does not resolve to any node`);
    }

    // Non-empty required slots
    if (!tpl.requiredSlots || tpl.requiredSlots.length === 0) {
      errors.push(`Template "${tpl.id}": requiredSlots must not be empty`);
    }
  }

  return errors;
}
