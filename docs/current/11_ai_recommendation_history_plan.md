# AI Recommendation History Plan

## 1. 문서 목적

이 문서는 AI 추천 결과를 저장하고, 모델/prompt 변경 전후 결과를 비교하며, 사용자가 실제로 확인한 추천 이력을 관리하기 위한 설계 문서다.

목적:

- 동일 공고에 대한 반복 추천 결과 비교
- `prompt_version`/model 변경에 따른 품질 비교
- 비용이 발생한 OpenAI 호출 결과 유실 방지
- 사용자 검토 이력 보존
- 후속 review_items/dictionary_candidates 선택 반영의 기준 데이터 확보
- AI 추천 결과 중 사용자가 선택한 일부 항목만 반영하는 구조의 기반 마련

## 2. 현재 상태

AI Recommendation Phase AI-1B는 구현 및 사용자 로컬 검증 완료 상태다.

- endpoint: `GET /api/ai-recommendations/postings/{posting_id}`
- mode: `mock | openai`
- 기본 mode: `mock`
- 기본 model: `gpt-5.4-nano`
- OpenAI mode는 Responses API + Structured Outputs 사용
- frontend에서 사용자가 `AI 추천 조회` 버튼을 클릭할 때만 호출
- DB 저장 없음
- review_items 반영 없음
- analysis_results 갱신 없음
- config 수정 없음
- 추천 결과는 화면 표시용

AI Recommendation History backend 1차 구현 상태:

- `ai_recommendation_runs` 테이블 추가
- openai mode 성공 결과 저장
- mock mode 결과는 저장하지 않음
- 실패 결과 row는 1차 구현에서 생성하지 않음
- `POST /api/ai-recommendations/postings/{posting_id}/runs` 추가
- `GET /api/ai-recommendations/postings/{posting_id}/history` 추가
- `GET /api/ai-recommendations/history/{run_id}` 추가
- 기존 `GET /api/ai-recommendations/postings/{posting_id}`는 저장 없이 호환 유지
- frontend는 POST `/runs`, history 목록, history 상세 조회까지 1차 연결 완료

## 3. 문제 정의

현재 AI 추천 결과 저장 기능이 없어 아래 문제가 있다.

- 같은 공고에 대해 AI 추천을 여러 번 실행해도 결과 비교 불가
- 모델/prompt 변경 전후 추천 품질 추적 불가
- 비용이 발생한 OpenAI 호출 결과 유실
- 사용자가 어떤 추천을 검토했는지 추적 불가
- 후속 review_items 또는 dictionary_candidates 반영 기능의 기준 결과 부재
- AI 추천 결과 중 일부 항목만 선택해 반영했는지 추적 불가

## 4. 설계 원칙

- AI 추천 결과는 자동 확정하지 않는다.
- 저장된 추천 결과도 자동으로 review_items에 반영하지 않는다.
- analysis_results를 자동 갱신하지 않는다.
- config JSON을 자동 수정하지 않는다.
- AI 추천 결과는 사용자 검토용 이력으로 저장한다.
- API key는 절대 저장하지 않는다.
- raw prompt 전체는 저장하지 않는다.
- raw OpenAI response 전체는 저장하지 않는다.
- 저장 대상은 정규화된 recommendation JSON을 우선으로 한다.
- mode/model/prompt_version을 반드시 저장한다.
- openai mode 성공 결과 저장을 우선으로 한다.
- mock mode 결과는 1차 구현에서 저장하지 않는다.
- 추천 결과 전체 저장과 일부 항목 선택 반영을 분리한다.
- 선택적 반영은 저장 단계가 아니라 후속 반영 단계에서 처리한다.

## 5. 저장 대상 정책

### 저장 대상

초기 저장 대상은 openai mode 성공 결과를 우선으로 한다.

- openai mode 성공 결과
- `posting_id`
- recommendation JSON 전체
- `mode`
- `model`
- `prompt_version`
- `created_at`
- 추천 실행 상태

### 저장하지 않는 대상

아래 데이터는 저장하지 않는다.

- `OPENAI_API_KEY`
- raw prompt 전체
- raw OpenAI response 전체
- request payload 전체
- frontend local state
- API 호출자의 민감 정보

### 보류 대상

아래 항목은 1차 history 설계에서 보류한다.

- 실패 결과 저장 여부
- token usage 저장 여부
- `latency_ms` 저장 여부
- user action log 저장 여부

보류 사유:

