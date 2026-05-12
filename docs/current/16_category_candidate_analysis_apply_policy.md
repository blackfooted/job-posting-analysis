# Category Candidate Analysis Result Apply Policy

## Apply UI/UX 개선 상태

- 분석 결과 반영 UI에서 accepted 후보와 `applied_to_analysis` 반영 완료 상태의 구분을 유지한다.
- 판단 근거는 기본 접힘 상태로 표시해 후보 목록의 세로 길이를 줄였다.
- 반영 시각 등 날짜/시각은 `YYYY-MM-DD HH:MM:SS` 형식으로 통일한다.
- 반영 결과 메시지는 action, 이전 값, 새 값, 반영 필드를 간결하게 확인할 수 있도록 유지한다.

## Frontend Implementation Status

- `ai_recommendation_category_candidates`에 `analysis_results` 반영 추적을 위한 DB 컬럼이 schema 단계에서 추가되었다.
- 추가 컬럼은 `applied_to_analysis`, `applied_at`, `previous_analysis_value`, `applied_analysis_field`다.
- `POST /api/ai-recommendations/category-candidates/{candidate_id}/apply-analysis` backend API가 1차 구현되었다.
- frontend apply-analysis UI가 1차 연결되었다.
- `accepted` 후보만 `analysis_results`에 반영할 수 있다.
- accepted 후보 목록에서 사용자가 명시적으로 “분석 결과로 반영”을 실행할 수 있다.
- 기존 분석 결과 값과 후보값이 다르면 confirm 후 `confirm_overwrite=true`를 사용한다.
- 반영 성공 시 `applied_to_analysis`, `applied_at`, `previous_analysis_value`, `applied_analysis_field`를 기록한다.
- 반영 성공 후 category 후보 목록과 현재 공고의 analysis 결과를 refresh한다.
- 1차 구현에서 `analyzed_at`을 갱신하지 않는 정책은 유지한다.

## Category Candidate Analysis Apply 검증 결과

| 항목 | 결과 | 메모 |
|---|---|---|
| accepted 후보만 반영 가능 | pass | 신규 공고 기준 정상 작동 확인 |
| pending/rejected 후보 반영 불가 | pass | 신규 공고 기준 정상 작동 확인 |
| confirm_overwrite 처리 | pass | 기존 값과 후보값이 다른 경우 confirm 흐름 정상 |
| analysis_results 컬럼 반영 | pass | 후보 category_type에 맞는 분석 결과 반영 확인 |
| applied_to_analysis 기록 | pass | 반영 완료 상태 확인 |
| applied_at 기록 | pass | 반영 시각 기록 확인 |
| previous_analysis_value 기록 | pass | 기존 분석값 기록 확인 |
| applied_analysis_field 기록 | pass | 반영 필드 기록 확인 |
| analyzed_at 미갱신 | pass | 분석 결과 반영 후에도 analyzed_at 정책 유지 |
| dashboard 영향 확인 | pass | side-effect 검증에서 dashboard 영향 정책 정상 확인 |

종합 판단:

```text
pass
```

신규 공고 기준 사용자 로컬 검증에서 category 후보 상태 변경, accepted 후보의 “분석 결과로 반영”, `analysis_results` 반영, frontend 화면 반영 흐름이 정상 작동함을 확인했다.
기능 흐름과 side-effect 검증 모두 pass.

## Category Candidate Analysis Apply Side-effect 검증 결과

| 항목 | 결과 | 메모 |
|---|---|---|
| analyzed_at 미갱신 | pass | 분석 결과 반영 후에도 analyzed_at 정책 유지 |
| category 후보 저장만으로 dashboard 영향 없음 | pass | 후보 저장은 dashboard에 영향 없음 |
| accepted 상태만으로 dashboard 영향 없음 | pass | 후보 채택만으로 dashboard에 영향 없음 |
| analysis_results 반영 후 dashboard 영향 | pass | analysis_results 반영 후 dashboard에 영향 가능 |
| 종합 판단 | pass | 기능 검증 완료 |

사용자 로컬 side-effect 검증에서 `analyzed_at` 미갱신 정책과 dashboard 영향 정책이 pass로 확인되었다.

## 1. 문서 목적

이 문서는 `accepted` 상태의 AI recommendation category 후보를 실제 `analysis_results`에 반영하는 정책을 정의한다.

목적:

- 후보 채택과 분석 결과 반영의 책임 분리
- 사용자의 명시적 반영 액션 기준 정의
- 기존 classification 결과와 AI 후보의 충돌 처리
- industry/domain/position 반영 정책 정의
- domain 단일값/복수값 정책 범위 정의
- dashboard 집계 영향 관리
- 반영 이력/되돌리기 정책 검토
- 후속 backend API와 frontend UI 구현 기준 제공

