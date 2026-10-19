import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  apiRequest,
  setUnauthorizedListener,
  toQueryString,
} from '../../../src/api/client.js';

function respond(status, body, headers = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async () =>
        new Response(body === undefined ? null : JSON.stringify(body), { status, headers }),
    ),
  );
}

async function failure(promise) {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Expected the request to fail.');
}

describe('apiRequest', () => {
  let detach = () => {};
  afterEach(() => detach());

  it('sends JSON with same-origin credentials', async () => {
    respond(200, { ok: true });
    await expect(apiRequest('/admin/thing', { method: 'PUT', body: { a: 1 } })).resolves.toEqual({
      ok: true,
    });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('/api/admin/thing');
    expect(init).toMatchObject({ method: 'PUT', credentials: 'same-origin', body: '{"a":1}' });
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('returns null for empty responses', async () => {
    respond(204);
    await expect(apiRequest('/auth/logout', { method: 'POST' })).resolves.toBeNull();
  });

  it('maps the error envelope, field errors and Retry-After', async () => {
    respond(
      429,
      { error: { code: 'rate_limited', message: 'Too many failed sign-in attempts.' } },
      { 'Retry-After': '120' },
    );
    const error = await failure(apiRequest('/auth/login', { method: 'POST', body: {} }));
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 429, code: 'rate_limited', retryAfterSeconds: 120 });

    respond(400, {
      error: { code: 'validation_failed', message: 'Check.', fields: { email: 'Bad' } },
    });
    expect(await failure(apiRequest('/auth/login'))).toMatchObject({ fields: { email: 'Bad' } });
  });

  it('falls back to readable messages for non-JSON failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html>Bad gateway</html>', { status: 502 })),
    );
    const error = await failure(apiRequest('/admin/guilds'));
    expect(error).toMatchObject({ status: 502, code: 'http_502' });
    expect(error.message).toMatch(/external service/);
  });

  it('reports network failures as status 0', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    );
    expect(await failure(apiRequest('/admin/guilds'))).toMatchObject({
      status: 0,
      code: 'network_error',
    });
  });

  it('notifies the session listener on 401 outside the auth routes only', async () => {
    const listener = vi.fn();
    detach = setUnauthorizedListener(listener);
    respond(401, { error: { code: 'session_expired', message: 'Expired.' } });
    await failure(apiRequest('/admin/guilds'));
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ code: 'session_expired' }));

    respond(401, { error: { code: 'invalid_credentials', message: 'Wrong.' } });
    await failure(apiRequest('/auth/login', { method: 'POST', body: {} }));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('builds query strings without empty values', () => {
    expect(toQueryString({ a: 'x', b: undefined, c: null, d: '', e: 0 })).toBe('?a=x&e=0');
    expect(toQueryString({ since: new Date('2026-10-20T10:00:00Z') })).toBe(
      '?since=2026-10-20T10%3A00%3A00.000Z',
    );
    expect(toQueryString({})).toBe('');
  });
});
