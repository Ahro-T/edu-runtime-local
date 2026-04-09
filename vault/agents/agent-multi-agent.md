---
id: agent-multi-agent
pillar: agents
node_type: concept
title: Multi-Agent Coordination
summary: Patterns for multiple agents collaborating on tasks through role assignment and communication
prerequisites:
  - agent-core-loop
  - agent-planning
related:
  - harness-orchestration
  - agent-architectures
assessment_template: tpl-agent-multi-agent-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Multi-Agent Coordination

Multi-agent systems use multiple specialized LLM agents that collaborate to solve complex tasks. Each agent has a distinct role, tools, and system prompt.

### Coordination Patterns

- **Role-based** (CrewAI) — Agents are assigned roles (researcher, writer, reviewer) and collaborate on a shared task
- **Conversational** (AutoGen) — Agents communicate through messages, debating and refining solutions
- **Graph-based** (LangGraph) — Agent transitions are defined as a state machine with explicit edges

### Key Challenges

- **Communication overhead** — More agents means more token usage
- **Coordination failures** — Agents may disagree, loop, or duplicate work
- **Accountability** — Hard to trace which agent caused a failure

### Why It Matters

Single agents struggle with tasks that require diverse expertise. Multi-agent systems enable divide-and-conquer strategies, peer review, and specialized tool access.

### Sources

- [AutoGen: Enabling Next-Gen LLM Applications via Multi-Agent Conversation (Wu et al., 2023)](https://arxiv.org/pdf/2308.08155)
- [CrewAI vs LangGraph vs AutoGen (DataCamp)](https://www.datacamp.com/tutorial/crewai-vs-langgraph-vs-autogen)