## 2. 현재 상태

- `analysis_results`는 현재 공고별 자동 classification 결과를 저장한다.
- 주요 컬럼은 `industry_category`, `domain_category`, `position_category`, `extracted_skills`, `extracted_competencies`, `unconfirmed_count`, `analyzed_at`이다.
- AI category 후보는 `ai_recommendation_category_candidates`에 별도 저장된다.
- category 후보 상태는 `pending`, `accepted`, `rejected`다.
- `accepted`는 후보 채택일 뿐 `analysis_results` 반영이 아니다.
- 현재 dashboard는 `analysis_results` 기준으로 동작한다.
- config JSON은 자동 수정하지 않는다.
- `dictionary_candidates` 구조는 아직 미구현이다.

## 3. 문제 정의

- 사용자가 category 후보를 `accepted`로 바꿔도 실제 분석 결과에는 반영되지 않는다.
- 후보 채택 상태와 최종 분석 결과 사이에 한 단계가 더 필요하다.
- 기존 classification 결과와 AI category 후보가 다를 수 있다.
- `analysis_results.domain_category`는 단일값 구조이므로 복수 domain 후보를 그대로 반영할 수 없다.
- dashboard 집계는 `analysis_results`를 기준으로 하므로 반영 시 집계가 달라진다.
- 되돌리기/이력 추적 없이 덮어쓰면 이전 classification 결과를 잃을 수 있다.

## 4. 기본 원칙

- category 후보는 자동으로 `analysis_results`에 반영하지 않는다.
- `accepted` 상태만으로는 `analysis_results`를 갱신하지 않는다.
- 사용자가 별도 “분석 결과로 반영” 액션을 실행해야 한다.
- 반영은 `category_type`별로 명시적으로 수행한다.
- `analysis_results` 반영 전 기존 값과 후보 값을 비교해서 보여줘야 한다.
- config JSON은 수정하지 않는다.
- `dictionary_candidates` 연동은 후속이다.
- dashboard 집계는 `analysis_results` 반영 이후에만 바뀐다.
- 반영 이력 또는 최소한 반영 시각/출처를 남기는 방식을 검토한다.

## 5. accepted와 applied의 의미 분리

| 용어 | 의미 |
|---|---|
| pending | category 후보가 저장됐지만 아직 검토되지 않음 |
| accepted | 사용자가 후보가 유효하다고 채택함 |
| rejected | 사용자가 후보에서 제외함 |
| applied_to_analysis | 사용자가 후보를 실제 `analysis_results`에 반영함 |

정책:

- `accepted`는 후보 채택 상태다.
- `applied_to_analysis`는 실제 분석 결과 반영 상태다.
- 1차 schema에는 `applied_to_analysis` 상태 컬럼이 추가되었다.
- 여러 번 반영/되돌리기 이력까지 추적해야 한다면, 별도 반영 이력 테이블 또는 note 기록 방식 보완을 검토한다.

## 6. analysis_results 반영 대상

1차 반영 대상은 아래로 제한한다.

| category_type | 반영 컬럼 |
|---|---|
| industry | `analysis_results.industry_category` |
| domain | `analysis_results.domain_category` |
| position | `analysis_results.position_category` |

주의:

- `extracted_skills`, `extracted_competencies`, `unconfirmed_count`는 이 기능에서 수정하지 않는다.
- skills/competencies는 기존 review_items 선택 반영 기능이 담당한다.
- category 후보 반영은 산업/도메인/직무 대표값만 다룬다.

## 7. 1차 반영 정책

### 7-1. 자동 반영 금지

- 후보가 `accepted`가 되어도 자동 반영하지 않는다.
- 사용자가 별도 버튼을 눌러야 한다.
- 버튼 예: “분석 결과로 반영”

### 7-2. 단일 후보 반영

- 한 번에 하나의 category 후보만 `analysis_results`의 해당 컬럼에 반영한다.
- 예: `category_type=domain` 후보 1개를 `analysis_results.domain_category`에 반영한다.
- 여러 후보를 한 번에 반영하는 bulk 기능은 후속이다.

### 7-3. accepted 후보 우선

- 1차 구현에서는 `accepted` 상태 후보만 반영 가능하게 한다.
- `pending` 후보는 먼저 `accepted`로 변경해야 한다.
- `rejected` 후보는 반영할 수 없다.

### 7-4. 기존 값 덮어쓰기

