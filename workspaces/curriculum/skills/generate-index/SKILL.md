# Skill: generate-index

## Purpose

Generate auto-index files for `wiki-vault/` after a `wiki compile` run. This skill:

1. Scans all concept node `.md` files in `wiki-vault/concepts/{pillar}/` dynamically
2. Generates `wiki-vault/index.md` with wikilinks grouped by pillar
3. Generates per-pillar summary indexes in `wiki-vault/indexes/` (NOT inside `concepts/`)
4. Populates `## Backlinks` sections on each concept node

## When to Run

Run after `wiki compile` + `enrich-node` + `generate-template` + `wiki lint` in Ingest Mode.
Also run after any manual edits to concept node body text or frontmatter `related`/`prerequisites` arrays.

## Invocation

```bash
bash scripts/generate-index.sh
```

Run from the project root (`/home/pjm38/Edu/`).

## Inputs

- `wiki-vault/concepts/{pillar}/*.md` — all concept node files (scanned dynamically)

## Outputs

- `wiki-vault/index.md` — top-level vault index with wikilinks to all nodes by pillar
- `wiki-vault/indexes/agents.md` — Agents pillar summary with node list + prerequisite graph
- `wiki-vault/indexes/harnesses.md` — Harnesses pillar summary
- `wiki-vault/indexes/openclaw.md` — OpenClaw pillar summary
- Updated `## Backlinks` sections in each concept node file

## Backlinks Algorithm

For each concept node file, the script:

1. Extracts `[[node-id]]` wikilinks from the body text (after closing `---`)
2. Extracts IDs from the frontmatter `related` array
3. Extracts IDs from the frontmatter `prerequisites` array
4. Builds a reverse map: for each referenced node-id, records which files reference it
5. Writes the `## Backlinks` section at the bottom of each concept node

## Critical Constraints

- Per-pillar index files MUST live in `wiki-vault/indexes/` — NOT inside `wiki-vault/concepts/{pillar}/`
- `vault-scanner.ts` reads ALL `.md` files in `concepts/{pillar}/` and expects full knowledge node frontmatter; index files without it cause parse failures
- The script is idempotent: re-running replaces existing backlinks and index files

## Verification

After running, verify no regressions:

```bash
npx vitest src/adapters/content/obsidian
```

All 13 tests must pass.