- 실패 결과 저장은 디버깅에 유용하지만 error payload, prompt 일부, provider metadata 저장 범위를 별도 정의해야 한다.
- token usage와 `latency_ms`는 비용/성능 분석에 유용하지만 Responses API 응답 형태와 SDK metadata 확인 후 안정적으로 설계해야 한다.
- user action log는 다중 사용자/감사 로그 설계와 연결되므로 MVP history 저장과 분리한다.

## 6. 저장 단위와 선택적 반영 정책

정책:

- 1차 구현에서는 AI 추천 결과 전체를 `recommendation_json`으로 저장한다.
- 사용자가 skills만, competencies만, 특정 review_item_candidates만 선택해 반영하는 기능은 "저장"이 아니라 "반영" 단계에서 처리한다.
- 즉, history에는 전체 추천 결과를 보존하고, 이후 사용자가 어떤 항목을 선택 반영했는지 별도 추적한다.
- 초기에는 반영 여부만 `applied_status`로 관리한다.
- `applied_status` 기본값은 `not_applied`다.
- 일부 항목만 반영한 경우 `partially_applied`로 관리할 수 있다.
- 전체 또는 주요 항목을 반영한 경우 `applied`로 관리할 수 있다.
- 어떤 항목이 반영되었는지까지 추적하려면 후속 컬럼 `applied_items_json`을 추가할 수 있다.

권장 추가 후보 컬럼:

| column | reason |
|---|---|
| `applied_items_json` | 사용자가 선택 반영한 skills/competencies/review_item_candidates 항목 추적 |
| `applied_at` | 마지막 반영 시각 추적용 |
| `applied_by` | 다중 사용자 구조 도입 시 반영 사용자 추적 |

초기 판단:

- 1차 history 저장 구현에서는 `applied_status`만 둔다.
- `applied_items_json`은 선택 반영 기능 구현 단계에서 추가 검토한다.
- 저장과 반영의 책임을 분리한다.

예시:

```text
AI 추천 결과 전체 저장:
- skills: SQL, Python, AWS
- competencies: 요구사항 분석, 협업
- review_item_candidates: ERP, WMS

사용자 선택 반영:
- skills 중 SQL만 반영
- competencies 중 요구사항 분석만 반영

history:
- recommendation_json에는 전체 결과 보존
- applied_status=partially_applied
- applied_items_json은 후속 구현 시 선택 반영 항목 기록
```

## 7. DB 저장 구조 초안

1차 구현 테이블:

```text
ai_recommendation_runs
```

1차 구현 컬럼:

| column | type | required | note |
|---|---|---:|---|
| `id` | INTEGER PRIMARY KEY | yes | 실행 이력 ID |
| `posting_id` | INTEGER | yes | 대상 공고 ID |
| `mode` | TEXT | yes | `openai` 우선, `mock` 저장 여부는 보류 |
| `model` | TEXT | yes | 예: `gpt-5.4-nano` |
| `prompt_version` | TEXT | yes | prompt 변경 전후 비교용 |
| `status` | TEXT | yes | `succeeded`, 실패 저장 시 `failed` 후보 |
| `recommendation_json` | TEXT | yes | 정규화된 recommendation JSON |
| `applied_status` | TEXT | yes | `not_applied`, `partially_applied`, `applied` |
| `created_at` | TEXT | yes | 추천 실행 저장 시각 |

후속 컬럼 후보:

| column | reason |
|---|---|
| `latency_ms` | 실제 OpenAI 호출 성능 추적 |
| `input_token_count` | 비용 분석 |
| `output_token_count` | 비용 분석 |
| `error_code` | 실패 결과 저장 시 원인 분류 |
| `error_message` | 실패 결과 저장 시 제한된 오류 메시지 |
| `applied_items_json` | 선택 반영 항목 추적 |
| `applied_at` | 반영 시각 추적 |
| `applied_by` | 다중 사용자 구조 도입 시 사용자 추적 |

초기 상태값:

```text
status = succeeded
applied_status = not_applied | partially_applied | applied
```

주의:

- `recommendation_json`에는 API 응답 전체가 아니라 `recommendation` object를 저장하는 것을 우선 검토한다.
- `meta.generated_at`과 history `created_at`은 역할이 다르다. 1차 저장에서는 history `created_at`을 기준으로 둔다.
- `posting_id` 대상 공고가 soft delete되어도 history를 즉시 삭제하지 않는 방향을 우선 검토한다.

## 8. API 설계 초안

기존 Phase AI-1B endpoint는 유지한다.

```text
GET /api/ai-recommendations/postings/{posting_id}
```

History 1차 구현 API:

```text
POST /api/ai-recommendations/postings/{posting_id}/runs
GET /api/ai-recommendations/postings/{posting_id}/history
GET /api/ai-recommendations/history/{run_id}
```

후속 검토 후보:

```text
PATCH /api/ai-recommendations/runs/{run_id}/applied-status
```

초기 정책:

- 기존 조회형 추천 endpoint의 응답 구조는 유지한다.
- 기존 GET endpoint는 저장 없이 호환 유지한다.
- POST `/runs`는 추천 실행 + 저장 API다.
- openai mode 성공 결과만 저장한다.
- mock mode는 저장하지 않고 `run=null`, `meta.saved=false`를 반환한다.
- 저장 여부가 최종 API 응답 구조를 깨지 않도록 한다.
- 저장 실패는 `AI_RECOMMENDATION_HISTORY_SAVE_FAILED`로 처리한다.
- 실패 결과 row는 1차 구현에서 생성하지 않는다.
- 선택 반영 API는 history 저장/조회 구현 이후 설계한다.
- `PATCH /api/ai-recommendations/runs/{run_id}/applied-status`는 후속 선택 반영 단계에서 검토한다.

## 9. Frontend 설계 초안

## POST /runs 전환 시 frontend 영향 범위

- `frontend/src/api/aiRecommendationsApi.js`
  - 현재 `fetchAiRecommendation()`의 GET 호출 방식을 변경하거나, 신규 `createAiRecommendationRun()` 함수를 추가해야 한다.
  - 기존 GET 조회 함수와 POST run 생성 함수를 분리할지 결정해야 한다.

- `frontend/src/App.jsx`
  - `AI 추천 조회` 버튼 클릭 핸들러에서 호출 API 변경이 필요하다.
  - 기존 `fetchAiRecommendation(postingId)` 호출을 `createAiRecommendationRun(postingId)`로 바꿀지 검토해야 한다.
  - 응답 data 구조가 기존 추천 결과와 동일하게 유지되는지 확인해야 한다.
  - history 저장 후 반환된 `run_id`를 화면 상태에 보관하거나 표시할지 결정해야 한다.

- 기존 `GET /api/ai-recommendations/postings/{posting_id}`
  - 호환성을 위해 일정 기간 유지하거나 deprecated 처리해야 한다.
  - 기존 frontend 화면이 즉시 깨지지 않도록 유지 전략이 필요하다.
  - 제거하려면 별도 migration phase가 필요하다.

- 빠른 구현 관점
  - frontend 변경 범위를 최소화하려면 기존 GET 유지 + 내부 저장 방식이 더 빠르다.

- 장기 구조 관점
  - 비용 발생 및 저장 발생 행위이므로 POST /runs가 더 적절하다.
  - 단기 구현 방식과 장기 전환 방식은 구현 전에 최종 결정해야 한다.

1차 frontend 연결 상태:

- AI 추천 조회 버튼은 POST `/runs`를 사용한다.
- 기존 GET client는 호환용으로 유지한다.
- POST `/runs` 응답의 `data.recommendation`을 기존 추천 결과 표시 구조로 표시한다.
- POST `/runs` 응답의 `run`/`meta`를 이용해 저장 상태를 표시한다.
- `data.run=null`이면 run id/created_at은 표시하지 않는다.
- history 목록은 `data.items`, `data.pagination` 구조를 기준으로 표시한다.
- history 목록에는 run metadata만 표시하고 recommendation JSON 전체는 표시하지 않는다.
- 공고 선택 시 history page 1로 초기화 후 목록을 조회한다.
- POST `/runs` 성공 후 history page 1로 refresh한다.
- history 목록에서 `상세 보기`를 선택하면 `GET /api/ai-recommendations/history/{run_id}`로 상세를 조회한다.
- history 상세는 run metadata, source, 저장된 recommendation을 표시한다.
- history 상세 recommendation은 현재 추천 결과 영역과 별도 상세 영역으로 표시한다.
- history 목록에서 같은 공고의 저장된 run 2개를 보기 전용 비교 대상으로 선택할 수 있다.
- 선택한 2개 run은 `GET /api/ai-recommendations/history/{run_id}` 상세 응답을 기준으로 좌우 비교한다.
- 비교 UI는 metadata와 recommendation 요약을 표시하며 자동 판단이나 선택 반영은 하지 않는다.
- 공고 변경, history page 이동, history refresh, POST `/runs` 성공 후 refresh 시 compare 상태를 초기화한다.
- 선택 반영 UI는 후속 단계로 둔다.
- 기존 GET endpoint는 호환 유지한다.

초기 UI 후보:

