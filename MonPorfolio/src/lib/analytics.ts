import { useEffect, useState } from 'react';
import { fetchStats, incrementMetric as incrementMetricApi, resetStats as resetStatsApi } from '../services/statsService';
import { METRIC_KEYS } from '../types/stats';
import type { DayEntry, MetricKey, Stats } from '../types/stats';

export type { DayEntry, MetricKey, Stats } from '../types/stats';

// --- Compteurs KPI, servis par l'API backend (table daily_stats) -----------
// NOTE : ces statistiques sont désormais partagées entre TOUS les visiteurs
// du site (stockées côté serveur dans Supabase), plus seulement dans le
// navigateur de l'admin comme avec l'ancienne version localStorage.

const CHANGE_EVENT = 'portfolio_stats_change';
const VISIT_SESSION_FLAG = 'portfolio_visit_recorded_session';

function emptyMetrics(): Record<MetricKey, number> {
  return METRIC_KEYS.reduce((acc, k) => ({ ...acc, [k]: 0 }), {} as Record<MetricKey, number>);
}

function defaultStats(): Stats {
  return { ...emptyMetrics(), lastVisit: null, history: [] };
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// --- Cache local + notification de changement --------------------------------

let cache: Stats = defaultStats();
let hasLoaded = false;
let fetchPromise: Promise<Stats> | null = null;

function notifyChange() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

async function loadStats(): Promise<Stats> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetchStats()
    .then((data) => {
      cache = { ...defaultStats(), ...data };
      hasLoaded = true;
      notifyChange();
      return cache;
    })
    .catch((err) => {
      console.error("Impossible de charger les statistiques depuis l'API :", err);
      return cache;
    })
    .finally(() => {
      fetchPromise = null;
    });
  return fetchPromise;
}

/** Incrémentation optimiste locale (feedback instantané) + appel API en tâche de fond. */
function recordMetric(field: MetricKey) {
  const date = todayKey();
  const history = [...cache.history];
  const idx = history.findIndex((h) => h.date === date);
  if (idx >= 0) {
    history[idx] = { ...history[idx], [field]: history[idx][field] + 1 };
  } else {
    history.push({ date, ...emptyMetrics(), [field]: 1 });
  }
  cache = {
    ...cache,
    [field]: cache[field] + 1,
    ...(field === 'visits' ? { lastVisit: new Date().toISOString() } : {}),
    history,
  };
  notifyChange();

  incrementMetricApi(field).catch((err) =>
    console.error(`Échec de l'enregistrement de la métrique "${field}" :`, err)
  );
}

/** À appeler une fois par session (montage de l'app publique). */
export function recordVisit() {
  if (sessionStorage.getItem(VISIT_SESSION_FLAG)) return;
  sessionStorage.setItem(VISIT_SESSION_FLAG, '1');
  recordMetric('visits');
}

export function recordCvDownload() {
  recordMetric('cvDownloads');
}

export function recordWhatsappClick() {
  recordMetric('whatsappClicks');
}

export type SocialPlatform = 'github' | 'linkedin' | 'facebook';

export function recordSocialClick(platform: SocialPlatform) {
  recordMetric(`${platform}Clicks` as MetricKey);
}

export async function resetStats() {
  try {
    await resetStatsApi();
    cache = defaultStats();
    notifyChange();
  } catch (err) {
    alert(
      (err as Error).message ||
        "Échec de la réinitialisation. Vérifie que le serveur est démarré et que ta clé admin est correcte."
    );
  }
}

export function useStats(): Stats {
  const [stats, setStats] = useState<Stats>(cache);

  useEffect(() => {
    if (!hasLoaded) loadStats();
    const refresh = () => setStats(cache);
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => window.removeEventListener(CHANGE_EVENT, refresh);
  }, []);

  return stats;
}

// --- Agrégation pour les graphiques (jour / semaine / mois) -----------------

export type Granularity = 'day' | 'week' | 'month';

export type ChartPoint = {
  /** Étiquette du haut (la vraie date). */
  label: string;
  /** Étiquette du bas (ex: nom du jour). */
  subLabel: string;
  key: string;
} & Record<MetricKey, number>;

export interface ChartWindow {
  points: ChartPoint[];
  /** Résumé de la période affichée, ex: "8 – 14 septembre 2026". */
  rangeLabel: string;
  /** true si on peut encore reculer dans le temps (naviguer vers le passé). */
  canGoOlder: boolean;
  /** true si on peut avancer vers aujourd'hui. */
  canGoNewer: boolean;
}

