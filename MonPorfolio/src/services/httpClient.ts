import { API_BASE_URL } from './config';
import { getAdminKey } from './tokenStorage';

function authHeaders(): Record<string, string> {
  const key = getAdminKey();
  return key ? { 'X-Admin-Key': key } : {};
}

/** Requête vers l'API, avec le jeton admin (s'il existe) attaché automatiquement. */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json();
}
