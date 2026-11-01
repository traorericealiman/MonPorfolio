import { apiFetch } from './httpClient';
import type { SiteContent } from '../types/content';

/** Tout le contenu public du site en un seul appel. */
export async function fetchAllContent(): Promise<Partial<SiteContent>> {
  return apiFetch<Partial<SiteContent>>('/content');
}
