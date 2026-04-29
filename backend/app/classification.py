from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Any

from backend.app.config_loader import load_all_configs


@dataclass(frozen=True)
class ReviewItemDraft:
    field_type: str
    raw_value: str


@dataclass(frozen=True)
class AnalysisDraft:
    industry_category: str | None
    domain_category: str | None
    position_category: str | None
    extracted_skills: list[str]
    extracted_competencies: list[str]
    review_items: list[ReviewItemDraft]


PATTERN_SOURCE_FIELDS = (
    "duties",
    "requirements",
    "preferred",
    "tools",
    "industry_memo",
    "raw_text",
)

CATEGORY_MATCH_SOURCE_FIELDS = (
    "industry_memo",
    "duties",
    "requirements",
    "preferred",
)

COMPOUND_CANDIDATES = (
    "시장 조사",
    "벤치마킹",
    "요구사항 분석",
    "요건정의",
    "정책 수립",
    "서비스 운영",
    "서비스 개선",
    "기능 정의",
    "상세 기능 정의",
    "화면 설계",
    "UX 설계",
    "데이터 분석",
    "데이터 흐름",
    "API 연동",
    "히스토리 관리",
    "프로젝트 관리",
    "백오피스",
    "어드민",
    "정산",
    "주문",
    "배송",
    "회원",
    "상품",
    "전시",
    "결제",
    "Slack",
    "Claude Code",
    "Claude",
    "ChatGPT",
    "Gemini",
    "Cursor",
    "LLM",
    "ERD",
    "SRS",
    "CRM",
    "CMS",
    "KYC",
    "AML",
    "IA",
    "백로그",
    "스토리보드",
    "와이어프레임",
    "프로젝트 리딩",
    "우선순위 관리",
    "이슈 관리",
    "시스템 연동",
    "VOC",
    "SQL",
    "Jira",
    "Confluence",
    "Figma",
    "PRD",
    "Wireframe",
    "SB",
    "QA",
)

SKILL_CANDIDATES = {
    "API",
    "VOC",
    "SQL",
    "Jira",
    "Confluence",
    "Figma",
    "PRD",
    "Wireframe",
    "SB",
    "QA",
    "Slack",
    "Claude Code",
    "Claude",
    "ChatGPT",
    "Gemini",
    "Cursor",
    "LLM",
    "ERD",
    "SRS",
    "CRM",
    "CMS",
    "KYC",
    "AML",
    "IA",
    "백로그",
    "스토리보드",
    "와이어프레임",
}

DOMAIN_CANDIDATES = {
    "주문",
    "배송",
    "회원",
    "상품",
    "전시",
    "결제",
    "정산",
}

STANDALONE_KEYWORD_CANDIDATES = {
    "벤치마킹",
    "문서화",
    "협업",
    "조율",
    "커뮤니케이션",
    "테스트",
    "검증",
    "검수",
    "기획",
}

SUFFIX_KEYWORDS = (
    "조사",
    "벤치마킹",
    "설계",
    "정의",
    "수립",
    "관리",
    "운영",
    "개선",
    "분석",
    "검토",
    "작성",
    "문서화",
    "협업",
    "조율",
    "커뮤니케이션",
    "테스트",
    "검증",
    "검수",
    "기획",
    "도출",
)

GENERIC_SPLIT_WORDS = {
    "개발",
    "과제",
    "결과",
    "데이터",
    "디자인",
    "목표",
    "산출물",
    "서비스",
    "업무",
    "운영",
    "팀",
}

CONTEXT_WORDS = {
    "개발",
    "디자인",
    "목표",
    "바탕",
    "서비스",
    "산출물",
    "아이디어",
    "운영",
    "참여",
    "최종",
    "프로젝트",
    "따른",
    "위한",
    "통한",
    "통해",
    "활용",
    "활용한",
    "대한",
    "이해",
    "우대",
    "우대합니다",
    "경험한",
    "있으면",
    "좋습니다",
    "필요합니다",
}

