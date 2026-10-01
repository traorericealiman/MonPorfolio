import { Eye, Download, MessageCircle, RotateCcw, Info, Github } from 'lucide-react';
import { useStats, resetStats } from '../../lib/analytics';
import { Card, PageHeader } from '../ui/Field';
import MetricChartCard from '../ui/MetricChartCard';

function KpiCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
}) {
  return (
    <Card className="relative overflow-hidden">
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
        <Icon className="text-blue-500" size={22} />
      </div>
      <p className="text-5xl font-black text-zinc-900 leading-none">{value.toLocaleString('fr-FR')}</p>
      <p className="text-base font-medium text-zinc-500 mt-3">{label}</p>
    </Card>
  );
}

export default function StatsTab() {
  const stats = useStats();
  const socialTotal = stats.githubClicks + stats.linkedinClicks + stats.facebookClicks;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <PageHeader title="Statistiques" subtitle="Vue d'ensemble de l'activité du site." />
        <button
          onClick={() => resetStats()}
          className="flex items-center gap-2 px-4 py-2.5 border border-zinc-200 text-zinc-500 rounded-xl text-sm font-bold hover:border-red-200 hover:text-red-500 hover:bg-red-50 transition-colors h-fit"
        >
          <RotateCcw size={15} />
          Réinitialiser
        </button>
      </div>

      <Card className="mb-6 flex items-start gap-3 bg-blue-50 border-blue-100">
        <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-base text-blue-900">
          Ces chiffres sont enregistrés dans <strong>ce navigateur</strong> uniquement (pas encore de
          base de données centrale). Une vraie collecte multi-visiteurs arrivera avec le backend.
        </p>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard icon={Eye} label="Visites" value={stats.visits} />
        <KpiCard icon={Download} label="Téléchargements CV" value={stats.cvDownloads} />
        <KpiCard icon={MessageCircle} label="Clics WhatsApp" value={stats.whatsappClicks} />
        <KpiCard icon={Github} label="Clics réseaux sociaux" value={socialTotal} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <MetricChartCard
          title="Visites du site"
          icon={Eye}
          history={stats.history}
          total={stats.visits}
          series={[{ key: 'visits', label: 'Visites', color: '#0A66C2' }]}
        />

        <MetricChartCard
          title="Téléchargements du CV"
          icon={Download}
          history={stats.history}
          total={stats.cvDownloads}
          series={[{ key: 'cvDownloads', label: 'Téléchargements', color: '#22C55E' }]}
        />

        <MetricChartCard
          title="Clics sur WhatsApp"
          icon={MessageCircle}
          history={stats.history}
          total={stats.whatsappClicks}
          series={[{ key: 'whatsappClicks', label: 'Clics WhatsApp', color: '#25D366' }]}
        />

        <MetricChartCard
          title="Clics sur les réseaux sociaux"
          icon={Github}
          history={stats.history}
          total={socialTotal}
          series={[
            { key: 'githubClicks', label: 'GitHub', color: '#18181B' },
            { key: 'linkedinClicks', label: 'LinkedIn', color: '#0A66C2' },
            { key: 'facebookClicks', label: 'Facebook', color: '#1877F2' },
          ]}
        />
      </div>
    </div>
  );
}
