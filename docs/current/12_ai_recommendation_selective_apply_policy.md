# AI Recommendation Selective Apply Policy

## 1. 문서 목적

이 문서는 AI 추천 이력에서 사용자가 일부 항목을 선택해 `review_items` 또는 후속 `dictionary_candidates`에 반영하기 위한 정책 문서다.

목적:

- AI 추천 결과를 자동 확정하지 않고 사용자 선택 기반으로 반영한다.
- 기존 classification/review_items 흐름과 충돌을 방지한다.
- 중복 `review_items` 생성을 방지한다.
- 기존 `removed` 이력을 존중한다.
- 어떤 AI 추천 항목이 반영되었는지 추적할 기반을 마련한다.
- `applied_status` / `applied_items_json` 정책을 확정한다.
- 후속 선택 반영 API와 UI 구현 기준을 제공한다.

## 2. 현재 상태

- AI 추천 실행: `POST /api/ai-recommendations/postings/{posting_id}/runs`
- AI 추천 결과 저장: `ai_recommendation_runs`
- history 목록 UI 완료
- history 상세 UI 완료
- history 비교 UI 완료
- `recommendation_json`에는 정규화된 recommendation object 저장
- `applied_status`는 존재하지만 선택 반영 기능은 아직 없음
- `applied_items_json` 컬럼 추가 완료
- `review_items` 자동 반영 없음
- `dictionary_candidates` 연동 없음
- `analysis_results` 자동 갱신 없음
- config 자동 수정 없음

## 3. 선택 반영의 기본 원칙

- AI 추천은 자동 확정하지 않는다.
- AI 추천 항목은 사용자가 명시적으로 선택한 경우에만 반영한다.
- 선택 반영은 AI 추천 이력 전체가 아니라 항목 단위로 처리한다.
- 선택 반영은 1차로 `review_items`에만 반영한다.
- `dictionary_candidates` 연동은 후속 구조 확정 후 검토한다.
- `analysis_results`를 자동 갱신하지 않는다.
- config JSON을 자동 수정하지 않는다.
- industry/domain/position은 1차 선택 반영 대상에서 제외한다.
- 기존 `review_items`와 중복되는 항목은 신규 생성하지 않는다.
- `removed` 상태 또는 `removed` 이력은 되살리지 않는다.
- 선택 반영 결과는 `ai_recommendation_runs.applied_status`와 `applied_items_json`으로 추적한다.

## 4. 1차 반영 대상

1차 선택 반영 대상은 아래로 제한한다.

### 포함 대상

- `recommendation.skills`
- `recommendation.competencies`
- `recommendation.review_item_candidates` 중 `field_type`이 `skill` 또는 `competency`인 항목

### 제외 대상

- `recommendation.industry_category`
- `recommendation.primary_domain_category`
- `recommendation.position_category`
- `review_item_candidates` 중 `field_type`이 `industry`, `domain`, `position`인 항목

industry/domain/position은 별도 category apply policy 문서에서 다룬다.

- category 후보 저장/반영 정책 문서: `docs/current/14_ai_recommendation_category_apply_policy.md`
- 기존 selective apply는 skill/competency 중심으로 유지한다.

## 5. industry/domain/position 제외 이유

industry/domain/position을 초기 반영 대상에서 제외하는 이유:

- 현재 DB는 `analysis_results.domain_category` 단일값 구조다.
- AI 추천이 다른 값을 제안하면 기존 classification 결과를 덮어쓸 위험이 있다.
- `industry_category`, `domain_category`, `position_category`는 공고 분석의 핵심 확정값에 가까워 단순 `review_items` 반영보다 정책 영향이 크다.
- 복수 도메인 구조 도입 후 representative domain / multiple domains 정책과 함께 검토하는 것이 안전하다.
- dashboard 집계와 `analysis_results` 구조에 영향을 줄 수 있으므로 별도 phase에서 다룬다.

정책:

- 1차 선택 반영에서는 industry/domain/position을 저장된 history에서 볼 수만 있다.
- 사용자가 선택해도 `review_items`로 반영하지 않는다.
- 후속 phase에서 복수 도메인 구조와 함께 재검토한다.

## 6. review_items 반영 정책

1차 선택 반영은 `review_items`에만 수행한다.

반영 방식:

