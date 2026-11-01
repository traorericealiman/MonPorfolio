import { Plus, ImagePlus, FolderKanban } from 'lucide-react';
import { type Project } from '../../lib/contentStore';
import { Field, TextInput, TextArea, PageHeader } from '../ui/Field';
import { EditableCard } from '../ui/EditableCard';
import { useEditableList } from '../useEditableList';

function emptyProject(): Project {
  return {
    id: `${Date.now()}`,
    title: 'NOUVEAU PROJET',
    description: '',
    tech: [],
    accent: '#0A66C2',
    bg: '#F5F4F0',
    textColor: '#0A0A0A',
    isDark: false,
    year: String(new Date().getFullYear()),
    category: '',
    github: '#',
    link: '#',
    image: '',
  };
}

export default function ProjectsTab() {
  const { items, isEditing, updateField, startEdit, cancelEdit, saveItem, addItem, deleteItem } =
    useEditableList<Project>('projects');

  const onImageUpload = (id: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField(id, { image: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <PageHeader
        title="Projets"
        subtitle="Les études de cas affichées dans la section Projets."
        action={
          <button
            onClick={() => addItem(emptyProject)}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Plus size={16} />
            Ajouter un projet
          </button>
        }
      />

      <div className="space-y-5">
        {items.map((project) => (
          <EditableCard
            key={project.id}
            editing={isEditing(project.id)}
            onEdit={() => startEdit(project.id)}
            onCancel={() => cancelEdit(project.id)}
            onSave={() => saveItem(project.id)}
            onDelete={() => deleteItem(project.id)}
            preview={
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-zinc-200 flex items-center justify-center" style={{ background: project.bg }}>
                  {project.image ? (
                    <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">🎨</span>
                  )}
                </div>
                <div className="min-w-0 pr-16">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: project.accent }} />
                    <h3 className="font-bold text-zinc-900 truncate">{project.title}</h3>
                  </div>
                  <p className="text-sm text-zinc-500 line-clamp-2 mb-2">{project.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.tech.map((t) => (
                      <span key={t} className="text-[10px] font-bold uppercase tracking-wide bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            }
            form={
              <>
                <div className="flex items-start gap-4">
                  <label className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 cursor-pointer group/upload">
                    {project.image ? (
                      <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: project.bg }}>
                        <ImagePlus className="text-zinc-400" size={22} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover/upload:bg-black/40 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover/upload:opacity-100 text-white text-[10px] font-bold uppercase tracking-wide transition-opacity">
                        Changer
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onImageUpload(project.id, e.target.files?.[0])}
                    />
                  </label>
                  <div className="flex-1">
                    <Field label="Titre du projet">
                      <TextInput
                        value={project.title}
                        onChange={(e) => updateField(project.id, { title: e.target.value })}
                        className="font-bold"
                      />
                    </Field>
                  </div>
                </div>

                <Field label="Description">
                  <TextArea
                    rows={2}
                    value={project.description}
                    onChange={(e) => updateField(project.id, { description: e.target.value })}
                  />
                </Field>

                <Field label="Technologies (séparées par des virgules)">
                  <TextInput
                    value={project.tech.join(', ')}
                    onChange={(e) =>
                      updateField(project.id, {
                        tech: e.target.value.split(',').map((t) => t.trim()).filter(Boolean),
                      })
                    }
                  />
                </Field>

                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <Field label="Catégorie">
                    <TextInput
                      value={project.category}
                      onChange={(e) => updateField(project.id, { category: e.target.value })}
                    />
                  </Field>
                  <Field label="Année">
                    <TextInput value={project.year} onChange={(e) => updateField(project.id, { year: e.target.value })} />
                  </Field>
                  <Field label="Lien GitHub">
                    <TextInput
                      value={project.github}
                      onChange={(e) => updateField(project.id, { github: e.target.value })}
                    />
                  </Field>
                  <Field label="Lien du projet">
                    <TextInput value={project.link} onChange={(e) => updateField(project.id, { link: e.target.value })} />
                  </Field>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 items-end">
                  <Field label="Couleur d'accent">
                    <input
                      type="color"
                      value={project.accent}
                      onChange={(e) => updateField(project.id, { accent: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 cursor-pointer"
                    />
                  </Field>
                  <Field label="Couleur de fond">
                    <input
                      type="color"
                      value={project.bg}
                      onChange={(e) => updateField(project.id, { bg: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 cursor-pointer"
                    />
                  </Field>
                  <label className="flex items-center gap-2 pb-2.5 text-sm font-medium text-zinc-700">
                    <input
                      type="checkbox"
                      checked={project.isDark}
                      onChange={(e) =>
                        updateField(project.id, {
                          isDark: e.target.checked,
                          textColor: e.target.checked ? '#F5F4F0' : '#0A0A0A',
                        })
                      }
                      className="w-4 h-4"
                    />
                    Fond sombre (texte clair)
                  </label>
                </div>
              </>
            }
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <FolderKanban size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun projet pour le moment.</p>
        </div>
      )}
    </div>
  );
}
