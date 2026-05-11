# AI Recommendation Category Candidate Storage

## 1. 문서 목적

이 문서는 AI 추천 결과 중 industry/domain/position category 후보를 별도 저장 구조로 관리하기 위한 DB/API/UI 설계 문서다.

목적:

- AI 추천 category를 analysis_results에 즉시 반영하지 않고 후보로 보존
- industry/domain/position 후보를 skill/competency review_items와 분리 관리
- 복수 도메인 후보를 수용할 수 있는 기반 마련
- 사용자 검토 상태를 pending/accepted/rejected로 관리
- 향후 analysis_results 반영, dashboard 반영, dictionary_candidates 연계를 위한 기반 마련
- 후속 backend/frontend 구현 기준 제공

## 2. 현재 정책 요약

- AI 추천 category는 자동 확정하지 않는다.
- analysis_results 즉시 갱신은 1차 구현에서 제외한다.
- config JSON 자동 수정은 하지 않는다.
- dashboard 집계에 즉시 반영하지 않는다.
- category 후보는 우선 사용자 검토용 후보로 저장한다.
- 단기 권장 구조는 별도 category 후보 테이블이다.
- 장기적으로 dictionary_candidates 또는 config 후보 관리 구조와 통합 가능성을 검토한다.

DB schema 1차 구현 상태:

- `ai_recommendation_category_candidates` 테이블 schema 구현 완료
- `category_type`, `status`, `confidence` CHECK 제약은 신규 DB schema 기준으로 적용
- `run_id`, `posting_id` foreign key 추가
- category 후보 관련 index 3개 추가
- 기존 DB 보강 로직 추가
- category 후보 저장/조회/상태 변경 backend API 1차 구현 완료
- frontend category 후보 UI는 후속

## 3. 저장 대상

저장 대상 category는 아래로 제한한다.

### 포함 대상

- recommendation.industry_category
- recommendation.primary_domain_category
- recommendation.position_category
- review_item_candidates 중 field_type이 industry/domain/position인 항목

### 제외 대상

- recommendation.skills
- recommendation.competencies
- review_item_candidates 중 field_type이 skill/competency인 항목

주의:

- skills/competencies는 기존 selective apply 흐름에서 review_items로 반영한다.
- category 후보 저장은 skill/competency 선택 반영과 독립된 흐름이다.

## 4. 저장하지 않는 대상

아래 항목은 저장하지 않는다.

- OpenAI API key
- raw prompt 전체
- raw OpenAI response 전체
- request payload 전체
- frontend local state
- analysis_results 변경 이력
- dashboard 집계 결과
- config JSON 전체

주의:

- recommendation_json 원본은 ai_recommendation_runs에 이미 저장되어 있다.
- category 후보 테이블에는 선택된 category 후보와 최소 metadata만 저장한다.

## 5. DB 테이블 설계 초안

테이블명:

```text
ai_recommendation_category_candidates
```

컬럼 초안:

| column | type | required | 설명 |
|---|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | yes | 후보 ID |
| run_id | INTEGER | yes | AI recommendation run ID |
| posting_id | INTEGER | yes | 대상 공고 ID |
| category_type | TEXT | yes | industry/domain/position |
| source_path | TEXT | yes | recommendation 내 위치 |
| recommended_value | TEXT | yes | AI 추천값 |
| confidence | TEXT | no | high/medium/low |
| reason | TEXT | no | AI 판단 근거 |
| status | TEXT | yes | pending/accepted/rejected |
| created_at | TEXT | yes | 후보 생성 시각 |
| reviewed_at | TEXT | no | 검토 시각 |
| note | TEXT | no | 사용자 메모 |

권장 제약:

- category_type IN ('industry', 'domain', 'position')
- status IN ('pending', 'accepted', 'rejected')

권장 index:

- idx_ai_category_candidates_posting_id_created_at
- idx_ai_category_candidates_run_id
- idx_ai_category_candidates_status

외래키 후보:

- run_id -> ai_recommendation_runs.id
- posting_id -> postings.id

주의:

- accepted가 곧 analysis_results 반영을 의미하지 않는다.
- accepted는 "사용자가 후보로 채택/유효하다고 표시"한 상태다.
- analysis_results 반영은 별도 phase에서 수행한다.

## 6. source_path 정책

지원할 source_path 형식:

- industry_category
- primary_domain_category
- position_category
- review_item_candidates[0]
- review_item_candidates[1]

정책:

- source_path는 저장된 recommendation_json에서 실제로 존재해야 한다.
- review_item_candidates는 원본 배열 index 기준을 사용한다.
- 필터링/정렬 후 index를 사용하지 않는다.
- source_path를 신뢰하지 말고 backend에서 recommendation_json을 기준으로 검증한다.
- eval 사용 금지
- 명시적 파싱 또는 제한된 문자열 매칭만 허용

매핑:

