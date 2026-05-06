from __future__ import annotations

import json
import os
import sqlite3
import sys
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Query
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
RAW_TEXT_PREVIEW_MAX_LENGTH = 500
AI_RECOMMENDATION_MAX_OUTPUT_TOKENS = 900
AI_RECOMMENDATION_PROMPT_VERSION = "ai-recommendation-v1"
AI_RECOMMENDATION_DEBUG_ENV = "AI_RECOMMENDATION_DEBUG"
AI_RECOMMENDATION_DEBUG_PREVIEW_LENGTH = 200
AI_RECOMMENDATION_MODE_ENV = "AI_RECOMMENDATION_MODE"
OPENAI_API_KEY_ENV = "OPENAI_API_KEY"
OPENAI_MODEL_ENV = "OPENAI_MODEL"
DEFAULT_AI_RECOMMENDATION_MODE = "mock"
DEFAULT_OPENAI_MODEL = "gpt-5.4-nano"
AI_RECOMMENDATION_MODES = {"mock", "openai"}
AI_RECOMMENDATION_RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["recommendation"],
    "properties": {
        "recommendation": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "industry_category",
                "primary_domain_category",
                "position_category",
                "skills",
                "competencies",
                "review_item_candidates",
            ],
            "properties": {
                "industry_category": {"$ref": "#/$defs/category_item"},
                "primary_domain_category": {"$ref": "#/$defs/category_item"},
                "position_category": {"$ref": "#/$defs/category_item"},
                "skills": {
                    "type": "array",
                    "items": {"$ref": "#/$defs/category_item"},
                },
                "competencies": {
                    "type": "array",
                    "items": {"$ref": "#/$defs/category_item"},
                },
                "review_item_candidates": {
                    "type": "array",
                    "items": {"$ref": "#/$defs/review_item_candidate"},
                },
            },
        }
    },
    "$defs": {
        "category_item": {
            "type": "object",
            "additionalProperties": False,
            "required": ["value", "confidence", "reason"],
            "properties": {
                "value": {"type": ["string", "null"]},
                "confidence": {
                    "type": "string",
                    "enum": ["high", "medium", "low"],
                },
                "reason": {"type": "string"},
            },
        },
        "review_item_candidate": {
            "type": "object",
            "additionalProperties": False,
            "required": [
                "field_type",
                "raw_value",
                "suggested_value",
                "confidence",
                "reason",
            ],
            "properties": {
                "field_type": {
                    "type": "string",
                    "enum": [
                        "industry",
                        "domain",
                        "position",
                        "skill",
                        "competency",
                    ],
                },
                "raw_value": {"type": ["string", "null"]},
                "suggested_value": {"type": ["string", "null"]},
                "confidence": {
                    "type": "string",
                    "enum": ["high", "medium", "low"],
                },
                "reason": {"type": "string"},
            },
        },
    },
}


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

    mode = _get_ai_recommendation_mode()
    if mode not in AI_RECOMMENDATION_MODES:
        return JSONResponse(
            status_code=500,
            content=_error_response(
                "AI_CONFIG_INVALID",
                "AI_RECOMMENDATION_MODE 값은 mock 또는 openai여야 합니다.",
            ),
        )

    model = None
    raw_recommendation: dict[str, Any]
    if mode == "mock":
        raw_recommendation = _get_mock_recommendation(posting)
    else:
        api_key = os.getenv(OPENAI_API_KEY_ENV, "").strip()
        if not api_key:
            return JSONResponse(
                status_code=500,
                content=_error_response(
                    "AI_CONFIG_MISSING",
                    "openai mode에서는 OPENAI_API_KEY가 필요합니다.",
                ),
            )

        model = os.getenv(OPENAI_MODEL_ENV, "").strip() or DEFAULT_OPENAI_MODEL
        try:
            raw_recommendation = _get_openai_recommendation(
                posting=posting,
                api_key=api_key,
                model=model,
            )
        except AIRecommendationParseError:
            return JSONResponse(
                status_code=500,
                content=_error_response(
                    "AI_RESPONSE_PARSE_FAILED",
                    "AI 추천 응답을 JSON으로 해석할 수 없습니다.",
                ),
            )
        except Exception:
            return JSONResponse(
                status_code=500,
                content=_error_response(
                    "AI_RECOMMENDATION_FAILED",
                    "OpenAI 추천 호출에 실패했습니다.",
                ),
            )

    try:
        recommendation = _normalize_recommendation_response(
            raw_recommendation,
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
                "mode": mode,
                "model": model,
                "saved": False,
                "generated_at": _current_kst_isoformat(),
            },
        }
    )


