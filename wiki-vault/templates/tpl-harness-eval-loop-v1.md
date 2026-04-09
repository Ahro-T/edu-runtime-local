---
id: tpl-harness-eval-loop-v1
aliases:
  - Harness Eval Loop Template v1
nodeId: harness-eval-loop
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: |
  Answer using the five slots below. Each slot must be addressed clearly and specifically.
  - definition: Define the harness evaluation loop and its five steps
  - importance: Explain why the harness loop is necessary for reproducible evaluation
  - relation: Describe how the harness eval loop relates to the agent core loop
  - example: Give a concrete example of a harness running an agent through the eval loop
  - boundary: Describe the boundary between the harness and the agent it evaluates
rubric:
  passRules:
    - all five required slots are present and non-empty
    - definition identifies inject, run, observe, score, decide as the loop steps
    - example shows a realistic harness-agent interaction
  failRules:
    - definition slot is missing or describes something other than an eval loop
    - fewer than three slots answered
  remediationRules:
    - relation to agent-core-loop is not explained
    - boundary between harness and agent is not articulated
---