- 반영 시 기존 `analysis_results` 값을 새 후보값으로 덮어쓴다.
- 덮어쓰기 전 UI에서 기존 값과 후보값을 표시해야 한다.
- 덮어쓰기 이력 추적이 필요하다.

### 7-5. analyzed_at 처리

선택지 A:

```text
analyzed_at을 갱신하지 않음
```

장점:

- 자동 classification 실행 시각과 사용자 수동 반영을 구분 가능

단점:

- 결과 변경 시각을 알기 어려움

선택지 B:

```text
analyzed_at을 현재 시각으로 갱신
```

장점:

- 분석 결과가 변경된 시각을 알 수 있음

단점:

- 자동 분석 시각과 수동 반영 시각이 섞임

권장:

- 1차 구현에서는 `analyzed_at`을 갱신하지 않는다.
- 수동 반영 시각은 별도 이력 또는 후보 테이블의 `applied_at`으로 추적한다.

## 8. 반영 이력/상태 추적 정책

현재 `ai_recommendation_category_candidates`에는 아래 컬럼이 있다.

- `status`
- `reviewed_at`
- `note`

반영 추적을 위해 schema 단계에서 추가된 컬럼:

- `applied_to_analysis`
- `applied_at`
- `previous_analysis_value`
- `applied_analysis_field`

정책:

- `analysis_results` 반영 기능을 구현하기 전에 필요한 1차 DB 보완은 완료되었다.
- 최소 후보 컬럼은 `applied_at`, `applied_to_analysis`, `previous_analysis_value`다.
- 또는 별도 이력 테이블 `ai_recommendation_category_candidate_applications`를 검토한다.

### 선택지 A. 후보 테이블 컬럼 추가

장점:

- 구현 단순
- 후보별 반영 여부 확인 쉬움

단점:

- 여러 번 반영/되돌리기 이력 추적이 약함

### 선택지 B. 별도 이력 테이블 추가

장점:

- 이전 값/새 값/반영 시각/되돌리기 추적 가능
- 장기 운영에 유리

단점:

- 설계/구현 비용 증가

권장:

- MVP 1차는 후보 테이블 컬럼 추가 방식으로 구현되었다.
- 장기적으로는 별도 이력 테이블을 검토한다.

## 9. domain 단일값/복수값 정책

현재 `analysis_results.domain_category`는 단일값이다.

1차 정책:

- domain 후보를 반영할 때는 대표 도메인 1개만 `analysis_results.domain_category`에 반영한다.
- 여러 domain 후보가 `accepted`되어 있어도 사용자가 명시적으로 선택한 1개만 반영한다.
- 복수 domain 확정은 후속 phase로 분리한다.
- dashboard 집계도 1차에서는 대표 domain 기준으로 유지한다.

후속 후보:

- `representative_domain = analysis_results.domain_category`
- `confirmed_domains = 별도 mapping table 또는 JSON`

주의:

- 지금 단계에서 `analysis_results.domain_category`를 JSON 배열이나 복수값 문자열로 바꾸지 않는다.
- dashboard 집계 기준도 변경하지 않는다.

## 10. 충돌 처리 정책

### 기존 analysis_results 값이 null인 경우

- 후보값을 반영할 수 있다.
- 이전 값은 `null`로 기록한다.

### 기존 analysis_results 값이 있는 경우

- 후보값과 다르면 덮어쓰기 경고를 표시해야 한다.
- 사용자가 명시적으로 확인해야 한다.
- 이전 값을 반영 이력에 기록한다.

### 동일 값인 경우

- 실제 update를 생략하거나 no-op 처리할 수 있다.
- 후보 상태는 이미 `accepted`라면 유지한다.
- 응답에는 “이미 동일 값”으로 표시한다.

### 여러 accepted 후보가 있는 경우

- 자동 선택하지 않는다.
- 사용자가 반영할 후보 1개를 직접 선택한다.

## 11. API 설계 초안

이번 문서에서는 구현하지 않고 API 초안만 정의한다.

### 11-1. category 후보를 analysis_results에 반영

```text
POST /api/ai-recommendations/category-candidates/{candidate_id}/apply-analysis
```

역할:

- `accepted` category 후보 1개를 `analysis_results` 해당 컬럼에 반영
- 기존 값과 후보값 비교
- previous value 기록
- `analysis_results` 갱신
- candidate에 applied 상태 기록

요청 body 후보:

```json
{
  "confirm_overwrite": true
}
```

정책:

- `accepted` 후보만 반영 가능
- `rejected`/`pending` 후보는 400
- 기존 값과 다르면 `confirm_overwrite=true` 필요
- 동일 값이면 no-op 가능
- `analysis_results` row가 없으면 생성할지 error로 둘지 정책 필요

