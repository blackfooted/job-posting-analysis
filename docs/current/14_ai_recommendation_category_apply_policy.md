# AI Recommendation Category Apply Policy

## Analysis Apply Tracking Schema Current Update

- category 후보 저장 구조에 analysis apply 추적 컬럼이 추가되었다.
- 추가 컬럼은 `applied_to_analysis`, `applied_at`, `previous_analysis_value`, `applied_analysis_field`다.
- accepted 상태만으로 `analysis_results`가 변경되지 않는 정책은 유지한다.
- 실제 apply-analysis 처리는 후속 backend API에서 구현한다.

## Analysis Result Apply Policy Reference

- accepted category 후보의 `analysis_results` 반영은 `docs/current/16_category_candidate_analysis_apply_policy.md` 기준을 따른다.
- accepted 상태만으로 `analysis_results`를 갱신하지 않는다.
- 분석 결과 반영은 별도 apply 액션, overwrite confirm, 반영 이력/상태 추적 정책이 필요하다.

## Frontend Category Candidate Save UI Current Update

- AI 추천 이력 상세/비교 화면에서 category 후보 저장 UI가 연결되었다.
- 하단 category 후보 목록은 `저장된 산업/도메인/직무 후보` 관리 영역으로 유지한다.
- `review_items` 반영 흐름과 category 후보 저장 흐름은 버튼은 공유하되 API 호출과 결과 표시를 독립적으로 처리한다.
- category 후보 저장 성공 후 공고별 후보 목록을 refresh하며, `analysis_results` 즉시 갱신은 하지 않는다.

## 1. 문서 목적

이 문서는 AI 추천 결과 중 industry/domain/position category 항목을 어떻게 저장하고 검토할지 정의하는 정책 문서다.

목적:

- AI 추천 category 값을 즉시 확정값으로 덮어쓰는 위험 방지
- analysis_results와 dashboard 집계 기준 충돌 방지
- domain 단일값/복수값 정책 정리
- AI 추천 category 후보를 사용자 검토 대상으로 저장하는 구조 검토
- review_items 확장, 별도 후보 테이블, dictionary_candidates 연계 중 방향 결정
- 후속 category 후보 저장 API/UI 구현 기준 제공

## 2. 현재 상태

- AI recommendation history 저장 가능
- skill/competency 선택 반영 가능
- 선택 반영 결과는 review_items에 반영
- applied_items_json 기록 가능
- industry/domain/position은 현재 선택 반영 대상에서 제외
- analysis_results는 자동 갱신하지 않음
- config JSON은 자동 수정하지 않음
- dictionary_candidates 구조는 아직 미구현

## 3. 문제 정의

- AI 추천이 산업/도메인/직무를 제안하지만 현재 저장·검토 흐름이 없음
- 사용자가 AI 추천 category 값을 보고도 반영하거나 보류할 방법이 없음
- 규칙 기반 classification 결과와 AI 추천 category가 다를 수 있음
- 산업/도메인/직무는 dashboard 집계와 연결되므로 즉시 덮어쓰기 위험이 있음
- domain은 현재 단일값 구조라 복수 도메인 추천을 수용하기 어려움
- config 후보 확장과도 연결될 수 있으므로 별도 정책 필요

## 4. 기본 원칙

- AI 추천 category는 자동 확정하지 않는다.
- AI 추천 category는 analysis_results를 즉시 갱신하지 않는다.
- AI 추천 category는 config JSON을 자동 수정하지 않는다.
- AI 추천 category는 사용자 검토용 후보로 저장한다.
- category 후보 저장과 최종 반영은 분리한다.
- industry/domain/position은 skill/competency와 다른 정책으로 관리한다.
- domain은 단일값/복수값 정책 확정 전까지 최종 반영하지 않는다.
- dashboard 집계에 즉시 반영하지 않는다.
- dictionary_candidates 또는 category_candidates와의 장기 연계를 고려한다.

## 5. 핵심 결정 1 — review_items 확장 vs 별도 테이블

### 선택지 A. review_items 확장

설명:

- industry/domain/position 후보도 review_items에 저장
- field_type 값으로 industry/domain/position 활용
- 기존 review_items UI/상태 흐름을 일부 재사용

장점:

