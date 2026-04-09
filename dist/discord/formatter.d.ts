/**
 * Formats API responses into Discord-friendly messages.
 * Teacher tone: concise but instructional, constructive on failure, always 1-3 next steps.
 */
import type { KnowledgeNode } from '../domain/content/KnowledgeNode.js';
import type { DashboardData } from '../services/DashboardService.js';
export interface EvaluationResult {
    result: 'pass' | 'fail' | 'remediation';
    score: number;
    feedback: string;
    missingPoints: string[];
}
export interface AdvancementResult {
    advanced: boolean;
    pillarCompleted: boolean;
    nextNode: KnowledgeNode | null;
}
/**
 * Format a knowledge node as an explanation message (3–8 sentences).
 */
export declare function formatNodeExplanation(node: KnowledgeNode): string;
/**
 * Format an assessment template as a task prompt.
 */
export declare function formatTaskPrompt(node: KnowledgeNode, instructions: string): string;
/**
 * Format an evaluation result with pass/fail/remediation tone.
 */
export declare function formatEvaluation(result: EvaluationResult, nodeTitle: string): string;
/**
 * Format a dashboard as a status summary.
 */
export declare function formatDashboard(data: DashboardData): string;
/**
 * Format an advancement result.
 */
export declare function formatAdvancement(result: AdvancementResult): string;
/**
 * Format a review scheduling confirmation.
 */
export declare function formatReviewScheduled(nodeId: string, scheduledFor: Date): string;
/**
 * Format an error message constructively.
 */
export declare function formatError(message: string, suggestions: string[]): string;
//# sourceMappingURL=formatter.d.ts.map