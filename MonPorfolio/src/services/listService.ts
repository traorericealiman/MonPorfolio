import { apiFetch } from './httpClient';
import type { ListResource } from '../types/content';

/** CRUD générique pour les ressources en liste : compétitions, créations, projets. */

export async function createListItem<T extends { id: string }>(
  resource: ListResource,
  data: Omit<T, 'id'> & { id?: string }
): Promise<T> {
  return apiFetch<T>(`/${resource}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateListItem<T extends { id: string }>(
  resource: ListResource,
  id: string,
  data: T
): Promise<T> {
  return apiFetch<T>(`/${resource}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteListItem(resource: ListResource, id: string): Promise<void> {
  await apiFetch(`/${resource}/${id}`, { method: 'DELETE' });
}
