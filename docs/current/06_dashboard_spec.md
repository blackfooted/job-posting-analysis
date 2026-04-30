# Dashboard Spec

## 목적

dashboard는 저장된 공고 데이터를 기준으로 개수 요약과 간단한 분포 정보를 보여주는 기능이다.

## API

`backend/app/dashboard.py`에서 확인한 현재 구현:

- `GET /api/dashboard/summary`
- `GET /api/dashboard/charts`
- `GET /api/dashboard/comparison`

## summary endpoint

소스코드에서 확인한 현재 구현:

- `total_postings`
- `total_industry_categories`
- `total_domain_categories`
- `total_position_categories`
- `total_unconfirmed_items`

현재 집계 규칙:

- soft delete된 posting은 제외한다.
- distinct category count는 `NULL`과 빈 문자열을 제외한다.
- `total_unconfirmed_items`는 `status='unconfirmed'` review item만 집계한다.

## charts endpoint

소스코드에서 확인한 현재 구현:

- `industry_distribution`
- `position_distribution`
- `top_competencies`
- `top_skills`

현재 제한:

- charts endpoint에는 domain distribution이 없다.

## comparison endpoint

소스코드에서 확인한 현재 구현:

- soft delete되지 않은 posting당 1행을 반환한다.
- 포함 필드:
  - `company`
  - `position`
  - `industry_category`
  - `domain_category`
  - `position_category`
  - `extracted_skills`
  - `extracted_competencies`
  - `unconfirmed_count`

## frontend dashboard 상태

`frontend/src/App.jsx`에서 확인한 현재 구현:

- 기본 진입 페이지는 `activePage = 'dashboard'`다.
- summary, charts, comparison 데이터를 각각 별도로 로드한다.
- 차트 라이브러리 기반 시각화가 아니라 목록/표 기반 렌더링이다.

## 현재 한계

소스코드에서 확인한 현재 구현:

- domain은 summary distinct count와 comparison row에는 포함되지만, charts 분포 출력에는 없다.
- 집계는 단일값 `analysis_results.domain_category` 구조를 전제로 한다.
- 기간 필터는 없다.
- 고급 차트 라이브러리 연동은 없다.

## 후속 계획

- domain distribution 추가
- 복수 도메인 구조 도입 후 전체 도메인 기준 집계 지원
- 대표 도메인 / 전체 도메인 집계 전환 방식 검토
- 더 풍부한 시각화와 교차 분석 추가
