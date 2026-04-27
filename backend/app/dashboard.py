from __future__ import annotations

import json
import sqlite3
from collections import Counter
from typing import Any

from fastapi import APIRouter

from backend.app.database import get_connection, initialize_database
from backend.app.postings import _success


router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def get_dashboard_summary() -> dict[str, Any]:
    initialize_database()
    with _connection() as connection:
        total_postings = connection.execute(
            """
            SELECT COUNT(*)
            FROM postings
            WHERE is_deleted = 0
            """
        ).fetchone()[0]

        total_industry_categories = _count_distinct_category(
            connection,
            "industry_category",
        )
        total_domain_categories = _count_distinct_category(
            connection,
            "domain_category",
        )
        total_position_categories = _count_distinct_category(
            connection,
            "position_category",
        )

        total_unconfirmed_items = connection.execute(
            """
            SELECT COUNT(*)
            FROM review_items AS review_items
            INNER JOIN postings AS postings
              ON postings.id = review_items.posting_id
            WHERE postings.is_deleted = 0
              AND review_items.status = 'unconfirmed'
            """
        ).fetchone()[0]

    return _success(
        {
            "total_postings": total_postings,
            "total_industry_categories": total_industry_categories,
            "total_domain_categories": total_domain_categories,
            "total_position_categories": total_position_categories,
            "total_unconfirmed_items": total_unconfirmed_items,
        }
    )


@router.get("/charts")
def get_dashboard_charts() -> dict[str, Any]:
    initialize_database()
    with _connection() as connection:
        industry_distribution = _category_distribution(
            connection,
            "industry_category",
        )
        position_distribution = _category_distribution(
            connection,
            "position_category",
        )
        json_rows = connection.execute(
            """
            SELECT
              analysis_results.extracted_skills,
              analysis_results.extracted_competencies
            FROM analysis_results AS analysis_results
            INNER JOIN postings AS postings
              ON postings.id = analysis_results.posting_id
            WHERE postings.is_deleted = 0
            """
        ).fetchall()

    skill_counter: Counter[str] = Counter()
    competency_counter: Counter[str] = Counter()
    for row in json_rows:
        skill_counter.update(_parse_json_array(row["extracted_skills"]))
        competency_counter.update(_parse_json_array(row["extracted_competencies"]))

    return _success(
        {
            "industry_distribution": industry_distribution,
            "position_distribution": position_distribution,
            "top_competencies": _top_items(competency_counter, limit=10),
            "top_skills": _top_items(skill_counter, limit=10),
        }
    )


@router.get("/comparison")
def get_dashboard_comparison() -> dict[str, Any]:
    initialize_database()
    with _connection() as connection:
        rows = connection.execute(
            """
            SELECT
              postings.company,
              postings.position,
              analysis_results.industry_category,
              analysis_results.domain_category,
              analysis_results.position_category,
              analysis_results.extracted_skills,
              analysis_results.extracted_competencies,
              analysis_results.unconfirmed_count
            FROM postings AS postings
            INNER JOIN analysis_results AS analysis_results
              ON analysis_results.posting_id = postings.id
            WHERE postings.is_deleted = 0
            ORDER BY postings.created_at DESC, postings.id DESC
            """
        ).fetchall()

    return _success([_row_to_comparison_item(row) for row in rows])


def _connection() -> sqlite3.Connection:
    connection = get_connection()
    connection.row_factory = sqlite3.Row
    return connection


def _count_distinct_category(
    connection: sqlite3.Connection,
    category_column: str,
) -> int:
    if category_column not in {
        "industry_category",
        "domain_category",
        "position_category",
    }:
        raise ValueError(f"Unsupported category column: {category_column}")

    return connection.execute(
        f"""
        SELECT COUNT(DISTINCT analysis_results.{category_column})
        FROM analysis_results AS analysis_results
        INNER JOIN postings AS postings
          ON postings.id = analysis_results.posting_id
        WHERE postings.is_deleted = 0
          AND analysis_results.{category_column} IS NOT NULL
          AND TRIM(analysis_results.{category_column}) != ''
        """
    ).fetchone()[0]


def _category_distribution(
    connection: sqlite3.Connection,
    category_column: str,
) -> list[dict[str, Any]]:
    if category_column not in {
        "industry_category",
        "position_category",
    }:
        raise ValueError(f"Unsupported distribution column: {category_column}")

    rows = connection.execute(
        f"""
        SELECT
          analysis_results.{category_column} AS name,
          COUNT(*) AS count
        FROM analysis_results AS analysis_results
        INNER JOIN postings AS postings
          ON postings.id = analysis_results.posting_id
        WHERE postings.is_deleted = 0
          AND analysis_results.{category_column} IS NOT NULL
          AND TRIM(analysis_results.{category_column}) != ''
        GROUP BY analysis_results.{category_column}
        ORDER BY count DESC, name ASC
        """
    ).fetchall()

    return [{"name": row["name"], "count": row["count"]} for row in rows]


def _parse_json_array(raw_value: str | None) -> list[str]:
    if not raw_value:
        return []

    try:
        parsed = json.loads(raw_value)
    except json.JSONDecodeError:
        return []

    if not isinstance(parsed, list):
        return []

    values: list[str] = []
    for item in parsed:
        value = str(item).strip()
        if value:
            values.append(value)
    return values


def _top_items(counter: Counter[str], limit: int) -> list[dict[str, Any]]:
    sorted_items = sorted(counter.items(), key=lambda item: (-item[1], item[0]))
    return [
        {"name": name, "count": count}
        for name, count in sorted_items[:limit]
    ]


def _row_to_comparison_item(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "company": row["company"],
        "position": row["position"],
        "industry_category": row["industry_category"],
        "domain_category": row["domain_category"],
        "position_category": row["position_category"],
        "extracted_skills": _parse_json_array(row["extracted_skills"]),
        "extracted_competencies": _parse_json_array(row["extracted_competencies"]),
        "unconfirmed_count": row["unconfirmed_count"],
    }
