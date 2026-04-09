export class ParseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ParseError';
    }
}
const REQUIRED_FIELDS = ['result', 'score', 'rubricSlots', 'feedback', 'missingPoints', 'confidence'];
const VALID_RESULTS = new Set(['pass', 'fail', 'remediation']);
const REQUIRED_SLOTS = ['definition', 'importance', 'relation', 'example', 'boundary'];
export function parseVllmOutput(content) {
    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    let parsed;
    try {
        parsed = JSON.parse(cleaned);
    }
    catch {
        throw new ParseError(`Failed to parse JSON from vLLM response: ${content.slice(0, 200)}`);
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new ParseError('vLLM response is not a JSON object');
    }
    const obj = parsed;
    for (const field of REQUIRED_FIELDS) {
        if (!(field in obj)) {
            throw new ParseError(`Missing required field: ${field}`);
        }
    }
    if (!VALID_RESULTS.has(obj['result'])) {
        throw new ParseError(`Invalid result value: ${String(obj['result'])}`);
    }
    if (typeof obj['score'] !== 'number' || obj['score'] < 0 || obj['score'] > 100) {
        throw new ParseError(`Invalid score: ${String(obj['score'])}`);
    }
    if (typeof obj['rubricSlots'] !== 'object' || obj['rubricSlots'] === null) {
        throw new ParseError('rubricSlots must be an object');
    }
    const rubricSlots = obj['rubricSlots'];
    for (const slot of REQUIRED_SLOTS) {
        if (!(slot in rubricSlots)) {
            throw new ParseError(`Missing rubricSlot: ${slot}`);
        }
        const slotVal = rubricSlots[slot];
        if (typeof slotVal['present'] !== 'boolean') {
            throw new ParseError(`rubricSlots.${slot}.present must be boolean`);
        }
        if (typeof slotVal['quality'] !== 'string') {
            throw new ParseError(`rubricSlots.${slot}.quality must be string`);
        }
    }
    if (typeof obj['feedback'] !== 'string') {
        throw new ParseError('feedback must be a string');
    }
    if (!Array.isArray(obj['missingPoints'])) {
        throw new ParseError('missingPoints must be an array');
    }
    if (typeof obj['confidence'] !== 'number' || obj['confidence'] < 0 || obj['confidence'] > 1) {
        throw new ParseError(`Invalid confidence: ${String(obj['confidence'])}`);
    }
    return {
        result: obj['result'],
        score: obj['score'],
        rubricSlots: obj['rubricSlots'],
        feedback: obj['feedback'],
        missingPoints: obj['missingPoints'].map(String),
        confidence: obj['confidence'],
    };
}
//# sourceMappingURL=output-parser.js.map