# Curriculum Agent — HEARTBEAT

## Schedules

### 24h — New Source Check
interval: 24h
action: |
  Scan sources/ for files newer than 24 hours.
  If new files found:
    - Run wiki compile on new sources
    - Run enrich-node skill on compiled output
    - Run generate-template skill for new nodes
    - Run validate-node skill (wiki lint)
    - Report summary: files ingested, nodes created, errors

### 48h — Lint Pass
interval: 48h
action: |
  Run wiki lint across entire wiki-vault/.
  Report:
    - Broken prerequisite links
    - Missing required frontmatter fields
    - Templates with no matching node
    - Nodes with no matching template
  Do not auto-fix — report only.

### 168h — Coverage Report
interval: 168h
action: |
  Generate coverage report in reports/:
    - Count nodes per pillar (agents, harnesses, openclaw)
    - Count templates vs teachable nodes (should be 1:1)
    - List nodes without templates
    - List nodes with no prerequisites and no related nodes (isolated nodes)
    - List pillars with fewer than 3 nodes (below minimum coverage)
  Write report to reports/coverage-{YYYY-MM-DD}.md
