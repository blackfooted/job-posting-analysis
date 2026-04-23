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


def analyze_posting(posting: dict[str, str]) -> AnalysisDraft:
    configs = load_all_configs()
    review_items: list[ReviewItemDraft] = []

    industry_category = _match_single_exact_or_alias(
        posting["industry_memo"],
        configs["industry-categories.json"],
    )
    if industry_category is None and posting["industry_memo"].strip():
        review_items.append(ReviewItemDraft("industry", posting["industry_memo"]))

    domain_category = _match_single_exact_or_alias(
        posting["industry_memo"],
        configs["domain-categories.json"],
    )
    if domain_category is None and posting["industry_memo"].strip():
        review_items.append(ReviewItemDraft("domain", posting["industry_memo"]))

    position_category = _match_single_exact_or_alias(
        posting["position"],
        configs["position-categories.json"],
    )
    if position_category is None and posting["position"].strip():
        review_items.append(ReviewItemDraft("position", posting["position"]))

    extracted_skills = _match_multi_contains_alias(
        _split_tools(posting["tools"]),
        configs["skill-dictionary.json"],
        "skill",
        review_items,
    )

    competency_values = [
        posting["duties"],
        posting["requirements"],
        posting["preferred"],
    ]
    extracted_competencies = _match_multi_exact_or_alias(
        competency_values,
        configs["competency-dictionary.json"],
        "competency",
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
    return [value.strip() for value in re.split(r"[,/\n]+", tools) if value.strip()]


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
