---
id: harness-orchestration
pillar: harnesses
node_type: concept
title: Harness Orchestration
aliases:
  - Harness Orchestration
summary: How a harness coordinates multiple agents working on shared tasks
prerequisites:
  - harness-tool-registry
related:
  - agent-planning
assessment_template: tpl-harness-orchestration-v1
mastery_stage_target: descriptive
teacher_prompt_mode: socratic
---

## Harness Orchestration

Orchestration is the harness capability to coordinate multiple agents — spawning sub-agents, routing their outputs, and aggregating results into a coherent response.

### Orchestration Patterns
- **Sequential**: agents run one after another; each agent's output feeds the next
- **Parallel**: agents run concurrently on independent subtasks; results are merged
- **Hierarchical**: a lead agent delegates to worker agents and integrates their results

### Shared State
Orchestrated agents may share a task list, message queue, or memory store. The harness mediates access to prevent race conditions.

### Failure Propagation
When a worker agent fails, the orchestrator must decide: retry, use a fallback agent, or propagate the failure. Orchestration logic is where most multi-agent failure modes surface.

### Relation to Planning
[[agent-planning]] (deciding what to do) and harness orchestration (routing work to agents) are complementary. A planning agent decides to spawn a sub-agent; the harness orchestration layer actually provisions and runs it.

## Backlinks
- [[agent-planning]]
- [[harness-tool-registry]]
- [[openclaw-discord-gateway]]
