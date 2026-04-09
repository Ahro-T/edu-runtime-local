# Open Questions

## edu-runtime-v1 - 2026-04-09

- [ ] What is OpenClaw's plugin API contract? -- Phase 8 (Discord) depends on this. If undocumented, a discovery spike or fallback to raw Discord.js is needed.
- [ ] Which vLLM model will be used for evaluation? -- Different models produce different structured output quality. Guardrails mitigate this, but model choice affects prompt engineering in Phase 5.
- [ ] Should eslint-plugin-boundaries or a similar lint rule be added in Phase 1 to enforce hexagonal layer boundaries? -- Convention-only boundaries risk shortcut imports as the codebase grows.
- [ ] Is there an existing Obsidian vault with content, or does sample content need to be authored from scratch? -- Phase 4 needs 9-15 nodes with templates. If content exists, Phase 4 is adapter-only; if not, content authoring is a parallel workstream.
- [ ] What is the deployment target for V1? -- Local dev only, Docker Compose, or cloud? Affects Phase 7 startup/config and whether a Dockerfile is needed.
- [ ] Should the evaluation prompt be versioned? -- If the prompt template changes, old evaluations become non-comparable. The spec doesn't address prompt versioning.
