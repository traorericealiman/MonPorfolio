"""Authentification admin par username/mot de passe + jeton de session.

Le mot de passe est vérifié contre son hash stocké dans la table
`admin_users` (Supabase). Une fois connecté, le frontend reçoit un jeton
signé (pas le mot de passe, pas de secret partagé statique) qu'il renvoie
ensuite dans l'en-tête `X-Admin-Key` pour chaque requête protégée.
"""
import os
from functools import wraps

from flask import jsonify, request
from itsdangerous import BadSignature, SignatureExpired, URLSafeTimedSerializer
from werkzeug.security import check_password_hash, generate_password_hash

SECRET_KEY = os.environ.get("SECRET_KEY")
TOKEN_MAX_AGE = 60 * 60 * 24 * 30  # 30 jours

_serializer = URLSafeTimedSerializer(SECRET_KEY) if SECRET_KEY else None


def hash_password(password: str) -> str:
    return generate_password_hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return check_password_hash(password_hash, password)


def make_token(username: str) -> str:
    if not _serializer:
        raise RuntimeError("SECRET_KEY non configurée côté serveur")
    return _serializer.dumps({"username": username})


def verify_token(token: str):
    if not _serializer or not token:
        return None
    try:
        data = _serializer.loads(token, max_age=TOKEN_MAX_AGE)
        return data.get("username")
    except (BadSignature, SignatureExpired):
        return None


def require_admin(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not SECRET_KEY:
            return jsonify({"error": "SECRET_KEY non configurée côté serveur"}), 500
        provided = request.headers.get("X-Admin-Key")
        username = verify_token(provided)
        if not username:
            return jsonify({"error": "Non autorisé"}), 401
        return fn(*args, **kwargs)

    return wrapper
