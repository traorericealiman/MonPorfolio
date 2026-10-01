import os

from dotenv import load_dotenv

load_dotenv()  # charge .env avant tout le reste (DATABASE_URL, ADMIN_API_KEY...)

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_swagger_ui import get_swaggerui_blueprint
from werkzeug.exceptions import HTTPException

from auth import require_admin
from docs import ENDPOINTS, render_docs_html
from openapi import build_spec
from routes.auth import auth_bp
from routes.content import content_bp
from routes.stats import stats_bp

SWAGGER_URL = "/api-docs"
OPENAPI_URL = "/openapi.json"


def create_app():
    app = Flask(__name__)

    allowed_origins = os.environ.get(
        "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"
    ).split(",")
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

    app.register_blueprint(content_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(auth_bp)

    swagger_bp = get_swaggerui_blueprint(
        SWAGGER_URL,
        OPENAPI_URL,
        config={"app_name": "API Portfolio"},
    )
    app.register_blueprint(swagger_bp, url_prefix=SWAGGER_URL)

    @app.get(OPENAPI_URL)
    def openapi_spec():
        # request.host_url inclut déjà le bon schéma/host/port, y compris en
        # déploiement (derrière un nom de domaine différent de localhost).
        return jsonify(build_spec(request.host_url.rstrip("/")))

    @app.get("/api/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/api/admin/verify")
    @require_admin
    def verify_admin():
        # Ne fait rien d'autre que confirmer que la clé envoyée est valide 
        # utilisé par l'écran de connexion de l'Admin pour un vrai contrôle
        # côté serveur (plus de code d'accès en dur côté front).
        return jsonify({"ok": True})

    @app.get("/docs")
    def docs_html():
        return render_docs_html()

    @app.get("/api/docs")
    def docs_json():
        return jsonify(ENDPOINTS)

    @app.errorhandler(HTTPException)
    def handle_http_error(err):
        return jsonify({"error": err.description}), err.code

    @app.errorhandler(Exception)
    def handle_error(err):
        app.logger.exception(err)
        return jsonify({"error": str(err)}), 500

    return app


app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)
