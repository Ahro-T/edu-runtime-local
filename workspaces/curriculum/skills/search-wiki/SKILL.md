# Skill: search-wiki

## Purpose
Search the wiki-vault concept nodes by query string, with optional pillar or tag filters. Returns structured, agent-parseable output listing matching node IDs, titles, pillars, and body snippets.

## When to Use
- To find concept nodes relevant to a topic before planning a lesson
- To resolve a node ID from a human-readable concept name
- To enumerate all nodes in a specific pillar
- To check if a concept exists before adding a prerequisite link

## Input
- `query` (required): search string matched against title, summary, body text, pillar, prerequisites, and related fields
- `--pillar PILLAR` (optional): restrict search to one pillar (`agents`, `harnesses`, `openclaw`)
- `--tag TAG` (optional): restrict search to files containing the given tag string

## Command
```bash
bash scripts/wiki-search.sh QUERY
bash scripts/wiki-search.sh --pillar PILLAR QUERY
bash scripts/wiki-search.sh --tag TAG QUERY
bash scripts/wiki-search.sh --pillar PILLAR --tag TAG QUERY
```

## Examples
```bash
# Find nodes related to "core loop"
bash scripts/wiki-search.sh "core loop"

# Find nodes in the agents pillar matching "loop"
bash scripts/wiki-search.sh --pillar agents "loop"

# Find nodes related to "plugin" in the openclaw pillar
bash scripts/wiki-search.sh --pillar openclaw "plugin"
```

## Output Format
One tab-separated line per matching node:
```
node-id=<id>	title=<title>	pillar=<pillar>	snippet=<matched line, max 120 chars>
```

Example output:
```
node-id=agent-core-loop	title=Agent Core Loop	pillar=agents	snippet=The fundamental perceive-think-act cycle that drives autonomous agent behavior
```

## Rules
- Run from the project root (`/home/pjm38/Edu/`)
- No external dependencies — uses only `grep`, `awk`, `find`, `sed`
- Exit code 0 always (no match = no output, not an error)
- Output is one line per match, suitable for piping to `awk` or `jq`
- `--pillar` must be an exact pillar directory name

## Steps
1. Run `bash scripts/wiki-search.sh QUERY` (with optional filters)
2. Collect stdout lines
3. Parse each line by splitting on `\t` and extracting `node-id=`, `title=`, `pillar=`, `snippet=` fields
4. Use `node-id` values to fetch full node content if needed
