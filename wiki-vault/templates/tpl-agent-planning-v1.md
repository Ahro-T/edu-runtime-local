---
id: tpl-agent-planning-v1
aliases:
  - Agent Planning Template v1
nodeId: agent-planning
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: |
  Answer using the five slots below. Each slot must be addressed clearly and specifically.
  - definition: Define agent planning and how it decomposes goals into steps
  - importance: Explain why planning is necessary for multi-step tasks
  - relation: Describe the relationship between planning and tool use
  - example: Give a concrete example of an agent creating and executing a plan
  - boundary: Explain where planning ends and orchestration begins
rubric:
  passRules:
    - all five required slots are present and non-empty
    - definition covers goal decomposition and subgoal sequencing
    - example illustrates a multi-step plan with at least two steps
  failRules:
    - definition slot is missing or confuses planning with acting
    - fewer than three slots answered
  remediationRules:
    - relation to agent-tool-use is missing or incorrect
    - boundary between planning and orchestration is not articulated
---
