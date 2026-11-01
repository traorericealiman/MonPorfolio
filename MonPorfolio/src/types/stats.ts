export const METRIC_KEYS = [
  'visits',
  'cvDownloads',
  'whatsappClicks',
  'githubClicks',
  'linkedinClicks',
  'facebookClicks',
] as const;

export type MetricKey = (typeof METRIC_KEYS)[number];

export type DayEntry = { date: string } & Record<MetricKey, number>;

export type Stats = Record<MetricKey, number> & {
  lastVisit: string | null;
  history: DayEntry[];
};
