import { apiFetch } from './httpClient';
import type { MetricKey, Stats } from '../types/stats';

export async function fetchStats(): Promise<Stats> {
  return apiFetch<Stats>('/stats');
}

export async function incrementMetric(metric: MetricKey): Promise<void> {
  await apiFetch('/stats/increment', {
    method: 'POST',
    body: JSON.stringify({ metric }),
  });
}

/** Route protégée : nécessite un jeton admin valide (attaché automatiquement par apiFetch). */
export async function resetStats(): Promise<void> {
  await apiFetch('/stats/reset', { method: 'POST' });
}
