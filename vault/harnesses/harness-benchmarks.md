---
id: harness-benchmarks
pillar: harnesses
node_type: concept
title: Agent Benchmarks
summary: Standardized evaluation benchmarks for measuring agent capabilities across coding, reasoning, and real-world tasks
prerequisites:
  - harness-eval-loop
related:
  - harness-observability
  - agent-reflection
assessment_template: tpl-harness-benchmarks-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Agent Benchmarks

Benchmarks provide standardized tasks and metrics to compare agent performance objectively. They are essential for measuring progress and identifying failure modes.

### Key Benchmarks

- **SWE-bench** — Real GitHub issues that agents must resolve by producing correct patches. Tests end-to-end software engineering capability
- **GAIA** — General AI Assistant benchmark with multi-step questions requiring tool use, web browsing, and reasoning
- **HumanEval / MBPP** — Code generation benchmarks measuring functional correctness
- **WebArena** — Web navigation tasks in realistic browser environments

### Evaluation Dimensions

- **Accuracy** — Does the agent produce correct results?
- **Efficiency** — How many steps/tokens does it take?
- **Reliability** — How consistent are results across runs?
- **Safety** — Does the agent avoid harmful actions?

### Why It Matters

Without benchmarks, agent improvement is anecdotal. Benchmarks enable reproducible comparison and expose failure patterns that anecdotal testing misses.

### Sources

- [SWE-bench (vals.ai)](https://www.vals.ai/benchmarks/swebench)
- [Holistic Agent Leaderboard](https://arxiv.org/pdf/2510.11977)
