---
id: tpl-openclaw-plugin-model-v1
aliases:
  - OpenClaw Plugin Model Template v1
nodeId: openclaw-plugin-model
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: |
  Answer using the five slots below. Each slot must be addressed clearly and specifically.
  - definition: Define the OpenClaw plugin model and its four plugin declarations
  - importance: Explain why a plugin model makes OpenClaw more maintainable and extensible
  - relation: Describe how the plugin model relates to the OpenClaw runtime
  - example: Give a concrete example of a plugin being declared and loaded
  - boundary: Describe what a plugin cannot do (isolation boundary)
rubric:
  passRules:
    - all five required slots are present and non-empty
    - definition covers name/version, lifecycle hooks, tool registrations, event subscriptions
    - example shows a realistic plugin declaration
  failRules:
    - definition slot is missing or describes a different extensibility pattern
    - fewer than three slots answered
  remediationRules:
    - relation to openclaw-runtime is not explained
    - isolation boundary is not articulated
---
