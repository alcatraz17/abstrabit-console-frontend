const DEFAULT_MESSAGES = {
  0: 'The server could not be reached. Check your connection and try again.',
  401: 'Sign in to continue.',
  403: 'This request is not allowed.',
  404: 'The requested resource was not found.',
  409: 'This item changed in the meantime. Reload it and try again.',
  413: 'The request is too large.',
  429: 'Too many requests. Try again shortly.',
  502: 'An external service did not respond. Try again shortly.',
};

export class ApiError extends Error {
  constructor({ status, code, message, fields = {}, retryAfterSeconds = null }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

let unauthorizedListener = null;

export function setUnauthorizedListener(listener) {
  unauthorizedListener = listener;
  return () => {
    if (unauthorizedListener === listener) unauthorizedListener = null;
  };
}

function defaultMessage(status) {
  if (DEFAULT_MESSAGES[status]) return DEFAULT_MESSAGES[status];
  if (status >= 500) return 'Something went wrong on the server. Try again shortly.';
  return 'The request could not be completed.';
}

async function readJson(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function toQueryString(params = {}) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, value instanceof Date ? value.toISOString() : String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export async function apiRequest(path, { method = 'GET', body, signal } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new ApiError({ status: 0, code: 'network_error', message: defaultMessage(0) });
  }

  const payload = await readJson(response);
  if (response.ok) return payload;

  const details = payload?.error ?? {};
  const retryAfter = Number(response.headers.get('Retry-After'));
  const error = new ApiError({
    status: response.status,
    code: details.code ?? `http_${response.status}`,
    message: details.message ?? defaultMessage(response.status),
    fields: details.fields ?? {},
    retryAfterSeconds: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
  });
  if (response.status === 401 && !path.startsWith('/auth/')) unauthorizedListener?.(error);
  throw error;
}
