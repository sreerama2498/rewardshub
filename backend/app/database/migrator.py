import os
import glob
from sqlalchemy import text
from app.database.connection import engine
from app.database.base import Base

def run_migrations():
    """
    Executes Base.metadata.create_all and applies any pending SQL migration
    scripts idempotently on application startup.
    """
    # 1. Create base tables
    Base.metadata.create_all(bind=engine)

    # SQLite (used in unit tests) does not support Postgres-specific SQL syntax
    if engine.dialect.name == "sqlite":
        return

    # 2. Check for migration SQL scripts
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "database", "migrations"),
        os.path.join(os.getcwd(), "database", "migrations"),
        "/app/database/migrations",
    ]

    migrations_dir = None
    for p in possible_paths:
        if os.path.isdir(p):
            migrations_dir = os.path.abspath(p)
            break

    if not migrations_dir:
        return

    sql_files = sorted(glob.glob(os.path.join(migrations_dir, "*.sql")))
    if not sql_files:
        return

    with engine.begin() as conn:
        # Create migrations tracking table if not exists
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS _applied_migrations (
                id SERIAL PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        """))

        result = conn.execute(text("SELECT filename FROM _applied_migrations;"))
        applied = {row[0] for row in result.fetchall()}

        for sql_file in sql_files:
            filename = os.path.basename(sql_file)
            if filename in applied:
                continue

            with open(sql_file, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    conn.execute(text(content))

            conn.execute(
                text("INSERT INTO _applied_migrations (filename) VALUES (:fname);"),
                {"fname": filename}
            )
            print(f"Applied database migration: {filename}")
