import { clearCsrfToken } from './csrf';

async function parseAuth(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || 'Authentication failed.');
  }
  return payload.admin;
}

export async function login(username, password) {
  const response = await fetch('api/admin-login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });
  clearCsrfToken();
  return parseAuth(response);
}

export async function logout() {
  await fetch('api/admin-logout.php', {
    method: 'POST',
    credentials: 'include',
  });
  clearCsrfToken();
}

export async function getCurrentAdmin() {
  const response = await fetch('api/admin-me.php', { credentials: 'include' });
  return parseAuth(response);
}
