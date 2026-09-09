// The one place the browser talks to the API.
//
// Always same-origin `/api/...`: Vite proxies it in development and Vercel
// rewrites it in production, so the session cookie is first-party in both. That
// is why nothing here needs a base URL, and why `credentials: 'include'` is
// enough without any CORS dance.

export class ApiError extends Error {
  constructor(status, code, payload) {
    super(code || `http_${status}`);
    this.status = status;
    // A stable machine code, translated at render time. The server never sends
    // display text — it does not know which language the reader chose.
    this.code = code || 'serverError';
    this.payload = payload;
  }
}

async function request(method, path, body) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'include',
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body === undefined ? undefined : JSON.stringify(body)
    });
  } catch {
    // Distinguishable from a 500: the request never arrived. Render's free tier
    // sleeps, so this is the likely shape of a first visit after an idle spell.
    throw new ApiError(0, 'networkUnreachable');
  }

  if (res.status === 204) return null;

  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  if (!res.ok) throw new ApiError(res.status, payload?.error, payload);
  return payload;
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  del: (path) => request('DELETE', path)
};
