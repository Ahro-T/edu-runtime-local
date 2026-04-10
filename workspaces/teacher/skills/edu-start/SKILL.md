---
name: edu_start
description: Start a learning session. Usage /edu_start agents|harnesses|openclaw
user-invocable: true
command-dispatch: tool
command-tool: exec
command-arg-mode: raw
---

# edu_start

Starts a learning session by calling the Runtime API.

When invoked, run:
```
bash /workspace/skills/edu-start/start.sh <pillar>
```

Then explain the current node to the learner in 3-8 sentences. End with: type `/edu_task` when ready.
