import { Plus, Trophy, Upload, ImageOff } from 'lucide-react';
import { type Competition } from '../../lib/contentStore';
import { Field, TextInput, TextArea, PageHeader } from '../ui/Field';
import { EditableCard } from '../ui/EditableCard';
import { useEditableList } from '../useEditableList';

function emptyCompetition(): Competition {
  return {
    id: `comp-${Date.now()}`,
    title: '',
    project: '',
    result: '1er prix',
    description: '',
    image: '',
  };
}

export default function CompetitionsTab() {
  const { items, isEditing, updateField, startEdit, cancelEdit, saveItem, addItem, deleteItem } =
    useEditableList<Competition>('competitions');

  const onImageUpload = (id: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField(id, { image: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <PageHeader
        title="Compétitions & Hackathons"
        subtitle="Gère la liste affichée dans la section Palmarès du site."
        action={
          <button
            onClick={() => addItem(emptyCompetition)}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Plus size={16} />
            Ajouter une compétition
          </button>
        }
      />

      <div className="space-y-5">
        {items.map((comp) => (
          <EditableCard
            key={comp.id}
            editing={isEditing(comp.id)}
            onEdit={() => startEdit(comp.id)}
            onCancel={() => cancelEdit(comp.id)}
            onSave={() => saveItem(comp.id)}
            onDelete={() => deleteItem(comp.id)}
            preview={
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                  {comp.image ? (
                    <img src={comp.image} alt={comp.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageOff className="text-zinc-300" size={20} />
                  )}
                </div>
                <div className="min-w-0 pr-16">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-zinc-900 truncate">{comp.title || 'Sans titre'}</h3>
                    <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">
                      {comp.result}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-blue-600 mb-1">{comp.project}</p>
                  <p className="text-sm text-zinc-500 line-clamp-2">{comp.description}</p>
                </div>
              </div>
            }
            form={
              <>
                <div className="flex items-start gap-4">
                  <label className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 cursor-pointer group/upload">
                    {comp.image ? (
                      <img src={comp.image} alt={comp.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Trophy className="text-zinc-300" size={22} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover/upload:bg-black/40 transition-colors flex items-center justify-center">
                      <Upload
                        size={16}
                        className="text-white opacity-0 group-hover/upload:opacity-100 transition-opacity"
                      />
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onImageUpload(comp.id, e.target.files?.[0])}
                    />
                  </label>
                  <div className="flex-1 grid sm:grid-cols-2 gap-3">
                    <Field label="Titre de la compétition">
                      <TextInput
                        value={comp.title}
                        onChange={(e) => updateField(comp.id, { title: e.target.value })}
                      />
                    </Field>
                    <Field label="Projet">
                      <TextInput
                        value={comp.project}
                        onChange={(e) => updateField(comp.id, { project: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>

                <Field label="Résultat (badge)">
                  <TextInput
                    value={comp.result}
                    onChange={(e) => updateField(comp.id, { result: e.target.value })}
                  />
                </Field>

                <Field label="Description">
                  <TextArea
                    rows={2}
                    value={comp.description}
                    onChange={(e) => updateField(comp.id, { description: e.target.value })}
                  />
                </Field>
              </>
            }
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <Trophy size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucune compétition pour le moment.</p>
        </div>
      )}
    </div>
  );
}
