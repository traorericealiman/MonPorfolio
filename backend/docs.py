"""Documentation de l'API, générée depuis une simple liste Python.

Ajoute une entrée ici à chaque fois que tu ajoutes une route dans routes/*.py
 la page /docs se met à jour automatiquement.
"""

ENDPOINTS = [
    {
        "group": "Général",
        "method": "GET",
        "path": "/api/health",
        "auth": False,
        "description": "Vérifie que le serveur répond.",
    },
    {
        "group": "Général",
        "method": "GET",
        "path": "/api/admin/verify",
        "auth": True,
        "description": "Vérifie qu'un jeton de session admin est encore valide (rechargement de page).",
    },
    {
        "group": "Authentification",
        "method": "POST",
        "path": "/api/admin/login",
        "auth": False,
        "description": "Connexion avec username + mot de passe. Renvoie un jeton de session (X-Admin-Key).",
        "body": '{"username": "...", "password": "..."}',
    },
    {
        "group": "Authentification",
        "method": "POST",
        "path": "/api/admin/register",
        "auth": False,
        "description": "Crée le tout premier compte admin. Refuse si un compte existe déjà.",
        "body": '{"username": "...", "password": "..."}',
    },
    {
        "group": "Authentification",
        "method": "POST",
        "path": "/api/admin/change-password",
        "auth": True,
        "description": "Change le mot de passe du compte admin.",
        "body": '{"username": "...", "currentPassword": "...", "newPassword": "..."}',
    },
    {
        "group": "Contenu",
        "method": "GET",
        "path": "/api/content",
        "auth": False,
        "description": "Tout le contenu du site en un seul appel (profil, compétitions, créations, projets).",
    },
    {
        "group": "Profil",
        "method": "GET",
        "path": "/api/profile",
        "auth": False,
        "description": "Récupère le profil (bio, email, téléphone, photo, réseaux sociaux).",
    },
    {
        "group": "Profil",
        "method": "PUT",
        "path": "/api/profile",
        "auth": True,
        "description": "Met à jour le profil.",
    },
    {
        "group": "Compétitions",
        "method": "GET",
        "path": "/api/competitions",
        "auth": False,
        "description": "Liste des compétitions & hackathons.",
    },
    {
        "group": "Compétitions",
        "method": "POST",
        "path": "/api/competitions",
        "auth": True,
        "description": "Ajoute une compétition.",
    },
    {
        "group": "Compétitions",
        "method": "PUT",
        "path": "/api/competitions/<id>",
        "auth": True,
        "description": "Modifie une compétition existante.",
    },
    {
        "group": "Compétitions",
        "method": "DELETE",
        "path": "/api/competitions/<id>",
        "auth": True,
        "description": "Supprime une compétition.",
    },
    {
        "group": "Créations visuelles",
        "method": "GET",
        "path": "/api/creations",
        "auth": False,
        "description": "Liste des créations visuelles.",
    },
    {
        "group": "Créations visuelles",
        "method": "POST",
        "path": "/api/creations",
        "auth": True,
        "description": "Ajoute une création.",
    },
    {
        "group": "Créations visuelles",
        "method": "PUT",
        "path": "/api/creations/<id>",
        "auth": True,
        "description": "Modifie une création existante.",
    },
    {
        "group": "Créations visuelles",
        "method": "DELETE",
        "path": "/api/creations/<id>",
        "auth": True,
        "description": "Supprime une création.",
    },
    {
        "group": "Projets",
        "method": "GET",
        "path": "/api/projects",
        "auth": False,
        "description": "Liste des projets.",
    },
    {
        "group": "Projets",
        "method": "POST",
        "path": "/api/projects",
        "auth": True,
        "description": "Ajoute un projet.",
    },
    {
        "group": "Projets",
        "method": "PUT",
        "path": "/api/projects/<id>",
        "auth": True,
        "description": "Modifie un projet existant.",
    },
    {
        "group": "Projets",
        "method": "DELETE",
        "path": "/api/projects/<id>",
        "auth": True,
        "description": "Supprime un projet.",
    },
    {
        "group": "Statistiques",
        "method": "GET",
        "path": "/api/stats",
        "auth": False,
        "description": "Totaux + historique quotidien (visites, téléchargements CV, clics WhatsApp, clics réseaux sociaux).",
    },
    {
        "group": "Statistiques",
        "method": "POST",
        "path": "/api/stats/increment",
        "auth": False,
        "description": 'Incrémente un compteur du jour. Body JSON : { "metric": "visits" }.',
        "body": '{"metric": "visits" | "cvDownloads" | "whatsappClicks" | "githubClicks" | "linkedinClicks" | "facebookClicks"}',
    },
    {
        "group": "Statistiques",
        "method": "POST",
        "path": "/api/stats/reset",
        "auth": True,
        "description": "Remet toutes les statistiques à zéro.",
    },
]


