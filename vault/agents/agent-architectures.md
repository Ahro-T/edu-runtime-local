---
id: agent-architectures
pillar: agents
node_type: concept
title: Agent Architectures
summary: High-level design patterns for building LLM agents — from simple workflows to autonomous agents
prerequisites:
  - agent-core-loop
  - agent-tool-use
  - agent-planning
related:
  - agent-react-pattern
  - agent-prompt-chaining
  - agent-multi-agent
assessment_template: tpl-agent-architectures-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Agent Architectures

Not every LLM application needs a fully autonomous agent. Anthropic's framework distinguishes between workflows (deterministic orchestration) and agents (model-driven decisions).

### Spectrum of Autonomy

1. **Prompt Chaining** — Fixed sequence of LLM calls, output of one feeds into next
2. **Router** — LLM classifies input and routes to specialized handler
3. **Parallelization** — Multiple LLM calls run simultaneously, results aggregated
4. **Orchestrator-Worker** — Central LLM delegates subtasks to worker LLMs
5. **Autonomous Agent** — LLM decides its own actions in a loop until task completion

### When to Use What

- Simple, predictable tasks → workflows (prompt chaining, routing)
- Complex, open-ended tasks → autonomous agents
- Start simple, add autonomy only when needed

### Why It Matters

Choosing the right architecture avoids over-engineering simple tasks and under-engineering complex ones. Most production systems use workflows, not fully autonomous agents.

### Sources

- [Anthropic: Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
- [Anthropic Cookbook: Agent Patterns](https://github.com/anthropics/anthropic-cookbook/tree/main/patterns/agents)
