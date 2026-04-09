---
id: foundations-rag
pillar: foundations
node_type: concept
title: Retrieval-Augmented Generation (RAG)
summary: Grounding LLM responses in external knowledge through retrieval to reduce hallucination
prerequisites:
  - foundations-structured-output
related:
  - agent-memory-systems
  - agent-tool-use
assessment_template: tpl-foundations-rag-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Retrieval-Augmented Generation (RAG)

RAG combines a retriever (search engine) with a generator (LLM). Instead of relying solely on the model's training data, the system retrieves relevant documents and includes them in the prompt as context.

### Pipeline

1. **Index** — Chunk documents, generate embeddings, store in a vector database
2. **Query** — Convert user question to an embedding and find similar chunks
3. **Augment** — Insert retrieved chunks into the LLM prompt as context
4. **Generate** — LLM produces an answer grounded in the retrieved documents

### Key Challenges

- **Chunking strategy** — Too small loses context, too large wastes tokens
- **Retrieval quality** — Bad retrieval = bad answers, regardless of model quality
- **Context window limits** — Can't stuff unlimited documents into the prompt
- **Citation** — Tracing which document supported which claim

### Why It Matters

RAG is how agents access up-to-date, domain-specific knowledge without fine-tuning. It is the most practical way to reduce hallucination in knowledge-intensive tasks.

### Sources

- [LangChain RAG Tutorial](https://python.langchain.com/docs/tutorials/rag/)
- [RAG for LLMs - Prompt Engineering Guide](https://www.promptingguide.ai/research/rag)
