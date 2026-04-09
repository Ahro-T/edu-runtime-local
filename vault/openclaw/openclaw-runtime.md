---
id: openclaw-runtime
pillar: openclaw
node_type: concept
title: OpenClaw Runtime
summary: The core execution environment that hosts agents, plugins, and the event bus
prerequisites:
  - openclaw-plugin-model
related:
  - harness-eval-loop
assessment_template: tpl-openclaw-runtime-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## OpenClaw Runtime

The OpenClaw runtime is the central process that bootstraps the system: loading configuration, initializing plugins, starting the event bus, and exposing the API surface that agents and external systems interact with.

### Startup Sequence
1. Load and validate configuration (env vars, config files)
2. Initialize structured logging
3. Connect to persistence (database, cache)
4. Load plugins and call their onLoad hooks
5. Start the event bus
6. Expose HTTP API and Discord gateway
7. Signal ready

### Event Bus
The event bus is the runtime's internal message broker. Components publish events (session started, submission received, evaluation complete) and subscribers react asynchronously.

### Graceful Shutdown
On SIGTERM, the runtime drains in-flight events, calls plugin onUnload hooks, closes connections, and exits. Abrupt shutdown risks orphaned sessions.

### Relation to Plugin Model
The runtime is the host; plugins are guests. The runtime provides the registries and event bus that plugins attach to. Without the runtime, plugins have nothing to load into.

### Remediation Path
If the runtime concept is unclear, revisit openclaw-plugin-model first to understand what the runtime hosts before examining how it manages the hosting lifecycle.
