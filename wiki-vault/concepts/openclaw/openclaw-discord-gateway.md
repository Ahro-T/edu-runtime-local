---
id: openclaw-discord-gateway
pillar: openclaw
node_type: concept
title: OpenClaw Discord Gateway
aliases:
  - OpenClaw Discord Gateway
summary: The plugin that bridges Discord slash commands to the OpenClaw runtime API
prerequisites:
  - openclaw-runtime
related:
  - harness-orchestration
assessment_template: tpl-openclaw-discord-gateway-v1
mastery_stage_target: descriptive
teacher_prompt_mode: socratic
---

## OpenClaw Discord Gateway

The Discord gateway is an OpenClaw plugin that listens to Discord events, translates them into runtime API calls, and sends responses back to Discord channels.

### Responsibilities
- Authenticate with Discord using a bot token
- Register slash commands (/start, /status, /task, /next, /explain, /review, /help)
- Route incoming interactions to the runtime HTTP API
- Format runtime responses as Discord embeds or plain messages
- Handle rate limits and retry logic for Discord API calls

### Command Routing
Each slash command maps to one or more runtime API endpoints. The gateway is stateless: it holds no learner state itself, delegating all persistence to the runtime.

### Channel Awareness
The gateway captures the Discord channel ID from each interaction and passes it to the runtime, which stores it on the learner session for reply routing.

### Failure Modes
- Discord API outage: gateway must queue or drop messages gracefully
- Runtime API outage: gateway should return a user-friendly error message, not a crash
- Rate limiting: gateway must implement exponential backoff

### Relation to Runtime
The gateway is a plugin that registers with the [[openclaw-runtime]] on startup. It uses the runtime's HTTP API surface — it does not access the database or agent logic directly.

## Backlinks
- [[harness-orchestration]]
- [[openclaw-runtime]]
