"""Connexion à la base PostgreSQL (Supabase) via un pool de connexions."""
import os

from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

DATABASE_URL = os.environ.get("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL manquant. Copie .env.example vers .env et renseigne "
        "ta chaîne de connexion Supabase."
    )

# prepare_threshold=None : désactive les "prepared statements" côté serveur,
# incompatibles avec PgBouncer en mode transaction (utilisé par le pooler Supabase).
_pool = ConnectionPool(
    conninfo=DATABASE_URL,
    min_size=1,
    max_size=10,
    open=True,
    kwargs={"prepare_threshold": None},
)


class Cursor:
    """Context manager : récupère une connexion du pool, fournit un curseur
    qui renvoie des dicts, commit/rollback automatique, puis rend la
    connexion au pool."""

    def __enter__(self):
        self._ctx = _pool.connection()
        self.conn = self._ctx.__enter__()
        self.cur = self.conn.cursor(row_factory=dict_row)
        return self.cur

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cur.close()
        return self._ctx.__exit__(exc_type, exc_val, exc_tb)


def get_cursor():
    return Cursor()
