---
name: edu_start
description: Start a learning session. Usage /edu_start agents|harnesses|openclaw
user-invocable: true
command-dispatch: tool
command-tool: exec
command-arg-mode: raw
---

# edu_start

Run: `node /workspace/skills/edu-start/start.mjs <pillar>`

The script returns JSON. Send the `message` field to the learner. Do not change it.
