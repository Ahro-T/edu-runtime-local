---
id: tpl-harness-tool-registry-v1
nodeId: harness-tool-registry
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: |
  Answer using the five slots below. Each slot must be addressed clearly and specifically.
  - definition: Define the tool registry and its responsibilities within a harness
  - importance: Explain why a registry is needed rather than letting agents call tools directly
  - relation: Describe how the registry relates to agent tool use
  - example: Give a concrete example of registering a tool and the agent calling it
  - boundary: Describe the boundary between the registry and the harness eval loop
rubric:
  passRules:
    - all five required slots are present and non-empty
    - definition covers enumeration, validation, routing, and result return
    - example shows a tool being registered and invoked through the registry
  failRules:
    - definition slot is missing or confuses registry with tool implementation
    - fewer than three slots answered
  remediationRules:
    - relation to agent-tool-use is not explained
    - boundary between registry and eval loop is not articulated
---
