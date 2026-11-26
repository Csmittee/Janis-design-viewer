CC_PROMPT viewer_r2 v1.0 2026-11-27
Origin: white-house
WH version: v0.6
Target repo: Csmittee/janis-design-viewer · branch from main (basis a60116a "Initial commit") · PR count: one · Scope: first build of the product viewer as a Cloudflare worker that reads STL files from R2.

## 0 CLOSE-OUT
none (new repo, no earlier PR here).

## 1 INTRO
Read and execute: this file.

- Repo: Csmittee/janis-design-viewer. Work on a new branch from main. One PR.
- Read-only source: Csmittee/janis-product-design, file `viewer/janis-product-viewer.html` at main 764a0a2 (96,492 bytes). Copy it; never edit that repo.
- This repo is new. It has only README.md. There is no cc_rules.md, knowledge.map or cc_chat_log.md yet; you create the basics in TASK 5.
- Before starting, say aloud: the basis hash of this repo, the hash and byte size of the source viewer file you copied.
- Do NOT read: any other file of janis-product-design, any Satu repo.
- R-009: before changing a value or logic, say whether it exists in more than one place in the viewer file, and change every copy in one pass.

## 2 CONTEXT
### Why
The old viewer lives at api.janishammer.com/janis-product-viewer, served from the Satu backend repo.
For VM-01, VM-02 and BBQ-01 it lists STL files through the GitHub Contents API of the Satu repo (unauthenticated).
Satu is now private, so that call returns 404 and the viewer shows "No models uploaded yet". PR-01 still works because it uses one fixed STL address.
Design files should not live in the payment backend. So the viewer moves to its own repo, its own worker, and its own R2 bucket, behind a login.

### Owner decisions (2026-11-26 and 2026-11-27, do not re-ask)
1. STL files live in the Cloudflare R2 bucket `janis-design-models`. The owner uploads them by drag-and-drop in the dashboard.
2. The viewer gets the file list from its own worker. No GitHub API at all.
3. Worker name: `janis-design-viewer`. The owner already created it and connected it to this repo (Workers Builds). A merge to main deploys.
4. R2 layout, one folder per product, lowercase, exactly as the owner made them: `vm-01/`, `vm-02/`, `bbq-01/`, `pr-01/`. PR-01 now uses a folder like the others.
5. Address: viewer.janishammer.com. The owner connects this custom domain in the dashboard after the merge. Do NOT declare any route or custom domain in the wrangler config.
6. Login: Cloudflare Access (owner + invited e-mails) is already set on viewer.janishammer.com by the owner. Every other address of the worker must be off, because it would skip the login: `workers_dev = false` and `preview_urls = false`.
7. Step 1 scope: same viewer features as today; all 4 products load. Nothing new.
8. The repo is public: viewer code only. No STL file, no secret, no account ID, no token in the repo.
9. The old viewer and Satu are not touched. They are removed later, only after the owner passes the new viewer.

### What does NOT change
- Csmittee/janis-product-design and the Satu repo: nothing.
- The viewer's look, product list, parameters, toggles, components, Three.js loading and camera: same as the source file.
- The R2 bucket contents: the worker only reads. No write, no delete.

### Decision Impact Statement (owner OK in chat 2026-11-27)
- Changes: worker janis-design-viewer serves the viewer page, GET `/api/models?folder=<name>` (lists .stl keys in one R2 folder) and GET `/models/<folder>/<file>` (streams one STL from R2).
- Touches: the worker deploy (through Workers Builds), the R2 binding (read only). DNS and Access are done by the owner.
- Preserved: Satu, satu-api, the old viewer at api.janishammer.com.
- Risk: an address that skips Access (workers.dev or preview URL) would make the viewer public. Rule 6 above closes both.
- Rollback: the owner removes the custom domain or deletes the worker. The old viewer is still there.

QA CARRY-OVER: Csmittee/janis-product-design#179 (FAIL flag kept on purpose by the owner; its cause, the Satu-based viewer, is what this repo replaces). Do not edit #179.

