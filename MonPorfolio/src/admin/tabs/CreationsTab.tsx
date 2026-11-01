import { Plus, ImagePlus, Palette } from 'lucide-react';
import { type Creation } from '../../lib/contentStore';
import { Field, TextInput, PageHeader } from '../ui/Field';
import { EditableCard } from '../ui/EditableCard';
import { useEditableList } from '../useEditableList';

function emptyCreation(): Creation {
  return { id: `creation-${Date.now()}`, title: '', category: '', color: '#0A66C2', image: '' };
}

export default function CreationsTab() {
  const { items, isEditing, updateField, startEdit, cancelEdit, saveItem, addItem, deleteItem } =
    useEditableList<Creation>('creations');

  const onImageUpload = (id: string, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateField(id, { image: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <PageHeader
        title="Créations visuelles"
        subtitle="Le carrousel affiché dans la section Créations Visuelles."
        action={
          <button
            onClick={() => addItem(emptyCreation)}
            className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-sm font-bold transition-colors shadow-sm"
          >
            <Plus size={16} />
            Ajouter une création
          </button>
        }
      />

      <div className="space-y-5">
        {items.map((item) => (
          <EditableCard
            key={item.id}
            editing={isEditing(item.id)}
            onEdit={() => startEdit(item.id)}
            onCancel={() => cancelEdit(item.id)}
            onSave={() => saveItem(item.id)}
            onDelete={() => deleteItem(item.id)}
            preview={
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-zinc-200 flex items-center justify-center">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: item.color }}
                    >
                      <ImagePlus className="text-white/70" size={20} />
                    </div>
                  )}
                </div>
                <div className="min-w-0 pr-16">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <h3 className="font-bold text-zinc-900 truncate">{item.title || 'Sans titre'}</h3>
                  </div>
                  <p className="text-sm text-zinc-500">{item.category}</p>
                </div>
              </div>
            }
            form={
              <>
                <div className="flex items-start gap-4">
                  <label className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-zinc-100 border border-zinc-200 cursor-pointer group/upload">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        style={{ backgroundColor: item.color }}
                      >
                        <ImagePlus className="text-white/70" size={20} />
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
                      onChange={(e) => onImageUpload(item.id, e.target.files?.[0])}
                    />
                  </label>
                  <div className="flex-1">
                    <Field label="Titre">
                      <TextInput
                        value={item.title}
                        onChange={(e) => updateField(item.id, { title: e.target.value })}
                      />
                    </Field>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Catégorie">
                    <TextInput
                      value={item.category}
                      onChange={(e) => updateField(item.id, { category: e.target.value })}
                    />
                  </Field>
                  <Field label="Couleur (si pas d'image)">
                    <input
                      type="color"
                      value={item.color}
                      onChange={(e) => updateField(item.id, { color: e.target.value })}
                      className="w-full h-10 rounded-xl border border-zinc-200 cursor-pointer"
                    />
                  </Field>
                </div>
              </>
            }
          />
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-zinc-400">
          <Palette size={32} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucune création pour le moment.</p>
        </div>
      )}
    </div>
  );
}
