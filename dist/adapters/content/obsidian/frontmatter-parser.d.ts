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
export declare function parseNodeFile(raw: string, filePath: string): ParsedFile<NodeFrontmatter>;
export declare function parseTemplateFile(raw: string, filePath: string): ParsedFile<TemplateFrontmatter>;
//# sourceMappingURL=frontmatter-parser.d.ts.map