// janis-design-viewer worker.
//   GET /api/models?folder=<name>   lists the .stl files of one R2 folder
//   GET /models/<folder>/<file>     streams one STL from R2
//   everything else                 static viewer page (ASSETS)
// Read only: this worker never writes to or deletes from R2. No CORS headers
// (same origin only).

const FOLDERS = new Set(['vm-01', 'vm-02', 'bbq-01', 'pr-01']);

function text(body, status, extra = {}) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8', ...extra },
  });
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function methodNotAllowed() {
  return text('Method Not Allowed', 405, { Allow: 'GET' });
}

// Lists every .stl directly in <folder>/ (follows the cursor until done).
async function listModels(env, folder) {
  const prefix = `${folder}/`;
  const files = [];
  let cursor;
  do {
    // delimiter "/" keeps nested keys out: only files directly in the folder.
    const page = await env.MODELS.list({ prefix, delimiter: '/', cursor });
    for (const obj of page.objects) {
      const name = obj.key.slice(prefix.length);
      if (!name || name.includes('/') || !/\.stl$/i.test(name)) continue;
      files.push({
        name,
        size: obj.size,
        uploaded: obj.uploaded.toISOString(),
      });
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  files.sort((a, b) => a.name.localeCompare(b.name));
  return files;
}

async function handleApi(request, env, url) {
  if (request.method !== 'GET') return methodNotAllowed();
  const folder = url.searchParams.get('folder');
  if (!folder || !FOLDERS.has(folder)) return text('Not Found', 404);
  return json(await listModels(env, folder));
}

async function handleModel(request, env, url) {
  if (request.method !== 'GET') return methodNotAllowed();

  // Expected path: /models/<folder>/<file>
  const parts = url.pathname.split('/');
  if (parts.length !== 4 || !FOLDERS.has(parts[2])) return text('Not Found', 404);

  let file;
  try {
    file = decodeURIComponent(parts[3]);
  } catch {
    return text('Bad Request', 400);
  }
  if (!file || file.includes('/') || file.includes('\\') || file.includes('..')) {
    return text('Bad Request', 400);
  }

  const obj = await env.MODELS.get(`${parts[2]}/${file}`);
  if (!obj) return text('Not Found', 404);

  return new Response(obj.body, {
    status: 200,
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': String(obj.size),
      ETag: obj.httpEtag,
      'Cache-Control': 'private, max-age=300',
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/models') return handleApi(request, env, url);
    if (url.pathname.startsWith('/models/')) return handleModel(request, env, url);
    return env.ASSETS.fetch(request);
  },
};