## 3 NEW FILES
- `wrangler.jsonc` - worker config: name, main, compatibility date, static assets, R2 binding, workers_dev false, preview_urls false. Cap 60 lines.
- `src/index.js` - the worker: two API paths + static assets. Cap 150 lines.
- `public/index.html` - the viewer, copied from the source file, then changed per TASK 3. No cap (source is 96,492 B); it must not grow by more than 5 KB.
- `CLAUDE.md` - thin read-order file for this repo. Cap 40 lines / 2 KB.
- `cc_chat_log.md` - work log, newest first, `### date | title` entries, max 10 lines each. Cap 10 entries.
- `docs/prompts/` - finished prompts (this file goes here in the last commit).
- Existing file to update: `README.md` - what this repo is, how files are added (drag-drop into the R2 folder), the 4 folder names. Cap 40 lines.

## 4 TASKS
### TASK 1 — Worker config (decisions 3, 5, 6)
- Create `wrangler.jsonc` with `name: "janis-design-viewer"` (must equal the worker the owner made, or Workers Builds fails).
- `main: "src/index.js"`. `compatibility_date`: the date of your session.
- Static assets from `./public`, binding `ASSETS`. Make the worker run first for `/api/*` and `/models/*` (use `run_worker_first`), so those paths never fall through to assets.
- R2 binding: `binding: "MODELS"`, `bucket_name: "janis-design-models"`.
- `workers_dev: false` and `preview_urls: false`.
- No `routes`, no `route`, no custom domain, no account_id, no vars holding secrets.
- No package.json build step is needed. If you add a package.json, it must not need a build command.

### TASK 2 — Worker code (decisions 1, 2, 4)
- In `src/index.js`, allowed folders are exactly: `vm-01`, `vm-02`, `bbq-01`, `pr-01`. Anything else returns 404.
- GET `/api/models?folder=<name>`: list R2 keys with prefix `<name>/` (follow the list cursor until done). Return JSON `[{ "name": "<file>.stl", "size": <bytes>, "uploaded": "<ISO date>" }]`, only keys ending in `.stl` (any letter case), only files directly in that folder. Empty folder = `[]` with status 200. Header `Cache-Control: no-store`.
- GET `/models/<folder>/<file>`: check the folder is allowed and the file name has no `/` or `..`. Get the object from R2. Missing = 404. Found = stream the body, `Content-Type: application/octet-stream`, `Content-Length`, `ETag`, `Cache-Control: private, max-age=300`.
- Any other method on these two paths: 405.
- Everything else: `env.ASSETS.fetch(request)`.
- No CORS headers (same origin only).

### TASK 3 — Viewer page (decisions 2, 4, 7)
- Copy the source file byte for byte to `public/index.html` first, and commit that copy alone, so the diff of the next commit shows only your changes.
- Replace the GitHub listing in `fetchModelFolder()`: call `/api/models?folder=<folder>`; map each entry to `{ filename, label: prettifyFilename(name), url: "/models/<folder>/<name>" }`. Use relative URLs only. Keep the same return shape and the same error handling style (network error and non-200 throw a clear message; 404 = empty list).
- Remove `SATU_BACKEND_REPO` and every GitHub wording in messages and comments of that block (rate limit 60/hr text included). Keep the 5-minute cache: it is still useful.
- `modelsFolder` values become lowercase: `'vm-01'`, `'vm-02'`, `'bbq-01'`. PR-01 gets `modelsFolder: 'pr-01'` and loses its fixed `stl:` address.
- VM-01 loses its three fixed `stl`, `stlOpen`, `stlC2` api.janishammer.com addresses (modelsFolder already wins over them).
- User-facing messages that say `public/models/<folder>/` now say the R2 folder: `R2 folder <folder>/`.
- The help text that names `/models/VM-01-v36.stl` (around line 632 of the source) now says models load from the R2 bucket.
- Product keys shown to the user (`'VM-01'`, labels, versions, status) do not change.
- After this task, `api.github.com`, `api.janishammer.com` and `Satu` must have 0 hits in `public/index.html`.

### TASK 4 — README (decision 8)
- Update `README.md`: purpose, the address viewer.janishammer.com (login required), the 4 R2 folders, "to add a view: drag an .stl into the folder in the R2 dashboard, then refresh the page; no code change".

### TASK 5 — Repo basics
- `CLAUDE.md`: Version / Changes / Previous header, `Standard: White House v0.6`, read order (this file, then cc_chat_log.md first 3 entries), the rules: no secrets or account IDs in this public repo; never add a route, custom domain or workers_dev; the 4 folder names; finished prompts go to docs/prompts/.
- `cc_chat_log.md`: first entry for this session.

