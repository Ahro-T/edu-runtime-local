---
id: tpl-agent-tool-use-v1
aliases:
  - Agent Tool Use Template v1
nodeId: agent-tool-use
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: |
  Answer using the five slots below. Each slot must be addressed clearly and specifically.
  - definition: Define agent tool use and the tool call lifecycle
  - importance: Explain why tool use is essential for agents to be practical
  - relation: Describe how tool use relates to the agent core loop
  - example: Give a concrete example of an agent selecting and calling a tool
  - boundary: Describe the difference between tool use and planning
rubric:
  passRules:
    - all five required slots are present and non-empty
    - definition correctly covers tool selection, invocation, and result handling
    - example shows a realistic tool call scenario
  failRules:
    - definition slot is missing or describes a different mechanism
    - fewer than three slots answered
  remediationRules:
    - relation to core loop act phase is not explained
    - boundary between tool use and planning is unclear
---