CORE_PHRASE_ALLOWED_TRAILING_WORDS = (
    "과제",
    "기획",
    "개발",
    "설계",
    "개선",
    "분석",
    "운영",
    "관리",
    "활동",
    "업무",
    "경험",
    "프로젝트",
    "프로세스",
    "통해",
    "기반",
)

CORE_PHRASE_EXCLUDED_TRAILING_WORDS = (
    "열정",
    "노력",
    "의지",
    "자세",
    "관심",
    "이해",
    "마인드",
    "성향",
    "우대",
)

NOISY_CONTEXT_PREFIX_WORDS = (
    "대한",
    "이해",
    "우대",
    "우대합니다",
    "경험한",
    "있으면",
    "좋습니다",
    "필요합니다",
)

MAX_CANDIDATE_LENGTH = 25
MIN_CANDIDATE_LENGTH = 2
REVIEW_ONLY_FIELD_SUFFIX = ":review"


def analyze_posting(posting: dict[str, str]) -> AnalysisDraft:
    configs = load_all_configs()
    analysis_posting = {
        key: _normalize_text_for_analysis(value) for key, value in posting.items()
    }
    review_items: list[ReviewItemDraft] = []

    industry_category = _match_single_category_from_posting(
        analysis_posting,
        configs["industry-categories.json"],
    )
    if industry_category is None and analysis_posting["industry_memo"].strip():
        _append_review_item_if_valid(
            review_items,
            "industry",
            analysis_posting["industry_memo"],
        )

    domain_category = _match_single_category_from_posting(
        analysis_posting,
        configs["domain-categories.json"],
    )
    if domain_category is None and analysis_posting["industry_memo"].strip():
        _append_review_item_if_valid(
            review_items,
            "domain",
            analysis_posting["industry_memo"],
        )

    position_category = _match_single_exact_or_alias(
        analysis_posting["position"],
        configs["position-categories.json"],
    )
    if position_category is None and analysis_posting["position"].strip():
        review_items.append(ReviewItemDraft("position", analysis_posting["position"]))

    extracted_skills = _match_multi_contains_alias(
        _split_tools(analysis_posting["tools"]),
        configs["skill-dictionary.json"],
        "skill",
        review_items,
    )

    extracted_competencies: list[str] = []
    _extract_pattern_candidates(
        analysis_posting,
        configs,
        extracted_skills,
        extracted_competencies,
        review_items,
    )

    return AnalysisDraft(
        industry_category=industry_category,
        domain_category=domain_category,
        position_category=position_category,
        extracted_skills=extracted_skills,
        extracted_competencies=extracted_competencies,
        review_items=review_items,
    )


def analysis_to_db_values(analysis: AnalysisDraft) -> dict[str, Any]:
    return {
        "industry_category": analysis.industry_category,
        "domain_category": analysis.domain_category,
        "position_category": analysis.position_category,
        "extracted_skills": json.dumps(analysis.extracted_skills, ensure_ascii=False),
        "extracted_competencies": json.dumps(
            analysis.extracted_competencies,
            ensure_ascii=False,
        ),
        "unconfirmed_count": len(analysis.review_items),
    }


def _split_tools(tools: str) -> list[str]:
    return [
        value.strip()
        for value in re.split(r"[,;/·\n]+", tools)
        if value.strip()
    ]


