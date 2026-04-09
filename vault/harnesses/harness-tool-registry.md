---
id: harness-tool-registry
pillar: harnesses
node_type: concept
title: Harness Tool Registry
summary: The catalog of tools a harness exposes to agents and how tool routing works
prerequisites:
  - harness-eval-loop
related:
  - agent-tool-use
assessment_template: tpl-harness-tool-registry-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Harness Tool Registry

The tool registry is the harness component that maintains the mapping from tool names to handler implementations. When an agent emits a tool call, the harness looks up the handler in the registry and dispatches the call.

### Registry Responsibilities
- Enumerate available tools and their JSON schemas for the agent
- Validate incoming tool calls against the registered schema
- Route calls to the correct handler
- Return structured results or typed errors back to the agent

### Static vs Dynamic Registries
A static registry is configured at harness startup. A dynamic registry can register or unregister tools at runtime — useful for multi-phase tasks where tool availability changes.

### Security Boundary
The registry enforces which tools an agent can access. Sensitive operations (file deletion, external API calls) should require explicit registration so agents cannot invoke them accidentally.

### Relation to Tool Use
Without a registry, tool use is undefined. The registry is what makes the agent's tool schema real — it specifies not just what the agent thinks it can do, but what the harness will actually execute.

### Remediation Path
If this node is unclear, revisit harness-eval-loop to understand how the harness controls agent execution before examining how tools are registered within it.
