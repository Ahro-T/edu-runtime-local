---
id: tpl-openclaw-discord-gateway-v1
aliases:
  - OpenClaw Discord Gateway Template v1
nodeId: openclaw-discord-gateway
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: |
  Answer using the five slots below. Each slot must be addressed clearly and specifically.
  - definition: Define the Discord gateway plugin and its responsibilities
  - importance: Explain why the gateway is implemented as a plugin rather than core runtime code
  - relation: Describe how the gateway uses the runtime API
  - example: Trace a /start slash command from Discord through the gateway to the runtime and back
  - boundary: Describe what the gateway does not own (what it delegates to the runtime)
rubric:
  passRules:
    - all five required slots are present and non-empty
    - definition covers authentication, command registration, routing, and formatting
    - example traces a complete command flow end-to-end
  failRules:
    - definition slot is missing or describes the runtime rather than the gateway
    - fewer than three slots answered
  remediationRules:
    - relation to openclaw-runtime API is not explained
    - delegation boundary between gateway and runtime is not articulated
---
