---
id: harness-observability
pillar: harnesses
node_type: concept
title: Agent Observability
summary: Tracing, monitoring, and debugging agent execution through spans, latency tracking, and cost analysis
prerequisites:
  - harness-orchestration
related:
  - harness-benchmarks
  - harness-eval-loop
assessment_template: tpl-harness-observability-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Agent Observability

Observability is the ability to understand what an agent is doing, why it made certain decisions, and where it failed. It extends traditional application monitoring with LLM-specific concerns.

### Key Components

- **Tracing** — Recording each step of agent execution as spans (LLM calls, tool invocations, retrieval queries) with timing and token counts
- **Logging** — Structured logs of inputs, outputs, and intermediate reasoning
- **Metrics** — Latency, token usage, cost per request, success/failure rates
- **Replay** — Ability to replay a failed execution with the same inputs for debugging

### LLM-Specific Challenges

- Non-deterministic outputs make reproduction difficult
- Long multi-step traces are hard to visualize
- Cost attribution across chained calls
- Distinguishing model errors from tool/environment errors

### Why It Matters

Agents fail in complex, non-obvious ways. Without observability, debugging is guesswork. Production agent systems require the same level of observability as traditional distributed systems.

### Sources

- [LangSmith Observability Platform](https://www.langchain.com/langsmith/observability)
