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
   - AI recommendation history: `11_ai_recommendation_history_plan.md`
   - AI recommendation selective apply: `12_ai_recommendation_selective_apply_policy.md`
   - AI recommendation quality validation: `13_ai_recommendation_quality_validation.md`
   - AI recommendation category apply: `14_ai_recommendation_category_apply_policy.md`
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

## Frontend 작업 기준

- frontend 작업 시에는 현재 `frontend/src/App.jsx`와 `frontend/src/App.css`를 함께 확인한다.
- frontend 상태 관리와 컴포넌트 구조는 문서보다 실제 코드 기준으로 확인한다.
- review_items 화면의 선택 상태, draft 상태, bulk 저장 메시지 등 UI state는 `App.jsx` 구현을 기준으로 판단한다.
- frontend API client를 수정해야 하는 작업인지 아닌지를 지시문에 명확히 구분한다.

## Codex 지시문 작성 기준

Codex 작업 지시문에는 아래 항목을 포함한다.

- 작업명
- 기준 문서
- 수정 허용 파일
- 수정 금지 파일
- 구현 기준
- 검증 방법
- 작업 완료 후 요약 항목
- 자동 push / merge 금지

작성 원칙:

- 구현 기준은 번호 목록으로 작성한다.
- 수정 범위와 수정 금지 범위를 명확히 분리한다.
- backend/frontend/config/docs 수정 여부를 작업 완료 요약에 포함한다.
- sandbox에서 frontend build가 `spawn EPERM`으로 실패하면, 무제한 재실행하지 말고 로컬 PowerShell 재검증 필요로 기록한다.

## 기능 변경 시 수정 대상 문서

이 표는 문서 현행화 누락을 막기 위한 기준이다. 실제 변경 범위가 작으면 해당 문서 중 관련 부분만 최소 수정한다.

| 변경 영역 | 수정 대상 문서 |
|---|---|
| postings API/정책 | `03_postings_feature_spec.md`, 필요 시 `09_current_dev_handoff.md` |
| review_items API/정책 | `04_review_items_feature_spec.md`, 필요 시 `09_current_dev_handoff.md` |
| classification 로직/config | `05_classification_and_config_spec.md`, 필요 시 `09_current_dev_handoff.md` |
| dashboard API/집계 기준 | `06_dashboard_spec.md`, 필요 시 `09_current_dev_handoff.md` |
| AI recommendation | `07_ai_recommendation_spec.md`, 필요 시 `09_current_dev_handoff.md` |
| AI recommendation 기능 변경 | `07_ai_recommendation_spec.md`, `09_current_dev_handoff.md`, `11_ai_recommendation_history_plan.md`, `12_ai_recommendation_selective_apply_policy.md` |
| AI recommendation history 저장/조회 변경 | `11_ai_recommendation_history_plan.md`, `07_ai_recommendation_spec.md`, `09_current_dev_handoff.md` |
| AI recommendation 선택 반영 변경 | `12_ai_recommendation_selective_apply_policy.md`, `07_ai_recommendation_spec.md`, `09_current_dev_handoff.md`, `11_ai_recommendation_history_plan.md` |
| AI recommendation category 후보/반영 변경 | `14_ai_recommendation_category_apply_policy.md`, `07_ai_recommendation_spec.md`, `09_current_dev_handoff.md`, `11_ai_recommendation_history_plan.md`, `12_ai_recommendation_selective_apply_policy.md` |
| AI recommendation 품질 검증/평가 변경 | 품질 검증 문서, `07_ai_recommendation_spec.md`, `09_current_dev_handoff.md` |
| DB 스키마 변경 | `02_architecture_current_state.md`와 연관 기능 spec |
| 복수 도메인 구조 도입 | `02_architecture_current_state.md`, `03_postings_feature_spec.md`, `05_classification_and_config_spec.md`, `06_dashboard_spec.md`, `07_ai_recommendation_spec.md`, `09_current_dev_handoff.md` |
| 로드맵 변경 | `08_future_roadmap.md`, `09_current_dev_handoff.md` |
| 문서 우선순위/운영 규칙 변경 | `00_project_doc_index.md` |
## AI Recommendation 품질 검증 문서

- AI recommendation 품질 검증/평가 변경 시 `13_ai_recommendation_quality_validation.md`, `07_ai_recommendation_spec.md`, `09_current_dev_handoff.md`를 함께 확인한다.

## AI Recommendation Category Apply 정책 문서

- AI recommendation category 후보 저장/반영 정책 문서: `docs/current/14_ai_recommendation_category_apply_policy.md`
- industry/domain/position 후보 저장, analysis_results 반영, domain 단일값/복수값, dictionary_candidates 연계 정책 변경 시 함께 확인한다.
