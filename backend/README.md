# Backend  API Flask (Supabase)

API REST qui sert le contenu du portfolio (profil, compétitions, créations,
projets) et les statistiques (KPI), stockés dans Supabase (PostgreSQL) via
le schéma `supabase/schema.sql` du dépôt.

## Installation

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configuration

Le fichier `.env` existe déjà avec ta chaîne de connexion Supabase  remplace
juste `[YOUR-PASSWORD]` par ton vrai mot de passe de base de données (visible
dans Supabase > Project Settings > Database).

Change aussi `ADMIN_API_KEY` par une valeur secrète à toi (c'est cette clé
qu'il faudra envoyer dans le header `X-Admin-Key` pour toute écriture depuis
l'Admin du site).

## Lancer le serveur

```bash
python app.py
```

L'API tourne sur `http://localhost:5001`.

## Endpoints

### Contenu (lecture publique, écriture protégée)

| Méthode | Route                          | Auth  | Description                          |
|---------|----------------------------------|-------|---------------------------------------|
| GET     | `/api/content`                  | non   | Tout le contenu en un appel           |
| GET     | `/api/profile`                  | non   | Le profil                             |
| PUT     | `/api/profile`                  | oui   | Met à jour le profil                  |
| GET     | `/api/competitions`              | non   | Liste des compétitions                |
| POST    | `/api/competitions`              | oui   | Ajoute une compétition                |
| PUT     | `/api/competitions/<id>`         | oui   | Modifie une compétition               |
| DELETE  | `/api/competitions/<id>`         | oui   | Supprime une compétition              |
| GET/POST/PUT/DELETE | `/api/creations[/<id>]` | idem | Même schéma que competitions      |
| GET/POST/PUT/DELETE | `/api/projects[/<id>]`  | idem | Même schéma que competitions      |

Pour les routes protégées, ajoute le header :

```
X-Admin-Key: <valeur de ADMIN_API_KEY>
```

### Statistiques

| Méthode | Route                   | Auth | Description                                   |
|---------|--------------------------|------|-------------------------------------------------|
| GET     | `/api/stats`             | non  | Totaux + historique quotidien                  |
| POST    | `/api/stats/increment`   | non  | `{ "metric": "visits" }`  incrémente un compteur du jour |
| POST    | `/api/stats/reset`       | oui  | Remet toutes les stats à zéro                  |

Métriques valides pour `/api/stats/increment` :
`visits`, `cvDownloads`, `whatsappClicks`, `githubClicks`, `linkedinClicks`, `facebookClicks`.

## Déploiement

En production, lance avec gunicorn plutôt que le serveur de dev Flask :

```bash
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```
