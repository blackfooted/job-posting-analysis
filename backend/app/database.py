from __future__ import annotations

import os
import sqlite3
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = Path(
    os.getenv("DB_PATH") or PROJECT_ROOT / "backend" / "job_posting_analysis.db"
)

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS postings (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  company          TEXT NOT NULL,
  position         TEXT NOT NULL,
  duties           TEXT NOT NULL,
  requirements     TEXT NOT NULL,
  preferred        TEXT NOT NULL,
  tools            TEXT NOT NULL,
  experience       TEXT NOT NULL,
  employment_type  TEXT NOT NULL,
  work_type        TEXT NOT NULL,
  industry_memo    TEXT NOT NULL,
  raw_text         TEXT NOT NULL,
  is_deleted       INTEGER DEFAULT 0,
  created_at       TEXT DEFAULT (datetime('now', '+9 hours')),
  updated_at       TEXT DEFAULT (datetime('now', '+9 hours'))
);

CREATE TABLE IF NOT EXISTS review_items (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  posting_id        INTEGER NOT NULL,
  field_type        TEXT NOT NULL,
  raw_value         TEXT NOT NULL,
  approved_value    TEXT,
  status            TEXT DEFAULT 'unconfirmed',
  dictionary_apply  INTEGER DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now', '+9 hours')),
  updated_at        TEXT DEFAULT (datetime('now', '+9 hours')),
  FOREIGN KEY (posting_id) REFERENCES postings(id)
);

CREATE TABLE IF NOT EXISTS analysis_results (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  posting_id             INTEGER NOT NULL UNIQUE,
  industry_category      TEXT,
  domain_category        TEXT,
  position_category      TEXT,
  extracted_skills       TEXT,
  extracted_competencies TEXT,
  unconfirmed_count      INTEGER DEFAULT 0,
  analyzed_at            TEXT DEFAULT (datetime('now', '+9 hours')),
  FOREIGN KEY (posting_id) REFERENCES postings(id)
);

