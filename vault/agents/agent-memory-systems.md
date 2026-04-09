---
id: agent-memory-systems
pillar: agents
node_type: concept
title: Agent Memory Systems
summary: Short-term and long-term memory architectures that give agents persistent context
prerequisites:
  - agent-core-loop
related:
  - agent-reflection
  - foundations-rag
assessment_template: tpl-agent-memory-systems-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Agent Memory Systems

LLM agents are fundamentally limited by their context window. Memory systems extend this by providing mechanisms to store, retrieve, and forget information across interactions.

### Memory Types

- **Working Memory** — The current context window; everything the agent can see right now
- **Short-term Memory** — Recent conversation history, scratchpads, intermediate results
- **Long-term Memory** — Persistent storage (vector DBs, knowledge graphs) that survives across sessions
- **Episodic Memory** — Records of past experiences, allowing the agent to recall similar situations

### Design Considerations

- Retrieval strategy: semantic search vs recency vs importance scoring
- Memory consolidation: when to compress or summarize old memories
- Forgetting: pruning irrelevant memories to avoid noise

### Why It Matters

Without memory, agents cannot learn from past interactions, maintain user preferences, or build up knowledge over time. Memory architecture is what separates a stateless chatbot from a persistent agent.

### Sources

- [A Survey on the Memory Mechanism of LLM-based Agents](https://arxiv.org/abs/2404.13501)
- [A-Mem: Agentic Memory for LLM Agents](https://arxiv.org/html/2502.12110v11)
