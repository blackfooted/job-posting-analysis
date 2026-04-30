# Project Document Index

## 문서 목적

이 문서는 현재 프로젝트의 기준 문서 세트와 문서 우선순위를 정의한다.
Codex 작업을 시작할 때는 전체 문서를 읽기보다, 작업 범위에 맞는 current 문서만 선택해서 참고한다.

## 현재 기준 문서

현재 개발 기준은 `00_project_doc_index.md`부터 `09_current_dev_handoff.md`까지의 current 문서 세트를 따른다.

1. `09_current_dev_handoff.md`
   - 현재 구현 상태, 차이점, 다음 작업 권장사항을 가장 먼저 확인하는 문서
2. `01_product_overview.md`
   - 서비스 목적, MVP 범위, 제외 범위, AI 사용 원칙
3. `02_architecture_current_state.md`
   - backend/frontend 구조, DB 스키마, API 구성, 로컬 실행 기준
4. 기능별 spec 문서
   - postings: `03_postings_feature_spec.md`
   - review_items: `04_review_items_feature_spec.md`
   - classification/config: `05_classification_and_config_spec.md`
   - dashboard: `06_dashboard_spec.md`
   - AI recommendation: `07_ai_recommendation_spec.md`
5. `08_future_roadmap.md`
   - 현재 구현 범위를 넘는 후속 계획 확인용 문서

## Archive 및 참고 문서 기준

- `docs/archive/**`는 현재 개발 기준 문서가 아니다.
- 기존 문서인 `job_posting_analysis_next_dev_handoff_v2.md`, `job_posting_dashboard_MVP_PRD_v0_7.md`, `seed_data_cleaning_criteria_v3.md`는 `docs/current/` 아래에 남아 있을 수 있으나 현재 개발 기준으로 사용하지 않는다.
- 위 기존 구형 문서는 참고용이며, 현재 작업 기준으로는 `00_project_doc_index.md`부터 `09_current_dev_handoff.md`까지의 current 문서 세트를 우선한다.
- `seed_data_cleaning_criteria_v3.md`는 참고 문서다. 현행 classification/config 기준은 `05_classification_and_config_spec.md`를 따른다.

## Codex 작업 원칙

- 작업 범위에 해당하는 current 문서만 읽는다.
- archive 문서를 현재 정책의 1차 기준으로 사용하지 않는다.
- 코드와 문서가 다르면 "현재 구현" 판단은 코드 기준으로 한다.
- 코드와 구성안 사이 차이는 `09_current_dev_handoff.md` 또는 해당 기능 spec에 기록한다.
