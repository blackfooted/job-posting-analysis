from __future__ import annotations

import sqlite3
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from backend.app.database import get_connection, initialize_database
from backend.app.postings import _success


router = APIRouter(prefix="/api/review-items", tags=["review-items"])

REVIEW_ITEM_STATUSES = {"unconfirmed", "confirmed", "removed"}


class ReviewItemUpdate(BaseModel):
    approved_value: str | None = None
    status: str | None = None
    dictionary_apply: int | None = None


@router.get("")
def list_review_items(
    page: int = Query(default=1, ge=1),
    size: int = Query(default=15, ge=1),
    status: str | None = Query(default=None),
    field_type: str | None = Query(default=None),
    dictionary_apply: int | None = Query(default=None),
    keyword: str | None = Query(default=None),
) -> dict[str, Any]:
    initialize_database()
    if status is not None and status not in REVIEW_ITEM_STATUSES:
        raise HTTPException(
            status_code=400,
            detail="status must be one of: unconfirmed, confirmed, removed",
        )
    allowed_field_types = {"industry", "domain", "position", "skill", "competency"}
    if field_type is not None and field_type not in allowed_field_types:
        raise HTTPException(
            status_code=400,
            detail="field_type must be one of: industry, domain, position, skill, competency",
        )
    if dictionary_apply is not None and dictionary_apply not in {0, 1}:
        raise HTTPException(
            status_code=400,
            detail="dictionary_apply must be 0 or 1",
        )

    offset = (page - 1) * size
    filter_conditions: list[str] = []
    filter_params: list[str] = []
    if status is not None:
        filter_conditions.append("AND review_items.status = ?")
        filter_params.append(status)
    else:
        filter_conditions.append("AND review_items.status != 'removed'")
    if field_type is not None:
        filter_conditions.append("AND review_items.field_type = ?")
        filter_params.append(field_type)
    if dictionary_apply is not None:
        filter_conditions.append("AND review_items.dictionary_apply = ?")
        filter_params.append(dictionary_apply)
    normalized_keyword = keyword.strip() if keyword is not None else ""
    if normalized_keyword:
        filter_conditions.append(
            "AND (review_items.raw_value LIKE ? OR review_items.approved_value LIKE ?)"
        )
        keyword_pattern = f"%{normalized_keyword}%"
        filter_params.extend([keyword_pattern, keyword_pattern])
    filter_clause = "\n              ".join(filter_conditions)

    connection = _connection()
    try:
        total = connection.execute(
            f"""
            SELECT COUNT(*)
            FROM review_items AS review_items
            INNER JOIN postings AS postings
              ON postings.id = review_items.posting_id
            WHERE postings.is_deleted = 0
              {filter_clause}
            """,
            filter_params,
        ).fetchone()[0]
        rows = connection.execute(
            f"""
            SELECT review_items.*,
                   postings.company AS company,
                   postings.position AS position
            FROM review_items AS review_items
            INNER JOIN postings AS postings
              ON postings.id = review_items.posting_id
            WHERE postings.is_deleted = 0
              {filter_clause}
            ORDER BY
              CASE
                WHEN review_items.status = 'unconfirmed' THEN 0
                ELSE 1
              END ASC,
              review_items.updated_at DESC,
              review_items.id DESC
            LIMIT ? OFFSET ?
            """,
            (*filter_params, size, offset),
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

        if status not in REVIEW_ITEM_STATUSES:
            raise HTTPException(
                status_code=400,
                detail="status must be one of: unconfirmed, confirmed, removed",
            )
        if status == "removed":
            dictionary_apply = 0
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

        affected_posting_ids = {existing["posting_id"]}
        if (
            dictionary_apply == 1
            and status == "confirmed"
            and approved_value is not None
            and approved_value != ""
        ):
            affected_posting_ids.update(
                _apply_dictionary_to_matching_review_items(
                    connection=connection,
                    field_type=existing["field_type"],
                    raw_value=existing["raw_value"],
                    approved_value=approved_value,
                    exclude_id=review_item_id,
                )
            )

        for posting_id in affected_posting_ids:
            _sync_analysis_unconfirmed_count(connection, posting_id)

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


def _normalize_review_value(value: str) -> str:
    return "".join(str(value).split())


def _apply_dictionary_to_matching_review_items(
    connection: sqlite3.Connection,
    field_type: str,
    raw_value: str,
    approved_value: str,
    exclude_id: int,
) -> set[int]:
    normalized_raw_value = _normalize_review_value(raw_value)
    rows = connection.execute(
        """
        SELECT review_items.id,
               review_items.posting_id,
               review_items.raw_value
        FROM review_items AS review_items
        INNER JOIN postings AS postings
          ON postings.id = review_items.posting_id
        WHERE review_items.id != ?
          AND review_items.field_type = ?
          AND review_items.status = 'unconfirmed'
          AND postings.is_deleted = 0
        """,
        (exclude_id, field_type),
    ).fetchall()

    matched_rows = [
        row
        for row in rows
        if _normalize_review_value(row["raw_value"]) == normalized_raw_value
    ]
    matched_ids = [row["id"] for row in matched_rows]
    affected_posting_ids = {row["posting_id"] for row in matched_rows}

    if matched_ids:
        placeholders = ", ".join("?" for _ in matched_ids)
        connection.execute(
            f"""
            UPDATE review_items
            SET approved_value = ?,
                status = 'confirmed',
                dictionary_apply = 1,
                updated_at = datetime('now', '+9 hours')
            WHERE id IN ({placeholders})
            """,
            (approved_value, *matched_ids),
        )

    return affected_posting_ids


def _row_to_review_item(row: sqlite3.Row) -> dict[str, Any]:
    return {key: row[key] for key in row.keys()}
