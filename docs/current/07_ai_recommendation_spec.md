# AI Recommendation Spec

## 현재 상태

확인한 소스코드 기준 현재 구현:

- backend AI recommendation API 1차 Mock 구현이 있다.
- `backend/app/main.py`에 AI router가 등록되어 있다.
- endpoint: `GET /api/ai-recommendations/postings/{posting_id}`
- 현재 단계는 실제 OpenAI API 호출 없이 Mock recommendation 응답으로 Swagger 검증하는 단계다.
- OpenAI SDK는 사용하지 않는다.
- OpenAI 결제/API key 없이 Swagger에서 테스트 가능하다.
- 추천 생성 로직은 `backend/app/ai_recommendations.py`에 격리되어 있다.
- `frontend/src/App.jsx`에는 `aiRecommendations` 메뉴가 있지만, 현재 페이지는 placeholder만 있다.

## 제품 원칙

후속 AI 개발 시 사용할 현재 정책 기준:

- AI는 자동 확정하지 않는다.
- AI는 사용자가 버튼을 눌렀을 때만 호출한다.
- 공고 저장 시 자동으로 AI를 호출하지 않는다.
- 1차 개발은 조회형 recommendation API부터 시작한다.
- DB 저장은 후속 단계로 둔다.

## 1차 Mock 구현 범위

현재 구현:

- backend recommendation 조회 API 1개
- `posting_id`로 저장된 공고 조회
- 공고가 없거나 삭제되었으면 `POSTING_NOT_FOUND` 404 반환
- Mock recommendation JSON 반환
- DB 저장 없음
- `analysis_results` 수정 없음
- `review_items` 생성/수정 없음
- config 수정 없음
- frontend 연결 없음
- 공고 저장/수정 시 자동 호출 없음

## 1차 Mock 응답 구조

현재 응답의 `recommendation`에는 아래 필드가 포함된다.

- `industry_category`
- `primary_domain_category`
- `position_category`
- `skills`
- `competencies`
- `review_item_candidates`

`meta` 기준:

- `mode`: `mock`
- `model`: `null`
- `saved`: `false`
- `generated_at`: API 호출 시점의 ISO 8601 문자열

주의:

- `domain_categories`는 1차 응답에서 제외한다.
- 복수 도메인 구조는 후속 DB 구조 결정 이후 검토한다.
- 현재 Mock 응답은 실제 AI 판단 결과가 아니라 API 구조 검증용 고정 데이터다.

## AI가 따라야 할 분류 정책

AI 작업도 현재 정책 기준을 그대로 따라야 한다.

- 산업 = 회사의 주된 제품/수익 모델
- 도메인 = 제품/서비스가 다루는 시장/업무 영역
- 현재 저장 구조는 단일 `analysis_results.domain_category`
- 후속 구조는 대표 도메인 1개 + 전체 도메인 N개 방향
- AI 결과는 사용자 검토용 추천이며 자동 최종 확정이 아니다.

## 후속 단계

- Phase AI-1B: OpenAI 결제/API key 설정 후 실제 `gpt-4o-mini` 호출로 교체
- Phase AI-2: UI 트리거와 조회 결과 표시
- Phase AI-3: 선택적으로 AI 추천을 review_items에 반영
- Phase AI-4: 개별 review_item 단위 추천 고도화
