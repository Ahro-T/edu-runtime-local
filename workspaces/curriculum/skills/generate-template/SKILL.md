# Skill: generate-template

## Purpose
Create a 5-slot assessment template for an enriched knowledge node. Templates are consumed by the edu-runtime to structure learner assessments.

## When to Use
After `enrich-node` has run on a concept page and the node has a valid `id`. Run once per node. Do not overwrite existing templates.

## Input
- `nodeId`: the node's `id` frontmatter value (e.g., `agents-core-loop`)
- `nodeTitle`: the node's `title` frontmatter value
- `pillar`: one of `agents`, `harnesses`, `openclaw`
- `outputDir`: path to the templates directory (default: `wiki-vault/templates/`)

## Output
Creates `wiki-vault/templates/tpl-{nodeId}-v1.md` with the following frontmatter:

```yaml
id: tpl-{nodeId}-v1
nodeId: {nodeId}
requiredSlots:
  - definition
  - importance
  - relation
  - example
  - boundary
instructions: |
  Answer using the five slots below. Each slot must be addressed clearly and specifically.
  - definition: Define {nodeTitle} in your own words
  - importance: Explain why {nodeTitle} matters in the context of {pillar}
  - relation: Describe how {nodeTitle} relates to at least one other concept you know
  - example: Give a concrete example of {nodeTitle} in action
  - boundary: Describe where {nodeTitle} ends and another concept begins
rubric:
  passRules:
    - all five required slots are present and non-empty
    - definition correctly captures the core concept
    - example is concrete and plausible
  failRules:
    - definition slot is missing or describes a different concept
    - fewer than three slots answered
  remediationRules:
    - relation to a prerequisite concept is missing or incorrect
    - boundary between this concept and adjacent concepts is not articulated
```

## Rules
- Template id MUST follow pattern `tpl-{nodeId}-v1`
- `nodeId` in template MUST match the node's `id` exactly
- `requiredSlots` MUST contain all five slots: definition, importance, relation, example, boundary
- Do NOT overwrite an existing template — check if `tpl-{nodeId}-v1.md` exists first
- Template lives in `templates/` directory, not in `concepts/`

## Steps
1. Check if `wiki-vault/templates/tpl-{nodeId}-v1.md` already exists — if yes, skip and log
2. Generate template content with node-specific instructions
3. Write file to `wiki-vault/templates/tpl-{nodeId}-v1.md`
4. Log success: `Created template tpl-{nodeId}-v1 for node {nodeId}`

## Error Cases
- `nodeId` is empty or null → throw error
- `outputDir` does not exist → throw error
- Write fails → throw error with path
