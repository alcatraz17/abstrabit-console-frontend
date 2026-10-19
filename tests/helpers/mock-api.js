import { vi } from 'vitest';

export function json(body, status = 200, headers = {}) {
  return { status, body, headers };
}

export function apiError(status, code, message, extra = {}) {
  return json({ error: { code, message, ...extra } }, status);
}

export function installMockApi(handlers = {}) {
  const routes = { ...handlers };
  const calls = [];

  const fetchMock = vi.fn(async (input, init = {}) => {
    const url = new URL(input, 'http://console.test');
    const method = (init.method ?? 'GET').toUpperCase();
    const body = init.body ? JSON.parse(init.body) : undefined;
    const call = { method, path: url.pathname, query: Object.fromEntries(url.searchParams), body };
    calls.push(call);

    const handler = routes[`${method} ${url.pathname}`];
    const result =
      typeof handler === 'function'
        ? await handler(call)
        : (handler ?? apiError(404, 'not_found', `No mock for ${method} ${url.pathname}`));
    const {
      status = 200,
      body: payload,
      headers = {},
    } = result && 'status' in result && 'body' in result ? result : json(result);
    return new Response(status === 204 || payload === undefined ? null : JSON.stringify(payload), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    });
  });

  vi.stubGlobal('fetch', fetchMock);

  return {
    calls,
    on(route, handler) {
      routes[route] = handler;
    },
    callsTo(method, path) {
      return calls.filter((call) => call.method === method && call.path === path);
    },
  };
}