@router.post("/postings/{posting_id}/runs", response_model=None)
def create_ai_recommendation_run_for_posting(posting_id: int) -> Any:
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

    mode = _get_ai_recommendation_mode()
    if mode not in AI_RECOMMENDATION_MODES:
        return JSONResponse(
            status_code=500,
            content=_error_response(
                "AI_CONFIG_INVALID",
                "AI_RECOMMENDATION_MODE 값은 mock 또는 openai여야 합니다.",
            ),
        )

    model = None
    raw_recommendation: dict[str, Any]
    if mode == "mock":
        raw_recommendation = _get_mock_recommendation(posting)
    else:
        api_key = os.getenv(OPENAI_API_KEY_ENV, "").strip()
        if not api_key:
            return JSONResponse(
                status_code=500,
                content=_error_response(
                    "AI_CONFIG_MISSING",
                    "openai mode에서는 OPENAI_API_KEY가 필요합니다.",
                ),
            )

        model = os.getenv(OPENAI_MODEL_ENV, "").strip() or DEFAULT_OPENAI_MODEL
        try:
            raw_recommendation = _get_openai_recommendation(
                posting=posting,
                api_key=api_key,
                model=model,
            )
        except AIRecommendationParseError:
            return JSONResponse(
                status_code=500,
                content=_error_response(
                    "AI_RESPONSE_PARSE_FAILED",
                    "AI 추천 응답을 JSON으로 해석할 수 없습니다.",
                ),
            )
        except Exception:
            return JSONResponse(
                status_code=500,
                content=_error_response(
                    "AI_RECOMMENDATION_FAILED",
                    "OpenAI 추천 호출에 실패했습니다.",
                ),
            )

    try:
        recommendation = _normalize_recommendation_response(
            raw_recommendation,
        )
    except AIRecommendationParseError:
        return JSONResponse(
            status_code=500,
            content=_error_response(
                "AI_RESPONSE_PARSE_FAILED",
                "AI 추천 응답을 JSON으로 해석할 수 없습니다.",
            ),
        )

    generated_at = _current_kst_isoformat()
    run = None
    saved = False
    if mode == "openai":
        try:
            with _connection() as connection:
                run = _create_ai_recommendation_run(
                    connection=connection,
                    posting_id=posting_id,
                    mode=mode,
                    model=model,
                    prompt_version=AI_RECOMMENDATION_PROMPT_VERSION,
                    recommendation=recommendation,
                    created_at=generated_at,
                )
                connection.commit()
            saved = True
        except sqlite3.Error:
            return JSONResponse(
                status_code=500,
                content=_error_response(
                    "AI_RECOMMENDATION_HISTORY_SAVE_FAILED",
                    "AI 추천 이력 저장 중 오류가 발생했습니다.",
                ),
            )

    return _success(
        _build_recommendation_payload(
            posting=posting,
            recommendation=recommendation,
            mode=mode,
            model=model,
            saved=saved,
            generated_at=generated_at,
            run=run,
        )
    )


@router.get("/postings/{posting_id}/history", response_model=None)
def list_ai_recommendation_history_for_posting(
    posting_id: int,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=10, ge=1, le=100),
) -> Any:
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

        rows, total = _fetch_ai_recommendation_runs(
            connection=connection,
            posting_id=posting_id,
            page=page,
            size=size,
        )

    total_pages = (total + size - 1) // size if total else 0
    return _success(
        {
            "items": [_serialize_run(row) for row in rows],
            "pagination": {
                "page": page,
                "size": size,
                "total": total,
                "total_pages": total_pages,
            },
        }
    )


