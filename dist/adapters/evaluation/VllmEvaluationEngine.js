import { buildEvaluationPrompt } from './prompt-builder.js';
import { parseVllmOutput } from './output-parser.js';
import { applyGuardrails } from './guardrails.js';
import { buildDegradedResult } from './degraded-mode.js';
export class VllmEvaluationEngine {
    vllmUrl;
    model;
    timeoutMs;
    constructor(options) {
        this.vllmUrl = options.vllmUrl.replace(/\/$/, '');
        this.model = options.model ?? 'default';
        this.timeoutMs = options.timeoutMs ?? 30_000;
    }
    async evaluate(submission, node, template) {
        const prompt = buildEvaluationPrompt(submission, node, template);
        const messages = [
            {
                role: 'system',
                content: 'You are an educational evaluator. Return only valid JSON matching the requested schema. No markdown, no explanation.',
            },
            { role: 'user', content: prompt },
        ];
        let responseJson;
        try {
            responseJson = await this.callVllm(messages);
        }
        catch (err) {
            // vLLM unreachable — return degraded sentinel
            // Caller is responsible for preserving the submission
            const degraded = buildDegradedResult();
            throw Object.assign(new Error(`Evaluation unavailable: ${degraded.error}`), { code: degraded.error, available: degraded.available });
        }
        const content = responseJson.choices[0]?.message.content ?? '';
        const evaluatorModel = responseJson.model;
        const raw = parseVllmOutput(content);
        return applyGuardrails(raw, submission.id, evaluatorModel);
    }
    async isAvailable() {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5_000);
            try {
                const response = await fetch(`${this.vllmUrl}/health`, {
                    signal: controller.signal,
                });
                return response.ok;
            }
            finally {
                clearTimeout(timer);
            }
        }
        catch {
            return false;
        }
    }
    async callVllm(messages) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
            const response = await fetch(`${this.vllmUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: this.model,
                    messages,
                    temperature: 0.1,
                    max_tokens: 1024,
                }),
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`vLLM responded with status ${response.status}`);
            }
            return (await response.json());
        }
        finally {
            clearTimeout(timer);
        }
    }
}
//# sourceMappingURL=VllmEvaluationEngine.js.map