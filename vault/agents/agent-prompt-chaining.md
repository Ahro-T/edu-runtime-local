---
id: agent-prompt-chaining
pillar: agents
node_type: concept
title: Prompt Chaining
summary: Breaking complex tasks into sequential LLM calls where each output feeds the next input
prerequisites:
  - agent-core-loop
related:
  - agent-architectures
  - foundations-chain-of-thought
assessment_template: tpl-agent-prompt-chaining-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Prompt Chaining

Prompt chaining decomposes a complex task into a series of simpler LLM calls. The output of one step becomes the input of the next, with optional validation gates between steps.

### Structure

1. **Step 1** — Generate initial output (e.g., draft an outline)
2. **Gate** — Validate output meets criteria (programmatic or LLM-based check)
3. **Step 2** — Refine or extend (e.g., expand outline into full text)
4. **Gate** — Final quality check

### Advantages Over Single Prompts

- Each step has a focused, simpler prompt
- Intermediate results can be validated and corrected
- Easier to debug — you can inspect each step's output
- Lower token usage per call (shorter context)

### Why It Matters

Prompt chaining is the simplest reliable pattern for multi-step tasks. It trades off autonomy for predictability, making it ideal for production systems where consistency matters more than flexibility.

### Sources

- [Prompt Chaining - Prompt Engineering Guide](https://www.promptingguide.ai/techniques/prompt_chaining)
