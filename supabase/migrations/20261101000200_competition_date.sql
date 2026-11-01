-- Date de la compétition au format "AAAA-MM" (vide si inconnue), pour l'ordre chronologique.
alter table competitions add column if not exists date text not null default '';