- 사용자가 선택한 AI 추천 항목을 `review_items`에 반영한다.
- `field_type`은 `skill` 또는 `competency`만 허용한다.
- `raw_value`는 AI 추천 item의 `value`, `raw_value`, `suggested_value` 중 정책에 맞게 결정한다.
- `approved_value`는 선택 반영 시 함께 설정할 수 있다.
- `status`는 사용자 선택 반영이므로 `confirmed`로 설정하는 방향을 우선 검토한다.

권장 mapping:

### skills / competencies item

```text
field_type = skill 또는 competency
raw_value = item.value
approved_value = item.value
status = confirmed
dictionary_apply = 0
```

### review_item_candidates item

```text
field_type = item.field_type
raw_value = item.raw_value 또는 item.suggested_value
approved_value = item.suggested_value 또는 item.raw_value
status = confirmed
dictionary_apply = 0
```

주의:

- 사용자가 선택한 항목만 반영한다.
- AI 추천 생성만으로 `review_items`를 만들지 않는다.
- AI 추천 생성만으로 기존 `unconfirmed`를 `confirmed`로 바꾸지 않는다.

## 7. 기존 review_items 중복 처리 정책

중복 기준:

```text
posting_id + field_type + normalized raw_value
```

normalized raw value 기준:

- 기존 `removed` 재생성 방지 로직과 동일하게 공백 제거 또는 현재 backend normalization 기준을 따른다.
- 정확한 normalization 함수는 구현 단계에서 소스코드 기준으로 확인한다.

상태별 정책:

### 기존 confirmed 항목이 있는 경우

- 신규 `review_item`을 생성하지 않는다.
- 기존 `confirmed` 항목을 유지한다.
- `applied_items_json`에는 `existing_confirmed_reused` 같은 결과 상태로 기록하는 것을 검토한다.

### 기존 unconfirmed 항목이 있는 경우

- AI 추천만으로 자동 `confirmed` 처리하지 않는다.
- 사용자가 해당 AI 추천 항목을 선택 반영했을 때만 `confirmed`로 갱신한다.
- 신규 `review_item`은 생성하지 않는다.
- 기존 `unconfirmed` 항목의 `approved_value`를 선택값으로 채우고 `status=confirmed`로 갱신하는 방식을 우선 검토한다.
- 이는 "AI 자동 확정 금지" 원칙과 일치한다.

### 기존 removed 항목이 있는 경우

- 신규 `review_item`을 생성하지 않는다.
- `removed` 항목을 자동으로 되살리지 않는다.
- 사용자가 선택했더라도 1차 구현에서는 `removed` 이력을 존중해 반영하지 않는 방향을 우선한다.
- 필요하면 사용자에게 "이 항목은 이전에 제외 처리된 항목"으로 안내하는 UI를 후속 검토한다.
- `applied_items_json`에는 `skipped_removed_history` 같은 결과 상태로 기록하는 것을 검토한다.

### 동일 raw_value가 없고 removed 이력도 없는 경우

- 신규 `review_item`을 생성할 수 있다.
- 사용자가 명시적으로 선택한 항목이므로 `status=confirmed`를 우선 검토한다.

## 8. 자동 확정 금지 원칙과 사용자 선택 반영의 관계

- AI 추천 생성은 자동 확정이 아니다.
- AI 추천 이력 저장도 자동 확정이 아니다.
- 사용자가 특정 항목을 선택 반영하는 행위는 명시적 사용자 결정이다.
- 따라서 사용자가 선택 반영한 항목은 `confirmed`로 갱신하거나 생성할 수 있다.
- 단, `removed` 이력은 별도 사용자 재승인 정책이 없으므로 1차 구현에서는 되살리지 않는다.

## 9. applied_status 정책

`ai_recommendation_runs.applied_status` 상태값을 아래처럼 정의한다.

| applied_status | 의미 |
|---|---|
| `not_applied` | 선택 반영이 한 번도 수행되지 않음 |
| `partially_applied` | 일부 항목이 `review_items`에 반영됨 |
| `applied` | 선택 가능한 주요 항목이 모두 반영되었거나 사용자가 반영 완료로 표시 |

1차 구현 권장:

- 선택 반영 API가 성공하면 기본적으로 `partially_applied`로 갱신한다.
- `applied`는 후속 UI에서 "반영 완료로 표시" 기능이 생긴 뒤 사용한다.
- 선택한 항목 중 일부가 skipped 처리되어도 최소 1개 이상 반영되면 `partially_applied`로 본다.
- 아무 항목도 반영되지 않으면 `not_applied` 유지 또는 별도 결과 메시지 반환을 검토한다.