/** Lundi de la semaine contenant la date donnée. */
function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const dayNum = (date.getDay() + 6) % 7; // 0 = lundi
  date.setDate(date.getDate() - dayNum);
  date.setHours(0, 0, 0, 0);
  return date;
}

const DAY_NAMES_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTH_NAMES_SHORT = [
  'janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc',
];

function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]}`;
}

function sumEntry(target: Record<MetricKey, number>, entry: DayEntry | undefined) {
  if (!entry) return;
  METRIC_KEYS.forEach((k) => {
    target[k] += entry[k] ?? 0;
  });
}

const WINDOW_SIZE = { day: 14, week: 12, month: 6 } as const;

/**
 * Regroupe l'historique quotidien en points de graphique selon la granularité
 * demandée. `offset` décale la fenêtre affichée vers le passé (0 = fenêtre la
 * plus récente se terminant aujourd'hui, 1 = fenêtre précédente, etc.).
 */
export function aggregateHistory(history: DayEntry[], granularity: Granularity, offset = 0): ChartWindow {
  const findEntry = (key: string) => history.find((h) => h.date === key);

  if (granularity === 'day') {
    const size = WINDOW_SIZE.day;
    const points: ChartPoint[] = [];
    const endOffsetDays = offset * size;
    for (let i = size - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - endOffsetDays - i);
      const key = d.toISOString().slice(0, 10);
      const entry = findEntry(key);
      const metrics = emptyMetrics();
      sumEntry(metrics, entry);
      points.push({
        key,
        label: formatShortDate(d),
        subLabel: DAY_NAMES_FULL[d.getDay()],
        ...metrics,
      });
    }
    const first = new Date(points[0].key);
    const last = new Date(points[points.length - 1].key);
    return {
      points,
      rangeLabel: `${formatShortDate(first)} – ${formatShortDate(last)} ${last.getFullYear()}`,
      canGoOlder: true,
      canGoNewer: offset > 0,
    };
  }

  if (granularity === 'week') {
    const size = WINDOW_SIZE.week;
    const points: ChartPoint[] = [];
    const endOffsetWeeks = offset * size;
    for (let i = size - 1; i >= 0; i--) {
      const ref = new Date();
      ref.setDate(ref.getDate() - (endOffsetWeeks + i) * 7);
      const monday = startOfWeek(ref);

      const metrics = emptyMetrics();
      for (let d = 0; d < 7; d++) {
        const day = new Date(monday);
        day.setDate(day.getDate() + d);
        sumEntry(metrics, findEntry(day.toISOString().slice(0, 10)));
      }

      points.push({
        key: monday.toISOString().slice(0, 10),
        label: formatShortDate(monday),
        subLabel: '',
        ...metrics,
      });
    }
    const first = new Date(points[0].key);
    const lastMonday = new Date(points[points.length - 1].key);
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastSunday.getDate() + 6);
    return {
      points,
      rangeLabel: `${formatShortDate(first)} – ${formatShortDate(lastSunday)} ${lastSunday.getFullYear()}`,
      canGoOlder: true,
      canGoNewer: offset > 0,
    };
  }

  // month
  const size = WINDOW_SIZE.month;
  const points: ChartPoint[] = [];
  const endOffsetMonths = offset * size;
  for (let i = size - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1); // évite les débordements de fin de mois lors du setMonth
    d.setMonth(d.getMonth() - endOffsetMonths - i);
    const year = d.getFullYear();
    const month = d.getMonth();

    const metrics = emptyMetrics();
    history.forEach((h) => {
      const hd = new Date(h.date);
      if (hd.getFullYear() === year && hd.getMonth() === month) {
        sumEntry(metrics, h);
      }
    });

    points.push({
      key: `${year}-${month}`,
      label: MONTH_NAMES_SHORT[month],
      subLabel: String(year),
      ...metrics,
    });
  }
  const first = points[0];
  const last = points[points.length - 1];
  return {
    points,
    rangeLabel:
      first.subLabel === last.subLabel
        ? `${first.label} – ${last.label} ${last.subLabel}`
        : `${first.label} ${first.subLabel} – ${last.label} ${last.subLabel}`,
    canGoOlder: true,
    canGoNewer: offset > 0,
  };
}