def _extract_pattern_candidates(
    posting: dict[str, str],
    configs: dict[str, Any],
    extracted_skills: list[str],
    extracted_competencies: list[str],
    review_items: list[ReviewItemDraft],
) -> None:
    confirmed_values = _confirmed_value_keys(
        extracted_skills,
        extracted_competencies,
    )

    for field in PATTERN_SOURCE_FIELDS:
        for line in _split_normalized_lines(posting.get(field, "")):
            for field_type, candidate in _extract_candidates_from_line(line):
                actual_field_type = _actual_field_type(field_type)
                normalized_candidate = _normalize(candidate)
                if normalized_candidate in confirmed_values:
                    continue

                matched_value = None
                if _allows_confirmation(field_type):
                    matched_value = _match_candidate_with_dictionary(
                        candidate,
                        actual_field_type,
                        configs,
                    )
                if matched_value is not None:
                    if actual_field_type == "skill":
                        _append_unique(extracted_skills, matched_value)
                    elif actual_field_type == "competency":
                        _append_unique(extracted_competencies, matched_value)
                    confirmed_values.add(_normalize(matched_value))
                    continue

                _append_review_item_if_valid(review_items, actual_field_type, candidate)


def _split_normalized_lines(value: str) -> list[str]:
    return [line.strip() for line in value.split("\n") if line.strip()]


def _extract_candidates_from_line(line: str) -> list[tuple[str, str]]:
    candidates: list[tuple[str, str]] = []

    for phrase in COMPOUND_CANDIDATES:
        if phrase in line:
            _append_compound_candidate(candidates, phrase, line)

    if "데이터 분석" in line:
        _append_core_phrase_candidate(candidates, "데이터 분석", line)
    if "서비스 개선" in line:
        _append_core_phrase_candidate(candidates, "서비스 개선", line)

    for parenthetical_value in re.findall(r"\(([^)]+)\)", line):
        for segment in _split_candidate_segments(parenthetical_value):
            _append_candidates_from_segment(candidates, segment, line)

    line_without_parentheses = re.sub(r"\([^)]*\)", " ", line)
    for segment in _split_candidate_segments(line_without_parentheses):
        _append_candidates_from_segment(candidates, segment, line)

    return _prefer_specific_candidates(candidates)


def _append_candidates_from_segment(
    candidates: list[tuple[str, str]],
    segment: str,
    context: str | None = None,
) -> None:
    context = context or segment
    segment = _clean_candidate(segment)
    if not segment:
        return

    for phrase in COMPOUND_CANDIDATES:
        if phrase in segment:
            _append_compound_candidate(candidates, phrase, context)

    for acronym in re.findall(r"\b[A-Z][A-Z0-9+#.]{1,}\b", segment):
        if acronym == "QA" and not _is_allowed_qa_context(context):
            continue
        _append_candidate(candidates, "skill", acronym)

    for keyword in STANDALONE_KEYWORD_CANDIDATES:
        if keyword in segment:
            _append_candidate(candidates, "competency", keyword)

    suffix_pattern = re.compile(
        r"([A-Za-z0-9+#.가-힣]+(?:\s+[A-Za-z0-9+#.가-힣]+){0,3})\s*"
        rf"({'|'.join(SUFFIX_KEYWORDS)})"
    )
    for match in suffix_pattern.finditer(segment):
        prefix = _trim_context_prefix(match.group(1))
        suffix = match.group(2)

        if suffix == "작성":
            continue

        if suffix in STANDALONE_KEYWORD_CANDIDATES:
            _append_candidate(candidates, "competency", suffix)

        if prefix and prefix not in SKILL_CANDIDATES:
            _append_candidate(candidates, "competency", f"{prefix} {suffix}")


def _append_compound_candidate(
    candidates: list[tuple[str, str]],
    phrase: str,
    context: str,
) -> None:
    if phrase == "QA":
        if _is_allowed_qa_context(context):
            _append_candidate(candidates, "skill", phrase)
        return

    if phrase in {"데이터 분석", "서비스 개선"}:
        _append_core_phrase_candidate(candidates, phrase, context)
        return

    _append_candidate(candidates, _field_type_for_candidate(phrase), phrase)


def _append_core_phrase_candidate(
    candidates: list[tuple[str, str]],
    phrase: str,
    context: str,
) -> None:
    field_type = "competency"
    if not _is_allowed_core_phrase_confirmation(context, phrase):
        field_type = _review_only_field_type(field_type)
    _append_candidate(candidates, field_type, phrase)


