# Janis-design-viewer

3D viewer for Janis product designs (vending machines, BBQ smoker, pilates reformer).
It is one Cloudflare worker that serves the viewer page and reads the STL files from an R2 bucket.

- Address: https://viewer.janishammer.com (login required, Cloudflare Access)
- Worker: `janis-design-viewer` (a merge to `main` deploys it through Workers Builds)
- R2 bucket: `janis-design-models` (read only for the worker)

## R2 folders (one per product, lowercase)

| Product | R2 folder |
|---------|-----------|
| VM-01   | `vm-01/`  |
| VM-02   | `vm-02/`  |
| BBQ-01  | `bbq-01/` |
| PR-01   | `pr-01/`  |

## To add a view

Drag an `.stl` file into the folder in the R2 dashboard, then refresh the page. No code change.

## Files

- `public/index.html` - the viewer page
- `src/index.js` - the worker: `GET /api/models?folder=<name>` (list) and `GET /models/<folder>/<file>` (one STL)
- `wrangler.jsonc` - worker config

## Rules

- Public repo: viewer code only. No STL file, secret, account ID or token.
- No route, custom domain or `workers_dev` in the config: the custom domain is added in the dashboard, behind the login.