권장:

- `analysis_results` row가 없으면 error 처리한다.
- 공고 분석 결과가 먼저 존재해야 한다.

응답 예시:

```json
{
  "data": {
    "candidate": {
      "id": 1,
      "category_type": "domain",
      "recommended_value": "헬스케어",
      "applied_to_analysis": true,
      "applied_at": "2026-05-11T10:00:00+09:00"
    },
    "analysis_result": {
      "posting_id": 14,
      "field": "domain_category",
      "previous_value": "의료",
      "new_value": "헬스케어"
    }
  },
  "error": null
}
```

## 12. 에러 코드 초안

| code | 상황 |
|---|---|
| AI_CATEGORY_CANDIDATE_NOT_FOUND | 후보 없음 |
| AI_CATEGORY_CANDIDATE_NOT_ACCEPTED | accepted 상태가 아닌 후보를 반영하려 함 |
| ANALYSIS_RESULT_NOT_FOUND | 대상 공고의 analysis_results 없음 |
| ANALYSIS_RESULT_OVERWRITE_CONFIRM_REQUIRED | 기존 값과 달라 confirm_overwrite 필요 |
| CATEGORY_CANDIDATE_ANALYSIS_APPLY_FAILED | DB 반영 실패 |

## 13. Frontend UI 초안

후속 UI는 category 후보 목록에서 제공한다.

후보 목록 row 표시:

- 현재 상태
- 추천값
- 현재 `analysis_results` 값
- 반영 여부
- 반영 시각

액션:

- “분석 결과로 반영” 버튼
- 기존 값과 다르면 confirm modal 또는 confirm checkbox
- `accepted` 상태인 후보만 버튼 활성화
- `pending`/`rejected`는 비활성화

주의 문구:

```text
후보 채택은 분석 결과 반영이 아닙니다. 분석 결과로 반영하면 dashboard 집계에 영향을 줄 수 있습니다.
```

## 14. Dashboard 영향 정책

- category 후보 저장/`accepted` 상태는 dashboard에 영향을 주지 않는다.
- `analysis_results`에 반영된 뒤에만 dashboard 집계에 영향을 준다.
- dashboard는 현재 `analysis_results` 기준으로 유지한다.
- 복수 domain 구조가 도입되기 전까지 dashboard domain 집계는 대표 domain 1개 기준으로 유지한다.

## 15. 구현 단계 제안

### Phase CAT-3A — analysis apply policy 문서화

- 현재 문서
- `accepted` 후보와 `analysis_results` 반영 책임 분리
- 단일 후보 반영 정책 확정
- domain 단일값 정책 확정
- 이력 추적 DB 보완 필요성 정리

### Phase CAT-3B — DB schema 보완

- 후보 테이블에 applied 관련 컬럼 추가 검토
- `applied_to_analysis`
- `applied_at`
- `previous_analysis_value`
- 또는 별도 application history table 검토

### Phase CAT-3C — backend analysis apply API 구현

- `POST /category-candidates/{candidate_id}/apply-analysis`
- `accepted` 후보만 허용
- overwrite confirm 처리
- `analysis_results` 갱신
- applied state 기록

### Phase CAT-3D — frontend analysis apply UI 구현

- 후보 목록에서 분석 결과로 반영 버튼
- 기존 값/후보값 비교
- overwrite confirm
- 반영 결과 표시

### Phase CAT-3E — dashboard 영향 검증

- `analysis_results` 반영 후 dashboard 집계 확인

## 16. 결정 필요 항목

| 항목 | 선택지 | 권장 |
|---|---|---|
| 반영 트리거 | accepted 자동 / 별도 apply 액션 | 별도 apply 액션 |
| 반영 가능 상태 | pending 포함 / accepted만 | accepted만 |
| 반영 단위 | category_type별 1개 / bulk | 1개 |
| domain 반영 | 대표 domain 1개 / 복수 domain | 대표 domain 1개 |
| analyzed_at | 갱신 / 미갱신 | 미갱신 |
| 이력 추적 | 후보 테이블 컬럼 / 별도 이력 테이블 | 1차 컬럼, 장기 이력 테이블 |
| 기존 값 덮어쓰기 | 자동 / confirm 필요 | confirm 필요 |
| dashboard 반영 | 후보 저장 시 / accepted 시 / analysis_results 반영 시 | analysis_results 반영 시 |

## 17. 다음 작업 제안

다음 Codex 작업 후보:

- category candidate analysis apply DB 보완
- category candidate analysis apply backend API 구현
- category candidate analysis apply frontend UI 구현
- dashboard 영향 검증
- 복수 domain 구조 설계
