import { useEffect, useRef, useState } from 'react';
import {
  createListItem,
  deleteListItem,
  updateListItem,
  useContent,
  type ListResource,
} from '../lib/contentStore';

/**
 * Gère une liste éditable "carte par carte", branchée sur l'API backend :
 * chaque élément a son propre mode édition et son propre bouton Enregistrer
 *  modifier un élément ne touche jamais aux autres tant qu'on n'a pas
 * cliqué sur son Enregistrer (qui envoie alors juste CET élément à l'API).
 */
export function useEditableList<T extends { id: string }>(resource: ListResource) {
  const content = useContent();
  const savedFromApi = content[resource] as unknown as T[];

  const [items, setItems] = useState<T[]>(savedFromApi);
  const [savedSnapshot, setSavedSnapshot] = useState<T[]>(savedFromApi);
  const [editingIds, setEditingIds] = useState<Set<string>>(new Set());
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
  const prevApiRef = useRef(savedFromApi);

  // Resynchronise avec les données de l'API à chaque changement (chargement
  // initial, ou après qu'un AUTRE élément a été enregistré), sans jamais
  // écraser un élément actuellement en cours d'édition dans ce composant.
  useEffect(() => {
    if (prevApiRef.current === savedFromApi) return;
    prevApiRef.current = savedFromApi;

    setSavedSnapshot(savedFromApi);
    setItems((prev) => {
      const editingLocal = new Map(prev.filter((it) => editingIds.has(it.id)).map((it) => [it.id, it]));
      const merged = savedFromApi.map((fresh) => editingLocal.get(fresh.id) ?? fresh);
      const pendingNew = [...editingLocal.values()].filter(
        (it) => !savedFromApi.some((f) => f.id === it.id)
      );
      return [...pendingNew, ...merged];
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedFromApi]);

  const isEditing = (id: string) => editingIds.has(id);
  const isSaving = (id: string) => savingIds.has(id);
  const isNew = (id: string) => !savedSnapshot.some((it) => it.id === id);

  const updateField = (id: string, patch: Partial<T>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const startEdit = (id: string) => {
    setEditingIds((prev) => new Set(prev).add(id));
  };

  const stopEditing = (id: string) => {
    setEditingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const cancelEdit = (id: string) => {
    if (isNew(id)) {
      setItems((prev) => prev.filter((it) => it.id !== id));
    } else {
      const original = savedSnapshot.find((it) => it.id === id);
      if (original) setItems((prev) => prev.map((it) => (it.id === id ? original : it)));
    }
    stopEditing(id);
  };

  const saveItem = async (id: string) => {
    const current = items.find((it) => it.id === id);
    if (!current) return;
    setSavingIds((prev) => new Set(prev).add(id));
    try {
      if (isNew(id)) {
        await createListItem<T>(resource, current);
      } else {
        await updateListItem<T>(resource, id, current);
      }
      stopEditing(id);
    } catch (err) {
      console.error(`Échec de l'enregistrement (${resource}/${id}) :`, err);
      alert(
        (err as Error).message ||
          "Échec de l'enregistrement. Vérifie que le serveur est démarré et que ta clé admin est correcte."
      );
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const addItem = (factory: () => T) => {
    const item = factory();
    setItems((prev) => [item, ...prev]);
    startEdit(item.id);
  };

  const deleteItem = async (id: string) => {
    if (isNew(id)) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      stopEditing(id);
      return;
    }
    try {
      await deleteListItem(resource, id);
      stopEditing(id);
    } catch (err) {
      console.error(`Échec de la suppression (${resource}/${id}) :`, err);
      alert((err as Error).message || 'Échec de la suppression.');
    }
  };

  return {
    items,
    isEditing,
    isSaving,
    isNew,
    updateField,
    startEdit,
    cancelEdit,
    saveItem,
    addItem,
    deleteItem,
  };
}
