from __future__ import annotations

import sqlite3
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DB_PATH = PROJECT_ROOT / "backend" / "job_posting_analysis.db"

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

    return db_path
