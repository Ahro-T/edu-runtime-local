export interface VllmEvalResponse {
    result: 'pass' | 'fail' | 'remediation';
    score: number;
    rubricSlots: Record<string, {
        present: boolean;
        quality: string;
    }>;
    feedback: string;
    missingPoints: string[];
    confidence: number;
}
export declare class ParseError extends Error {
    constructor(message: string);
}
export declare function parseVllmOutput(content: string): VllmEvalResponse;
//# sourceMappingURL=output-parser.d.ts.map