- 구현이 빠름
- 기존 review_items 정제 흐름 재사용 가능
- 별도 테이블 설계 비용이 낮음

단점:

- review_items가 skill/competency 정제와 category 후보 관리를 모두 담당하게 됨
- analysis_results와 연결 정책이 불명확할 수 있음
- domain 단일값/복수값 정책을 별도로 해결해야 함
- category 후보와 일반 정제 후보가 섞여 UI 복잡도가 증가할 수 있음

적합한 경우:

- 단기 MVP에서 빠르게 category 후보를 검토하고 싶을 때
- category 후보를 최종 반영이 아니라 검토 후보로만 둘 때

### 선택지 B. 별도 category 후보 테이블

예시 테이블명:

```text
ai_recommendation_category_candidates
```

설명:

- AI 추천 category 후보만 별도 저장
- industry/domain/position 후보와 출처 run을 명확히 연결
- analysis_results 반영 여부는 별도 상태로 관리

장점:

- category 후보 관리 책임이 명확함
- analysis_results와 충돌을 줄일 수 있음
- 복수 도메인 후보를 저장하기 쉬움
- dashboard 반영 전 검토 상태를 유지하기 좋음

단점:

- DB/API/UI 설계가 추가로 필요
- MVP 범위가 커짐
- review_items와 별도 UI/흐름이 필요할 수 있음

적합한 경우:

- industry/domain/position 후보를 장기적으로 체계 관리하려는 경우
- 복수 도메인 구조와 연결하려는 경우
- config 후보 관리와 분리해서 category 후보를 다루려는 경우

### 선택지 C. dictionary_candidates 또는 config 후보 관리 구조와 통합

설명:

- category 후보를 향후 dictionary_candidates 구조와 통합
- confirmed review_items, AI category 후보, config 후보를 하나의 후보 관리 흐름으로 연결

장점:

- 장기적인 config 커버리지 확장과 가장 잘 맞음
- 중복 후보 관리가 쉬움
- 사람이 검토한 후보를 config 반영 후보로 축적 가능

단점:

- dictionary_candidates 구조가 아직 없음
- 가장 많은 설계 비용이 필요
- 지금 바로 구현하기에는 범위가 큼

적합한 경우:

- 공고와 후보 데이터가 충분히 누적된 이후
- config write-back 또는 후보 승인 프로세스를 본격적으로 설계할 때

## 6. 1차 권장 정책

1차 권장안:

- analysis_results 즉시 갱신은 하지 않는다.
- config JSON 자동 수정도 하지 않는다.
- category 후보는 우선 후보로만 저장한다.
- 단기 구현은 선택지 A 또는 B 중 하나를 결정해야 한다.
- 장기 구조는 선택지 C(dictionary_candidates 또는 config 후보 관리 구조)와 연결한다.

현재 권장 방향:

- 단기: 별도 category 후보 테이블 또는 review_items 확장 중 선택
- 장기: dictionary_candidates/config 후보 관리 구조와 통합

권장:

- 단기 MVP에서는 review_items 확장보다 별도 category 후보 테이블을 우선 검토한다.

이유:

- industry/domain/position은 skill/competency와 성격이 다름
- analysis_results와 dashboard 영향이 있어 분리 관리가 안전함
- 복수 도메인 후보 저장이 필요할 수 있음
- review_items가 지나치게 복잡해지는 것을 방지할 수 있음

단, 구현 속도를 최우선으로 할 경우 review_items 확장도 임시 선택지로 남긴다.

구체화된 저장 구조 설계:

- category 후보 저장 구조 설계 문서: `docs/current/15_ai_recommendation_category_candidate_storage.md`
- 단기 권장 구조가 별도 category 후보 테이블로 구체화되었다.
- 단기 권장 구조인 별도 category 후보 테이블이 schema 단계에서 구현되었다.
- category 후보 backend API 1차 구현이 완료되어 `pending`/`accepted`/`rejected` 상태 관리가 가능하다.
- `pending`으로 되돌릴 때 `reviewed_at=null`로 초기화하는 것은 의도된 정책이다.
- analysis_results 즉시 갱신 제외 정책은 유지한다.
- 다음 구현 후보는 frontend category 후보 UI다.

## 7. 핵심 결정 2 — analysis_results 즉시 갱신 vs 후보 관리

