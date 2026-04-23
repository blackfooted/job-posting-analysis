from __future__ import annotations

import json
import sqlite3
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.classification import analyze_posting, analysis_to_db_values
from backend.app.database import get_connection, initialize_database


router = APIRouter(prefix="/api/postings", tags=["postings"])

POSTING_FIELDS = (
    "company",
    "position",
    "duties",
    "requirements",
    "preferred",
    "tools",
    "experience",
    "employment_type",
    "work_type",
    "industry_memo",
    "raw_text",
)


class PostingInput(BaseModel):
    company: str
    position: str
    duties: str
    requirements: str
    preferred: str
    tools: str
    experience: str
    employment_type: str
    work_type: str
    industry_memo: str
    raw_text: str


@router.post("")
def create_posting(posting: PostingInput) -> dict[str, Any]:
    initialize_database()
    posting_data = _posting_data(posting)
    _validate_required_fields(posting_data)

    with _connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO postings (
              company, position, duties, requirements, preferred, tools, experience,
              employment_type, work_type, industry_memo, raw_text
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            tuple(posting_data[field] for field in POSTING_FIELDS),
        )
        posting_id = cursor.lastrowid
        _save_classification(connection, posting_id, posting_data)
        created = _fetch_posting(connection, posting_id)

    return _success(created)


@router.get("")
def list_postings() -> dict[str, Any]:
    initialize_database()
    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT *
            FROM postings
            WHERE is_deleted = 0
            ORDER BY created_at DESC, id DESC
            """
        ).fetchall()

    return _success([_row_to_posting(row) for row in rows])


@router.get("/{posting_id}")
def get_posting(posting_id: int) -> dict[str, Any]:
    initialize_database()
    with _connection() as connection:
        posting = _fetch_posting(connection, posting_id)

    if posting is None:
        raise HTTPException(status_code=404, detail="Posting not found")

    return _success(posting)


@router.put("/{posting_id}")
def update_posting(posting_id: int, posting: PostingInput) -> dict[str, Any]:
    initialize_database()
    posting_data = _posting_data(posting)
    _validate_required_fields(posting_data)

    with _connection() as connection:
        existing = _fetch_posting(connection, posting_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Posting not found")

        connection.execute(
            """
            UPDATE postings
            SET company = ?,
                position = ?,
                duties = ?,
                requirements = ?,
                preferred = ?,
                tools = ?,
                experience = ?,
                employment_type = ?,
                work_type = ?,
                industry_memo = ?,
                raw_text = ?,
                updated_at = datetime('now', '+9 hours')
            WHERE id = ? AND is_deleted = 0
            """,
            (*[posting_data[field] for field in POSTING_FIELDS], posting_id),
        )
        _save_classification(connection, posting_id, posting_data)
        updated = _fetch_posting(connection, posting_id)

    return _success(updated)


@router.delete("/{posting_id}")
def delete_posting(posting_id: int) -> dict[str, Any]:
    initialize_database()
    with _connection() as connection:
        existing = _fetch_posting(connection, posting_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Posting not found")

        connection.execute(
            """
            UPDATE postings
            SET is_deleted = 1,
                updated_at = datetime('now', '+9 hours')
            WHERE id = ? AND is_deleted = 0
            """,
            (posting_id,),
        )

    return _success({"id": posting_id, "is_deleted": 1})


def _connection() -> sqlite3.Connection:
    connection = get_connection()
    connection.row_factory = sqlite3.Row
    return connection


def _posting_data(posting: PostingInput) -> dict[str, str]:
    return {field: getattr(posting, field) for field in POSTING_FIELDS}


def _validate_required_fields(posting: dict[str, str]) -> None:
    missing_fields = [
        field for field, value in posting.items() if not value or not value.strip()
    ]
    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"Missing required fields: {', '.join(missing_fields)}",
        )


def _save_classification(
    connection: sqlite3.Connection,
    posting_id: int,
    posting: dict[str, str],
) -> None:
    analysis = analyze_posting(posting)
    analysis_values = analysis_to_db_values(analysis)

    connection.execute(
        """
        INSERT INTO analysis_results (
          posting_id,
          industry_category,
          domain_category,
          position_category,
          extracted_skills,
          extracted_competencies,
          unconfirmed_count,
          analyzed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+9 hours'))
        ON CONFLICT(posting_id) DO UPDATE SET
          industry_category = excluded.industry_category,
          domain_category = excluded.domain_category,
          position_category = excluded.position_category,
          extracted_skills = excluded.extracted_skills,
          extracted_competencies = excluded.extracted_competencies,
          unconfirmed_count = excluded.unconfirmed_count,
          analyzed_at = datetime('now', '+9 hours')
        """,
        (
            posting_id,
            analysis_values["industry_category"],
            analysis_values["domain_category"],
            analysis_values["position_category"],
            analysis_values["extracted_skills"],
            analysis_values["extracted_competencies"],
            analysis_values["unconfirmed_count"],
        ),
    )

    connection.execute("DELETE FROM review_items WHERE posting_id = ?", (posting_id,))
    connection.executemany(
        """
        INSERT INTO review_items (
          posting_id,
          field_type,
          raw_value
        ) VALUES (?, ?, ?)
        """,
        [
            (posting_id, review_item.field_type, review_item.raw_value)
            for review_item in analysis.review_items
        ],
    )


def _fetch_posting(
    connection: sqlite3.Connection,
    posting_id: int,
) -> dict[str, Any] | None:
    row = connection.execute(
        """
        SELECT *
        FROM postings
        WHERE id = ? AND is_deleted = 0
        """,
        (posting_id,),
    ).fetchone()

    if row is None:
        return None
    return _row_to_posting(row)


def _row_to_posting(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}


def _success(data: Any) -> dict[str, Any]:
    return {"data": data, "error": None}


def error_response(code: str, message: str) -> dict[str, Any]:
    return {
        "data": None,
        "error": {
            "code": code,
            "message": message,
        },
    }
