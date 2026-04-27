from __future__ import annotations

import sqlite3
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.app.database import get_connection, initialize_database
from backend.app.postings import _success


router = APIRouter(prefix="/api/review-items", tags=["review-items"])


class ReviewItemUpdate(BaseModel):
    approved_value: str | None = None
    status: str | None = None
    dictionary_apply: int | None = None


@router.get("")
def list_review_items(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=15, ge=1),
) -> dict[str, Any]:
    initialize_database()
    offset = (page - 1) * size

    connection = _connection()
    try:
        total = connection.execute(
            """
            SELECT COUNT(*)
            FROM review_items AS review_items
            INNER JOIN postings AS postings
              ON postings.id = review_items.posting_id
            WHERE postings.is_deleted = 0
            """
        ).fetchone()[0]
        rows = connection.execute(
            """
            SELECT review_items.*
            FROM review_items AS review_items
            INNER JOIN postings AS postings
              ON postings.id = review_items.posting_id
            WHERE postings.is_deleted = 0
            ORDER BY
              CASE
                WHEN review_items.status = 'unconfirmed' THEN 0
                ELSE 1
              END ASC,
              review_items.updated_at DESC,
              review_items.id DESC
            LIMIT ? OFFSET ?
            """,
            (size, offset),
        ).fetchall()
    finally:
        connection.close()

    return _success(
        {
            "items": [_row_to_review_item(row) for row in rows],
            "page": page,
            "size": size,
            "total": total,
        }
    )


@router.put("/{review_item_id}")
def update_review_item(
    review_item_id: int,
    review_item: ReviewItemUpdate,
) -> dict[str, Any]:
    initialize_database()
    if hasattr(review_item, "model_dump"):
        update_data = review_item.model_dump(exclude_unset=True)
    else:
        update_data = review_item.dict(exclude_unset=True)

    connection = _connection()
    try:
        existing = _fetch_review_item(connection, review_item_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Review item not found")

        approved_value = update_data.get("approved_value", existing["approved_value"])
        status = update_data.get("status", existing["status"])
        dictionary_apply = update_data.get(
            "dictionary_apply",
            existing["dictionary_apply"],
        )

        if status not in {"unconfirmed", "confirmed"}:
            raise HTTPException(
                status_code=400,
                detail="status must be one of: unconfirmed, confirmed",
            )
        if dictionary_apply not in {0, 1}:
            raise HTTPException(
                status_code=400,
                detail="dictionary_apply must be 0 or 1",
            )

        connection.execute(
            """
            UPDATE review_items
            SET approved_value = ?,
                status = ?,
                dictionary_apply = ?,
                updated_at = datetime('now', '+9 hours')
            WHERE id = ?
            """,
            (approved_value, status, dictionary_apply, review_item_id),
        )

        _sync_analysis_unconfirmed_count(connection, existing["posting_id"])
        updated = _fetch_review_item(connection, review_item_id)
        connection.commit()
    finally:
        connection.close()

    return _success(updated)


def _connection() -> sqlite3.Connection:
    connection = get_connection()
    connection.row_factory = sqlite3.Row
    return connection


def _fetch_review_item(
    connection: sqlite3.Connection,
    review_item_id: int,
) -> dict[str, Any] | None:
    row = connection.execute(
        """
        SELECT review_items.*
        FROM review_items AS review_items
        INNER JOIN postings AS postings
          ON postings.id = review_items.posting_id
        WHERE review_items.id = ?
          AND postings.is_deleted = 0
        """,
        (review_item_id,),
    ).fetchone()

    if row is None:
        return None
    return _row_to_review_item(row)


def _sync_analysis_unconfirmed_count(
    connection: sqlite3.Connection,
    posting_id: int,
) -> None:
    unconfirmed_count = connection.execute(
        """
        SELECT COUNT(*)
        FROM review_items AS review_items
        INNER JOIN postings AS postings
          ON postings.id = review_items.posting_id
        WHERE review_items.posting_id = ?
          AND review_items.status = 'unconfirmed'
          AND postings.is_deleted = 0
        """,
        (posting_id,),
    ).fetchone()[0]

    connection.execute(
        """
        UPDATE analysis_results
        SET unconfirmed_count = ?
        WHERE posting_id = ?
        """,
        (unconfirmed_count, posting_id),
    )


def _row_to_review_item(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}
