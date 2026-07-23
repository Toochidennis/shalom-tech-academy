let cachedToken = null;

export function clearCsrfToken() {
  cachedToken = null;
}

export async function getCsrfToken() {
  if (cachedToken) return cachedToken;

  const response = await fetch('api/csrf.php', { credentials: 'include' });
  if (!response.ok) {
    cachedToken = null;
    return null;
  }

  const payload = await response.json();
  cachedToken = payload?.csrfToken || null;
  return cachedToken;
}

export async function csrfFetch(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const token = await getCsrfToken();
    if (token) headers['X-CSRF-Token'] = token;
  }

  return fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include',
  });
}
