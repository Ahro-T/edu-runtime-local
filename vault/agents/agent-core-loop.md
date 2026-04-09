---
id: agent-core-loop
pillar: agents
node_type: concept
title: Agent Core Loop
summary: The fundamental perceive-think-act cycle that drives autonomous agent behavior
prerequisites: []
related:
  - harness-eval-loop
assessment_template: tpl-agent-core-loop-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Agent Core Loop

An autonomous agent operates by repeatedly executing a perceive-think-act cycle. In each iteration, the agent reads its environment (perceive), selects an action based on its goals and current state (think), and then executes that action (act). The loop continues until the agent reaches its goal or is terminated.

### Perceive
The agent gathers observations from its environment. This may include tool outputs, memory contents, user messages, or external API responses.

### Think
The agent processes observations through its model — reasoning about the current state, consulting memory, planning next steps, and selecting the appropriate action or tool call.

### Act
The agent executes the chosen action: calling a tool, emitting a response, updating memory, or delegating to a sub-agent.

### Why It Matters
Understanding the core loop is essential for debugging agent behavior, designing evaluation harnesses, and reasoning about failure modes like infinite loops, goal drift, or context overflow.
