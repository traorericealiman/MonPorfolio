import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Pencil, Check, X, Mail, Phone, Github, Linkedin, Facebook, UserCircle2 } from 'lucide-react';
import { updateProfile, useContent, type Profile } from '../../lib/contentStore';
import { Field, TextInput, TextArea, Card, PageHeader } from '../ui/Field';

export default function ProfileTab() {
  const { profile: saved } = useContent();
  const [draft, setDraft] = useState<Profile>(saved);
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Si le profil arrive après coup (chargement initial de l'API), on met le
  // brouillon à jour tant que l'utilisateur n'a pas commencé à éditer.
  useEffect(() => {
    if (!editing) setDraft(saved);
  }, [saved, editing]);

  const update = (patch: Partial<Profile>) => setDraft((prev) => ({ ...prev, ...patch }));

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ photoUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleEdit = () => {
    setDraft(saved);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(saved);
    setEditing(false);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      await updateProfile(draft);
      setEditing(false);
    } catch (err) {
      alert(
        (err as Error).message ||
          "Échec de l'enregistrement. Vérifie que le serveur est démarré et que ta clé admin est correcte."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="Profil" subtitle="Bio, coordonnées et photo affichées dans la section À propos." />

      <div
        className={`relative bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
          editing
            ? 'border-blue-300 shadow-[0_8px_30px_-8px_rgba(10,102,194,0.25)] ring-1 ring-blue-100'
            : 'border-zinc-200'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="p-6 sm:p-8"
            >
              <div className="grid lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 flex flex-col items-center text-center gap-4">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                    {draft.photoUrl ? (
                      <img src={draft.photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle2 className="text-zinc-300" size={48} />
                    )}
                  </div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors">
                    <Upload size={16} />
                    Changer la photo
                    <input type="file" accept="image/*" onChange={onPhotoChange} className="hidden" />
                  </label>
                  <p className="text-xs text-zinc-400">JPG ou PNG, idéalement carrée.</p>
                </Card>

                <Card className="lg:col-span-2 space-y-5">
                  <Field label="Description / bio">
                    <TextArea rows={5} value={draft.description} onChange={(e) => update({ description: e.target.value })} />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Email">
                      <TextInput type="email" value={draft.email} onChange={(e) => update({ email: e.target.value })} />
                    </Field>
                    <Field label="Téléphone (avec indicatif)">
                      <TextInput type="tel" value={draft.phone} onChange={(e) => update({ phone: e.target.value })} />
                    </Field>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Le téléphone est aussi utilisé pour le bouton WhatsApp flottant du site.
                  </p>
                </Card>
              </div>

              <Card className="mt-6 space-y-5">
                <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">Réseaux sociaux</p>
                <div className="grid sm:grid-cols-3 gap-5">
                  <Field label="GitHub">
                    <TextInput
                      type="url"
                      placeholder="https://github.com/..."
                      value={draft.github}
                      onChange={(e) => update({ github: e.target.value })}
                    />
                  </Field>
                  <Field label="LinkedIn">
                    <TextInput
                      type="url"
                      placeholder="https://linkedin.com/in/..."
                      value={draft.linkedin}
                      onChange={(e) => update({ linkedin: e.target.value })}
                    />
                  </Field>
                  <Field label="Facebook">
                    <TextInput
                      type="url"
                      placeholder="https://facebook.com/..."
                      value={draft.facebook}
                      onChange={(e) => update({ facebook: e.target.value })}
                    />
                  </Field>
                </div>
                <p className="text-xs text-zinc-400">
                  Laisse un champ vide pour ne pas afficher ce lien dans le pied de page du site.
                </p>
              </Card>

              <div className="flex items-center gap-2 pt-5 mt-5 border-t border-zinc-100">
                <button
                  onClick={handleSave}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-60 text-zinc-950 rounded-xl text-sm font-black uppercase tracking-wide transition-colors"
                >
                  <Check size={16} />
                  {submitting ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-zinc-500 hover:bg-zinc-100 rounded-xl text-sm font-bold transition-colors"
                >
                  <X size={16} />
                  Annuler
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
              className="p-6 sm:p-8 relative group"
            >
              <button
                onClick={handleEdit}
                aria-label="Modifier le profil"
                className="absolute top-5 right-5 sm:top-6 sm:right-6 w-9 h-9 flex items-center justify-center bg-zinc-900 text-white rounded-full hover:bg-blue-500 hover:text-zinc-950 transition-colors shadow-lg"
              >
                <Pencil size={15} />
              </button>

              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 rounded-2xl overflow-hidden border border-zinc-200 mx-auto sm:mx-0 bg-zinc-100 flex items-center justify-center">
                  {saved.photoUrl ? (
                    <img src={saved.photoUrl} alt="Photo de profil" className="w-full h-full object-cover" />
                  ) : (
                    <UserCircle2 className="text-zinc-300" size={40} />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <p className="text-zinc-600 leading-relaxed mb-4">{saved.description}</p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm mb-4">
                    <span className="flex items-center justify-center sm:justify-start gap-2 text-zinc-500">
                      <Mail size={14} className="text-blue-500" />
                      {saved.email}
                    </span>
                    <span className="flex items-center justify-center sm:justify-start gap-2 text-zinc-500">
                      <Phone size={14} className="text-blue-500" />
                      {saved.phone}
                    </span>
                  </div>
                  <div className="border-t border-zinc-100 pt-4 space-y-2.5">
                    {[
                      { icon: Github, label: 'GitHub', value: saved.github },
                      { icon: Linkedin, label: 'LinkedIn', value: saved.linkedin },
                      { icon: Facebook, label: 'Facebook', value: saved.facebook },
                    ].map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-center sm:justify-start gap-2.5 text-sm"
                      >
                        <Icon size={15} className={value ? 'text-blue-500' : 'text-zinc-300'} />
                        <span className="font-medium text-zinc-500 w-16 text-left flex-shrink-0">{label}</span>
                        {value ? (
                          <a
                            href={value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate"
                          >
                            {value}
                          </a>
                        ) : (
                          <span className="text-zinc-300 italic">Non renseigné</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
