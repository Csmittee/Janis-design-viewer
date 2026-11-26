# cc_chat_log.md
Newest first. Max 10 lines per entry, max 10 entries.

### 2026-11-26 | viewer_r2 v1.0 - follow-up: CLAUDE.md standard line, pre-deploy gate
- CLAUDE.md: Standard line now "shape A product repo; hub = janis-product-design"; added the light-repo rule (no docs/wh/, cc_rules.md, knowledge.map, skills, WH_STANDARD.md).
- PR body: added a "Pre-deploy gate" table (rows 1-10) with real output.
- Workers Builds check on 5b9866e was red; the log pasted by the owner appears to be from an earlier build (19:17 UTC, before the PR), cause for the PR build still open.
- Prompt move redone as the last commit.

### 2026-11-26 | viewer_r2 v1.0 - first build of the viewer worker
- Prompt: CC_PROMPT_viewer_r2_v1.0 (WH v0.6). Basis: main 5eddf87 (parent a60116a).
- Source: janis-product-design 764a0a2, viewer/janis-product-viewer.html, 96,492 B, copied byte for byte first.
- Added wrangler.jsonc, src/index.js (list + stream from R2, read only), README, CLAUDE.md.
- Viewer: GitHub/Satu listing replaced by /api/models; folders now vm-01, vm-02, bbq-01, pr-01; PR-01 uses a folder.
- Checked: 0 hits api.github/api.janishammer/Satu; node --check; wrangler dry-run; local wrangler dev test.
- Not verified: real deploy, custom domain, Access login, real R2 files, in-browser 3D load (CDN blocked in sandbox).
- Open: owner QA in the PR body. Owner merges (merge = deploy).