CREATE TABLE IF NOT EXISTS ai_recommendation_runs (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  posting_id          INTEGER NOT NULL,
  mode                TEXT NOT NULL,
  model               TEXT,
  prompt_version      TEXT NOT NULL,
  status              TEXT NOT NULL CHECK (status IN ('succeeded', 'failed')),
  recommendation_json TEXT,
  applied_status      TEXT NOT NULL DEFAULT 'not_applied'
    CHECK (applied_status IN ('not_applied', 'partially_applied', 'applied')),
  applied_items_json  TEXT,
  error_code          TEXT,
  error_message       TEXT,
  created_at          TEXT NOT NULL,
  note                TEXT,
  FOREIGN KEY (posting_id) REFERENCES postings(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendation_runs_posting_id_created_at
ON ai_recommendation_runs(posting_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_recommendation_category_candidates (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  run_id              INTEGER NOT NULL,
  posting_id          INTEGER NOT NULL,
  category_type       TEXT NOT NULL CHECK (category_type IN ('industry', 'domain', 'position')),
  source_path         TEXT NOT NULL,
  recommended_value   TEXT NOT NULL,
  confidence          TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  reason              TEXT,
  status              TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at          TEXT NOT NULL DEFAULT (datetime('now', '+9 hours')),
  reviewed_at         TEXT,
  applied_to_analysis INTEGER NOT NULL DEFAULT 0 CHECK (applied_to_analysis IN (0, 1)),
  applied_at          TEXT,
  previous_analysis_value TEXT,
  applied_analysis_field TEXT,
  note                TEXT,
  FOREIGN KEY (run_id) REFERENCES ai_recommendation_runs(id),
  FOREIGN KEY (posting_id) REFERENCES postings(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_category_candidates_posting_id_created_at
ON ai_recommendation_category_candidates(posting_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_category_candidates_run_id
ON ai_recommendation_category_candidates(run_id);

CREATE INDEX IF NOT EXISTS idx_ai_category_candidates_status
ON ai_recommendation_category_candidates(status);
"""


def get_connection(db_path: Path | str = DEFAULT_DB_PATH) -> sqlite3.Connection:
    db_path = Path(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(db_path)
    connection.execute("PRAGMA foreign_keys = ON;")
    return connection


def initialize_database(db_path: Path | str = DEFAULT_DB_PATH) -> Path:
    db_path = Path(db_path)

    with get_connection(db_path) as connection:
        connection.executescript(SCHEMA_SQL)
        _ensure_ai_recommendation_runs_schema(connection)
        _ensure_ai_recommendation_category_candidates_schema(connection)

    return db_path


def _ensure_ai_recommendation_runs_schema(
    connection: sqlite3.Connection,
) -> None:
    columns = {
        row[1]
        for row in connection.execute(
            "PRAGMA table_info(ai_recommendation_runs)"
        ).fetchall()
    }
    column_sql = {
        "posting_id": "ALTER TABLE ai_recommendation_runs ADD COLUMN posting_id INTEGER",
        "mode": "ALTER TABLE ai_recommendation_runs ADD COLUMN mode TEXT",
        "model": "ALTER TABLE ai_recommendation_runs ADD COLUMN model TEXT",
        "prompt_version": (
            "ALTER TABLE ai_recommendation_runs "
            "ADD COLUMN prompt_version TEXT DEFAULT 'ai-recommendation-v1'"
        ),
        "status": (
            "ALTER TABLE ai_recommendation_runs "
            "ADD COLUMN status TEXT DEFAULT 'succeeded'"
        ),
        "recommendation_json": (
            "ALTER TABLE ai_recommendation_runs ADD COLUMN recommendation_json TEXT"
        ),
        "applied_status": (
            "ALTER TABLE ai_recommendation_runs "
            "ADD COLUMN applied_status TEXT DEFAULT 'not_applied'"
        ),
        "applied_items_json": (
            "ALTER TABLE ai_recommendation_runs "
            "ADD COLUMN applied_items_json TEXT"
        ),
        "error_code": "ALTER TABLE ai_recommendation_runs ADD COLUMN error_code TEXT",
        "error_message": (
            "ALTER TABLE ai_recommendation_runs ADD COLUMN error_message TEXT"
        ),
        "created_at": (
            "ALTER TABLE ai_recommendation_runs ADD COLUMN created_at TEXT"
        ),
        "note": "ALTER TABLE ai_recommendation_runs ADD COLUMN note TEXT",
    }
    for column, sql in column_sql.items():
        if column not in columns:
            connection.execute(sql)

    connection.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_ai_recommendation_runs_posting_id_created_at
        ON ai_recommendation_runs(posting_id, created_at DESC)
        """
    )


def _ensure_ai_recommendation_category_candidates_schema(
    connection: sqlite3.Connection,
) -> None:
    columns = {
        row[1]
        for row in connection.execute(
            "PRAGMA table_info(ai_recommendation_category_candidates)"
        ).fetchall()
    }
    column_sql = {
        "run_id": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN run_id INTEGER"
        ),
        "posting_id": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN posting_id INTEGER"
        ),
        "category_type": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN category_type TEXT"
        ),
        "source_path": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN source_path TEXT"
        ),
        "recommended_value": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN recommended_value TEXT"
        ),
        "confidence": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN confidence TEXT"
        ),
        "reason": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN reason TEXT"
        ),
        "status": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN status TEXT DEFAULT 'pending'"
        ),
        "created_at": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN created_at TEXT"
        ),
        "reviewed_at": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN reviewed_at TEXT"
        ),
        "applied_to_analysis": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN applied_to_analysis INTEGER DEFAULT 0"
        ),
        "applied_at": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN applied_at TEXT"
        ),
        "previous_analysis_value": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN previous_analysis_value TEXT"
        ),
        "applied_analysis_field": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN applied_analysis_field TEXT"
        ),
        "note": (
            "ALTER TABLE ai_recommendation_category_candidates "
            "ADD COLUMN note TEXT"
        ),
    }
    for column, sql in column_sql.items():
        if column not in columns:
            connection.execute(sql)

    connection.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_ai_category_candidates_posting_id_created_at
        ON ai_recommendation_category_candidates(posting_id, created_at DESC)
        """
    )
    connection.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_ai_category_candidates_run_id
        ON ai_recommendation_category_candidates(run_id)
        """
    )
    connection.execute(
        """
        CREATE INDEX IF NOT EXISTS idx_ai_category_candidates_status
        ON ai_recommendation_category_candidates(status)
        """
    )
