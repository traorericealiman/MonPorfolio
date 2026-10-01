"""Routes pour les statistiques (KPI) : visites, téléchargements CV,
clics WhatsApp, clics réseaux sociaux.

GET  /api/stats            -> totaux + historique quotidien (public, lecture
                               réservée en pratique au dashboard admin, mais
                               pas de clé exigée ici pour rester simple)
POST /api/stats/increment  -> incrémente un compteur du jour (appelé par
                               n'importe quel visiteur du site, PAS besoin
                               de clé admin)
"""
from flask import Blueprint, jsonify, request

from auth import require_admin
from db import get_cursor

stats_bp = Blueprint("stats", __name__, url_prefix="/api/stats")

ALLOWED_METRICS = {
    "visits",
    "cvDownloads",
    "whatsappClicks",
    "githubClicks",
    "linkedinClicks",
    "facebookClicks",
}

# camelCase (API/JS) -> snake_case (colonne SQL)
METRIC_TO_COLUMN = {
    "visits": "visits",
    "cvDownloads": "cv_downloads",
    "whatsappClicks": "whatsapp_clicks",
    "githubClicks": "github_clicks",
    "linkedinClicks": "linkedin_clicks",
    "facebookClicks": "facebook_clicks",
}

MAX_HISTORY_DAYS = 400


def serialize_day(row):
    return {
        "date": row["day"].isoformat(),
        "visits": row["visits"],
        "cvDownloads": row["cv_downloads"],
        "whatsappClicks": row["whatsapp_clicks"],
        "githubClicks": row["github_clicks"],
        "linkedinClicks": row["linkedin_clicks"],
        "facebookClicks": row["facebook_clicks"],
    }


@stats_bp.get("")
def get_stats():
    with get_cursor() as cur:
        cur.execute(
            """
            select
              coalesce(sum(visits), 0)          as visits,
              coalesce(sum(cv_downloads), 0)     as "cvDownloads",
              coalesce(sum(whatsapp_clicks), 0)  as "whatsappClicks",
              coalesce(sum(github_clicks), 0)    as "githubClicks",
              coalesce(sum(linkedin_clicks), 0)  as "linkedinClicks",
              coalesce(sum(facebook_clicks), 0)  as "facebookClicks"
            from daily_stats
            """
        )
        totals = cur.fetchone()

        cur.execute(
            """
            select day from daily_stats
            where visits > 0
            order by day desc
            limit 1
            """
        )
        last = cur.fetchone()
        last_visit = f"{last['day'].isoformat()}T00:00:00.000Z" if last else None

        cur.execute(
            f"""
            select * from daily_stats
            order by day desc
            limit {MAX_HISTORY_DAYS}
            """
        )
        history = [serialize_day(r) for r in reversed(cur.fetchall())]

    return jsonify(
        {
            **totals,
            "lastVisit": last_visit,
            "history": history,
        }
    )


@stats_bp.post("/increment")
def increment_stat():
    data = request.get_json(force=True) or {}
    metric = data.get("metric")

    if metric not in ALLOWED_METRICS:
        return jsonify({"error": f"Métrique inconnue : {metric}"}), 400

    column = METRIC_TO_COLUMN[metric]
    with get_cursor() as cur:
        cur.execute("select increment_stat(%s)", (column,))

    return jsonify({"ok": True})


@stats_bp.post("/reset")
@require_admin
def reset_stats():
    """Remet à zéro toutes les statistiques (bouton "Réinitialiser" du
    dashboard admin). Protégé par la clé admin."""
    with get_cursor() as cur:
        cur.execute("delete from daily_stats")
    return jsonify({"ok": True})
