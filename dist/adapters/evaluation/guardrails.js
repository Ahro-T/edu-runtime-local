const REQUIRED_SLOTS = ['definition', 'importance', 'relation', 'example', 'boundary'];
const LOW_CONFIDENCE_THRESHOLD = 0.5;
/**
 * Apply deterministic guardrails to an evaluated vLLM response and produce
 * a persisted SubmissionEvaluation (confidence is STRIPPED here).
 *
 * CRITICAL rules:
 * 1. NEVER allow pass when any required slot is absent.
 * 2. Fall back to remediation on low confidence (<0.5) AND failed relation check.
 */
export function applyGuardrails(raw, submissionId, evaluatorModel) {
    let result = raw.result;
    // Rule 1: Cap pass to remediation when any required slot is absent
    const missingSlots = REQUIRED_SLOTS.filter((slot) => !(raw.rubricSlots[slot]?.present ?? false));
    if (result === 'pass' && missingSlots.length > 0) {
        result = 'remediation';
    }
    // Rule 2: Fallback to remediation on low confidence + missing relation
    const relationPresent = raw.rubricSlots['relation']?.present ?? false;
    if (result === 'pass' &&
        raw.confidence < LOW_CONFIDENCE_THRESHOLD &&
        !relationPresent) {
        result = 'remediation';
    }
    // Convert rubricSlots from Record form to RubricSlotResult[] for persistence
    const rubricSlots = REQUIRED_SLOTS.map((slot) => ({
        slot,
        score: slotQualityToScore(raw.rubricSlots[slot]?.quality ?? 'missing'),
        feedback: raw.rubricSlots[slot]?.quality ?? 'missing',
    }));
    // confidence is TRANSIENT — not included in SubmissionEvaluation
    return {
        submissionId,
        evaluatorModel,
        result,
        score: raw.score,
        rubricSlots,
        feedback: raw.feedback,
        missingPoints: raw.missingPoints,
    };
}
function slotQualityToScore(quality) {
    switch (quality) {
        case 'strong': return 100;
        case 'adequate': return 70;
        case 'weak': return 40;
        case 'missing': return 0;
        default: return 0;
    }
}
//# sourceMappingURL=guardrails.js.map