@router.get("/history/{run_id}", response_model=None)
def get_ai_recommendation_history_run(run_id: int) -> Any:
    initialize_database()
    with _connection() as connection:
        row = _fetch_ai_recommendation_run(connection, run_id)
        if row is None:
            return JSONResponse(
                status_code=404,
                content=_error_response(
                    "AI_RECOMMENDATION_RUN_NOT_FOUND",
                    "AI 추천 이력을 찾을 수 없습니다.",
                ),
            )

        posting = _fetch_posting_by_id_including_deleted(
            connection,
            row["posting_id"],
        )

    try:
        recommendation = _deserialize_recommendation_json(
            row["recommendation_json"],
        )
    except AIRecommendationParseError:
        return JSONResponse(
            status_code=500,
            content=_error_response(
                "AI_RESPONSE_PARSE_FAILED",
                "AI 추천 이력 JSON을 해석할 수 없습니다.",
            ),
        )

    source = None
    if posting is not None:
        source = {
            "company": posting["company"],
            "position": posting["position"],
        }

    return _success(
        {
            "run": _serialize_run(row),
            "source": source,
            "recommendation": recommendation,
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


def _fetch_posting_by_id_including_deleted(
    connection: sqlite3.Connection,
    posting_id: int,
) -> dict[str, Any] | None:
    row = connection.execute(
        """
        SELECT *
        FROM postings
        WHERE id = ?
        """,
        (posting_id,),
    ).fetchone()

    if row is None:
        return None
    return {key: row[key] for key in row.keys()}


def _build_recommendation_payload(
    *,
    posting: dict[str, Any],
    recommendation: dict[str, Any],
    mode: str,
    model: str | None,
    saved: bool,
    generated_at: str,
    run: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "run": run,
        "source": {
            "company": posting["company"],
            "position": posting["position"],
        },
        "recommendation": recommendation,
        "meta": {
            "mode": mode,
            "model": model,
            "prompt_version": AI_RECOMMENDATION_PROMPT_VERSION,
            "saved": saved,
            "generated_at": generated_at,
        },
    }


def _create_ai_recommendation_run(
    *,
    connection: sqlite3.Connection,
    posting_id: int,
    mode: str,
    model: str | None,
    prompt_version: str,
    recommendation: dict[str, Any],
    created_at: str,
) -> dict[str, Any]:
    recommendation_json = json.dumps(
        recommendation,
        ensure_ascii=False,
        separators=(",", ":"),
    )
    cursor = connection.execute(
        """
        INSERT INTO ai_recommendation_runs (
          posting_id,
          mode,
          model,
          prompt_version,
          status,
          recommendation_json,
          applied_status,
          error_code,
          error_message,
          created_at,
          note
        )
        VALUES (?, ?, ?, ?, 'succeeded', ?, 'not_applied', NULL, NULL, ?, NULL)
        """,
        (
            posting_id,
            mode,
            model,
            prompt_version,
            recommendation_json,
            created_at,
        ),
    )
    row = _fetch_ai_recommendation_run(connection, cursor.lastrowid)
    if row is None:
        raise sqlite3.Error("AI recommendation run insert failed.")
    return _serialize_run(row)


def _fetch_ai_recommendation_runs(
    *,
    connection: sqlite3.Connection,
    posting_id: int,
    page: int,
    size: int,
) -> tuple[list[sqlite3.Row], int]:
    offset = (page - 1) * size
    total = connection.execute(
        """
        SELECT COUNT(*)
        FROM ai_recommendation_runs
        WHERE posting_id = ?
        """,
        (posting_id,),
    ).fetchone()[0]
    rows = connection.execute(
        """
        SELECT *
        FROM ai_recommendation_runs
        WHERE posting_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?
        """,
        (posting_id, size, offset),
    ).fetchall()
    return rows, total


def _fetch_ai_recommendation_run(
    connection: sqlite3.Connection,
    run_id: int,
) -> sqlite3.Row | None:
    return connection.execute(
        """
        SELECT *
        FROM ai_recommendation_runs
        WHERE id = ?
        """,
        (run_id,),
    ).fetchone()


def _serialize_run(row: sqlite3.Row) -> dict[str, Any]:
    return {
        "id": row["id"],
        "posting_id": row["posting_id"],
        "mode": row["mode"],
        "model": row["model"],
        "prompt_version": row["prompt_version"],
        "status": row["status"],
        "applied_status": row["applied_status"],
        "created_at": row["created_at"],
        "note": row["note"],
    }


def _deserialize_recommendation_json(value: Any) -> dict[str, Any]:
    if not isinstance(value, str) or not value.strip():
        raise AIRecommendationParseError()

    try:
        parsed = json.loads(value)
    except json.JSONDecodeError as exc:
        raise AIRecommendationParseError() from exc

    if not isinstance(parsed, dict):
        raise AIRecommendationParseError()

    return _normalize_recommendation_response({"recommendation": parsed})


def _build_ai_prompt(posting: dict[str, Any]) -> str:
    posting_lines = _build_posting_prompt_lines(posting)
    return "\n".join(
        [
            "채용공고 분석 결과를 사용자 검토용 추천 JSON으로만 반환하세요.",
            "AI 결과는 자동 확정값이 아니며 DB에 저장하지 않습니다.",
            "산업은 회사의 주된 제품 또는 수익 모델 기준으로 판단하세요.",
            "도메인은 제품/서비스가 다루는 시장 또는 업무 영역 기준으로 판단하세요.",
            "현재 응답에는 primary_domain_category만 포함하고 domain_categories 배열은 포함하지 마세요.",
            "최상위 JSON에는 recommendation 키를 포함하세요.",
            "recommendation 안에는 industry_category, primary_domain_category, position_category, skills, competencies, review_item_candidates를 포함하세요.",
            "",
            "Field type classification rules:",
            "- skills에는 명시적 도구, 시스템, 소프트웨어, 플랫폼, 기술 스택, 방법론, 산출물 작성 기술, 직무 수행에 직접 쓰이는 툴/기술만 넣습니다.",
            "- skills 예: SQL, Python, AWS, RAG, EMR, HIS, OCS, 와이어프레임, 스토리보드, UX/UI, API, ERD, 프롬프트 엔지니어링.",
            "- competencies에는 업무 역량, 사고방식, 행동 패턴, 분석 역량, 협업 방식, 문제 정의/해결 능력, 정책 수립 능력, 프로젝트 관리 능력, 커뮤니케이션 역량을 넣습니다.",
            "- competencies 예: 요구사항 분석, 정책 수립, 데이터 분석, 문제 정의, 협업, 커뮤니케이션, 프로젝트 관리, 서비스 운영, 문서화, 비즈니스 분석, 시스템 설계.",
            "- 커뮤니케이션, 협업, 데이터 기반 의사결정, 문제 해결, 책임감, 실행력, 이해관계자 조율은 skills가 아니라 competencies입니다.",
            "",
            "Exclude from recommendation and review_item_candidates:",
            "- 제출 서류, 전형 절차, 지원 조건, 포트폴리오 제출.",
            "- 고객사명, 파트너사명, 제품명, 기관명, 인증명, 수상명, 지원사업명, 회사 소개용 고유명사.",
            "- 단, Jira, Figma, SQL, AWS처럼 직무 수행 도구로 직접 쓰이는 고유명사는 포함할 수 있습니다.",
            "- Slack, Teams 같은 일반 협업 메신저는 특별히 직접 사용 능력을 요구하지 않으면 skill로 넣지 마세요.",
            "- ChatGPT, Claude Code, Cursor 등은 AI 도구 활용 맥락이면 AI툴활용 또는 프롬프트 엔지니어링 같은 짧은 대표값으로 통합하는 것을 우선하세요.",
            "",
            "Company tech stack handling:",
            "- 회사 기술스택 섹션에 등장하는 기술은 직무가 해당 기술을 직접 활용해야 한다고 명시한 경우에만 skills에 포함하세요.",
            "- 단순 회사 전체 기술스택이면 review_item_candidates에 넣지 마세요.",
            "- 기획자/PM/서비스기획 직무에서 직접 요구하는 기술이 아닌 개발자용 프레임워크는 제외하거나 낮은 우선순위로 판단하세요.",
            "- 예: FastAPI, Celery, Scrapy, React가 회사 기술스택에만 나오고 기획자가 직접 사용한다고 명시되지 않으면 제외하세요.",
            "- 예: SQL, ERD, API는 기획자가 개발팀과 논의하거나 데이터 구조를 이해해야 한다고 명시되면 포함할 수 있습니다.",
            "",
            "Value writing rules:",
            "- 각 category item의 value는 가능하면 15자 이내의 짧은 대표값으로 작성하세요.",
            "- reason은 한 문장으로, 가능하면 80자 이내로 작성하세요.",
            "- 불필요한 설명은 생략하고 자세한 문맥은 reason에만 짧게 작성하세요.",
            "- 좋은 value 예: 서비스 기획, 여행, 헬스케어, 이커머스, 데이터 분석, 요구사항 분석, 프로젝트 관리, 문서화, 프롬프트 엔지니어링.",
            "- 나쁜 value 예: 여행/항공권 유통 웹 서비스 기획(예약·환불·부가서비스 자동화).",
            "- 나쁜 value 예: 디지털 헬스케어 서비스 기획(EMR/건강관리 플랫폼, 사용자/의료기관 연결).",
            "- skills는 최대 8개까지만 반환하세요.",
            "- competencies는 최대 8개까지만 반환하세요.",
            "- review_item_candidates는 최대 5개까지만 반환하세요.",
            "",
            "review_item_candidates rules:",
            "- field_type 판단이 애매한 표현, config 대표값 추가 검토가 필요한 표현, 신규 alias 후보, 사람이 검토해야 할 후보만 포함하세요.",
            "- 제출 요건, 포트폴리오 제출, 회사 소개 고유명사, 고객사명, 파트너사명, 제품명, 인증명, 단순 기술스택 나열은 넣지 마세요.",
            "- 이미 skills 또는 competencies에 포함한 개념은 review_item_candidates에 중복해서 넣지 마세요.",
            "- 긴 문장형 후보는 review_item_candidates에 넣지 마세요.",
            "",
            "Few-shot example 1: skills vs competencies",
            "Bad:",
            '{"skills":[{"value":"커뮤니케이션"},{"value":"데이터 기반 의사결정"},{"value":"협업"}],"competencies":[]}',
            "Good:",
            '{"skills":[],"competencies":[{"value":"커뮤니케이션","confidence":"high","reason":"이해관계자와 소통하는 업무 역량입니다."},{"value":"데이터 기반 의사결정","confidence":"high","reason":"도구가 아니라 분석 기반 판단 역량입니다."},{"value":"협업","confidence":"high","reason":"부서 간 일하는 방식에 대한 역량입니다."}]}',
            "",
            "Few-shot example 2: submission requirements",
            "Bad:",
            '{"review_item_candidates":[{"field_type":"skill","raw_value":"포트폴리오 제출","suggested_value":"포트폴리오 제출","confidence":"medium","reason":"공고에 명시되어 있습니다."}]}',
            "Good:",
            '{"review_item_candidates":[]}',
            "Reason: 포트폴리오 제출은 분석 키워드가 아니라 지원 절차/제출 요건이므로 제외합니다.",
            "",
            "Few-shot example 3: company tech stack in planning jobs",
            "Bad:",
            '{"skills":[{"value":"FastAPI"},{"value":"Celery"},{"value":"Scrapy"},{"value":"React"}],"review_item_candidates":[{"field_type":"skill","raw_value":"FastAPI/Celery/Scrapy/React","suggested_value":"FastAPI","confidence":"low","reason":"회사 기술스택에 있습니다."}]}',
            "Good:",
            '{"skills":[{"value":"SQL","confidence":"medium","reason":"기획자가 데이터 구조를 이해하고 개발팀과 논의해야 하는 맥락이면 포함할 수 있습니다."},{"value":"API","confidence":"medium","reason":"서비스 기획 산출물과 개발 협업에 직접 필요한 기술 맥락입니다."}],"review_item_candidates":[]}',
            "Reason: FastAPI/Celery/Scrapy/React가 회사 기술스택에만 있고 기획자가 직접 활용한다고 명시되지 않으면 제외합니다.",
            "",
            "Few-shot example 4: short representative values",
            "Bad:",
            '{"primary_domain_category":{"value":"디지털 헬스케어 서비스 기획(EMR/건강관리 플랫폼, 사용자/의료기관 연결)","confidence":"high","reason":"공고가 헬스케어 플랫폼을 설명합니다."}}',
            "Good:",
            '{"primary_domain_category":{"value":"헬스케어","confidence":"high","reason":"EMR/건강관리 플랫폼과 의료기관 연결 맥락은 reason에만 설명합니다."}}',
            "",
            "Few-shot example 5: proper nouns and product/customer names",
            "Bad:",
            '{"skills":[{"value":"IATA"},{"value":"네이버"},{"value":"오름차트"},{"value":"Bati CIS"},{"value":"COSRX"}],"review_item_candidates":[{"field_type":"skill","raw_value":"파마리서치","suggested_value":"파마리서치","confidence":"low","reason":"원문에 등장합니다."}]}',
            "Good:",
            '{"skills":[],"review_item_candidates":[]}',
            "Reason: 기관명, 고객사명, 제품명, 회사 소개용 고유명사는 직무 수행 도구가 아니면 제외합니다.",
            "",
            "Posting:",
            *posting_lines,
        ]
    )


def _build_posting_prompt_lines(posting: dict[str, Any]) -> list[str]:
    posting_lines = []
    for field in POSTING_PROMPT_FIELDS:
        if field == "raw_text":
            preview = _truncate_text(
                posting.get("raw_text", ""),
                RAW_TEXT_PREVIEW_MAX_LENGTH,
            )
            posting_lines.append(f"raw_text_preview: {preview}")
            continue

        posting_lines.append(f"{field}: {posting.get(field, '')}")
    return posting_lines


def _truncate_text(value: Any, max_length: int = RAW_TEXT_PREVIEW_MAX_LENGTH) -> str:
    text = "" if value is None else str(value)
    if len(text) <= max_length:
        return text
    return f"{text[:max_length]}...[truncated]"


def _get_ai_recommendation_mode() -> str:
    mode = os.getenv(AI_RECOMMENDATION_MODE_ENV, "").strip().lower()
    return mode or DEFAULT_AI_RECOMMENDATION_MODE


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


def _get_openai_recommendation(
    *,
    posting: dict[str, Any],
    api_key: str,
    model: str,
) -> dict[str, Any]:
    try:
        from openai import OpenAI
    except ImportError as exc:
        raise RuntimeError("OpenAI SDK is not installed.") from exc

    client = OpenAI(api_key=api_key)
    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "system",
                "content": (
                    "You return only valid JSON for a job posting "
                    "recommendation API. Do not include markdown."
                ),
            },
            {
                "role": "user",
                "content": _build_ai_prompt(posting),
            },
        ],
        text={
            "format": {
                "type": "json_schema",
                "name": "ai_recommendation_response",
                "schema": AI_RECOMMENDATION_RESPONSE_SCHEMA,
                "strict": True,
            },
        },
        max_output_tokens=AI_RECOMMENDATION_MAX_OUTPUT_TOKENS,
    )

    _debug_ai_response_structure(response)
    raw_text = _extract_openai_response_text(response)
    _debug_ai_response_text(raw_text)
    return _parse_openai_json_content(raw_text)


