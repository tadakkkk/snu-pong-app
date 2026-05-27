<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Repository layout

- Do not create or recreate a top-level `scripts/` directory.
- Put data conversion utilities under `src/data/tools/`.
- Put server-side crawler, enrichment, and ingestion utilities under `src/server/`.
- If a command needs a one-off helper, place it in the appropriate `src/` subfolder or use an existing module instead of adding duplicate script folders.
- Any other source code files must be under `src/` and its subfolders.