def _is_allowed_core_phrase_confirmation(context: str, phrase: str) -> bool:
    if phrase not in context:
        return False

    trailing_text = context.split(phrase, 1)[1]
    trailing_words = re.findall(r"[A-Za-z0-9가-힣]+", trailing_text)
    if not trailing_words:
        return True

    first_words = trailing_words[:3]
    if any(word in CORE_PHRASE_EXCLUDED_TRAILING_WORDS for word in first_words):
        return False
    if any(word in CORE_PHRASE_ALLOWED_TRAILING_WORDS for word in first_words):
        return True
    return False


def _is_allowed_qa_context(text: str) -> bool:
    if "QA" not in text:
        return False

    if _is_simple_qa_department_list(text):
        return False

    if re.search(r"QA\s*(?:에\s*대한\s*)?이해", text):
        return False
    if re.search(r"QA\s*(?:팀|부서|관련\s*부서)?(?:과|와)?\s*협업", text):
        return False
    if re.search(r"QA\s*관련\s*부서", text):
        return False

    direct_patterns = (
        r"QA\s*(?:수행|담당|진행|경험|프로세스|업무|참여)",
        r"(?:테스트|품질\s*검증)\s*(?:및|/|·|\(|\s)*QA",
        r"QA\s*\)",
    )
    return any(re.search(pattern, text) for pattern in direct_patterns)


def _is_simple_qa_department_list(text: str) -> bool:
    normalized = re.sub(r"\([^)]*\)", "", text)
    parts = [part.strip() for part in re.split(r"[,;/·\n]+", normalized) if part.strip()]
    if len(parts) < 2 or "QA" not in parts:
        return False

    department_words = {
        "개발",
        "디자인",
        "QA",
        "기획",
        "PM",
        "PO",
        "사업",
        "운영",
        "마케팅",
    }
    return all(part in department_words for part in parts)


def _split_candidate_segments(value: str) -> list[str]:
    normalized = re.sub(r"[,;/·]+", "\n", value)
    return [segment.strip() for segment in normalized.split("\n") if segment.strip()]


def _split_category_match_values(value: str) -> list[str]:
    values: list[str] = []

    for line in _split_normalized_lines(value):
        values.append(line)
        for parenthetical_value in re.findall(r"\(([^)]+)\)", line):
            values.extend(_split_candidate_segments(parenthetical_value))

        line_without_parentheses = re.sub(r"\([^)]*\)", " ", line)
        values.extend(_split_candidate_segments(line_without_parentheses))

    unique_values: list[str] = []
    for candidate in values:
        candidate = candidate.strip()
        if candidate and candidate not in unique_values:
            unique_values.append(candidate)
    return unique_values


def _match_single_category_from_posting(
    posting: dict[str, str],
    dictionary: Any,
) -> str | None:
    matches: list[str] = []

    for field in CATEGORY_MATCH_SOURCE_FIELDS:
        for value in _split_category_match_values(posting.get(field, "")):
            match = _match_single_exact_or_alias(value, dictionary)
            if match is not None:
                _append_unique(matches, match)

    if len(matches) == 1:
        return matches[0]
    return None


def _trim_context_prefix(prefix: str) -> str:
    prefix = re.split(r"\s+(?:및|또는)\s+", prefix)[-1]
    words = []
    for word in prefix.split():
        clean_word = word.strip(" .,:;")
        if any(noisy_word in clean_word for noisy_word in NOISY_CONTEXT_PREFIX_WORDS):
            continue
        if re.search(r"(과의|와의|으로|로|에서|에게|에|의|을|를|과|와)$", clean_word):
            continue
        if (
            clean_word in CONTEXT_WORDS
            or clean_word in GENERIC_SPLIT_WORDS
            or clean_word in SKILL_CANDIDATES
        ):
            continue
        words.append(clean_word)

    if not words:
        return ""
    return " ".join(words[-2:])


