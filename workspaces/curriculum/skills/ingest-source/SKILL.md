# Skill: ingest-source

Convert non-markdown raw sources into `.md` files suitable for `wiki compile`.

## Trigger

Invoke when a new PDF, web clip, or code excerpt needs to be added to the vault.

## Input

- Source file path (PDF, URL, or code file/snippet)
- Target pillar: `agents` | `harnesses` | `openclaw`
- Brief description of the source content

## Steps

### PDF → Markdown Excerpt

1. Extract text from PDF (use available PDF-to-text tooling or manual extraction)
2. Identify the relevant sections for the target pillar
3. Write a `.md` file to `vault/pdfs/` with the following frontmatter:
   ```yaml
   ---
   source_type: pdf
   original_file: <filename.pdf>
   pillar: <pillar>
   date_ingested: <YYYY-MM-DD>
   description: <brief description>
   ---
   ```
4. Include the extracted text content below the frontmatter
5. Preserve section headings from the original where possible
6. Note page numbers for traceability (e.g., `<!-- p.12 -->`)

### Web Clip → Markdown

1. Fetch the web article content (strip navigation, ads, boilerplate)
2. Write a `.md` file to `vault/webclips/` with frontmatter:
   ```yaml
   ---
   source_type: webclip
   original_url: <url>
   pillar: <pillar>
   date_ingested: <YYYY-MM-DD>
   description: <brief description>
   ---
   ```
3. Include the article body as clean markdown
4. Preserve code blocks and headings

### Code Excerpt → Annotated Markdown

1. Extract the relevant code snippet(s) from the repo or file
2. Write a `.md` file to `vault/code/` with frontmatter:
   ```yaml
   ---
   source_type: code
   original_repo: <repo or file path>
   pillar: <pillar>
   date_ingested: <YYYY-MM-DD>
   description: <brief description>
   ---
   ```
3. Wrap code in fenced code blocks with language tag
4. Add annotation comments explaining key patterns, design decisions, or pedagogical relevance

## Output

A `.md` file in the appropriate `vault/{format}/` subdirectory, ready for `wiki compile`.

## Immutability

Once written to `vault/`, the file is immutable. Do not edit existing vault files — create a new version if updates are needed.

## Next Step

After pre-processing, run:
```
wiki compile vault/{format}/<filename>.md
```
Then follow the standard ingest pipeline: `enrich-node` → `generate-template` → `wiki lint`.
