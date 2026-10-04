const appRoutes = '(?:admin(?:/.*)?|about|academics|gallery|admissions|news(?:/.*)?|contact)';

export function appBasePath() {
  const pathname = window.location.pathname;
  const route = pathname.match(new RegExp('^(.*?)/' + appRoutes + '/?$'));
  if (route) return route[1];
  if (pathname === '/') return '';
  return pathname.replace(/\/$/, '');
}

export function apiUrl(endpoint) {
  return appBasePath() + '/api/' + String(endpoint).replace(/^\/+/, '');
}

export function assetUrl(path) {
  if (!path) return '';
  if (/^(?:https?:|data:|\/)/i.test(path)) return path;
  return appBasePath() + '/' + String(path).replace(/^\/+/, '');
}

export async function apiRequest(endpoint, { csrf, ...options } = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');
  if (csrf) headers.set('X-CSRF-Token', csrf);
  const response = await fetch(apiUrl(endpoint), {
    credentials: 'same-origin',
    ...options,
    headers,
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    throw new Error('The server returned an unreadable response.');
  }
  if (!response.ok) throw new Error(payload.error || 'Request failed (' + response.status + ').');
  return payload;
}