### 선택지 A. analysis_results 즉시 갱신

설명:

- 사용자가 AI 추천 category를 선택하면 analysis_results의 industry/domain/position 값을 바로 갱신

장점:

- dashboard와 분석 결과에 즉시 반영
- 사용자 입장에서는 결과 변경이 빠름

단점:

- 기존 classification 결과를 덮어씀
- AI 추천 오류가 dashboard 집계에 바로 반영됨
- domain 단일값/복수값 정책 미확정 상태에서 위험
- 되돌리기/이력 추적이 필요함

정책 판단:

- 1차 구현에서는 제외

### 선택지 B. 후보로만 관리

설명:

- AI 추천 category는 별도 후보로 저장
- 사용자가 검토 후 확정 여부를 판단
- analysis_results 반영은 별도 phase에서 수행

장점:

- 기존 분석 결과와 충돌하지 않음
- 후보 품질 검토 가능
- 복수 도메인 정책과 연결 가능
- 되돌리기/이력 관리에 유리

단점:

- 즉시 dashboard에 반영되지 않음
- 후보 관리 UI가 필요

정책 판단:

- 1차 구현 권장

## 8. domain 단일값/복수값 정책

현재 상태:

- 현재 analysis_results.domain_category는 단일값 구조
- AI 추천은 primary_domain_category를 반환
- 향후 복수 도메인 구조가 필요할 수 있음

정책:

- 1차 category 후보 저장은 단일 primary_domain_category 후보 저장부터 시작한다.
- 복수 도메인 전체 저장은 후속 구조에서 검토한다.
- 장기적으로는 아래 구조를 검토한다.
  - representative_domain = 대표 도메인 1개
  - domain_candidates = 후보 N개
  - confirmed_domains = 사용자가 확정한 N개

주의:

- 현재 단계에서 analysis_results.domain_category를 복수값으로 바꾸지 않는다.
- dashboard 집계 기준도 바로 바꾸지 않는다.
- 복수 도메인 구조는 별도 phase로 분리한다.

## 9. category 후보 데이터 구조 초안

별도 테이블을 선택할 경우 초안으로 아래를 제안한다.

테이블명 후보:

```text
ai_recommendation_category_candidates
```

초안 컬럼:

| column | type | required | 설명 |
|---|---|---|---|
| id | INTEGER PK | yes | 후보 ID |
| run_id | INTEGER | yes | AI recommendation run ID |
| posting_id | INTEGER | yes | 대상 공고 ID |
| category_type | TEXT | yes | industry/domain/position |
| recommended_value | TEXT | yes | AI 추천값 |
| confidence | TEXT | no | high/medium/low |
| reason | TEXT | no | AI 판단 근거 |
| source_path | TEXT | yes | recommendation 내 위치 |
| status | TEXT | yes | pending/accepted/rejected |
| created_at | TEXT | yes | 생성 시각 |
| reviewed_at | TEXT | no | 검토 시각 |
| note | TEXT | no | 사용자 메모 |

상태값:

| status | 의미 |
|---|---|
| pending | 후보 저장 후 미검토 |
| accepted | 사용자가 후보로 채택 |
| rejected | 사용자가 제외 |

주의:

- accepted가 곧 analysis_results 반영을 의미하지는 않는다.
- accepted 후 analysis_results 반영은 별도 phase에서 결정한다.

## 10. review_items 확장 선택 시 정책 초안

review_items 확장을 선택할 경우 아래 정책을 둔다.

- field_type=industry/domain/position 저장 허용
- status=pending 대신 기존 status 체계와 맞춰 unconfirmed/confirmed/removed 사용 가능
- confirmed가 곧 analysis_results 반영은 아님
- category 후보는 별도 표시 또는 filter가 필요
- skill/competency와 category 후보가 섞이므로 UI 라벨/필터 정리가 필요

주의:

- review_items 확장은 빠르지만 장기적으로 구조가 복잡해질 수 있음
- analysis_results 반영 정책을 별도로 두어야 함

## 11. AI recommendation category 후보 저장 API 초안

이번 문서에서는 구현하지 않고 API 초안만 작성한다.

별도 테이블 기준 후보 API:

