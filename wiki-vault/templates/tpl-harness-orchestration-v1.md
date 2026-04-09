---
id: tpl-harness-orchestration-v1
aliases:
  - Harness Orchestration Template v1
nodeId: harness-orchestration
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: |
  Answer using the five slots below. Each slot must be addressed clearly and specifically.
  - definition: Define harness orchestration and the three coordination patterns
  - importance: Explain why orchestration is needed for complex multi-agent tasks
  - relation: Describe how orchestration relates to agent planning
  - example: Give a concrete example of a harness orchestrating two agents in parallel
  - boundary: Describe the boundary between orchestration and individual agent execution
rubric:
  passRules:
    - all five required slots are present and non-empty
    - definition covers sequential, parallel, and hierarchical patterns
    - example shows at least two agents being coordinated
  failRules:
    - definition slot is missing or describes single-agent execution
    - fewer than three slots answered
  remediationRules:
    - relation to agent-planning is not explained
    - boundary between orchestration and individual agent is not articulated
---