## 10. applied_items_json 정책

선택 반영 기능 구현 전 DB 보완으로 `applied_items_json` 컬럼을 추가했다.

목적:

- 어떤 AI 추천 항목이 어떤 `review_item`으로 반영되었는지 추적한다.
- skipped/duplicated/removed 등 처리 결과를 기록한다.
- history 상세/비교 UI에서 반영 여부를 표시한다.
- 추후 `applied_status` 계산 근거를 확보한다.

권장 컬럼:

```text
ai_recommendation_runs.applied_items_json TEXT
```

권장 JSON 구조 예:

```json
[
  {
    "source_path": "skills[0]",
    "field_type": "skill",
    "raw_value": "SQL",
    "suggested_value": "SQL",
    "action": "created_review_item",
    "review_item_id": 123,
    "result": "applied"
  },
  {
    "source_path": "competencies[1]",
    "field_type": "competency",
    "raw_value": "협업",
    "suggested_value": "협업",
    "action": "updated_existing_review_item",
    "review_item_id": 124,
    "result": "applied"
  },
  {
    "source_path": "review_item_candidates[0]",
    "field_type": "skill",
    "raw_value": "Slack",
    "suggested_value": "Slack",
    "action": "skipped_removed_history",
    "review_item_id": null,
    "result": "skipped"
  }
]
```

정책:

- 선택 반영 API 구현 전 추적 기반은 마련되었다.
- 실제 write 로직은 backend 선택 반영 API에서 구현되었다.
- 별도 매핑 테이블은 다중 사용자/감사 로그가 필요할 때 후속 검토한다.

## 11. 선택 반영 API 1차 구현 상태

backend 1차 구현을 완료했다.

구현 API:

```text
POST /api/ai-recommendations/history/{run_id}/apply
```

요청 예시:

```json
{
  "items": [
    {
      "source_path": "skills[0]",
      "field_type": "skill",
      "raw_value": "SQL",
      "suggested_value": "SQL"
    },
    {
      "source_path": "competencies[1]",
      "field_type": "competency",
      "raw_value": "요구사항 분석",
      "suggested_value": "요구사항 분석"
    }
  ]
}
```

응답 예시:

```json
{
  "data": {
    "run": {
      "id": 1,
      "applied_status": "partially_applied"
    },
    "applied_items": [
      {
        "source_path": "skills[0]",
        "field_type": "skill",
        "raw_value": "SQL",
        "suggested_value": "SQL",
        "action": "created_review_item",
        "review_item_id": 123,
        "result": "applied"
      }
    ],
    "skipped_items": []
  },
  "error": null
}
```

정책:

- `run_id`가 없으면 `AI_RECOMMENDATION_RUN_NOT_FOUND`
- run의 `recommendation_json`에서 `source_path`가 유효한지 검증
- 요청 item과 저장된 recommendation item이 일치하는지 검증
- 허용 `field_type`은 `skill`/`competency`
- industry/domain/position은 1차 구현에서 거부
- 신규 항목은 `review_items`에 `status=confirmed`, `dictionary_apply=0`으로 생성
- 기존 `unconfirmed` 중복은 `approved_value`를 채우고 `confirmed`로 갱신
- 기존 `confirmed` 중복은 신규 생성하지 않고 reused/skipped 결과로 기록
- `removed` 이력은 1차 구현에서 skipped 처리
- 처리 결과는 `applied_items_json`에 저장
- 최소 1개 이상 applied되면 `applied_status=partially_applied`로 갱신
- frontend 선택 반영 UI는 history 상세/비교 화면에 1차 연결 완료

## 12. frontend 선택 반영 UI 1차 구현 상태

후속 UI로 아래를 검토한다.

위치:

- history 상세 화면
- history 비교 화면

기능:

- skills / competencies / review_item_candidates 항목별 checkbox
- `field_type` 표시
- `raw_value` / `suggested_value` 표시
- "선택 항목 review_items에 반영" 버튼
- `removed` 이력 또는 중복 항목 안내
- 반영 완료/스킵 결과 표시
- `applied_status` badge 갱신

제외:

- industry/domain/position 선택 반영
- config JSON 직접 반영
- `dictionary_candidates` 자동 등록

## 13. dictionary_candidates와의 관계

