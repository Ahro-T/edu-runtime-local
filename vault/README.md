# vault/ — Raw Source Repository

This directory holds all immutable raw source material ingested into the edu-wiki system.

## Supported Formats

| Directory   | Format              | Description                                         |
|-------------|---------------------|-----------------------------------------------------|
| `agents/`   | Markdown (`.md`)    | Hand-written agent documentation                    |
| `harnesses/`| Markdown (`.md`)    | Hand-written harness documentation                  |
| `openclaw/` | Markdown (`.md`)    | Hand-written openclaw documentation                 |
| `pdfs/`     | PDF → Markdown      | PDF sources converted to `.md` excerpts before ingest |
| `webclips/` | Web → Markdown      | Web article clips saved as `.md` files              |
| `code/`     | Code → Annotated MD | Code repo excerpts converted to annotated `.md`     |

## Immutability Rule

**Ingest creates, never modifies.**

Once a source file is placed in `vault/`, it is treated as immutable. The ingest pipeline reads from `vault/` and writes compiled output to the wiki — it never writes back to `vault/`. If a source needs correction, replace the file with a new version; do not edit in place.

## Non-Markdown Pre-processing

PDF, web clip, and code sources require a pre-processing step before `wiki compile` can consume them:

1. **PDF sources** (`pdfs/`): Convert with `ingest-source` skill → produces `.md` excerpt in `vault/pdfs/`
2. **Web clips** (`webclips/`): Save web article as `.md` via browser clipper or manual conversion → place in `vault/webclips/`
3. **Code excerpts** (`code/`): Annotate code snippets with context and place as `.md` in `vault/code/`

Only after pre-processing are files ready for `wiki compile`.

## Pipeline

```
vault/{format}/*.md → wiki compile → wiki-vault/concepts/{pillar}/ → enrich-node → wiki lint → runtime-ready
```

Non-markdown sources must be pre-processed first:
```
raw PDF/web/code → ingest-source skill → vault/{format}/*.md → wiki compile → ...
```
