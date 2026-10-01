import { apiFetch } from './httpClient';

/** Connexion username + mot de passe. Renvoie le jeton de session à stocker, ou lève une erreur. */
export async function loginAdmin(username: string, password: string): Promise<string> {
  const body = await apiFetch<{ token: string }>('/admin/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return body.token;
}

/** Crée le tout premier compte admin (ne fonctionne que si aucun compte n'existe encore). */
export async function registerAdmin(username: string, password: string): Promise<string> {
  const body = await apiFetch<{ token: string }>('/admin/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  return body.token;
}

/** Vérifie que le jeton actuellement stocké est toujours valide (ex: au rechargement de la page). */
export async function verifyAdminSession(): Promise<boolean> {
  try {
    await apiFetch('/admin/verify');
    return true;
  } catch {
    return false;
  }
}

export async function changeAdminPassword(
  username: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await apiFetch('/admin/change-password', {
    method: 'POST',
    body: JSON.stringify({ username, currentPassword, newPassword }),
  });
}
