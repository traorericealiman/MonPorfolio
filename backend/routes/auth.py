"""Routes de connexion admin (username/mot de passe -> jeton de session)."""
from flask import Blueprint, jsonify, request

from auth import hash_password, make_token, require_admin, verify_password
from db import get_cursor

auth_bp = Blueprint("auth", __name__, url_prefix="/api/admin")


@auth_bp.post("/login")
def login():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not username or not password:
        return jsonify({"error": "Nom d'utilisateur et mot de passe requis"}), 400

    with get_cursor() as cur:
        cur.execute("select username, password_hash from admin_users where username = %s", (username,))
        user = cur.fetchone()

    if not user or not verify_password(password, user["password_hash"]):
        return jsonify({"error": "Identifiants invalides"}), 401

    return jsonify({"token": make_token(user["username"]), "username": user["username"]})


@auth_bp.post("/register")
def register():
    """Ne fonctionne que tant qu'aucun compte admin n'existe (amorçage
    initial). Une fois un compte créé, cette route refuse toute nouvelle
    inscription  utilise /change-password (protégée) pour la suite."""
    with get_cursor() as cur:
        cur.execute("select count(*) as n from admin_users")
        count = cur.fetchone()["n"]

    if count > 0:
        return jsonify({"error": "Un compte admin existe déjà"}), 403

    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    password = body.get("password") or ""
    if not username or not password:
        return jsonify({"error": "Nom d'utilisateur et mot de passe requis"}), 400
    if len(password) < 8:
        return jsonify({"error": "Le mot de passe doit faire au moins 8 caractères"}), 400

    with get_cursor() as cur:
        cur.execute(
            "insert into admin_users (username, password_hash) values (%s, %s) returning username",
            (username, hash_password(password)),
        )
        created = cur.fetchone()

    return jsonify({"token": make_token(created["username"]), "username": created["username"]}), 201


@auth_bp.post("/change-password")
@require_admin
def change_password():
    body = request.get_json(silent=True) or {}
    username = (body.get("username") or "").strip()
    current_password = body.get("currentPassword") or ""
    new_password = body.get("newPassword") or ""
    if not username or not current_password or not new_password:
        return jsonify({"error": "Champs manquants"}), 400
    if len(new_password) < 8:
        return jsonify({"error": "Le nouveau mot de passe doit faire au moins 8 caractères"}), 400

    with get_cursor() as cur:
        cur.execute("select password_hash from admin_users where username = %s", (username,))
        user = cur.fetchone()
        if not user or not verify_password(current_password, user["password_hash"]):
            return jsonify({"error": "Mot de passe actuel incorrect"}), 401
        cur.execute(
            "update admin_users set password_hash = %s where username = %s",
            (hash_password(new_password), username),
        )

    return jsonify({"ok": True})
