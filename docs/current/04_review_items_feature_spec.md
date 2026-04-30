# Review Items Feature Spec

## 목적

`review_items`는 현재 규칙 기반 classification이 확정하지 못한 값을 수기 검토 대상으로 분리해 관리하는 기능이다.

## API

`backend/app/review_items.py`에서 확인한 현재 구현:

- `GET /api/review-items`
- `PUT /api/review-items/{review_item_id}`

## status 정책

`REVIEW_ITEM_STATUSES`에서 확인한 현재 구현:

- `unconfirmed`
- `confirmed`
- `removed`

## `removed`의 의미

소스코드에서 확인한 현재 구현:

- `removed`는 hard delete가 아니다.
- 활성 정제 대상에서 제외된 상태를 의미한다.
- `unconfirmed_count` 계산에서도 제외된다.
- 기본 목록 조회에서는 제외된다.
- `status=removed`를 명시하면 조회할 수 있다.

## 목록 필터

목록 API에서 확인한 현재 구현:

- `page`
- `size`
- `status`
- `field_type`
- `dictionary_apply`
- `keyword`

허용 `field_type`:

- `industry`
- `domain`
- `position`
- `skill`
- `competency`

현재 동작:

- `status` 미지정 시 `removed`를 제외하고 조회한다.
- `dictionary_apply`는 `0` 또는 `1`만 허용한다.
- `keyword`는 `raw_value` 또는 `approved_value`를 검색한다.
- soft delete된 posting에 연결된 row는 조회하지 않는다.

## 수정 정책

업데이트 API에서 확인한 현재 구현:

- 요청 필드가 모두 optional이므로 부분 수정이 가능하다.
- 기존 값을 먼저 조회한 뒤, 전달된 필드만 덮어쓴다.
- `status=removed`이면 `dictionary_apply = 0`으로 강제한다.
- `dictionary_apply`는 `0` 또는 `1`만 허용한다.

## 현재 `dictionary_apply` 의미

`_apply_dictionary_to_matching_review_items`에서 확인한 현재 구현:

- JSON config 파일을 수정하지 않는다.
- 현재 row를 저장한 뒤,
- `dictionary_apply = 1`이고 `status=confirmed`이며 `approved_value`가 비어 있지 않으면,
- 같은 `field_type`과 같은 정규화 `raw_value`를 가진 다른 `unconfirmed` row를 찾아 일괄 확정한다.
- 현재 정규화는 공백 제거 기준이다.
- 매칭된 row는 `approved_value`, `status='confirmed'`, `dictionary_apply=1`로 업데이트된다.

## `removed` 이력의 목적과 후속 활용

현재 `removed`는 정제 대상에서 제외한다는 의미다.
hard delete가 아니므로, 불필요하거나 잘못 추출된 후보를 추적 가능한 상태로 남길 수 있다.

현재 구현:

- `status=removed` 저장 가능
- 기본 목록에서 removed 제외
- `status=removed` 필터로 조회 가능
- removed 항목은 `unconfirmed_count`에서 제외
- removed 저장 시 `dictionary_apply=0`으로 강제

후속 계획:

- removed 이력을 classification 단계에서 참고한다.
- 동일 `field_type + normalized raw_value` 후보가 다시 생성되면 `review_items`에 재생성하지 않는 방향을 검토한다.

예:

1. 사용자가 `경험한 우대합니다. 분석`을 removed 처리한다.
2. 다음 공고에서 동일 후보가 다시 추출된다.
3. 후속 PHASE C에서는 해당 후보를 `review_items`에 생성하지 않도록 한다.

주의:

- 유사 표현 제외는 후속 고도화 범위다.
- 초기 PHASE C는 동일 표현 제외만 대상으로 한다.
- 의미 있는 후보를 실수로 제거하면 다음 분석에서 누락될 수 있으므로, removed 처리는 신중하게 사용한다.

## unconfirmed_count 동기화

`_sync_analysis_unconfirmed_count`에서 확인한 현재 구현:

- review_item 수정 후 영향받은 posting의 `analysis_results.unconfirmed_count`를 다시 계산한다.
- 집계 대상은 `status='unconfirmed'` row만이다.

## frontend 일괄 저장 동작

`frontend/src/App.jsx`에서 확인한 현재 구현:

- 별도의 backend bulk API는 없다.
- frontend의 일괄 저장/제외는 기존 `PUT /api/review-items/{id}`를 여러 번 호출하는 방식으로 처리한다.

## 후속 계획

- `removed` 이력 기반 동일 후보 재생성 방지
- 확정 review 이력을 향후 classification에 반영할지 정책 결정
- 필요 시 removed 항목 복구 흐름 추가
- 향후 config 반영 도구와 `dictionary_apply` 의미를 분리할지 검토
