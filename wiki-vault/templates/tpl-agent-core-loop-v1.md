---
id: tpl-agent-core-loop-v1
aliases:
  - Agent Core Loop Template v1
nodeId: agent-core-loop
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: |
  Answer using the five slots below. Each slot must be addressed clearly and specifically.
  - definition: Define the agent core loop in your own words
  - importance: Explain why the core loop matters for autonomous agent design
  - relation: Describe how the core loop relates to at least one other concept you know
  - example: Give a concrete example of the core loop executing in a real scenario
  - boundary: Describe where the core loop ends and another concept begins
rubric:
  passRules:
    - all five required slots are present and non-empty
    - definition correctly identifies perceive-think-act as the three phases
    - example is concrete and plausible
  failRules:
    - definition slot is missing or defines a different concept
    - fewer than three slots answered
  remediationRules:
    - relation to harness-eval-loop is missing or incorrect
    - boundary between core loop and planning is not articulated
---