- 공고별 AI 추천 이력 목록
- 실행 시각, mode, model, prompt_version, applied_status 표시
- 추천 이력 상세 보기
- 현재 추천 결과와 과거 추천 결과 비교 보기

후속 UI 후보:

- 이력 중 하나를 선택해 review_items 또는 dictionary_candidates에 반영
- skills/competencies/review_item_candidates 중 일부 항목만 선택 반영
- prompt_version/model별 결과 비교

초기 정책:

- Phase AI-1B의 현재 추천 조회 화면은 유지한다.
- history UI는 저장/조회 API 구현 이후 별도 단계에서 진행한다.
- 선택 반영 UI는 history 조회 UI 이후 검토한다.

## 10. prompt_version 정책

`prompt_version`은 모델 변경과 별도로 prompt 정책 변경을 추적하기 위한 값이다.

초기 후보:

```text
ai-recommendation-v1
```

운영 원칙:

- prompt 내용이 추천 결과 품질에 영향을 줄 정도로 변경되면 version을 올린다.
- 모델만 변경된 경우에는 `model`로 구분하고, prompt가 같으면 `prompt_version`은 유지할 수 있다.
- `raw_text_preview`, output length 제한, skills/competencies 구분 정책 같은 주요 prompt 정책은 version 판단에 포함한다.
- raw prompt 전체는 저장하지 않고 version 문자열과 문서 기준으로 추적한다.

## 11. 제외 범위

이번 history 설계 및 1차 구현 범위에서 제외할 항목:

- AI 추천 결과 자동 확정
- review_items 자동 반영
- analysis_results 자동 갱신
- config JSON 자동 수정
- dictionary_candidates 자동 생성
- raw prompt 전체 저장
- raw OpenAI response 전체 저장
- API key 저장
- OpenAI request payload 전체 저장
- frontend local state 저장
- 다중 사용자 권한/감사 로그
- 비용 청구/예산 관리 기능
- streaming 구현

## 12. 단계별 구현 제안

### Phase AI-2 — History 설계 확정

- 저장 테이블/필드 확정
- `prompt_version` 초기값 확정
- openai 성공 결과 저장 정책 확정
- mock/실패/token/latency 저장 여부 결정
- 기존 endpoint에서 저장할지 별도 endpoint로 분리할지 결정

### Phase AI-3 — History 저장/조회 구현

- backend 1차 구현 완료
- `ai_recommendation_runs` 또는 동등한 저장 구조 구현
- openai mode 성공 결과 저장
- 공고별 추천 이력 조회 API 구현
- run 상세 조회 API 구현
- frontend history 목록/상세 조회 UI 1차 연결 완료

### Phase AI-4 — 선택 반영 설계 및 구현 검토

- 저장된 recommendation에서 사용자가 선택한 항목을 review_items 또는 dictionary_candidates에 반영할지 결정
- 자동 반영이 아닌 사용자 선택 반영 원칙 유지
- `applied_status` 갱신 정책 구현
- 필요 시 `applied_items_json`, `applied_at`, `applied_by` 추가 검토

## 13. 검증 기준

문서 설계 검증:

- 저장 대상과 저장 금지 대상이 명확한지 확인
- 저장과 선택 반영 책임이 분리되어 있는지 확인
- API key/raw prompt/raw OpenAI response 전체 저장 금지가 명확한지 확인
- openai mode 성공 결과 저장 우선 정책이 명확한지 확인
- mock/실패/token/latency/user action log 보류 사유가 기록되어 있는지 확인

구현 단계 검증 후보:

- openai mode 성공 호출 후 history row 생성 확인
- `recommendation_json`이 정규화된 recommendation 구조인지 확인
- API key/raw prompt/raw OpenAI response 전체가 저장되지 않는지 확인
- `applied_status` 기본값이 `not_applied`인지 확인
- 공고별 history 목록 조회가 최신순으로 동작하는지 확인
- 기존 추천 조회 endpoint 응답 구조가 깨지지 않는지 확인

## 14. 결론

AI Recommendation History는 추천 결과를 자동 확정하거나 즉시 반영하기 위한 기능이 아니다. 1차 목표는 비용이 발생한 openai mode 성공 결과를 보존하고, 모델/prompt 변경 전후 결과를 비교하며, 후속 선택 반영의 기준 데이터를 마련하는 것이다.

초기 구현은 정규화된 `recommendation_json` 전체 저장과 `applied_status=not_applied` 관리에 집중한다. 항목별 선택 반영 추적은 후속 반영 기능 설계에서 `applied_items_json` 등으로 확장한다.