def _extract_openai_response_text(response: Any) -> str:
    output_text = getattr(response, "output_text", None)
    if isinstance(output_text, str) and output_text.strip():
        return output_text

    output = getattr(response, "output", None)
    if not isinstance(output, list):
        raise AIRecommendationParseError()

    text_parts = []
    for output_item in output:
        content_items = _read_output_attribute(output_item, "content")
        if not isinstance(content_items, list):
            continue
        for content_item in content_items:
            text = _read_output_attribute(content_item, "text")
            if isinstance(text, str):
                text_parts.append(text)

    content = "".join(text_parts).strip()
    if not content:
        _debug_ai_response_text(content)
        raise AIRecommendationParseError()
    return content


def _read_output_attribute(item: Any, key: str) -> Any:
    if isinstance(item, dict):
        return item.get(key)
    return getattr(item, key, None)


def _parse_openai_json_content(content: str) -> dict[str, Any]:
    cleaned_content = _strip_code_fence(content.strip())
    parse_candidates = [
        cleaned_content,
        _extract_first_json_object(cleaned_content),
    ]

    for candidate in parse_candidates:
        if candidate is None:
            continue
        try:
            parsed = json.loads(candidate)
        except json.JSONDecodeError as exc:
            _debug_ai_parse_failure(content, candidate, exc)
            continue
        if isinstance(parsed, dict):
            return _ensure_recommendation_wrapper(parsed)

    _debug_ai_parse_failure(content, None, None)
    raise AIRecommendationParseError()


