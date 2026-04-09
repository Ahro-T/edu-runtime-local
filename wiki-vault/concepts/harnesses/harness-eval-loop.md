---
id: harness-eval-loop
pillar: harnesses
node_type: concept
title: Harness Evaluation Loop
aliases:
  - Harness Evaluation Loop
summary: The outer loop a harness runs to execute, observe, and score agent behavior
prerequisites: []
related:
  - agent-core-loop
assessment_template: tpl-harness-eval-loop-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Harness Evaluation Loop

A harness is the infrastructure that wraps an agent to observe, control, and evaluate its behavior. The harness evaluation loop drives agent execution while collecting structured evidence for scoring.

### Loop Steps
1. **Inject** — The harness provides the initial prompt, environment state, and available tools
2. **Run** — The agent executes one or more core-loop iterations
3. **Observe** — The harness captures all tool calls, outputs, and state transitions
4. **Score** — The harness applies rubric rules to the captured trace
5. **Decide** — Pass, fail, or remediate based on score thresholds

### Why Harnesses Matter
Without a harness, agent behavior is unobservable. The harness is what makes evaluation reproducible: the same agent on the same task produces a comparable trace.

### Relation to Agent Core Loop
The harness eval loop is the outer loop; the [[agent-core-loop]] is the inner loop. The harness controls when the agent runs and what it can observe.

## Backlinks
- [[agent-core-loop]]
- [[harness-tool-registry]]
- [[openclaw-runtime]]
