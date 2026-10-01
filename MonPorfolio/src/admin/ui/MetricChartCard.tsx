import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';
import { aggregateHistory, type DayEntry, type Granularity, type MetricKey } from '../../lib/analytics';
import { Card } from './Field';

const GRANULARITIES: { id: Granularity; label: string }[] = [
  { id: 'week', label: 'Par semaine' },
  { id: 'month', label: 'Par mois' },
];

export interface Series {
  key: MetricKey;
  label: string;
  color: string;
}

function BarChart({ points, series, activeKeys }: { points: any[]; series: Series[]; activeKeys: MetricKey[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const visibleSeries = series.filter((s) => activeKeys.includes(s.key));
  const maxValue = Math.max(1, ...points.flatMap((p) => visibleSeries.map((s) => p[s.key])));
  const width = 100;
  const height = 100;
  const groupWidth = width / points.length;
  const barGap = 0.35;
  const barWidth = (groupWidth * (1 - barGap)) / Math.max(1, visibleSeries.length);
  const skipLabels = points.length > 8;

  return (
    <div className="relative">
      <div className="relative h-36 sm:h-40">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1={0} x2={width} y1={y} y2={y} stroke="#F0F0F0" strokeWidth={0.3} vectorEffect="non-scaling-stroke" />
          ))}
          {points.map((p, i) => {
            const groupX = i * groupWidth + (groupWidth * barGap) / 2;
            return (
              <g key={p.key} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)}>
                <rect x={i * groupWidth} y={0} width={groupWidth} height={height} fill="transparent" />
                {visibleSeries.map((s, si) => {
                  const val = p[s.key];
                  const barHeight = (val / maxValue) * (height - 4);
                  return (
                    <motion.rect
                      key={s.key}
                      x={groupX + si * barWidth}
                      width={Math.max(barWidth - 0.6, 0.5)}
                      fill={s.color}
                      rx={1}
                      initial={{ height: 0, y: height }}
                      animate={{ height: barHeight, y: height - barHeight }}
                      transition={{ duration: 0.5, delay: i * 0.02, ease: 'easeOut' }}
                      opacity={hovered === null || hovered === i ? 1 : 0.35}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>

        <AnimatePresence>
          {hovered !== null && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 -translate-y-full bg-zinc-900 text-white text-sm rounded-lg px-4 py-3 pointer-events-none shadow-xl z-10 whitespace-nowrap"
              style={{ left: `${(hovered + 0.5) * (100 / points.length)}%`, transform: 'translate(-50%, -8px)' }}
            >
              <p className="font-bold mb-1.5">
                {points[hovered].label} · {points[hovered].subLabel}
              </p>
              {visibleSeries.map((s) => (
                <p key={s.key} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                  {s.label} : {points[hovered][s.key]}
                </p>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between mt-3 px-0.5">
        {points.map((p, i) => (
          <div
            key={p.key}
            className={`flex flex-col items-center text-center leading-tight ${
              skipLabels && i % 2 !== 0 ? 'hidden' : 'flex'
            }`}
          >
            <span className={`text-sm font-bold ${hovered === i ? 'text-zinc-900' : 'text-zinc-500'}`}>{p.label}</span>
            <span className={`text-xs ${hovered === i ? 'text-zinc-600' : 'text-zinc-400'}`}>{p.subLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MetricChartCard({
  title,
  icon: Icon,
  series,
  history,
  total,
}: {
  title: string;
  icon: LucideIcon;
  series: Series[];
  history: DayEntry[];
  total: number;
}) {
  const [granularity, setGranularity] = useState<Granularity>('week');
  const [offset, setOffset] = useState(0);
  const [activeKeys, setActiveKeys] = useState<MetricKey[]>(series.map((s) => s.key));

  const chartWindow = useMemo(() => aggregateHistory(history, granularity, offset), [history, granularity, offset]);

  const changeGranularity = (g: Granularity) => {
    setGranularity(g);
    setOffset(0);
  };

  const toggleSeries = (key: MetricKey) => {
    setActiveKeys((prev) =>
      prev.includes(key) ? (prev.length > 1 ? prev.filter((k) => k !== key) : prev) : [...prev, key]
    );
  };

  return (
    <Card>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Icon size={17} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-black text-zinc-900">{title}</h3>
            <span className="text-sm font-bold text-zinc-400">· {total.toLocaleString('fr-FR')} au total</span>
          </div>
          <div className="flex items-center gap-2.5 mt-1.5 ml-11">
            <button
              onClick={() => setOffset((o) => o + 1)}
              disabled={!chartWindow.canGoOlder}
              aria-label="Période précédente"
              className="w-6 h-6 flex items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft size={13} />
            </button>
            <p className="text-sm text-zinc-500 font-medium min-w-max">{chartWindow.rangeLabel}</p>
            <button
              onClick={() => setOffset((o) => Math.max(0, o - 1))}
              disabled={!chartWindow.canGoNewer}
              aria-label="Période suivante"
              className="w-6 h-6 flex items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight size={13} />
            </button>
            {offset > 0 && (
              <button onClick={() => setOffset(0)} className="text-xs font-bold text-blue-600 hover:underline ml-1">
                Aujourd'hui
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {series.length > 1 && (
            <div className="flex items-center gap-3">
              {series.map((s) => {
                const active = activeKeys.includes(s.key);
                return (
                  <button
                    key={s.key}
                    onClick={() => toggleSeries(s.key)}
                    className={`flex items-center gap-1.5 text-sm font-bold transition-opacity ${
                      active ? 'opacity-100' : 'opacity-35'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
            {GRANULARITIES.map((g) => (
              <button
                key={g.id}
                onClick={() => changeGranularity(g.id)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                  granularity === g.id ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <BarChart points={chartWindow.points} series={series} activeKeys={activeKeys} />
    </Card>
  );
}
