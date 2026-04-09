const REQUIRED_SLOTS = ['definition', 'importance', 'relation', 'example', 'boundary'];
export function buildEvaluationPrompt(submission, node, template) {
    const rubricLines = [
        ...template.rubric.passRules.map((r) => `PASS: [${r.slot}] ${r.description}`),
        ...template.rubric.failRules.map((r) => `FAIL: [${r.slot}] ${r.description}`),
        ...template.rubric.remediationRules.map((r) => `REMEDIATION: [${r.slot}] ${r.description}`),
    ].join('\n');
    const requiredSlots = template.requiredSlots.length > 0
        ? template.requiredSlots
        : [...REQUIRED_SLOTS];
    const relatedNodes = node.related.length > 0
        ? `Related nodes: ${node.related.join(', ')}`
        : 'No related nodes specified.';
    const prerequisites = node.prerequisites.length > 0
        ? `Prerequisites: ${node.prerequisites.join(', ')}`
        : 'No prerequisites.';
    return `You are an educational evaluator. Evaluate the learner's answer for the following knowledge node.

## Node Context
Title: ${node.title}
Pillar: ${node.pillar}
Summary: ${node.summary}
${prerequisites}
${relatedNodes}
Body: ${node.body}

## Assessment Instructions
${template.instructions}

## Required Slots (ALL must be addressed)
${requiredSlots.map((s) => `- ${s}`).join('\n')}

## Rubric Rules
${rubricLines}

## Learner Submission
${submission.rawAnswer}

## Instructions
Evaluate the submission and return a JSON object ONLY (no markdown, no explanation outside JSON) with this exact shape:
{
  "result": "pass" | "fail" | "remediation",
  "score": <number 0-100>,
  "rubricSlots": {
    "definition": { "present": <boolean>, "quality": <"missing"|"weak"|"adequate"|"strong"> },
    "importance": { "present": <boolean>, "quality": <"missing"|"weak"|"adequate"|"strong"> },
    "relation": { "present": <boolean>, "quality": <"missing"|"weak"|"adequate"|"strong"> },
    "example": { "present": <boolean>, "quality": <"missing"|"weak"|"adequate"|"strong"> },
    "boundary": { "present": <boolean>, "quality": <"missing"|"weak"|"adequate"|"strong"> }
  },
  "feedback": "<constructive feedback string>",
  "missingPoints": ["<missing concept 1>", ...],
  "confidence": <number 0.0-1.0>
}

Rules:
- result MUST be "pass" only if ALL required slots are present and no major conceptual contradiction exists.
- result MUST be "fail" if the core definition is missing or the answer is too incomplete to map to the template.
- result MUST be "remediation" if the answer is partially coherent but prerequisite understanding appears weak or relation to prerequisite is missing/incorrect.
- confidence reflects your certainty about the evaluation (0=very uncertain, 1=very certain).
- Return ONLY the JSON object, nothing else.`;
}
//# sourceMappingURL=prompt-builder.js.map