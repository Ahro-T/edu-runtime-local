---
id: agent-planning
pillar: agents
node_type: concept
title: Agent Planning
aliases:
  - Agent Planning
summary: How agents decompose goals into subgoals and sequence actions to achieve them
prerequisites:
  - agent-tool-use
related:
  - harness-orchestration
assessment_template: tpl-agent-planning-v1
mastery_stage_target: descriptive
teacher_prompt_mode: socratic
---

## Agent Planning

Planning is the agent's ability to decompose a high-level goal into a sequence of concrete steps. Without planning, an agent reacts only to immediate inputs; with planning, it can pursue multi-step goals.

### Plan Representation
Plans may be explicit (a structured list of steps) or implicit (embedded in the agent's chain-of-thought). Explicit plans are more auditable; implicit plans are more flexible.

### Replanning
When an action fails or the environment changes, the agent must replan. Robust agents detect plan failures and update their subgoal sequence rather than blindly continuing.

### Hierarchical Planning
Complex tasks are broken into sub-tasks delegated to sub-agents or tool calls. The orchestrating agent maintains the top-level plan and integrates results from each sub-task.

### Boundary with Core Loop
Planning occurs in the Think phase. It is distinct from the Act phase: planning produces a decision, acting executes it. A common bug is conflating planning (reasoning about what to do) with acting (doing it).

### Remediation Path
If planning concepts are unclear, revisit [[agent-tool-use]] to understand what actions are available before reasoning about sequencing them.

## Backlinks
- [[harness-orchestration]]
