"""Spécification OpenAPI 3.0 de l'API  sert de base à l'interface Swagger
interactive (/api-docs), qui permet de tester chaque route directement dans
le navigateur ("Try it out").
"""

ADMIN_KEY_SECURITY = [{"AdminKey": []}]

PROFILE_SCHEMA = {
    "type": "object",
    "properties": {
        "description": {"type": "string"},
        "email": {"type": "string"},
        "phone": {"type": "string"},
        "photoUrl": {"type": "string"},
        "github": {"type": "string"},
        "linkedin": {"type": "string"},
        "facebook": {"type": "string"},
    },
}

COMPETITION_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "title": {"type": "string"},
        "project": {"type": "string"},
        "result": {"type": "string"},
        "description": {"type": "string"},
        "image": {"type": "string"},
    },
}

CREATION_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "title": {"type": "string"},
        "category": {"type": "string"},
        "color": {"type": "string", "example": "#0A66C2"},
        "image": {"type": "string"},
    },
}

PROJECT_SCHEMA = {
    "type": "object",
    "properties": {
        "id": {"type": "string"},
        "title": {"type": "string"},
        "description": {"type": "string"},
        "tech": {"type": "array", "items": {"type": "string"}},
        "accent": {"type": "string", "example": "#0A66C2"},
        "bg": {"type": "string", "example": "#F5F4F0"},
        "textColor": {"type": "string", "example": "#0A0A0A"},
        "isDark": {"type": "boolean"},
        "year": {"type": "string"},
        "category": {"type": "string"},
        "github": {"type": "string"},
        "link": {"type": "string"},
        "image": {"type": "string"},
    },
}

DAY_ENTRY_SCHEMA = {
    "type": "object",
    "properties": {
        "date": {"type": "string", "format": "date"},
        "visits": {"type": "integer"},
        "cvDownloads": {"type": "integer"},
        "whatsappClicks": {"type": "integer"},
        "githubClicks": {"type": "integer"},
        "linkedinClicks": {"type": "integer"},
        "facebookClicks": {"type": "integer"},
    },
}

STATS_SCHEMA = {
    "type": "object",
    "properties": {
        "visits": {"type": "integer"},
        "cvDownloads": {"type": "integer"},
        "whatsappClicks": {"type": "integer"},
        "githubClicks": {"type": "integer"},
        "linkedinClicks": {"type": "integer"},
        "facebookClicks": {"type": "integer"},
        "lastVisit": {"type": "string", "nullable": True},
        "history": {"type": "array", "items": DAY_ENTRY_SCHEMA},
    },
}

ID_PARAM = {
    "name": "id",
    "in": "path",
    "required": True,
    "schema": {"type": "string"},
    "description": "Identifiant de l'élément",
}


def _crud_paths(tag, path, schema):
    """Génère les 4 opérations GET/POST/PUT/DELETE pour une ressource liste
    (competitions, creations, projects), qui partagent toutes le même
    schéma de routes."""
    return {
        f"/api/{path}": {
            "get": {
                "tags": [tag],
                "summary": f"Liste des {tag.lower()}",
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {"application/json": {"schema": {"type": "array", "items": schema}}},
                    }
                },
            },
            "post": {
                "tags": [tag],
                "summary": f"Ajoute un(e) {tag.lower()[:-1] if tag.endswith('s') else tag.lower()}",
                "security": ADMIN_KEY_SECURITY,
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": schema}},
                },
                "responses": {
                    "201": {
                        "description": "Créé",
                        "content": {"application/json": {"schema": schema}},
                    },
                    "401": {"description": "Clé admin manquante ou invalide"},
                },
            },
        },
        f"/api/{path}/{{id}}": {
            "put": {
                "tags": [tag],
                "summary": "Modifie un élément existant",
                "security": ADMIN_KEY_SECURITY,
                "parameters": [ID_PARAM],
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": schema}},
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {"application/json": {"schema": schema}},
                    },
                    "401": {"description": "Clé admin manquante ou invalide"},
                    "404": {"description": "Introuvable"},
                },
            },
            "delete": {
                "tags": [tag],
                "summary": "Supprime un élément",
                "security": ADMIN_KEY_SECURITY,
                "parameters": [ID_PARAM],
                "responses": {
                    "200": {"description": "Supprimé"},
                    "401": {"description": "Clé admin manquante ou invalide"},
                    "404": {"description": "Introuvable"},
                },
            },
        },
    }


