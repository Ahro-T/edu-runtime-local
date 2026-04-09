---
id: foundations-structured-output
pillar: foundations
node_type: concept
title: Structured Output
summary: Guaranteeing JSON-schema-conformant output from LLMs for reliable downstream processing
prerequisites: []
related:
  - foundations-function-calling
  - harness-eval-loop
assessment_template: tpl-foundations-structured-output-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Structured Output

Structured output ensures that an LLM's response conforms to a specific format (typically JSON matching a schema). This is critical for any system that needs to programmatically parse model outputs.

### Approaches

- **Prompt-based** — Instruct the model to output JSON and hope it complies (unreliable)
- **Constrained decoding** — The inference engine restricts token sampling to only valid JSON tokens at each step (guaranteed valid)
- **API-level** — Providers like OpenAI offer a `response_format` parameter that enforces schema compliance

### Why Constrained Decoding Works

At each token generation step, the decoder masks out tokens that would produce invalid JSON. This guarantees 100% schema compliance with zero retries.

### Why It Matters

Agent harnesses depend on parsing model outputs to drive tool calls, state transitions, and evaluations. If the output isn't reliably structured, the entire pipeline breaks. This project's evaluation engine uses structured output to get consistent rubric scores from vLLM.

### Sources

- [OpenAI: Introducing Structured Outputs](https://openai.com/index/introducing-structured-outputs-in-the-api/)
