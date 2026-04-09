# Skill: validate-node

## Purpose
Run `wiki lint` to validate wiki structure and frontmatter for one or more nodes. This is an OpenClaw-side validation step — it does NOT call any Runtime API endpoint. Runtime-side validation happens at startup via `validateContent()` in `main.ts`.

## When to Use
- After `enrich-node` to verify a single node passes lint
- As part of the 48h scheduled lint pass (see HEARTBEAT.md)
- After any manual content edits

## Input
- `target` (optional): path to a specific file or directory to lint. Defaults to entire `wiki-vault/`

## Command
```bash
wiki lint {target}
```

If `target` is omitted:
```bash
wiki lint wiki-vault/
```

## What wiki lint Checks
- All required frontmatter fields are present (`id`, `pillar`, `node_type`, `title`, `summary`, `assessment_template`, `mastery_stage_target`, `teacher_prompt_mode`)
- `pillar` is one of `agents`, `harnesses`, `openclaw`
- `id` is unique across all concept pages
- Every `prerequisites` entry resolves to an existing node id
- Every `related` entry resolves to an existing node id
- Every `assessment_template` value resolves to a file in `templates/`
- Every template's `nodeId` resolves back to an existing concept node
- No empty `requiredSlots` arrays in templates

## Output
On success: `wiki lint passed — 0 errors`
On failure: list of errors with file path and field name

## Rules
- NEVER call any Runtime API endpoint (no `POST /api/content/validate` — this endpoint does not exist)
- NEVER modify files during validation — report only
- If lint fails, report all errors before stopping
- Exit code 0 = pass, non-zero = fail

## Steps
1. Run `wiki lint {target}`
2. Capture stdout/stderr
3. If exit code != 0, report all errors
4. Return pass/fail status with error list