def _clean_candidate(value: str) -> str:
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(
        r"^(?:를|을|이|가|은|는|및|또는|한|중인|위한|통한|따른)\s+",
        "",
        value,
    )
    value = re.sub(
        r"\s+(?:를|을|이|가|은|는|및|또는|한|중인|위한|통한|따른)$",
        "",
        value,
    )
    return value.strip()


def _append_candidate(
    candidates: list[tuple[str, str]],
    field_type: str,
    value: str,
) -> None:
    candidate = _clean_candidate(value)
    if not _is_valid_candidate(candidate):
        return

    key = (field_type, _normalize(candidate))
    if key not in {(item_type, _normalize(item_value)) for item_type, item_value in candidates}:
        candidates.append((field_type, candidate))


def _review_only_field_type(field_type: str) -> str:
    return f"{field_type}{REVIEW_ONLY_FIELD_SUFFIX}"


def _actual_field_type(field_type: str) -> str:
    return field_type.removesuffix(REVIEW_ONLY_FIELD_SUFFIX)


def _allows_confirmation(field_type: str) -> bool:
    return not field_type.endswith(REVIEW_ONLY_FIELD_SUFFIX)


def _prefer_specific_candidates(
    candidates: list[tuple[str, str]],
) -> list[tuple[str, str]]:
    preferred: list[tuple[str, str]] = []

    for field_type, value in sorted(candidates, key=lambda item: len(item[1]), reverse=True):
        normalized_value = _normalize(value)
        has_more_specific_value = any(
            existing_type == field_type
            and normalized_value in _normalize(existing_value)
            and normalized_value != _normalize(existing_value)
            for existing_type, existing_value in preferred
        )
        if not has_more_specific_value:
            preferred.append((field_type, value))

    return list(reversed(preferred))


def _field_type_for_candidate(candidate: str) -> str:
    if candidate in SKILL_CANDIDATES:
        return "skill"
    if candidate in DOMAIN_CANDIDATES:
        return "domain"
    return "competency"


def _match_candidate_with_dictionary(
    candidate: str,
    field_type: str,
    configs: dict[str, Any],
) -> str | None:
    if field_type == "skill":
        matches = _find_matches(
            candidate,
            configs["skill-dictionary.json"],
            allow_contains=True,
        )
    elif field_type == "competency":
        matches = _find_matches(
            candidate,
            configs["competency-dictionary.json"],
            allow_contains=False,
        )
    else:
        return None

    if len(matches) == 1:
        return matches[0]
    return None


def _confirmed_value_keys(
    extracted_skills: list[str],
    extracted_competencies: list[str],
) -> set[str]:
    return {
        _normalize(value)
        for value in [*extracted_skills, *extracted_competencies]
        if _normalize(value)
    }


def _append_review_item_if_valid(
    review_items: list[ReviewItemDraft],
    field_type: str,
    raw_value: str,
) -> None:
    candidate = _clean_candidate(raw_value)
    if not _is_valid_candidate(candidate):
        return

    normalized_candidate = _normalize(candidate)
    if any(
        item.field_type == field_type and _normalize(item.raw_value) == normalized_candidate
        for item in review_items
    ):
        return

    review_items.append(ReviewItemDraft(field_type, candidate))


def _is_valid_candidate(candidate: str) -> bool:
    normalized_candidate = _normalize(candidate)
    if not (
        MIN_CANDIDATE_LENGTH
        <= len(candidate)
        <= MAX_CANDIDATE_LENGTH
    ):
        return False
    if normalized_candidate in {_normalize(word) for word in GENERIC_SPLIT_WORDS}:
        return False
    if re.fullmatch(r"[가-힣]?", candidate):
        return False
    if re.search(r"(입니다|합니다|해주세요|가능한|우대|필수|자격|경험)$", candidate):
        return False
    return True


