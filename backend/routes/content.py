"""Routes pour le contenu du site : profil, compétitions, créations, projets.

Lecture (GET) : publique, sans clé.
Écriture (POST/PUT/DELETE) : protégée par la clé admin (header X-Admin-Key).
"""
import time

from flask import Blueprint, jsonify, request

from auth import require_admin
from db import get_cursor

content_bp = Blueprint("content", __name__, url_prefix="/api")


def new_id(prefix: str) -> str:
    return f"{prefix}-{int(time.time() * 1000)}"


# --- Sérialisation (snake_case DB -> camelCase JSON) ------------------------

def serialize_profile(row):
    if not row:
        return None
    return {
        "description": row["description"],
        "email": row["email"],
        "phone": row["phone"],
        "photoUrl": row["photo_url"],
        "github": row["github"],
        "linkedin": row["linkedin"],
        "facebook": row["facebook"],
    }


def serialize_competition(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "project": row["project"],
        "result": row["result"],
        "description": row["description"],
        "image": row["image"],
    }


def serialize_creation(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "category": row["category"],
        "color": row["color"],
        "image": row["image"],
    }


def serialize_project(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "tech": row["tech"] or [],
        "accent": row["accent"],
        "bg": row["bg"],
        "textColor": row["text_color"],
        "isDark": row["is_dark"],
        "year": row["year"],
        "category": row["category"],
        "github": row["github"],
        "link": row["link"],
        "image": row["image"],
    }


# --- Contenu complet (une seule requête pour tout charger) ------------------

@content_bp.get("/content")
def get_content():
    with get_cursor() as cur:
        cur.execute("select * from profile where id = 1")
        profile = serialize_profile(cur.fetchone())

        cur.execute("select * from competitions order by position asc, created_at asc")
        competitions = [serialize_competition(r) for r in cur.fetchall()]

        cur.execute("select * from creations order by position asc, created_at asc")
        creations = [serialize_creation(r) for r in cur.fetchall()]

        cur.execute("select * from projects order by position asc, created_at asc")
        projects = [serialize_project(r) for r in cur.fetchall()]

    return jsonify(
        {
            "profile": profile,
            "competitions": competitions,
            "creations": creations,
            "projects": projects,
        }
    )


# --- Profil ------------------------------------------------------------------

@content_bp.get("/profile")
def get_profile():
    with get_cursor() as cur:
        cur.execute("select * from profile where id = 1")
        row = cur.fetchone()
    return jsonify(serialize_profile(row))


@content_bp.put("/profile")
@require_admin
def update_profile():
    data = request.get_json(force=True) or {}
    with get_cursor() as cur:
        cur.execute(
            """
            insert into profile (id, description, email, phone, photo_url, github, linkedin, facebook)
            values (1, %(description)s, %(email)s, %(phone)s, %(photoUrl)s, %(github)s, %(linkedin)s, %(facebook)s)
            on conflict (id) do update set
              description = excluded.description,
              email = excluded.email,
              phone = excluded.phone,
              photo_url = excluded.photo_url,
              github = excluded.github,
              linkedin = excluded.linkedin,
              facebook = excluded.facebook
            returning *
            """,
            {
                "description": data.get("description", ""),
                "email": data.get("email", ""),
                "phone": data.get("phone", ""),
                "photoUrl": data.get("photoUrl", ""),
                "github": data.get("github", ""),
                "linkedin": data.get("linkedin", ""),
                "facebook": data.get("facebook", ""),
            },
        )
        row = cur.fetchone()
    return jsonify(serialize_profile(row))


# --- Fabrique de routes CRUD génériques pour les 3 listes -------------------

def register_list_routes(bp, path, table, id_prefix, serialize, fields):
    """Enregistre GET/POST/PUT/DELETE pour une table de type liste
    (competitions, creations, projects), qui partagent toutes le même schéma
    id/CRUD. `fields` est une liste de (json_key, db_column, default)."""

    @bp.get(f"/{path}", endpoint=f"list_{table}")
    def list_items():
        with get_cursor() as cur:
            cur.execute(f"select * from {table} order by position asc, created_at asc")
            rows = cur.fetchall()
        return jsonify([serialize(r) for r in rows])

    @bp.post(f"/{path}", endpoint=f"create_{table}")
    @require_admin
    def create_item():
        data = request.get_json(force=True) or {}
        item_id = data.get("id") or new_id(id_prefix)

        columns = ["id"] + [db_col for _, db_col, _ in fields]
        placeholders = ["%(id)s"] + [f"%({json_key})s" for json_key, _, _ in fields]
        values = {"id": item_id}
        for json_key, _, default in fields:
            values[json_key] = data.get(json_key, default)

        with get_cursor() as cur:
            cur.execute("select coalesce(max(position), -1) + 1 as next from " + table)
            next_position = cur.fetchone()["next"]
            cur.execute(
                f"""
                insert into {table} (position, {", ".join(columns)})
                values (%(position)s, {", ".join(placeholders)})
                returning *
                """,
                {**values, "position": next_position},
            )
            row = cur.fetchone()
        return jsonify(serialize(row)), 201

    @bp.put(f"/{path}/<item_id>", endpoint=f"update_{table}")
    @require_admin
    def update_item(item_id):
        data = request.get_json(force=True) or {}
        set_clause = ", ".join(f"{db_col} = %({json_key})s" for json_key, db_col, _ in fields)
        values = {"id": item_id}
        for json_key, _, default in fields:
            values[json_key] = data.get(json_key, default)

        with get_cursor() as cur:
            cur.execute(
                f"update {table} set {set_clause} where id = %(id)s returning *",
                values,
            )
            row = cur.fetchone()
        if not row:
            return jsonify({"error": "Introuvable"}), 404
        return jsonify(serialize(row))

    @bp.delete(f"/{path}/<item_id>", endpoint=f"delete_{table}")
    @require_admin
    def delete_item(item_id):
        with get_cursor() as cur:
            cur.execute(f"delete from {table} where id = %s returning id", (item_id,))
            row = cur.fetchone()
        if not row:
            return jsonify({"error": "Introuvable"}), 404
        return jsonify({"ok": True})


register_list_routes(
    content_bp,
    "competitions",
    "competitions",
    "comp",
    serialize_competition,
    [
        ("title", "title", ""),
        ("project", "project", ""),
        ("result", "result", ""),
        ("description", "description", ""),
        ("image", "image", ""),
    ],
)

register_list_routes(
    content_bp,
    "creations",
    "creations",
    "creation",
    serialize_creation,
    [
        ("title", "title", ""),
        ("category", "category", ""),
        ("color", "color", "#0A66C2"),
        ("image", "image", ""),
    ],
)

register_list_routes(
    content_bp,
    "projects",
    "projects",
    "project",
    serialize_project,
    [
        ("title", "title", ""),
        ("description", "description", ""),
        ("tech", "tech", []),
        ("accent", "accent", "#0A66C2"),
        ("bg", "bg", "#F5F4F0"),
        ("textColor", "text_color", "#0A0A0A"),
        ("isDark", "is_dark", False),
        ("year", "year", ""),
        ("category", "category", ""),
        ("github", "github", "#"),
        ("link", "link", "#"),
        ("image", "image", ""),
    ],
)
