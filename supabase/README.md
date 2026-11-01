# Backend Supabase (Edge Function `api`)

Remplace l'ancien backend Flask : une seule fonction, mêmes routes (`/content`, `/profile`,
`/competitions`, `/creations`, `/projects`, `/stats`, `/admin/*`).

## Déploiement

```bash
supabase link --project-ref <ref>
supabase db push                                  # applique supabase/migrations
supabase secrets set ADMIN_TOKEN_SECRET=<longue-chaine-aleatoire>
supabase secrets set ALLOWED_ORIGINS=https://ton-site.vercel.app,http://localhost:3000   # optionnel
supabase functions deploy api --no-verify-jwt
```

## Frontend

Dans `MonPorfolio/.env` (et dans les variables Vercel) :

```
VITE_API_URL=https://<ref>.supabase.co/functions/v1/api
```

Les comptes admin existants (hashes Werkzeug) restent valides ; ils sont migrés au premier login.