def _is_ai_recommendation_debug_enabled() -> bool:
    return os.getenv(AI_RECOMMENDATION_DEBUG_ENV, "").strip() == "1"


def _debug_ai_log(message: str) -> None:
    if _is_ai_recommendation_debug_enabled():
        print(f"AI_RECOMMENDATION_DEBUG {message}", file=sys.stderr)


def _debug_ai_response_text(raw_text: str) -> None:
    if not _is_ai_recommendation_debug_enabled():
        return

    stripped_text = raw_text.strip()
    preview = stripped_text[:AI_RECOMMENDATION_DEBUG_PREVIEW_LENGTH].replace(
        "\n",
        "\\n",
    )
    _debug_ai_log(f"raw_text_length={len(raw_text)}")
    _debug_ai_log(f"raw_text_empty={str(not bool(stripped_text)).lower()}")
    _debug_ai_log(
        f"raw_text_startswith_json={str(stripped_text.startswith('{')).lower()}"
    )
    _debug_ai_log(
        f"raw_text_endswith_json={str(stripped_text.endswith('}')).lower()}"
    )
    _debug_ai_log(f"raw_text_preview={preview}")


def _debug_ai_response_structure(response: Any) -> None:
    if not _is_ai_recommendation_debug_enabled():
        return

    output = getattr(response, "output", None)
    output_count = len(output) if isinstance(output, list) else None
    output_text = getattr(response, "output_text", None)
    _debug_ai_log(f"response_type={type(response).__name__}")
    _debug_ai_log(f"has_output_text={str(isinstance(output_text, str)).lower()}")
    _debug_ai_log(f"output_type={type(output).__name__}")
    _debug_ai_log(f"output_count={output_count}")

    if not isinstance(output, list):
        return

    for index, output_item in enumerate(output[:3]):
        content_items = _read_output_attribute(output_item, "content")
        content_count = len(content_items) if isinstance(content_items, list) else None
        _debug_ai_log(
            "output_item_"
            f"{index}_type={type(output_item).__name__} "
            f"content_type={type(content_items).__name__} "
            f"content_count={content_count}"
        )


