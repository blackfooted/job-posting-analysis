# Postings Feature Spec

## 목적

postings 기능은 채용공고를 저장하고, 저장 또는 수정 시 규칙 기반 분석을 다시 수행하며, 공고 원문과 분석 결과를 함께 조회할 수 있게 한다.

## API

`backend/app/postings.py`에서 확인한 현재 구현:

- `POST /api/postings`
- `GET /api/postings`
- `GET /api/postings/{posting_id}`
- `PUT /api/postings/{posting_id}`
- `DELETE /api/postings/{posting_id}`
- `GET /api/postings/{posting_id}/analysis`

## 입력 필드

### 필수 필드

`REQUIRED_POSTING_FIELDS`에서 확인한 현재 구현:

- `company`
- `position`
- `duties`
- `requirements`
- `raw_text`

### 선택 필드

`POSTING_FIELDS`와 프런트 form에서 확인한 현재 구현:

- `preferred`
- `tools`
- `experience`
- `employment_type`
- `work_type`
- `industry_memo`

## validation 정책

소스코드에서 확인한 현재 구현:

- backend는 필수 필드가 없거나 `strip()` 이후 빈 문자열이면 오류를 반환한다.
- 선택 필드는 빈 문자열 저장을 허용한다.
- DB 스키마는 posting 텍스트 필드를 모두 `TEXT NOT NULL`로 유지한다.
- frontend는 필수 5개 필드만 검증하고, 선택 필드는 `(선택)`으로 표시한다.

## 생성 및 수정 동작

소스코드에서 확인한 현재 구현:

- `POST`는 공고를 저장한 뒤 classification을 실행하고, `analysis_results` 저장 및 `review_items` 재생성을 수행한다.
- `PUT`는 `PostingInput` 전체 필드 구조를 요구한다.
- `PUT`는 공고를 수정한 뒤 classification을 다시 실행하고, `analysis_results`를 덮어쓰며, 기존 `review_items`를 삭제한 뒤 새로 삽입한다.

## 현재 주의할 점

`backend/app/postings.py`에서 확인한 현재 구현:

- 공고 수정 시 해당 공고의 기존 review_items는 모두 삭제되고, 새 classification 결과로 다시 생성된다.

## 삭제 정책

소스코드에서 확인한 현재 구현:

- `DELETE`는 hard delete가 아니다.
- `postings.is_deleted = 1`로 soft delete 처리한다.
- 삭제된 공고는 postings 목록, review_items 조인 조회, dashboard 집계에서 제외된다.

## 분석 결과 응답 구조

`GET /api/postings/{posting_id}/analysis`에서 확인한 현재 구현:

- `posting_id`
- `industry_category`
- `domain_category`
- `position_category`
- `extracted_skills`
- `extracted_competencies`
- `unconfirmed_count`
- `analyzed_at`

analysis row가 없으면 카테고리는 `null`, 배열은 빈 배열, `unconfirmed_count`는 `0`, `analyzed_at`은 `null`을 반환한다.

## 후속 계획

- 공고 재분석 시 기존 확정 review 결과를 어떻게 보존할지 정책 정리
- 단일 `domain_category`를 넘는 복수 도메인 구조 추가
- 공고 저장 시 자동 호출이 아닌, 상세 화면 기준 사용자 트리거형 AI recommendation 연동
