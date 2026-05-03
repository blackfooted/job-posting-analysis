# Product Overview

## 서비스 요약

이 프로젝트는 채용공고를 저장하고, 공고별로 규칙 기반 classification을 수행하며, 확정이 어려운 값을 `review_items`로 분리하고, 누적 결과를 `dashboard`에서 확인하는 구조의 분석 도구다.

## 제품 목표

MVP 기준 목표는 1명의 운영자가 채용공고를 누적 저장하면서 다음 질문에 답할 수 있게 만드는 것이다.

- 어떤 산업과 도메인이 반복적으로 등장하는가
- 어떤 직무 카테고리가 많이 나타나는가
- 어떤 skill과 competency가 반복되는가
- 어떤 추출값이 아직 수기 검토가 필요한가

## 현재 사용자 모델

현재 구현은 단일 로컬 운영자를 전제로 한다.

- 공고 입력/수정
- `review_items` 정제
- `dashboard` 확인

현재 코드 기준으로 로그인, 사용자 분리, 권한 모델은 없다.

## 현재 구현 범위

소스코드에서 확인한 현재 구현:

- postings 생성/목록/상세/수정/삭제 API
- 개별 공고 분석 결과 API
- JSON config 기반 규칙형 classification
- `review_items` 목록, 필터, pagination
- `review_items` 수정, 확정, 제외 처리
- `review_items` 선택 항목 일괄 저장
- 정제 대상 제외 처리(`status=removed`)
- `dashboard` summary/charts/comparison API
- React 단일 화면 구조와 `dashboard`, `postings`, `reviewItems`, `aiRecommendations` 화면 전환

## 데이터 정제 워크플로우

현재 서비스의 핵심 흐름은 다음과 같다.

1. 사용자가 공고를 입력한다.
2. `POST /api/postings` 또는 `PUT /api/postings/{posting_id}`가 호출된다.
3. backend에서 classification이 자동 실행된다.
4. `analysis_results`에 자동 분석 결과가 저장된다.
   - `industry_category`
   - `domain_category`
   - `position_category`
   - `extracted_skills`
   - `extracted_competencies`
   - `unconfirmed_count`
5. 자동 확정이 어려운 후보는 `review_items`에 `unconfirmed` 상태로 생성된다.
6. 사용자는 데이터 정제 관리 화면에서 `review_items`를 검토한다.
7. 의미 있는 후보는 대표값을 입력하고 `confirmed`로 저장한다.
8. 불필요한 후보는 `removed`로 제외한다.
9. `review_items` 저장 후 `analysis_results.unconfirmed_count`가 동기화된다.
10. `dashboard`는 postings, `analysis_results`, `review_items` 기준으로 집계된다.

주의:

- 현재 `dictionary_apply`는 config 파일 자동 수정이 아니라 동일 `field_type + normalized raw_value` `review_items` 일괄 확정 기능이다.
- confirmed/removed 이력을 향후 classification에 재사용하는 기능은 후속 계획이다.

## 현재 제외 범위

확인한 소스코드 기준 미구현 항목:

- 로그인/회원가입
- 다중 사용자
- export
- 사전관리 전용 UI
- AI 추천 자동 실행
- 자동 최종 카테고리 확정
- 공고 1건당 복수 도메인 저장

## AI 사용 원칙

후속 AI 개발 시 기준으로 삼을 정책:

- AI는 자동 확정자가 아니라 추천 도구다.
- AI는 사용자가 명시적으로 실행할 때만 호출한다.
- 공고 저장 시 자동으로 AI를 호출하지 않는다.
- 1차 AI 개발은 DB 저장이 없는 조회형 추천 API부터 시작한다.
