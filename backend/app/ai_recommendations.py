from __future__ import annotations

import sqlite3
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse

from backend.app.database import get_connection, initialize_database


router = APIRouter(
    prefix="/api/ai-recommendations",
    tags=["ai-recommendations"],
)

CONFIDENCE_VALUES = {"high", "medium", "low"}
REVIEW_ITEM_FIELD_TYPES = {
    "industry",
    "domain",
    "position",
    "skill",
    "competency",
}
POSTING_PROMPT_FIELDS = (
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


class AIRecommendationParseError(Exception):
    pass


@router.get("/postings/{posting_id}", response_model=None)
def get_ai_recommendation_for_posting(posting_id: int) -> Any:
    initialize_database()
    with _connection() as connection:
        posting = _fetch_posting(connection, posting_id)

    if posting is None:
        return JSONResponse(
            status_code=404,
            content=_error_response(
                "POSTING_NOT_FOUND",
                "공고를 찾을 수 없습니다.",
            ),
        )

    try:
        recommendation = _normalize_recommendation_response(
            _get_mock_recommendation(posting),
        )
    except AIRecommendationParseError:
        return JSONResponse(
            status_code=500,
            content=_error_response(
                "AI_RESPONSE_PARSE_FAILED",
                "AI 추천 응답을 JSON으로 해석할 수 없습니다.",
            ),
        )

    return _success(
        {
            "posting_id": posting_id,
            "source": {
                "company": posting["company"],
                "position": posting["position"],
            },
            "recommendation": recommendation,
            "meta": {
                "mode": "mock",
                "model": None,
                "saved": False,
                "generated_at": _current_kst_isoformat(),
            },
        }
    )


def _connection() -> sqlite3.Connection:
    connection = get_connection()
    connection.row_factory = sqlite3.Row
    return connection


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
    return {key: row[key] for key in row.keys()}


def _build_ai_prompt(posting: dict[str, Any]) -> str:
    posting_lines = [
        f"{field}: {posting.get(field, '')}"
        for field in POSTING_PROMPT_FIELDS
    ]
    return "\n".join(
        [
            "채용공고 분석 결과를 사용자 검토용 추천 JSON으로만 반환하세요.",
            "AI 결과는 자동 확정값이 아니며 DB에 저장하지 않습니다.",
            "산업은 회사의 주된 제품 또는 수익 모델 기준으로 판단하세요.",
            "도메인은 제품/서비스가 다루는 시장 또는 업무 영역 기준으로 판단하세요.",
            "현재 응답에는 primary_domain_category만 포함하고 domain_categories 배열은 포함하지 마세요.",
            "skills는 명시적 도구, 기술, 툴 중심으로 추출하세요.",
            "competencies는 업무 역량, 수행 능력, 행동 패턴 중심으로 추출하세요.",
            "판단이 애매하면 review_item_candidates에 포함하세요.",
            "최상위 JSON에는 recommendation 키를 포함하세요.",
            "recommendation 안에는 industry_category, primary_domain_category, position_category, skills, competencies, review_item_candidates를 포함하세요.",
            "",
            "Posting:",
            *posting_lines,
        ]
    )


def _get_mock_recommendation(posting: dict[str, Any]) -> dict[str, Any]:
    del posting
    return {
        "recommendation": {
            "industry_category": {
                "value": "IT",
                "confidence": "medium",
                "reason": "Mock recommendation 테스트 응답입니다.",
            },
            "primary_domain_category": {
                "value": "SaaS",
                "confidence": "medium",
                "reason": "Mock recommendation 테스트 응답입니다.",
            },
            "position_category": {
                "value": "서비스 기획",
                "confidence": "medium",
                "reason": "Mock recommendation 테스트 응답입니다.",
            },
            "skills": [
                {
                    "value": "Jira",
                    "confidence": "medium",
                    "reason": "Mock recommendation 테스트 응답입니다.",
                }
            ],
            "competencies": [
                {
                    "value": "요구사항 분석",
                    "confidence": "medium",
                    "reason": "Mock recommendation 테스트 응답입니다.",
                }
            ],
            "review_item_candidates": [
                {
                    "field_type": "competency",
                    "raw_value": "운영 프로세스 개선",
                    "suggested_value": "프로세스 개선",
                    "confidence": "medium",
                    "reason": "Mock recommendation 테스트 응답입니다.",
                }
            ],
        }
    }


def _normalize_recommendation_response(raw_response: dict[str, Any]) -> dict[str, Any]:
    recommendation = raw_response.get("recommendation")
    if not isinstance(recommendation, dict):
        raise AIRecommendationParseError()

    for field in (
        "industry_category",
        "primary_domain_category",
        "position_category",
    ):
        if field not in recommendation or not isinstance(recommendation[field], dict):
            raise AIRecommendationParseError()

    normalized = dict(recommendation)
    normalized.pop("domain_categories", None)
    normalized["industry_category"] = _normalize_category_item(
        recommendation["industry_category"],
    )
    normalized["primary_domain_category"] = _normalize_category_item(
        recommendation["primary_domain_category"],
    )
    normalized["position_category"] = _normalize_category_item(
        recommendation["position_category"],
    )
    normalized["skills"] = _normalize_recommendation_items(
        recommendation.get("skills"),
    )
    normalized["competencies"] = _normalize_recommendation_items(
        recommendation.get("competencies"),
    )
    normalized["review_item_candidates"] = _normalize_review_item_candidates(
        recommendation.get("review_item_candidates"),
    )
    return normalized


def _normalize_category_item(item: dict[str, Any]) -> dict[str, Any]:
    confidence = item.get("confidence")
    if confidence not in CONFIDENCE_VALUES:
        confidence = "low"

    reason = item.get("reason", "")
    if reason is None:
        reason = ""

    return {
        "value": item.get("value") if item.get("value") is not None else None,
        "confidence": confidence,
        "reason": str(reason),
    }


def _normalize_recommendation_items(raw_items: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_items, list):
        return []

    normalized_items = []
    for item in raw_items:
        if isinstance(item, dict):
            normalized_items.append(_normalize_category_item(item))
    return normalized_items


def _normalize_review_item_candidates(raw_items: Any) -> list[dict[str, Any]]:
    if not isinstance(raw_items, list):
        return []

    normalized_items = []
    for item in raw_items:
        if not isinstance(item, dict):
            continue

        confidence = item.get("confidence")
        if confidence not in CONFIDENCE_VALUES:
            confidence = "low"

        reason = item.get("reason", "")
        if reason is None:
            reason = ""

        field_type = item.get("field_type")
        if field_type not in REVIEW_ITEM_FIELD_TYPES:
            field_type = None

        normalized_items.append(
            {
                "field_type": field_type,
                "raw_value": item.get("raw_value"),
                "suggested_value": item.get("suggested_value"),
                "confidence": confidence,
                "reason": str(reason),
            }
        )
    return normalized_items


def _current_kst_isoformat() -> str:
    kst = timezone(timedelta(hours=9))
    return datetime.now(kst).isoformat(timespec="seconds")


def _success(data: Any) -> dict[str, Any]:
    return {"data": data, "error": None}


def _error_response(code: str, message: str) -> dict[str, Any]:
    return {
        "data": None,
        "error": {
            "code": code,
            "message": message,
        },
    }
