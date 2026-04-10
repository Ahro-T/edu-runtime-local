---
name: edu_task
description: Get a 5-slot assessment task for the current node
user-invocable: true
command-dispatch: tool
command-tool: exec
command-arg-mode: raw
---

# edu_task

When invoked, run:
```
bash /workspace/skills/edu-task/task.sh <pillar>
```

Then generate a 5-slot assessment task based on the node content:
1. **Definition** - What is this concept precisely?
2. **Importance** - Why does it matter?
3. **Relation** - How does it connect to adjacent concepts?
4. **Example** - A concrete illustration
5. **Boundary** - What is this concept NOT?