METHOD_COLORS = {
    "GET": "#0A66C2",
    "POST": "#22C55E",
    "PUT": "#F59E0B",
    "DELETE": "#EF4444",
}


def render_docs_html() -> str:
    from html import escape

    groups = {}
    for ep in ENDPOINTS:
        groups.setdefault(ep["group"], []).append(ep)

    sections = ""
    for group, endpoints in groups.items():
        rows = ""
        for ep in endpoints:
            color = METHOD_COLORS.get(ep["method"], "#71717A")
            auth_badge = (
                '<span class="badge badge-auth">🔒 clé admin requise</span>'
                if ep["auth"]
                else '<span class="badge badge-public">public</span>'
            )
            body_row = (
                f'<div class="body-example"><code>{escape(ep["body"])}</code></div>' if ep.get("body") else ""
            )
            rows += f"""
            <div class="endpoint">
              <div class="endpoint-head">
                <span class="method" style="background:{color}">{ep["method"]}</span>
                <code class="path">{escape(ep["path"])}</code>
                {auth_badge}
              </div>
              <p class="desc">{escape(ep["description"])}</p>
              {body_row}
            </div>
            """
        sections += f'<section><h2>{group}</h2>{rows}</section>'

    return f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>API Portfolio  Documentation</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  :root {{ color-scheme: light; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #F4F4F5;
    color: #18181B;
    padding: 0 20px 80px;
  }}
  header {{
    max-width: 860px;
    margin: 0 auto;
    padding: 48px 0 24px;
  }}
  h1 {{ font-size: 28px; font-weight: 900; letter-spacing: -0.02em; margin: 0 0 6px; }}
  header p {{ color: #71717A; margin: 0; }}
  main {{ max-width: 860px; margin: 0 auto; }}
  section {{ margin-bottom: 32px; }}
  h2 {{
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #71717A;
    font-weight: 800;
    margin: 0 0 12px;
  }}
  .endpoint {{
    background: white;
    border: 1px solid #E4E4E7;
    border-radius: 14px;
    padding: 16px 18px;
    margin-bottom: 10px;
  }}
  .endpoint-head {{ display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }}
  .method {{
    color: white;
    font-weight: 800;
    font-size: 11px;
    padding: 3px 9px;
    border-radius: 999px;
    letter-spacing: 0.04em;
  }}
  .path {{ font-family: ui-monospace, Menlo, monospace; font-size: 14px; font-weight: 600; }}
  .badge {{
    margin-left: auto;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 999px;
  }}
  .badge-public {{ background: #ECFDF5; color: #059669; }}
  .badge-auth {{ background: #FEF2F2; color: #DC2626; }}
  .desc {{ margin: 10px 0 0; color: #52525B; font-size: 14px; line-height: 1.5; }}
  .body-example {{
    margin-top: 10px;
    background: #FAFAFA;
    border: 1px solid #E4E4E7;
    border-radius: 8px;
    padding: 8px 12px;
  }}
  .body-example code {{ font-family: ui-monospace, Menlo, monospace; font-size: 12.5px; color: #3F3F46; }}
  .note {{
    max-width: 860px;
    margin: 0 auto 32px;
    background: #EFF6FF;
    border: 1px solid #DBEAFE;
    border-radius: 14px;
    padding: 16px 18px;
    font-size: 14px;
    color: #1E3A8A;
    line-height: 1.6;
  }}
  .note code {{ background: rgba(0,0,0,0.06); padding: 1px 5px; border-radius: 4px; }}
</style>
</head>
<body>
  <header>
    <h1>API Portfolio</h1>
    <p>Documentation des routes disponibles.</p>
  </header>
  <div class="note">
    Les routes marquées <span class="badge badge-auth" style="margin-left:0">🔒 clé admin requise</span>
    attendent le header <code>X-Admin-Key: &lt;ta clé&gt;</code> (voir <code>ADMIN_API_KEY</code> dans <code>.env</code>).
  </div>
  <main>
    {sections}
  </main>
</body>
</html>"""
