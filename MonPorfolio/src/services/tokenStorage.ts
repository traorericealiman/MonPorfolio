/** Stockage du jeton de session admin (sessionStorage : effacé à la fermeture de l'onglet). */
const ADMIN_KEY_STORAGE = 'portfolio_admin_key';

export function setAdminKey(token: string) {
  sessionStorage.setItem(ADMIN_KEY_STORAGE, token);
}

export function getAdminKey(): string | null {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE);
}

export function clearAdminKey() {
  sessionStorage.removeItem(ADMIN_KEY_STORAGE);
}
