import type { VllmEvalResponse } from './output-parser.js';
import type { SubmissionEvaluation } from '../../domain/learner/SubmissionEvaluation.js';
/**
 * Apply deterministic guardrails to an evaluated vLLM response and produce
 * a persisted SubmissionEvaluation (confidence is STRIPPED here).
 *
 * CRITICAL rules:
 * 1. NEVER allow pass when any required slot is absent.
 * 2. Fall back to remediation on low confidence (<0.5) AND failed relation check.
 */
export declare function applyGuardrails(raw: VllmEvalResponse, submissionId: string, evaluatorModel: string): SubmissionEvaluation;
//# sourceMappingURL=guardrails.d.ts.map