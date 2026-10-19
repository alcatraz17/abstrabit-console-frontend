const BASE = 'https://console.invalid';

function hasControlCharacter(value) {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

export function safeRedirect(target, fallback = '/') {
  if (typeof target !== 'string' || target.length === 0 || target.length > 2048) return fallback;
  if (!target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return fallback;
  if (hasControlCharacter(target)) return fallback;
  try {
    const url = new URL(target, BASE);
    if (url.origin !== BASE || url.pathname === '/login') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