def build_spec(server_url: str) -> dict:
    paths = {
        "/api/health": {
            "get": {
                "tags": ["Général"],
                "summary": "Vérifie que le serveur répond",
                "responses": {"200": {"description": "OK"}},
            }
        },
        "/api/admin/verify": {
            "get": {
                "tags": ["Authentification"],
                "summary": "Vérifie qu'un jeton de session admin est valide",
                "security": ADMIN_KEY_SECURITY,
                "responses": {
                    "200": {"description": "Jeton valide"},
                    "401": {"description": "Jeton manquant, invalide ou expiré"},
                },
            }
        },
        "/api/admin/login": {
            "post": {
                "tags": ["Authentification"],
                "summary": "Connexion username + mot de passe",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["username", "password"],
                                "properties": {
                                    "username": {"type": "string"},
                                    "password": {"type": "string"},
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "200": {"description": "Connexion réussie, renvoie un jeton"},
                    "401": {"description": "Identifiants invalides"},
                },
            }
        },
        "/api/admin/register": {
            "post": {
                "tags": ["Authentification"],
                "summary": "Crée le tout premier compte admin (amorçage)",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["username", "password"],
                                "properties": {
                                    "username": {"type": "string"},
                                    "password": {"type": "string", "minLength": 8},
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "201": {"description": "Compte créé, renvoie un jeton"},
                    "403": {"description": "Un compte admin existe déjà"},
                },
            }
        },
        "/api/admin/change-password": {
            "post": {
                "tags": ["Authentification"],
                "summary": "Change le mot de passe du compte admin",
                "security": ADMIN_KEY_SECURITY,
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["username", "currentPassword", "newPassword"],
                                "properties": {
                                    "username": {"type": "string"},
                                    "currentPassword": {"type": "string"},
                                    "newPassword": {"type": "string", "minLength": 8},
                                },
                            }
                        }
                    },
                },
                "responses": {
                    "200": {"description": "Mot de passe changé"},
                    "401": {"description": "Mot de passe actuel incorrect, ou non autorisé"},
                },
            }
        },
        "/api/content": {
            "get": {
                "tags": ["Contenu"],
                "summary": "Tout le contenu du site en un seul appel",
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "profile": PROFILE_SCHEMA,
                                        "competitions": {"type": "array", "items": COMPETITION_SCHEMA},
                                        "creations": {"type": "array", "items": CREATION_SCHEMA},
                                        "projects": {"type": "array", "items": PROJECT_SCHEMA},
                                    },
                                }
                            }
                        },
                    }
                },
            }
        },
        "/api/profile": {
            "get": {
                "tags": ["Profil"],
                "summary": "Récupère le profil",
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {"application/json": {"schema": PROFILE_SCHEMA}},
                    }
                },
            },
            "put": {
                "tags": ["Profil"],
                "summary": "Met à jour le profil",
                "security": ADMIN_KEY_SECURITY,
                "requestBody": {
                    "required": True,
                    "content": {"application/json": {"schema": PROFILE_SCHEMA}},
                },
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {"application/json": {"schema": PROFILE_SCHEMA}},
                    },
                    "401": {"description": "Clé admin manquante ou invalide"},
                },
            },
        },
        "/api/stats": {
            "get": {
                "tags": ["Statistiques"],
                "summary": "Totaux + historique quotidien",
                "responses": {
                    "200": {
                        "description": "OK",
                        "content": {"application/json": {"schema": STATS_SCHEMA}},
                    }
                },
            }
        },
        "/api/stats/increment": {
            "post": {
                "tags": ["Statistiques"],
                "summary": "Incrémente un compteur du jour",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "metric": {
                                        "type": "string",
                                        "enum": [
                                            "visits",
                                            "cvDownloads",
                                            "whatsappClicks",
                                            "githubClicks",
                                            "linkedinClicks",
                                            "facebookClicks",
                                        ],
                                    }
                                },
                                "required": ["metric"],
                            },
                            "example": {"metric": "visits"},
                        }
                    },
                },
                "responses": {
                    "200": {"description": "OK"},
                    "400": {"description": "Métrique inconnue"},
                },
            }
        },
        "/api/stats/reset": {
            "post": {
                "tags": ["Statistiques"],
                "summary": "Remet toutes les statistiques à zéro",
                "security": ADMIN_KEY_SECURITY,
                "responses": {
                    "200": {"description": "OK"},
                    "401": {"description": "Clé admin manquante ou invalide"},
                },
            }
        },
    }

    paths.update(_crud_paths("Compétitions", "competitions", COMPETITION_SCHEMA))
    paths.update(_crud_paths("Créations", "creations", CREATION_SCHEMA))
    paths.update(_crud_paths("Projets", "projects", PROJECT_SCHEMA))

    return {
        "openapi": "3.0.3",
        "info": {
            "title": "API Portfolio",
            "description": (
                "API du portfolio (profil, compétitions, créations, projets, statistiques). "
                "Pour tester les routes protégées, clique sur 🔓 **Authorize** en haut à droite "
                "et colle ta clé (`ADMIN_API_KEY` dans `.env`)."
            ),
            "version": "1.0.0",
        },
        "servers": [{"url": server_url}],
        "components": {
            "securitySchemes": {
                "AdminKey": {
                    "type": "apiKey",
                    "in": "header",
                    "name": "X-Admin-Key",
                }
            }
        },
        "paths": paths,
    }
