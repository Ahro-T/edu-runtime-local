# Skill: enrich-node

## Purpose
Add educational frontmatter to a wiki-compiled concept page so it can be consumed by the edu-runtime's ObsidianContentRepository.

## When to Use
After `wiki compile` produces a page in `concepts/{pillar}/`. The compiled page may have wiki-specific frontmatter (claims, confidence, evidence) but lacks the educational fields required by the runtime.

## Input
- `filePath`: absolute or vault-relative path to the compiled concept markdown file
- `pillar`: one of `agents`, `harnesses`, `openclaw`
- `preservedId` (optional): existing node id to preserve. If provided, inject this as `id`. If absent, generate `{pillar}-{slug}` from the filename.

## Output
The file is updated in-place with the following frontmatter fields added or preserved:

```yaml
id: {preserved or generated}
pillar: {agents|harnesses|openclaw}
node_type: concept
title: {derived from wiki page title or filename}
summary: {one-sentence summary derived from wiki page lead paragraph}
prerequisites: []
related: []
assessment_template: tpl-{id}-v1
mastery_stage_target: descriptive
teacher_prompt_mode: guided
```

## Rules
- NEVER overwrite an existing `id` field — if `id` is already present in frontmatter, keep it unchanged
- `pillar` must be one of the three allowed values — reject with error if not
- `assessment_template` value must match the id of a template that will be created by `generate-template`
- Wiki-specific fields (`claims`, `confidence`, `evidence`, `provenance`) are left untouched
- Required educational fields: `id`, `pillar`, `node_type`, `title`, `summary`, `assessment_template`, `mastery_stage_target`, `teacher_prompt_mode`

## Steps
1. Read the file and parse existing frontmatter
2. If `id` is already present, use it; otherwise generate from filename
3. Derive `title` from the first `#` heading in the body, or from filename if no heading
4. Derive `summary` from the first non-heading paragraph (truncate to ~150 chars)
5. Merge educational fields into frontmatter (do not overwrite existing values)
6. Write the updated file

## Error Cases
- `pillar` not in `[agents, harnesses, openclaw]` → throw error, do not write
- File does not exist → throw error
- Frontmatter parse fails → throw error, do not write partial output
