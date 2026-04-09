export interface DegradedModeResult {
  available: false;
  error: 'temporary-eval-unavailable';
}

/**
 * Returns a degraded-mode sentinel when Ollama is unreachable.
 * The caller is responsible for preserving the submission for later retry.
 * Never silently passes — always signals unavailability.
 */
export function buildDegradedResult(): DegradedModeResult {
  return {
    available: false,
    error: 'temporary-eval-unavailable',
  };
}
