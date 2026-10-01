import { Lock } from 'lucide-react';
import { Card, PageHeader } from '../ui/Field';

const STACK_OVERVIEW = [
  { category: 'Frontend', tools: ['React', 'Next.js', 'TypeScript', 'Tailwind'] },
  { category: 'Backend', tools: ['Node.js', 'Express', 'Python'] },
  { category: 'Database', tools: ['PostgreSQL', 'Supabase', 'MongoDB'] },
  { category: 'Design', tools: ['Figma', 'Photoshop', 'Illustrator'] },
  { category: 'DevOps', tools: ['Git', 'Docker', 'Vercel'] },
];

export default function TechnologiesTab() {
  return (
    <div>
      <PageHeader
        title="Technologies"
        subtitle="Cette section reste statique pour le moment (non modifiable ici)."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {STACK_OVERVIEW.map((section) => (
          <Card key={section.category}>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-3">
              {section.category}
            </h3>
            <ul className="space-y-1.5">
              {section.tools.map((tool) => (
                <li key={tool} className="text-sm font-medium text-zinc-700">
                  {tool}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
