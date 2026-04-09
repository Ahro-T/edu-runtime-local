---
id: harness-sandboxing
pillar: harnesses
node_type: concept
title: Agent Sandboxing
summary: Secure code execution environments using containers and microVMs to isolate agent actions
prerequisites:
  - harness-orchestration
  - harness-guardrails
related:
  - harness-observability
assessment_template: tpl-harness-sandboxing-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Agent Sandboxing

When agents execute code or interact with systems, they need isolated environments to prevent accidental or malicious damage. Sandboxing provides this isolation.

### Isolation Levels

- **Process-level** — Separate OS process with restricted permissions (least isolation)
- **Container-level** — Docker/Podman containers with resource limits and network isolation
- **MicroVM-level** — Lightweight VMs (Firecracker, gVisor) with hardware-level isolation (strongest)

### Key Properties

- **Ephemeral** — Sandbox is created per-task and destroyed after
- **Resource-limited** — CPU, memory, disk, and network quotas
- **Network-restricted** — No outbound access or allowlisted endpoints only
- **Filesystem-restricted** — Read-only base with writable scratch space

### Why It Matters

An agent that can execute arbitrary code without sandboxing is a security incident waiting to happen. Sandboxing is what makes code execution agents production-safe.

### Sources

- [E2B Documentation](https://e2b.dev/docs)
- [Hugging Face: Secure Code Execution in smolagents](https://huggingface.co/docs/smolagents/en/tutorials/secure_code_execution)
