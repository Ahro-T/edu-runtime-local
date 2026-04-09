---
id: tpl-openclaw-runtime-v1
aliases:
  - OpenClaw Runtime Template v1
nodeId: openclaw-runtime
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: |
  Answer using the five slots below. Each slot must be addressed clearly and specifically.
  - definition: Define the OpenClaw runtime and its role in the system
  - importance: Explain why a centralized runtime is needed rather than ad-hoc components
  - relation: Describe how the runtime relates to the plugin model
  - example: Walk through the runtime startup sequence step by step
  - boundary: Describe what the runtime does not do (what plugins are responsible for)
rubric:
  passRules:
    - all five required slots are present and non-empty
    - definition identifies the runtime as the host process for plugins and event bus
    - example covers the 7-step startup sequence
  failRules:
    - definition slot is missing or describes a plugin rather than the runtime
    - fewer than three slots answered
  remediationRules:
    - relation to openclaw-plugin-model is not explained
    - boundary between runtime and plugin responsibilities is not articulated
---
