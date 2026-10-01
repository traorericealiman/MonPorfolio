import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Trash2, Check, X } from 'lucide-react';

export function EditableCard({
  editing,
  preview,
  form,
  onEdit,
  onSave,
  onCancel,
  onDelete,
  accent = false,
}: {
  editing: boolean;
  preview: ReactNode;
  form: ReactNode;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  accent?: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
        editing
          ? 'border-blue-300 shadow-[0_8px_30px_-8px_rgba(10,102,194,0.25)] ring-1 ring-blue-100'
          : 'border-zinc-200 hover:border-zinc-300 hover:shadow-md'
      } ${accent ? 'ring-2 ring-blue-400' : ''}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-5 sm:p-6 space-y-4"
          >
            {form}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={onSave}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-zinc-950 rounded-lg text-xs font-black uppercase tracking-wide transition-colors"
              >
                <Check size={14} />
                Enregistrer
              </button>
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-4 py-2 text-zinc-500 hover:bg-zinc-100 rounded-lg text-xs font-bold transition-colors"
              >
                <X size={14} />
                Annuler
              </button>
              <button
                onClick={onDelete}
                className="ml-auto flex items-center gap-1.5 px-3 py-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg text-xs font-bold transition-colors"
              >
                <Trash2 size={14} />
                Supprimer
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="p-5 sm:p-6 relative group"
          >
            <div className="absolute top-4 right-4 sm:top-5 sm:right-5 flex items-center gap-1.5">
              <button
                onClick={onEdit}
                aria-label="Modifier"
                className="w-8 h-8 flex items-center justify-center bg-zinc-900 text-white rounded-full hover:bg-blue-500 hover:text-zinc-950 transition-colors shadow-lg"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={onDelete}
                aria-label="Supprimer"
                className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 text-zinc-400 rounded-full hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors shadow-sm"
              >
                <Trash2 size={14} />
              </button>
            </div>
            {preview}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
