# CLAUDE.md - janis-design-viewer
Version: v1.0 - 2026-11-26
Changes: First version. Thin read-order file for the viewer worker repo.
Previous: none
Standard: White House v0.6

Cloudflare worker that serves the Janis product viewer and reads STL files from the R2 bucket `janis-design-models`.

## Read order
1. This file.
2. cc_chat_log.md, first 3 entries by line range: `grep -n "^### " cc_chat_log.md`.
3. README.md, then only the file the task names.

## Rules
- Public repo: no secrets, account IDs, tokens or STL files.
- Never add a route, custom domain or workers_dev to wrangler.jsonc. Keep `workers_dev = false` and `preview_urls = false`: any other address skips the login.
- The worker only reads R2. No write, no delete.
- The 4 R2 folders, lowercase: `vm-01`, `vm-02`, `bbq-01`, `pr-01`. The list lives in `src/index.js` and in `modelsFolder` of `public/index.html`: change both in one pass.
- A merge to main deploys. The owner merges, not CC.
- No GitHub Actions workflows: Workers Builds deploys.

## Closing
Update cc_chat_log.md (newest first, max 10 lines per entry, max 10 entries). Move the finished prompt to docs/prompts/.
