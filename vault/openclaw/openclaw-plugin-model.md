---
id: openclaw-plugin-model
pillar: openclaw
node_type: concept
title: OpenClaw Plugin Model
summary: How OpenClaw structures its extensibility through a plugin system
prerequisites: []
related:
  - openclaw-runtime
assessment_template: tpl-openclaw-plugin-model-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## OpenClaw Plugin Model

OpenClaw is a harness framework built for extensibility. Its plugin model allows new capabilities — tools, adapters, evaluators, UI surfaces — to be registered and activated without modifying core runtime code.

### Plugin Anatomy
A plugin declares:
- A unique name and version
- Lifecycle hooks (onLoad, onUnload)
- Tool registrations (schemas + handlers)
- Event subscriptions (what runtime events it reacts to)

### Plugin Loading
Plugins are discovered from a configuration manifest at startup. The runtime loads each plugin, calls its onLoad hook, and registers its tools and subscriptions into the appropriate registries.

### Isolation
Plugins run within the same process but interact with the runtime only through defined interfaces. This prevents plugins from directly mutating core state.

### Why This Matters
The plugin model is what makes OpenClaw composable. A Discord gateway, a vLLM evaluation engine, and a Postgres persistence adapter are all plugins — the core runtime knows nothing about them directly.
