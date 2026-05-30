<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Repository layout

- Keep the repository root reserved for project configuration and primary entry documentation only.
- Acceptable root files are project-level config/metadata files such as `README.md`, `AGENTS.md`, `CLAUDE.md`, `.gitignore`, env examples, package manager files, `package.json`, `next.config.*`, `tsconfig.json`, and build/tool config files.
- Do not put generated artifacts, crawler samples, extracted text, one-off helper scripts, SQL samples, PDF/DOCX builders, or dataset files in the repository root.
- Put project notes, extracted source text, generated document builders, and deployment guides under `document/` or `local/`, using a descriptive subfolder when useful.
- Put app-readable datasets under `src/data/`.
- Do not create or recreate a top-level `scripts/` directory.
- Put data conversion utilities under `src/data/tools/`.
- Put server-side crawler, enrichment, and ingestion utilities under `src/server/`.
- If a command needs a one-off helper, place it in the appropriate `src/` subfolder or use an existing module instead of adding duplicate script folders.
- Any other source code files must be under `src/` and its subfolders.
- Do not delete anything from `.gitignore`.
