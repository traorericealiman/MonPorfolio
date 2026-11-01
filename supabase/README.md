# Backend Supabase (Edge Function `api`)

Remplace l'ancien backend Flask : une seule fonction, mêmes routes (`/content`, `/profile`,
`/competitions`, `/creations`, `/projects`, `/stats`, `/admin/*`).

## Déploiement

```bash
supabase link --project-ref <ref>
supabase db push                                  # applique supabase/migrations
supabase secrets set ADMIN_TOKEN_SECRET=<chaine-aleatoire-de-32-caracteres-minimum>
supabase secrets set ALLOWED_ORIGINS=https://ton-site.vercel.app,http://localhost:3000
supabase functions deploy api --no-verify-jwt
```

## Sécurité

- Plus aucune table ni fonction SQL n'est accessible avec la clé publique (anon) : tout passe par la fonction.
- `/admin/login` : 10 échecs par compte (ou 20 par IP) en 15 minutes bloquent la connexion pendant 15 minutes.
- Les sessions admin durent 7 jours et sont invalidées dès que le mot de passe change.
- `/admin/register` est désactivé. Pour recréer un premier compte sur une base vide :
  `supabase secrets set ALLOW_ADMIN_REGISTER=true`, crée le compte, puis `supabase secrets unset ALLOW_ADMIN_REGISTER`.
- `/stats` (lecture) est réservé à l'admin ; seul `/stats/increment` reste public.

## Frontend

Dans `MonPorfolio/.env` (et dans les variables Vercel) :

```
VITE_API_URL=https://<ref>.supabase.co/functions/v1/api
```

Les comptes admin existants (hashes Werkzeug) restent valides ; ils sont migrés au premier login.