## 5 DO NOT TOUCH
- Csmittee/janis-product-design (read the one source file only), the Satu repo, every other repo.
- The R2 bucket contents (no upload, rename or delete), DNS, Access, worker settings in the dashboard.
- GitHub settings, branch protection, workflows, secrets.
- Do not create `.github/workflows/` (Workers Builds already deploys).

## 6 VERIFICATION
Checked by CC, one command each; put the results in the PR body as the evidence line.
1. `grep -c -E "api\.github\.com|api\.janishammer\.com|Satu" public/index.html` = 0.
2. `grep -n "modelsFolder" public/index.html` shows exactly `vm-01`, `vm-02`, `bbq-01`, `pr-01`.
3. `git diff --stat <copy commit> HEAD -- public/index.html`: list the changed lines count; size growth under 5 KB (`wc -c`).
4. `node --check src/index.js` passes.
5. `npx wrangler deploy --dry-run --outdir /tmp/dry` passes and prints the R2 binding MODELS -> janis-design-models and the assets binding. Do NOT run a real deploy.
6. `grep -n -E "routes|route|custom_domain|account_id|workers_dev|preview_urls" wrangler.jsonc`: only `workers_dev: false` and `preview_urls: false`.
7. Local test with `npx wrangler dev --local` and a local R2 copy holding one small test file `vm-01/test.stl`: `/api/models?folder=vm-01` returns it; `/api/models?folder=xyz` = 404; `/models/vm-01/test.stl` = 200; `/models/vm-01/../x` = 404 or 400. Say the results. Do not commit the test file.
8. `git ls-files | grep -i "\.stl$"` = nothing.

Evidence line format: `Checked by CC: <checks> / Files changed: <count and list> / Hashes: <head> / Not verified live: deploy, custom domain, Access, real R2 files`.

Copy this block, unindented, to the end of the PR body, all boxes unticked:

    ## OWNER QA (visual, phone-usable; tick PASS or FAIL for each step)
    How: tick PASS or FAIL (one only). On FAIL, comment `QA-FAIL [step]: <what you saw>`. Tick ALL DONE at the end.
    Before the steps: merge the PR, wait for the Workers Builds deploy to show "Success", then in the dashboard open Workers & Pages > janis-design-viewer > Settings > Domains & Routes > Add > Custom domain > viewer.janishammer.com.

    1. In a private browser tab open https://viewer.janishammer.com. EXPECTED: a Cloudflare login page asking for your e-mail; after the 6-digit code from your inbox, the viewer opens (proves: the login gate works).
       - [ ] PASS
       - [ ] FAIL
    2. Pick VM-01, then VM-02. EXPECTED: each shows its list of views and a 3D model loads (proves: the R2 list and file paths work for the vending machines).
       - [ ] PASS
       - [ ] FAIL
    3. Pick BBQ-01, then PR-01. EXPECTED: each loads a 3D model (proves: all 4 products load, PR-01 from its new folder).
       - [ ] PASS
       - [ ] FAIL
    4. In the same private tab open https://janis-design-viewer.<your-subdomain>.workers.dev (the address shown on the worker page, if any). EXPECTED: an error page or "not found", never the viewer (proves: no address skips the login).
       - [ ] PASS
       - [ ] FAIL

    - [ ] ALL DONE

## 7 MANDATORY CLOSING
- Prepend `cc_chat_log.md` (newest top, at most 10 lines).
- Version headers on CLAUDE.md (v1.0).
- Open the PR; do not merge (the owner merges, because merge = deploy).
- LAST COMMIT of the PR: `git mv` THIS prompt from the repo root to `docs/prompts/`.
- Final message: PR link, head hash, files and bytes, anything skipped.

## 8 GUARDRAILS
- Never invent a real value (account ID, zone, URL, token, hash). Unknown = UNVERIFIED in the PR body.
- Never run a real `wrangler deploy`, never touch the dashboard, never write to R2.
- Same fix fails twice: stop, write IS / IS-NOT in the PR, ask.
- One PR open at a time. Scope lock: extra ideas go to an IDEAS list in the PR body (for example: update `.claude/SKILL_viewer_update.md` in janis-product-design later; retire the old viewer later).
