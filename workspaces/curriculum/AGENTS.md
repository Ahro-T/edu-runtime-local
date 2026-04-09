# Curriculum Agent — AGENTS

## Workflow Modes

### Ingest Mode
Triggered when new raw source material is added to `vault/`.

**Step 0 — Pre-process non-markdown sources (if needed):**
- PDF files in `vault/pdfs/`: run `ingest-source` skill to produce `.md` excerpt
- Web clips in `vault/webclips/`: run `ingest-source` skill to produce clean `.md`
- Code excerpts in `vault/code/`: run `ingest-source` skill to produce annotated `.md`
- Hand-written markdown in `vault/agents/`, `vault/harnesses/`, `vault/openclaw/`: no pre-processing needed

1. Read source `.md` files from `vault/`
2. Run `wiki compile` to produce structured pages in `entities/` and `concepts/{pillar}/`
3. Run `enrich-node` skill on each compiled concept page to add educational frontmatter
4. Run `generate-template` skill for any node missing an assessment template
5. Run `validate-node` skill (`wiki lint`) to check structure
6. Report any errors; do not proceed if lint fails
7. Run `generate-index` skill to update `wiki-vault/index.md`, per-pillar indexes in `wiki-vault/indexes/`, and backlinks on all concept nodes

### Lint Mode
Triggered on a schedule (see HEARTBEAT.md) or manually.

1. Run `wiki lint` across the entire vault
2. Report broken links, missing frontmatter fields, unresolved prerequisites
3. Do not modify content — report only

### Refactor Mode
Triggered when node structure needs reorganization (pillar changes, prerequisite graph updates).

1. Read current node ids from `concepts/{pillar}/`
2. Identify nodes to refactor
3. Apply changes while preserving all existing ids
4. Re-run `wiki lint` to verify
5. Run `validate-node` on affected nodes

## Skill Invocation

- `skills/ingest-source/SKILL.md` — convert PDF, web clip, or code excerpt to `.md` for vault ingest
- `skills/enrich-node/SKILL.md` — add educational frontmatter to a compiled wiki page
- `skills/generate-template/SKILL.md` — create a 5-slot assessment template for a node
- `skills/validate-node/SKILL.md` — run `wiki lint` (no API calls)
- `skills/generate-index/SKILL.md` — generate per-pillar indexes and update backlinks on all concept nodes

## Content Pipeline Order

For hand-written markdown sources:
```
vault/{agents,harnesses,openclaw}/*.md → wiki compile → entities/ + concepts/{pillar}/ → enrich-node → generate-template → wiki lint → runtime-ready
```

For non-markdown sources (PDF, web clip, code):
```
raw source → ingest-source skill → vault/{pdfs,webclips,code}/*.md → wiki compile → entities/ + concepts/{pillar}/ → enrich-node → generate-template → wiki lint → runtime-ready
```

## Error Handling

- If `wiki compile` fails: check source formatting, report error, stop
- If `enrich-node` fails: report missing fields, do not write partial frontmatter
- If `wiki lint` fails: report all errors, do not mark content as ready
- If a prerequisite id does not resolve: flag as broken link, do not silence

## Boundaries

- Never call Runtime API endpoints
- Never read or write learner state
- Never modify `src/` TypeScript files
- Never delete node ids — only add or preserve