```text
POST /api/ai-recommendations/history/{run_id}/category-candidates
GET /api/ai-recommendations/postings/{posting_id}/category-candidates
PATCH /api/ai-recommendations/category-candidates/{candidate_id}
```

### POST category-candidates

역할:

- 저장된 recommendation_json에서 industry/domain/position 후보를 선택 저장
- source_path 검증
- analysis_results는 갱신하지 않음

요청 예시:

```json
{
  "items": [
    {
      "source_path": "industry_category",
      "category_type": "industry",
      "recommended_value": "헬스케어"
    },
    {
      "source_path": "primary_domain_category",
      "category_type": "domain",
      "recommended_value": "의료 SaaS"
    }
  ]
}
```

### GET posting category-candidates

역할:

- 특정 공고의 category 후보 목록 조회

### PATCH category-candidates

역할:

- 후보 상태를 pending/accepted/rejected로 변경
- note 입력 가능

주의:

- analysis_results 갱신 API는 아직 만들지 않음
- dashboard 반영도 아직 하지 않음

## 12. frontend UI 초안

후속 UI 후보:

위치:

- AI 추천 history 상세 화면
- AI 추천 history 비교 화면
- 별도 category 후보 관리 영역

기능:

- industry/domain/position 후보 선택
- 후보 저장 버튼
- 후보 상태 표시: pending/accepted/rejected
- 기존 analysis_results 값과 AI 추천값 비교
- accepted/rejected 처리
- note 입력

제외:

- analysis_results 즉시 갱신
- dashboard 즉시 반영
- config JSON 직접 수정

## 13. dictionary_candidates와의 관계

- category 후보 저장은 dictionary_candidates 설계와 연결 가능하다.
- 하지만 dictionary_candidates 구조가 아직 없으므로 즉시 통합하지 않는다.
- category 후보 저장 결과를 향후 dictionary_candidates 후보로 승격할 수 있다.
- confirmed review_items, accepted category candidates, AI 추천 후보를 장기적으로 하나의 후보 관리 구조로 통합할 수 있다.
- dictionary_candidates 설계 전까지는 category 후보 저장 구조를 독립적으로 유지하거나 임시 구조로 둔다.

## 14. 구현 단계 제안

### Phase CAT-1 — category apply policy 문서화

- 현재 문서
- review_items 확장 vs 별도 테이블 비교
- analysis_results 즉시 갱신 제외
- domain 단일값/복수값 정책 정리

### Phase CAT-2 — category 후보 저장 DB/API 설계

- 별도 테이블 또는 review_items 확장 최종 결정
- source_path 검증 정책
- 후보 상태값 정의

### Phase CAT-3 — category 후보 저장 backend 구현

- category 후보 저장 API
- 후보 목록 조회 API
- 후보 상태 변경 API

### Phase CAT-4 — category 후보 frontend UI 구현

- history 상세/비교 화면에서 category 후보 저장
- 후보 관리 목록
- accepted/rejected 처리

### Phase CAT-5 — analysis_results 반영 정책 검토

- accepted 후보를 analysis_results에 반영할지 검토
- domain 단일값/복수값 구조 검토
- dashboard 영향 검토

### Phase CAT-6 — dictionary_candidates 통합 검토

- category 후보와 config 후보 관리 통합 검토

## 15. 결정 필요 항목

| 항목 | 선택지 | 권장 |
|---|---|---|
| 단기 저장 구조 | review_items 확장 / 별도 category 후보 테이블 | 별도 category 후보 테이블 |
| analysis_results 반영 | 즉시 갱신 / 후보로만 관리 | 후보로만 관리 |
| domain 구조 | 단일값 유지 / 복수 후보 저장 / 복수 확정 도메인 | 복수 후보 저장부터 |
| dashboard 반영 | 즉시 반영 / accepted 후 반영 / 후속 | 후속 |
| dictionary_candidates 연계 | 즉시 통합 / 후속 통합 | 후속 |
| config JSON 반영 | 자동 반영 / 수동 후보 관리 | 수동 후보 관리 |

## 16. 다음 작업 제안

다음 Codex 작업 후보:

- category 후보 저장 구조 결정
- 별도 category 후보 테이블 설계
- category 후보 저장 backend API 구현
- category 후보 frontend UI 구현
- dictionary_candidates 구조 설계
