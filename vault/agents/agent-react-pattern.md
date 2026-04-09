---
id: agent-react-pattern
pillar: agents
node_type: concept
title: ReAct Pattern
summary: Interleaving reasoning traces and actions to ground LLM agents in external observations
prerequisites:
  - agent-core-loop
  - agent-tool-use
related:
  - agent-reflection
  - agent-planning
assessment_template: tpl-agent-react-pattern-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## ReAct Pattern

ReAct (Reasoning + Acting) is a prompting paradigm where the agent alternates between generating reasoning traces ("I need to search for X because...") and taking actions (tool calls, API requests). This interleaving grounds the agent's reasoning in real observations rather than relying solely on its parametric knowledge.

### How It Works

1. **Thought** — The agent verbalizes its reasoning about the current state
2. **Action** — The agent selects and executes a tool or API call
3. **Observation** — The environment returns a result
4. Repeat until the task is complete

### Why It Matters

ReAct significantly reduces hallucination compared to pure chain-of-thought because each reasoning step is validated against real-world observations. It is the foundational pattern behind most modern agent frameworks.

### Sources

- [ReAct: Synergizing Reasoning and Acting in Language Models (Yao et al., ICLR 2023)](https://arxiv.org/abs/2210.03629)
- [ReAct Prompting - Prompt Engineering Guide](https://www.promptingguide.ai/techniques/react)
