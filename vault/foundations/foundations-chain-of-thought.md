---
id: foundations-chain-of-thought
pillar: foundations
node_type: concept
title: Chain-of-Thought Prompting
summary: Eliciting step-by-step reasoning from LLMs to improve accuracy on complex tasks
prerequisites: []
related:
  - agent-react-pattern
  - agent-planning
assessment_template: tpl-foundations-chain-of-thought-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Chain-of-Thought Prompting

Chain-of-thought (CoT) prompting encourages the model to break down its reasoning into explicit intermediate steps before producing a final answer. This dramatically improves performance on math, logic, and multi-step reasoning tasks.

### Variants

- **Few-shot CoT** — Provide examples with step-by-step reasoning in the prompt
- **Zero-shot CoT** — Simply add "Let's think step by step" to the prompt
- **Self-consistency** — Generate multiple reasoning chains and take the majority vote

### How It Works

Instead of: "What is 23 × 17?" → "391"

CoT produces: "23 × 17 = 23 × 10 + 23 × 7 = 230 + 161 = 391"

The intermediate steps reduce errors by making the reasoning explicit and verifiable.

### Why It Matters

CoT is the foundational technique behind agent reasoning. ReAct, Reflexion, and planning all build on the idea that explicit reasoning traces improve LLM performance.

### Sources

- [Chain-of-Thought Prompting Elicits Reasoning in LLMs (Wei et al., 2022)](https://arxiv.org/abs/2201.11903)
- [Chain-of-Thought Prompting - Prompt Engineering Guide](https://www.promptingguide.ai/techniques/cot)