- 1차 선택 반영은 `review_items`까지만 연결한다.
- `dictionary_candidates` 구조가 아직 확정되지 않았으므로 자동 등록하지 않는다.
- 추후 config 후보 관리 구조가 구현되면, 사용자가 선택한 항목을 `dictionary_candidates`로 보내는 기능을 별도 phase에서 검토한다.
- `review_items` 반영과 `dictionary_candidates` 반영은 분리된 액션으로 설계하는 것이 안전하다.

## 14. 구현 단계 제안

### Phase AI-4A — 선택 반영 정책 문서화

- 현재 문서
- 적용 대상/제외 대상 확정
- 중복/removed/unconfirmed 처리 정책 확정

### Phase AI-4B — DB 스키마 보완

- `applied_items_json` 컬럼 추가 완료
- 필요 시 `applied_at` 검토
- 기존 `ai_recommendation_runs`와 호환 유지

### Phase AI-4C — backend 선택 반영 API 구현

- `POST /api/ai-recommendations/history/{run_id}/apply`
- `source_path` 검증
- `review_items` 생성/갱신
- duplicate/removed 처리
- `applied_status` 갱신
- `applied_items_json` 저장

### Phase AI-4D — frontend 선택 반영 UI 구현

- history 상세/비교 화면에서 항목 선택
- 선택 항목 반영 버튼
- 반영 결과 표시
- `applied_status` 갱신 반영

### Phase AI-4E — dictionary_candidates 연동 검토

- config 후보 관리 구조 확정 후 진행

## 15. 결정 필요 항목

| 항목 | 선택지 | 권장 |
|---|---|---|
| 1차 반영 위치 | `review_items` / `dictionary_candidates` / 둘 다 | `review_items` |
| 1차 반영 field_type | `skill`/`competency`만 / 전체 | `skill`/`competency`만 |
| industry/domain/position | 포함 / 제외 | 제외 |
| 기존 confirmed 중복 | 신규 생성 / 기존 유지 | 기존 유지 |
| 기존 unconfirmed 중복 | 자동 confirmed / 선택 시 confirmed | 선택 시 confirmed |
| 기존 removed 중복 | 되살림 / 제외 유지 | 제외 유지 |
| 신규 항목 status | `unconfirmed` / `confirmed` | `confirmed` |
| `applied_items_json` | 추가 / 미추가 | 추가 완료 |
| `dictionary_candidates` | 즉시 연동 / 후속 | 후속 |

## 16. 다음 작업 제안

다음 Codex 작업 후보:

- 선택 반영 backend API 구현
- 선택 반영 frontend UI 구현
- `dictionary_candidates` 구조 설계
## Frontend Selective Apply UI 1차 구현 상태

- frontend history 상세/비교 화면에서 선택 반영 UI를 1차 구현했다.
- 상세 화면에서는 저장된 run의 skill/competency 항목을 선택해 apply API를 호출한다.
- 비교 화면에서는 run별 선택 상태를 분리하고, 한 번에 한 run 기준으로 apply API를 호출한다.
- `source_path`는 `skills[0]`, `competencies[1]`, `review_item_candidates[2]`처럼 저장된 recommendation 원본 배열 index를 기준으로 생성한다.
- `review_item_candidates` 중 skill/competency만 선택 가능하며, 필터링 후 렌더링 index를 `source_path`로 사용하지 않는다.
- apply 성공 후 history 목록을 refresh하고 현재 상세 run은 상세 API로 재조회한다.
- backend 응답의 `applied_status`만 로컬 상세/비교 state에 덮어쓰는 방식은 사용하지 않는다.
- apply 결과의 `applied_items`와 `skipped_items`를 화면에 표시한다.
- AI 추천 화면의 주요 label/컬럼명은 한글로 정리했다.
- backend 선택 반영 정책은 유지하며, `dictionary_candidates` 연동은 후속 단계로 둔다.
## Phase AI-4 선택 반영 1차 완료 상태

- 선택 반영 backend/frontend 1차 구현이 완료되었다.
- 사용자 로컬에서 선택 반영 정상 작동을 확인했다.
- 선택 항목의 `review_items` 반영을 확인했다.
- 선택 반영 결과는 `applied_items`/`skipped_items`로 표시한다.
- `applied_items_json`에는 선택 반영 처리 결과를 기록한다.

정책상 남은 후속:

- `applied_items_json` 기반 항목별 반영 상태 표시 고도화
- `dictionary_candidates` 연동
- removed 항목 재승인 정책
- `applied_status`를 `applied`로 전환하는 명시적 완료 처리