| source_path | category_type |
|---|---|
| industry_category | industry |
| primary_domain_category | domain |
| position_category | position |
| review_item_candidates[n] | item.field_type 기준 industry/domain/position만 허용 |

## 7. 중복 처리 정책

중복 기준:

```text
posting_id + category_type + normalized recommended_value
```

normalized 기준:

- 앞뒤 공백 제거
- 내부 연속 공백 정리 또는 공백 제거 중 구현 단계에서 기존 normalization 기준과 맞춤
- 대소문자 차이는 영문 category 후보에서만 필요 시 정규화 검토

상태별 정책:

### 기존 pending 후보가 있는 경우

- 신규 생성하지 않는다.
- 기존 pending 후보를 유지한다.
- 필요하면 run_id/source_path만 별도 이력으로 추적하는 것은 후속 검토한다.

### 기존 accepted 후보가 있는 경우

- 신규 생성하지 않는다.
- accepted 상태를 유지한다.

### 기존 rejected 후보가 있는 경우

- 기본 정책은 신규 생성하지 않는다.
- rejected 이력을 존중한다.
- 단, 다른 run에서 반복 추천될 경우 "재검토 필요" 표시 여부는 후속 검토한다.

권장 1차 구현:

- 중복이 있으면 신규 생성하지 않고 skipped 처리
- 응답에 skipped_items로 사유를 반환

## 8. 후보 상태 정책

상태값:

| status | 의미 |
|---|---|
| pending | 후보 저장 후 미검토 |
| accepted | 사용자가 유효 후보로 채택 |
| rejected | 사용자가 후보에서 제외 |

정책:

- 최초 저장 시 status=pending
- accepted는 analysis_results 반영과 다르다.
- rejected는 동일 후보 재생성 방지 기준으로 활용할 수 있다.
- reviewed_at은 accepted/rejected 처리 시 갱신한다.
- note는 사용자가 후보 판단 근거를 남기는 용도다.

## 9. analysis_results와의 관계

- category 후보 저장은 analysis_results를 갱신하지 않는다.
- accepted 상태가 되어도 analysis_results를 즉시 갱신하지 않는다.
- analysis_results 반영은 별도 phase에서 정책 확정 후 구현한다.
- 특히 domain은 현재 단일값 구조이므로 대표 도메인/복수 도메인 정책 확정 전에는 반영하지 않는다.
- dashboard 집계도 category 후보 저장만으로 변경하지 않는다.

후속 검토 후보:

- accepted industry candidate -> analysis_results.industry_category 반영
- accepted representative domain -> analysis_results.domain_category 반영
- accepted position candidate -> analysis_results.position_category 반영
- 복수 domain 후보 -> 별도 domain mapping table 또는 JSON 구조 검토

## 10. domain 단일값/복수값 정책

현재 상태:

- analysis_results.domain_category는 단일값
- AI recommendation은 primary_domain_category를 반환
- 장기적으로 복수 domain 후보 저장이 필요할 수 있음

1차 정책:

- primary_domain_category를 category_type=domain 후보로 저장한다.
- review_item_candidates 중 field_type=domain 후보도 저장할 수 있다.
- domain 후보가 여러 개 저장되어도 analysis_results.domain_category는 변경하지 않는다.
- 대표 도메인 확정과 복수 도메인 확정은 후속 phase에서 다룬다.

장기 후보 구조:

- representative_domain: 대표 도메인 1개
- domain_candidates: 후보 N개
- confirmed_domains: 확정 도메인 N개

주의:

- 현재 단계에서 analysis_results.domain_category를 복수값으로 변경하지 않는다.
- dashboard 집계 기준도 변경하지 않는다.

## 11. API 설계 및 구현 상태

backend 1차 구현이 완료되었다.

### 11-1. category 후보 저장

```text
POST /api/ai-recommendations/history/{run_id}/category-candidates
```

역할:

