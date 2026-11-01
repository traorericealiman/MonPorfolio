import { apiFetch } from './httpClient';
import type { Profile } from '../types/content';

export async function updateProfile(profile: Profile): Promise<Profile> {
  return apiFetch<Profile>('/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}
