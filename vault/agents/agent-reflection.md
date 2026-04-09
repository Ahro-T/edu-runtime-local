---
id: agent-reflection
pillar: agents
node_type: concept
title: Agent Reflection
summary: Self-critique and verbal reinforcement learning to improve agent performance across attempts
prerequisites:
  - agent-core-loop
  - agent-react-pattern
related:
  - agent-planning
  - harness-eval-loop
assessment_template: tpl-agent-reflection-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Agent Reflection

Reflection enables an agent to evaluate its own outputs, identify mistakes, and generate improved responses on subsequent attempts. Rather than external reward signals, the agent uses verbal self-critique as a form of reinforcement learning.

### Reflexion Framework

1. **Act** — The agent attempts a task
2. **Evaluate** — The result is scored (pass/fail or graded)
3. **Reflect** — The agent generates a natural-language critique of what went wrong
4. **Retry** — The critique is added to context for the next attempt

### Why It Matters

Reflection allows agents to improve without fine-tuning. It is especially powerful for multi-step tasks where early errors compound. The Reflexion paper showed significant gains on coding, reasoning, and decision-making benchmarks.

### Sources

- [Reflexion: Language Agents with Verbal Reinforcement Learning (Shinn et al., 2023)](https://arxiv.org/abs/2303.11366)
- [Self-Reflection in LLM Agents: Effects on Problem-Solving](https://arxiv.org/abs/2405.06682)
