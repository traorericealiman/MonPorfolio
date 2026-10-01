import { useEffect, useState } from 'react';
import {
  createListItem as createListItemApi,
  deleteListItem as deleteListItemApi,
  fetchAllContent,
  updateListItem as updateListItemApi,
  updateProfile as updateProfileApi,
} from '../services';
import type { ListResource, Profile, SiteContent } from '../types/content';

export type { Competition, Creation, ListResource, Profile, Project, SiteContent } from '../types/content';

// --- Valeurs par défaut ------------------------------------------------------
// Structure vide tant que l'API n'a pas encore répondu (ou si le backend est
// injoignable)  volontairement AUCUNE donnée statique ici : si la base est
// vide, l'affichage doit rester vide, jamais un faux contenu de secours.

export const DEFAULT_CONTENT: SiteContent = {
  profile: {
    description: '',
    email: '',
    phone: '',
    photoUrl: '',
    github: '',
    linkedin: '',
    facebook: '',
  },
  competitions: [],
  creations: [],
  projects: [],
};

// --- Cache local + notification de changement --------------------------------
// Le contenu est chargé une fois depuis l'API puis mis en cache en mémoire, afin
// que les composants puissent le lire de façon synchrone sans réafficher un
// écran vide à chaque re-render.

const CHANGE_EVENT = 'portfolio_content_change';

let cache: SiteContent = DEFAULT_CONTENT;
let hasLoaded = false;
let fetchPromise: Promise<SiteContent> | null = null;

function notifyChange() {
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Donne le contenu actuellement en cache (peut être DEFAULT_CONTENT avant le premier chargement). */
export function getContent(): SiteContent {
  return cache;
}

async function loadContent(): Promise<SiteContent> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetchAllContent()
    .then((data) => {
      cache = {
        profile: { ...DEFAULT_CONTENT.profile, ...(data.profile || {}) },
        competitions: data.competitions ?? [],
        creations: data.creations ?? [],
        projects: data.projects ?? [],
      };
      hasLoaded = true;
      notifyChange();
      return cache;
    })
    .catch((err) => {
      console.error("Impossible de charger le contenu depuis l'API :", err);
      return cache;
    })
    .finally(() => {
      fetchPromise = null;
    });
  return fetchPromise;
}

/** Force un rechargement du contenu depuis l'API. */
export function refreshContent() {
  hasLoaded = false;
  return loadContent();
}

/** Hook React : charge le contenu au montage et se met à jour à chaque changement. */
export function useContent(): SiteContent {
  const [content, setContent] = useState<SiteContent>(cache);

  useEffect(() => {
    if (!hasLoaded) loadContent();
    const refresh = () => setContent(getContent());
    window.addEventListener(CHANGE_EVENT, refresh);
    return () => window.removeEventListener(CHANGE_EVENT, refresh);
  }, []);

  return content;
}

// --- Écriture : Profil --------------------------------------------------------

export async function updateProfile(profile: Profile): Promise<Profile> {
  const updated = await updateProfileApi(profile);
  cache = { ...cache, profile: updated };
  notifyChange();
  return updated;
}

// --- Écriture : listes (compétitions / créations / projets) ------------------

export async function createListItem<T extends { id: string }>(
  resource: ListResource,
  data: Omit<T, 'id'> & { id?: string }
): Promise<T> {
  const created = await createListItemApi<T>(resource, data);
  cache = { ...cache, [resource]: [...(cache[resource] as unknown as T[]), created] } as SiteContent;
  notifyChange();
  return created;
}

export async function updateListItem<T extends { id: string }>(
  resource: ListResource,
  id: string,
  data: T
): Promise<T> {
  const updated = await updateListItemApi<T>(resource, id, data);
  cache = {
    ...cache,
    [resource]: (cache[resource] as unknown as T[]).map((item) => (item.id === id ? updated : item)),
  } as SiteContent;
  notifyChange();
  return updated;
}

export async function deleteListItem(resource: ListResource, id: string): Promise<void> {
  await deleteListItemApi(resource, id);
  cache = {
    ...cache,
    [resource]: (cache[resource] as { id: string }[]).filter((item) => item.id !== id),
  } as SiteContent;
  notifyChange();
}
