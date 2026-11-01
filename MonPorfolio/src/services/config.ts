/**
 * URL de base de l'API : l'Edge Function Supabase "api".
 * Configurable via VITE_API_URL (ex: https://<ref>.supabase.co/functions/v1/api) dans .env.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.VITE_SUPABASE_URL ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api` : '');

if (!API_BASE_URL) {
  console.error("VITE_API_URL (ou VITE_SUPABASE_URL) n'est pas défini : l'API est injoignable.");
}
