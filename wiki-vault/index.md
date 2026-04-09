# Wiki Vault Index

This vault is the compiled knowledge base for the edu-runtime. It is managed by the Curriculum Agent workspace (`workspaces/curriculum/`).

## Structure

| Directory | Purpose |
|-----------|---------|
| `sources/` | Raw source material (docs, papers, transcripts). Never modified by agents. |
| `entities/` | Wiki-compiled entity pages produced by `wiki compile`. |
| `concepts/agents/` | Knowledge nodes for the Agents pillar. |
| `concepts/harnesses/` | Knowledge nodes for the Harnesses pillar. |
| `concepts/openclaw/` | Knowledge nodes for the OpenClaw pillar. |
| `templates/` | Assessment templates (one per teachable node). |
| `syntheses/` | Cross-concept synthesis pages. |
| `reports/` | Generated coverage and lint reports. |
| `indexes/` | Auto-generated per-pillar summary indexes. |

## Runtime Consumption

The `ObsidianContentRepository` in `src/adapters/content/obsidian/` reads from:
- `concepts/agents/`, `concepts/harnesses/`, `concepts/openclaw/` — knowledge nodes
- `templates/` — assessment templates

## Concept Nodes

### Agents Pillar — [[indexes/agents|Index]]

- [[agent-core-loop|Agent Core Loop]]
- [[agent-planning|Agent Planning]]
- [[agent-tool-use|Agent Tool Use]]

### Harnesses Pillar — [[indexes/harnesses|Index]]

- [[harness-eval-loop|Harness Evaluation Loop]]
- [[harness-orchestration|Harness Orchestration]]
- [[harness-tool-registry|Harness Tool Registry]]

### Openclaw Pillar — [[indexes/openclaw|Index]]

- [[openclaw-discord-gateway|OpenClaw Discord Gateway]]
- [[openclaw-plugin-model|OpenClaw Plugin Model]]
- [[openclaw-runtime|OpenClaw Runtime]]

## Content Pipeline

```
sources/ → wiki compile → entities/ + concepts/{pillar}/ → enrich-node → generate-template → wiki lint → generate-index → runtime-ready
```

## Node Count

Total nodes: 9

See `reports/` for coverage statistics. See `indexes/` for per-pillar summaries.
