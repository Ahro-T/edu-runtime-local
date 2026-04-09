---
id: foundations-function-calling
pillar: foundations
node_type: concept
title: Function Calling
summary: How LLMs invoke external tools through structured API calls with defined schemas
prerequisites:
  - foundations-structured-output
related:
  - agent-tool-use
  - agent-core-loop
assessment_template: tpl-foundations-function-calling-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
---

## Function Calling

Function calling allows an LLM to select and invoke external functions by generating structured arguments that match a predefined schema. The model does not execute code directly — it outputs a function name and arguments, and the harness executes the call.

### Flow

1. **Define tools** — Provide function schemas (name, description, parameters) in the system prompt or API call
2. **Model selects** — Based on the user's request, the model chooses which function to call and generates arguments
3. **Harness executes** — The runtime calls the actual function with the generated arguments
4. **Result returned** — The function output is fed back to the model for the next step

### Key Considerations

- Schema design matters — clear descriptions improve tool selection accuracy
- Parallel function calling — some APIs support multiple simultaneous calls
- Error handling — the harness must handle invalid arguments or failed calls gracefully

### Why It Matters

Function calling is the mechanical foundation of agent tool use. Without it, agents cannot interact with external systems, databases, or APIs.

### Sources

- [OpenAI: Function Calling Guide](https://developers.openai.com/api/docs/guides/function-calling)