- 저장된 recommendation_json에서 industry/domain/position 후보를 선택 저장
- source_path 검증
- 중복 후보 skipped 처리
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
    },
    {
      "source_path": "position_category",
      "category_type": "position",
      "recommended_value": "서비스 기획"
    }
  ]
}
```

응답 예시:

```json
{
  "data": {
    "created_items": [
      {
        "id": 1,
        "category_type": "domain",
        "recommended_value": "의료 SaaS",
        "status": "pending"
      }
    ],
    "skipped_items": []
  },
  "error": null
}
```

### 11-2. 공고별 category 후보 목록 조회

```text
GET /api/ai-recommendations/postings/{posting_id}/category-candidates
```

Query 후보:

- status=pending|accepted|rejected
- category_type=industry|domain|position
- page=1
- size=10

응답 항목:

- id
- run_id
- posting_id
- category_type
- recommended_value
- confidence
- reason
- status
- created_at
- reviewed_at
- note

### 11-3. category 후보 상세 조회

```text
GET /api/ai-recommendations/category-candidates/{candidate_id}
```

후보:

- 상세가 필요 없으면 1차 구현에서는 생략 가능

### 11-4. category 후보 상태 변경

```text
PATCH /api/ai-recommendations/category-candidates/{candidate_id}
```

요청 예시:

```json
{
  "status": "accepted",
  "note": "헬스케어 도메인 후보로 유효"
}
```

정책:

- status는 pending/accepted/rejected만 허용
- accepted/rejected 처리 시 reviewed_at 갱신
- pending으로 되돌릴 때 reviewed_at은 null로 초기화
- analysis_results는 갱신하지 않음

## 12. 에러 코드 초안

필요한 에러 코드 후보:

| code | 상황 |
|---|---|
| AI_CATEGORY_CANDIDATE_INVALID_REQUEST | 요청 구조/source_path/category_type invalid |
| AI_CATEGORY_CANDIDATE_DUPLICATED | 이미 동일 후보가 있음 |
| AI_CATEGORY_CANDIDATE_NOT_FOUND | 후보 ID 없음 |
| AI_CATEGORY_CANDIDATE_SAVE_FAILED | 저장 중 오류 |
| AI_CATEGORY_CANDIDATE_UPDATE_FAILED | 상태 변경 중 오류 |

주의:

- 중복은 에러로 반환할지 skipped_items로 반환할지 구현 단계에서 최종 결정
- 1차 권장: 저장 API에서는 중복을 skipped_items로 반환

## 13. frontend UI 설계 초안

후속 UI 위치:

- AI 추천 history 상세 화면
- AI 추천 history 비교 화면
- 별도 category 후보 관리 영역

### history 상세/비교 화면

기능:

- industry/domain/position 추천값 옆에 "후보 저장" 체크박스 또는 버튼
- 선택한 category 후보 저장 버튼
- 저장 결과 표시
- 이미 저장된 후보 여부 표시

### category 후보 관리 영역

기능:

- 공고별 category 후보 목록
- category_type 필터
- status 필터
- accepted/rejected 처리
- note 입력
- 기존 analysis_results 값과 후보값 비교

표시 label:

| 내부값 | 화면 표시 |
|---|---|
| industry | 산업 |
| domain | 도메인 |
| position | 직무 |
| pending | 검토 대기 |
| accepted | 후보 채택 |
| rejected | 제외 |
| recommended_value | 추천값 |
| reason | 판단 근거 |

제외:

- analysis_results 즉시 갱신
- dashboard 즉시 반영
- config JSON 직접 수정

## 14. dictionary_candidates와의 관계

- category 후보 저장은 dictionary_candidates 설계와 연결 가능하다.
- 하지만 dictionary_candidates 구조가 아직 없으므로 즉시 통합하지 않는다.
- accepted category 후보는 향후 dictionary_candidates 후보로 승격 가능하다.
- confirmed review_items, accepted category candidates, AI 추천 후보를 장기적으로 하나의 후보 관리 구조로 통합할 수 있다.
- dictionary_candidates 설계 전까지는 category 후보 저장 구조를 독립적으로 유지한다.

## 15. 구현 단계 제안

### Phase CAT-2A — storage 설계 문서 작성

- 현재 문서
- 테이블/API/UI 초안 확정
- analysis_results 즉시 갱신 제외 확정

### Phase CAT-2B — DB schema 구현

- ai_recommendation_category_candidates 테이블 추가 완료
- 기존 DB 보강 로직 추가 완료
- index 추가 완료

### Phase CAT-2C — backend 저장/조회 API 구현

- POST category-candidates 완료
- GET posting category-candidates 완료
- PATCH category-candidates status 완료

### Phase CAT-2D — frontend category 후보 UI 구현

- history 상세/비교 화면에서 후보 저장
- 공고별 후보 목록/필터
- accepted/rejected 처리

### Phase CAT-2E — analysis_results 반영 정책 검토

- accepted 후보를 실제 분석 결과에 반영할지 별도 결정

### Phase CAT-2F — dictionary_candidates 통합 검토

- config 후보 관리 구조와 연결

## 16. 결정 필요 항목

| 항목 | 선택지 | 권장 |
|---|---|---|
| 단기 테이블 | review_items 확장 / 별도 category 후보 테이블 | 별도 category 후보 테이블 |
| 저장 대상 | primary category만 / review_item_candidates 포함 | 둘 다 |
| analysis_results 반영 | 즉시 / 후속 | 후속 |
| domain 구조 | 단일 후보 / 복수 후보 | 복수 후보 저장 가능 |
| 중복 처리 | 에러 / skipped_items | skipped_items |
| rejected 재추천 | 차단 / 재검토 표시 / 허용 | 1차 차단 |
| dashboard 반영 | 즉시 / 후속 | 후속 |
| dictionary_candidates 통합 | 즉시 / 후속 | 후속 |

## 17. 다음 작업 제안

다음 Codex 작업 후보:

- category 후보 frontend UI 구현
- accepted category 후보의 analysis_results 반영 정책 설계
- dictionary_candidates 구조 설계
