# AI Recommendation Spec

## 현재 상태

확인한 소스코드 기준 현재 구현:

- backend AI recommendation API는 아직 없다.
- `backend/app/main.py`에 AI router가 없다.
- `frontend/src/App.jsx`에는 `aiRecommendations` 메뉴가 있지만, 현재 페이지는 placeholder만 있다.

## 제품 원칙

후속 AI 개발 시 사용할 현재 정책 기준:

- AI는 자동 확정하지 않는다.
- AI는 사용자가 버튼을 눌렀을 때만 호출한다.
- 공고 저장 시 자동으로 AI를 호출하지 않는다.
- 1차 개발은 조회형 recommendation API부터 시작한다.
- DB 저장은 후속 단계로 둔다.

## 1차 개발 권장 범위

후속 계획:

- backend recommendation 조회 API 1개 추가
- `posting_id`로 저장된 공고 조회
- 공고 본문을 AI에 전달
- recommendation JSON만 반환
- 1차 단계에서는 DB 저장 없음
- frontend 연결은 제외하거나 Swagger/API 검증만 우선 수행

## 권장 응답 구조

후속 계획:

- `industry_category`
- `primary_domain_category`
- `domain_categories`
- `position_category`
- `skills`
- `competencies`
- `review_item_candidates`

## AI가 따라야 할 분류 정책

AI 작업도 현재 정책 기준을 그대로 따라야 한다.

- 산업 = 회사의 주된 제품/수익 모델
- 도메인 = 제품/서비스가 다루는 시장/업무 영역
- 현재 저장 구조는 단일 `analysis_results.domain_category`
- 후속 구조는 대표 도메인 1개 + 전체 도메인 N개 방향
- AI 결과는 사용자 검토용 추천이며 자동 최종 확정이 아니다.

## 후속 단계

- Phase AI-2: UI 트리거와 조회 결과 표시
- Phase AI-3: 선택적으로 AI 추천을 review_items에 반영
- Phase AI-4: 개별 review_item 단위 추천 고도화