def _normalize_text_for_analysis(text: str | None) -> str:
    if text is None:
        return ""

    normalized = str(text)
    normalized = re.sub(r"(?i)<\s*/?\s*(ul|ol)\s*>", "\n", normalized)
    normalized = re.sub(r"(?i)<\s*li\s*>", "\n", normalized)
    normalized = re.sub(r"(?i)<\s*/\s*li\s*>", "\n", normalized)
    normalized = re.sub(r"(?i)<\s*br\s*/?\s*>", "\n", normalized)
    normalized = re.sub(r"<[^>]+>", "", normalized)

    bullet_pattern = re.compile(
        r"^\s*(?:[•\-*·ㆍ□■▶▷①②③④⑤⑥⑦⑧⑨⑩]|"
        r"\d+[\.)]|\(\d+\)|[가-힣][\.)]|[ㄱ-ㅎ][\.)])\s*"
    )
    lines = []
    for line in normalized.splitlines():
        line = bullet_pattern.sub("", line)
        line = re.sub(r"[ \t]+", " ", line).strip()
        if line:
            lines.append(line)

    return "\n".join(lines)


def _match_multi_contains_alias(
    values: list[str],
    dictionary: Any,
    field_type: str,
    review_items: list[ReviewItemDraft],
) -> list[str]:
    matched_values: list[str] = []

    for value in values:
        matches = _find_matches(value, dictionary, allow_contains=True)
        if len(matches) == 1:
            _append_unique(matched_values, matches[0])
        else:
            review_items.append(ReviewItemDraft(field_type, value))

    return matched_values


def _match_multi_exact_or_alias(
    values: list[str],
    dictionary: Any,
    field_type: str,
    review_items: list[ReviewItemDraft],
) -> list[str]:
    matched_values: list[str] = []

    for value in values:
        if not value.strip():
            continue

        matches = _find_matches(value, dictionary, allow_contains=False)
        if len(matches) == 1:
            _append_unique(matched_values, matches[0])
        else:
            review_items.append(ReviewItemDraft(field_type, value))

    return matched_values


def _match_single_exact_or_alias(value: str, dictionary: Any) -> str | None:
    matches = _find_matches(value, dictionary, allow_contains=False)
    if len(matches) == 1:
        return matches[0]
    return None


def _find_matches(value: str, dictionary: Any, allow_contains: bool) -> list[str]:
    normalized_value = _normalize(value)
    if not normalized_value:
        return []

    matches: list[str] = []
    for entry in _iter_entries(dictionary):
        terms = [_normalize(term) for term in (entry["name"], *entry["aliases"])]
        terms = [term for term in terms if term]
        if not terms:
            continue

        is_match = any(
            term in normalized_value if allow_contains else term == normalized_value
            for term in terms
        )
        if is_match:
            _append_unique(matches, entry["name"])

    return matches


def _iter_entries(dictionary: Any) -> list[dict[str, Any]]:
    if isinstance(dictionary, dict):
        iterable = dictionary.values()
    elif isinstance(dictionary, list):
        iterable = dictionary
    else:
        return []

    entries: list[dict[str, Any]] = []
    for item in iterable:
        if isinstance(item, str):
            entries.append({"name": item, "aliases": []})
        elif isinstance(item, dict):
            name = _entry_name(item)
            if name is None:
                continue
            entries.append({"name": name, "aliases": _entry_aliases(item)})

    return entries


def _entry_name(item: dict[str, Any]) -> str | None:
    for key in ("name", "value", "category", "label"):
        value = item.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def _entry_aliases(item: dict[str, Any]) -> list[str]:
    aliases = item.get("aliases", item.get("alias", []))
    if isinstance(aliases, str):
        return [aliases]
    if isinstance(aliases, list):
        return [alias for alias in aliases if isinstance(alias, str)]
    return []


def _normalize(value: str) -> str:
    return value.strip().casefold()


def _append_unique(values: list[str], value: str) -> None:
    if value not in values:
        values.append(value)
