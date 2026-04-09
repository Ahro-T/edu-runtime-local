/**
 * Returns a degraded-mode sentinel when vLLM is unreachable.
 * The caller is responsible for preserving the submission for later retry.
 * Never silently passes — always signals unavailability.
 */
export function buildDegradedResult() {
    return {
        available: false,
        error: 'temporary-eval-unavailable',
    };
}
//# sourceMappingURL=degraded-mode.js.map