def _debug_ai_parse_failure(
    raw_text: str,
    candidate: str | None,
    error: json.JSONDecodeError | None,
) -> None:
    if not _is_ai_recommendation_debug_enabled():
        return

    stripped_text = raw_text.strip()
    stripped_candidate = candidate.strip() if isinstance(candidate, str) else ""
    _debug_ai_log(f"parse_raw_text_length={len(raw_text)}")
    _debug_ai_log(f"parse_first_json_index={stripped_text.find('{')}")
    _debug_ai_log(f"parse_last_json_index={stripped_text.rfind('}')}")
    _debug_ai_log(f"parse_candidate_present={str(candidate is not None).lower()}")
    _debug_ai_log(f"parse_candidate_length={len(candidate) if candidate else 0}")
    _debug_ai_log(
        "parse_candidate_endswith_json="
        f"{str(stripped_candidate.endswith('}')).lower()}"
    )
    if error is not None:
        _debug_ai_log(f"parse_error_position={error.pos}")
        _debug_ai_log(f"parse_error_message={error.msg}")


def _ensure_recommendation_wrapper(parsed: dict[str, Any]) -> dict[str, Any]:
    recommendation = parsed.get("recommendation")
    if isinstance(recommendation, dict):
        return parsed

    required_fields = (
        "industry_category",
        "primary_domain_category",
        "position_category",
    )
    if all(isinstance(parsed.get(field), dict) for field in required_fields):
        return {"recommendation": parsed}

    raise AIRecommendationParseError()


def _strip_code_fence(content: str) -> str:
    if not content.startswith("```"):
        return content

    lines = content.splitlines()
    if len(lines) < 2:
        return content

    first_line = lines[0].strip().lower()
    last_line = lines[-1].strip()
    if first_line in {"```", "```json"} and last_line == "```":
        return "\n".join(lines[1:-1]).strip()

    return content


def _extract_first_json_object(content: str) -> str | None:
    start = content.find("{")
    if start == -1:
        return None

    depth = 0
    in_string = False
    escaped = False
    for index in range(start, len(content)):
        char = content[index]

        if in_string:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == '"':
                in_string = False
            continue

        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return content[start : index + 1]

    return None


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
            continue

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
