---
id: agent-tool-use
pillar: agents
node_type: concept
title: Agent Tool Use
aliases:
  - Agent Tool Use
summary: How agents extend their capabilities by calling external tools and interpreting results
prerequisites:
  - agent-core-loop
related:
  - harness-tool-registry
assessment_template: tpl-agent-tool-use-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Agent Tool Use

Agents become powerful when they can call tools — functions that interact with external systems. Tool use converts a purely generative model into an action-taking system.

### Tool Call Lifecycle
1. Agent selects a tool and constructs arguments from its reasoning context
2. The harness intercepts the tool call and routes it to the registered handler
3. The tool executes and returns a structured result
4. The agent incorporates the result into its next reasoning step

### Tool Schema
Tools are described by a JSON schema that specifies name, description, and parameter types. The agent uses this schema to decide when and how to call each tool.

### Error Handling
When a tool returns an error, the agent must decide whether to retry, use a fallback, or escalate. This is a key failure mode: agents that loop on tool errors can exhaust context.

### Relation to Core Loop
Tool use happens in the Act phase of the [[agent-core-loop]]. The result of a tool call feeds into the next Perceive phase.

## Backlinks
- [[agent-planning]]
- [[harness-tool-registry]]
