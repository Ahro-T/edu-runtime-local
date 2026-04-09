---
id: harness-guardrails
pillar: harnesses
node_type: concept
title: Guardrails and Safety
summary: Input/output moderation, jailbreak detection, and topical control for safe agent operation
prerequisites:
  - harness-eval-loop
  - harness-orchestration
related:
  - harness-sandboxing
assessment_template: tpl-harness-guardrails-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Guardrails and Safety

Guardrails are programmable rules that constrain agent behavior to prevent harmful, off-topic, or incorrect outputs. They operate as middleware between the user and the LLM.

### Types of Guardrails

- **Input rails** — Filter or transform user input before it reaches the model (PII detection, jailbreak detection, topic filtering)
- **Output rails** — Validate model responses before delivery (fact-checking, toxicity filtering, format validation)
- **Dialogue rails** — Control conversation flow (canonical forms, topic boundaries)

### Implementation Approaches

- **Rule-based** — Regex, keyword lists, format validators
- **LLM-based** — Secondary model judges whether output is safe/on-topic
- **Hybrid** — Fast rule-based pre-filter + LLM-based deep check

### Why It Matters

Without guardrails, agents can be jailbroken, leak sensitive data, or produce harmful content. Guardrails are the safety layer between raw model capability and production deployment.

### Sources

- [NeMo Guardrails Documentation (NVIDIA)](https://docs.nvidia.com/nemo/guardrails/latest/index.html)
- [NeMo Guardrails: A Toolkit for Controllable and Safe LLM Applications](https://arxiv.org/abs/2310.10501)
