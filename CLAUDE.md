@AGENTS.md

Do not create or recreate a top-level `scripts/` directory. Use the repository layout rules in `AGENTS.md`: data utilities belong under `src/data/tools/`, and server-side crawler/enrichment/ingestion utilities belong under `src/server/`.
Keep the repository root clean. Do not place generated artifacts, crawler samples, extracted text, one-off helper scripts, SQL samples, PDF/DOCX builders, deployment notes, or dataset files at the root; put them under `document/`, `local/`, `src/data/`, or `src/server/` as appropriate.
Do not delete anything from `.gitignore`.
