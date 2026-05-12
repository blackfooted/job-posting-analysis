# AI Recommendation Spec

## Frontend Category Candidate Save UI Current Update

- AI 추천 이력 상세 화면과 비교 화면의 `AI 추천 항목 선택` 영역에서 `industry_category`, `primary_domain_category`, `position_category`, `review_item_candidates` 중 `field_type=industry|domain|position` 항목을 함께 선택할 수 있다.
- 선택 항목 저장/반영 시 `skill|competency` 항목은 `POST /api/ai-recommendations/history/{run_id}/apply`로 `review_items`에 반영하고, `industry|domain|position` 항목은 `POST /api/ai-recommendations/history/{run_id}/category-candidates`로 산업/도메인/직무 후보에 저장한다.
- 두 API 호출 결과는 화면에서 독립적으로 표시한다. 하나가 실패해도 다른 API의 성공 결과는 유지하며, 부분 성공/부분 실패를 구분한다.
- 산업/도메인/직무 후보 저장은 `analysis_results`, dashboard, config JSON을 즉시 갱신하지 않는다.
- 하단 영역은 `저장된 산업/도메인/직무 후보` 관리 영역이며, AI 추천 결과에서 후보를 새로 선택하는 영역은 history 상세/비교 화면 안에 둔다.

## OpenAI Output Token 안정화 기준

- OpenAI mode는 Responses API + Structured Outputs JSON을 사용한다.
- `AI_RECOMMENDATION_MAX_OUTPUT_TOKENS` 1차 안정화 값은 `1800`이다.
- 이전 기준인 `900`은 긴 추천 JSON에서 응답이 중간에 잘려 `AI_RESPONSE_PARSE_FAILED`를 유발할 수 있다.
- 긴 공고의 추천 조회에서는 latency 최적화보다 Structured Outputs JSON 완성 안정성을 우선한다.
- 추후 실제 응답 길이, latency, 비용을 보고 `max_output_tokens` 값을 다시 조정할 수 있다.
- Responses API 호출에는 `max_output_tokens`를 사용하며, `max_tokens` 또는 `max_completion_tokens`는 사용하지 않는다.
- debug 확인 시 `raw_text_endswith_json=false` 또는 `parse_candidate_endswith_json=false`이면 JSON 잘림 가능성이 높다.
- debug 확인 시 `raw_text_empty=true`이면 Responses API 응답 텍스트 추출 문제 가능성을 우선 확인한다.

## Phase 구분

### Phase AI-1 — 완료

현재 완료 상태:

- backend Mock recommendation API 구현
- frontend Mock recommendation 조회 화면 구현
- 사용자가 공고를 선택하고 `AI 추천 조회` 버튼을 눌렀을 때만 추천 API 호출
- DB 저장 없음
- 자동 확정 없음
- review_items 반영 없음
- analysis_results 갱신 없음

### Phase AI-1B — 완료

현재 완료 상태:

- Phase AI-1B 구현 완료
- 사용자 로컬 검증 완료
- `AI_RECOMMENDATION_MODE=mock|openai` mode 분기 구현 완료
- 기본 mode는 `mock`
- `AI_RECOMMENDATION_MODE=openai`일 때 OpenAI 실제 호출 가능
- 기본 model은 `gpt-5.4-nano`
- OpenAI 호출은 Responses API와 `text.format` json_schema Structured Outputs를 사용
- Structured Outputs schema로 recommendation JSON 구조 강제
- OpenAI 응답 JSON parse 및 normalize/검증 경로 추가
- 기존 endpoint 유지
- 기존 frontend 표시 구조 유지
- mode가 `mock`이거나 미설정이면 기존 Mock 응답 유지
- 최종 응답 구조 유지
- `domain_categories` 제외 유지
- DB 저장 없음
- review_items 자동 반영 없음
- analysis_results 자동 갱신 없음
- config 수정 없음
- 실제 frontend 실행 기준 AI 추천 조회 성공
- `AI_RESPONSE_PARSE_FAILED` 오류는 현재 재현되지 않음

### Phase AI-2 — AI 추천 결과 히스토리 설계

- AI 추천 결과 저장 이력 관리 설계
- `model`, `prompt_version`, `recommendation_json`, `created_at` 저장 범위 정의
- API key, raw prompt, raw OpenAI response 전체 저장 금지
- 저장 대상은 openai mode 성공 결과 우선
- mock mode 결과는 1차 구현에서 저장하지 않음
- 설계 문서: `docs/current/11_ai_recommendation_history_plan.md`

### Phase AI-3 — AI 추천 결과 히스토리 저장/조회 구현

- backend 1차 구현 완료
- `ai_recommendation_runs` 테이블 또는 동등한 저장 구조 구현
- 추천 실행 결과 저장
- 공고별 추천 이력 조회 API
- frontend history 목록/상세 조회 UI 1차 연결 완료

### Phase AI-4 — 저장된 추천 결과의 선택 반영 검토

- 선택 반영 정책 문서: `docs/current/12_ai_recommendation_selective_apply_policy.md`
- category 후보 저장/반영 정책 문서: `docs/current/14_ai_recommendation_category_apply_policy.md`
- category 후보 저장 구조 설계 문서: `docs/current/15_ai_recommendation_category_candidate_storage.md`
- 1차 반영 위치는 `review_items`로 제한하고 `dictionary_candidates`는 후속 검토
- 1차 선택 반영 대상은 skills/competencies와 review_item_candidates 중 `skill`/`competency`
- industry/domain/position은 1차 반영 대상에서 제외
- industry/domain/position은 현재 선택 반영 대상에서 제외되어 있으나, category 후보 저장 정책을 별도 설계한다.
- category 후보는 별도 테이블 설계를 우선한다.
- category 후보 저장을 위한 DB schema 1차 구현 완료: `ai_recommendation_category_candidates`
- category 후보는 후보로 저장하고 사용자 검토 후 후속 반영하는 방향을 우선한다.
- analysis_results 즉시 갱신은 1차 제외한다.
- dashboard 집계 반영은 후속이다.
- category 후보 저장/조회/상태 변경 backend API 1차 구현 완료
  - `POST /api/ai-recommendations/history/{run_id}/category-candidates`
  - `GET /api/ai-recommendations/postings/{posting_id}/category-candidates`
  - `PATCH /api/ai-recommendations/category-candidates/{candidate_id}`
- category 후보 상태를 `pending`으로 되돌릴 때 `reviewed_at=null`로 초기화하는 것은 의도된 정책이다.
- category 후보 frontend UI도 아직 미구현이다.
- 기존 `unconfirmed`는 AI 추천만으로 자동 `confirmed` 처리하지 않고, 사용자가 선택 반영할 때만 `confirmed` 갱신 검토
- 기존 `removed` 이력은 존중하며 되살리지 않음
- `applied_items_json`은 선택 반영 결과 추적용으로 추가 완료
- 자동 반영이 아니라 사용자 선택 반영 원칙 유지

## 현재 상태

확인한 소스코드 기준 현재 구현:

- backend AI recommendation API 1차 Mock 구현이 있다.
- Phase AI-1B backend mode 분기가 구현되어 있고 사용자 로컬 검증이 완료되었다.
- `backend/app/main.py`에 AI router가 등록되어 있다.
- endpoint: `GET /api/ai-recommendations/postings/{posting_id}`
- 기본 mode는 Mock recommendation 응답이다.
- `AI_RECOMMENDATION_MODE=openai`일 때만 OpenAI API를 실제 호출한다.
- 기본 model은 `gpt-5.4-nano`다.
- OpenAI 호출은 Responses API와 `text.format` json_schema Structured Outputs를 사용한다.
- Structured Outputs schema로 recommendation JSON 구조를 강제한다.
- 사용자 로컬 검증에서 `posting_id=17`, `posting_id=16` openai mode 호출이 성공했다.
- 사용자 로컬 검증에서 `meta.mode = openai`, `meta.model = gpt-5.4-nano`, `meta.saved = false`가 확인되었다.
- 사용자 로컬 검증에서 recommendation 구조가 정상 반환되고 `domain_categories`가 없는 것이 확인되었다.
- `AI_RESPONSE_PARSE_FAILED` 오류는 현재 재현되지 않는다.
- OpenAI SDK import는 openai mode 호출 시점에만 수행한다.
- Mock mode는 OpenAI 결제/API key 없이 Swagger에서 테스트 가능하다.
- 추천 생성 로직은 `backend/app/ai_recommendations.py`에 격리되어 있다.
- frontend AI recommendation 화면에서 Mock API 조회가 가능하다.
- AI 추천 관리 화면 진입 시 공고 목록이 비어 있으면 기존 postings 조회로 목록을 로드한다.
- 사용자가 공고를 선택하고 `AI 추천 조회` 버튼을 눌렀을 때만 AI 추천 API를 호출한다.
- 공고 선택 변경 시 이전 추천 결과와 error 상태를 초기화한다.

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
- frontend는 Mock API 결과를 화면 표시용으로 조회
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
- frontend는 `domain_categories`를 표시하지 않는다.
- 추천 결과는 화면 표시용이며 DB에 저장하지 않는다.

## AI가 따라야 할 분류 정책

AI 작업도 현재 정책 기준을 그대로 따라야 한다.

- 산업 = 회사의 주된 제품/수익 모델
- 도메인 = 제품/서비스가 다루는 시장/업무 영역
- 현재 저장 구조는 단일 `analysis_results.domain_category`
- 후속 구조는 대표 도메인 1개 + 전체 도메인 N개 방향
- AI 결과는 사용자 검토용 추천이며 자동 최종 확정이 아니다.

### AI prompt 품질 기준

OpenAI 실제 호출 prompt는 서비스의 `field_type` 정책에 맞게 아래 기준을 직접 안내한다.

- `skills`는 도구, 시스템, 소프트웨어, 플랫폼, 기술 스택, 방법론, 산출물 작성 기술, 직무 수행에 직접 쓰이는 툴/기술만 포함한다.
- `skills` 예시는 `SQL`, `Python`, `AWS`, `RAG`, `EMR`, `HIS`, `OCS`, `와이어프레임`, `스토리보드`, `UX/UI`, `API`, `ERD`, `프롬프트 엔지니어링`이다.
- `competencies`는 업무 역량, 사고방식, 행동 패턴, 분석 역량, 협업 방식, 문제 정의/해결 능력, 정책 수립 능력, 프로젝트 관리 능력, 커뮤니케이션 역량을 포함한다.
- `competencies` 예시는 `요구사항 분석`, `정책 수립`, `데이터 분석`, `문제 정의`, `협업`, `커뮤니케이션`, `프로젝트 관리`, `서비스 운영`, `문서화`, `비즈니스 분석`, `시스템 설계`이다.
- `커뮤니케이션`, `협업`, `데이터 기반 의사결정`, `문제 해결`, `책임감`, `실행력`, `이해관계자 조율`은 `skills`가 아니라 `competencies`로 분류한다.
- 제출 서류, 전형 절차, 지원 조건, `포트폴리오 제출`은 recommendation과 `review_item_candidates`에서 제외한다.
- 고객사명, 파트너사명, 제품명, 기관명, 인증명, 수상명, 지원사업명, 회사 소개용 고유명사는 직무 수행 도구가 아니면 제외한다.
- `Jira`, `Figma`, `SQL`, `AWS`처럼 직무 수행 도구로 직접 쓰이는 고유명사는 예외로 포함할 수 있다.
- `Slack`, `Teams` 같은 일반 협업 메신저는 특별히 직접 사용 능력을 요구하지 않으면 `skill`로 넣지 않는다.
- `ChatGPT`, `Claude Code`, `Cursor` 등은 AI 도구 활용 맥락이면 `AI툴활용` 또는 `프롬프트 엔지니어링` 같은 대표값으로 통합하는 것을 우선한다.
- 회사 기술스택 섹션에만 등장하는 개발 기술은 직무가 해당 기술을 직접 활용해야 한다고 명시한 경우에만 `skills`에 포함한다.
- 기획자/PM/서비스기획 직무에서 `FastAPI`, `Celery`, `Scrapy`, `React` 등이 회사 전체 기술스택에만 나오면 제외하거나 낮은 우선순위로 본다.
- `SQL`, `ERD`, `API`는 기획자가 개발팀과 논의하거나 데이터 구조를 이해해야 한다고 명시되면 포함할 수 있다.
- 각 item의 `value`는 가능한 짧은 대표값으로 작성하고, 자세한 문맥은 `reason`에 작성한다.
- `review_item_candidates`에는 field_type 판단이 애매한 표현, config 대표값 추가 검토가 필요한 표현, 신규 alias 후보, 사람이 검토해야 할 후보만 포함한다.
- `review_item_candidates`에는 제출 요건, 포트폴리오 제출, 회사 소개 고유명사, 고객사명, 파트너사명, 제품명, 인증명, 단순 기술스택 나열을 넣지 않는다.

Prompt에는 위 기준과 함께 good/bad few-shot 예시를 포함해 `skills`/`competencies` 구분, 제출 요건 제외, 회사 기술스택 제외, 짧은 대표값 작성, 고유명사 제외를 안내한다.

### AI prompt 입력량 축소 정책

OpenAI 호출 latency와 비용을 줄이기 위해 prompt에 포함하는 공고 원문 입력량을 제한한다.

- `raw_text` 전체 원문은 prompt에 그대로 포함하지 않는다.
- `raw_text`는 앞 500자만 잘라 `raw_text_preview` 라벨로 포함한다.
- `raw_text`가 비어 있으면 `raw_text_preview`는 빈 문자열로 둔다.
- `raw_text`가 500자를 초과하면 preview 뒤에 truncation 표시를 붙일 수 있다.
- `duties`, `requirements`, `preferred`, `tools` 등 구조화 필드는 기존처럼 prompt에 포함한다.
- 목적은 입력 토큰과 비용 감소, 일부 OpenAI 호출 latency 개선이다.
- endpoint, Structured Outputs schema, 최종 API 응답 구조, frontend 표시 구조는 변경하지 않는다.

Streaming 응답은 현재 범위가 아니다. 현재 구현은 Responses API + Structured Outputs JSON을 완성 응답으로 받은 뒤 parse/normalize하는 구조이므로, streaming은 frontend 응답 방식, JSON 조립, error 처리 설계가 필요한 후속 UX 개선 후보로 분리한다.

### AI output length 제한 정책

OpenAI 출력 JSON 생성 시간을 줄이기 위해 출력 길이도 1차 제한한다.

- 현재 구현은 Responses API `client.responses.create(...)`를 사용하므로 `max_output_tokens=900`을 1차 기준으로 사용한다.
- Chat Completions API를 사용하는 경우에는 `max_tokens` 또는 `max_completion_tokens` 등 파라미터명이 다르므로 Responses API의 `max_output_tokens`와 혼용하지 않는다.
- `max_output_tokens`를 너무 낮게 잡으면 Structured Outputs JSON이 잘려 `AI_RESPONSE_PARSE_FAILED`가 발생할 수 있으므로 900으로 시작한다.
- 추후 실제 응답 품질과 parse 안정성을 확인한 뒤 700~800 수준으로 낮출 수 있다.
- prompt는 각 category item의 `value`를 가능한 짧은 대표값으로 작성하도록 지시한다.
- prompt는 `reason`을 한 문장, 가능하면 80자 이내로 작성하도록 지시한다.
- `skills`는 최대 8개까지만 반환한다.
- `competencies`는 최대 8개까지만 반환한다.
- `review_item_candidates`는 최대 5개까지만 반환한다.
- 이미 `skills` 또는 `competencies`에 포함한 개념은 `review_item_candidates`에 중복해서 넣지 않는다.
- 긴 문장형 후보는 `review_item_candidates`에 넣지 않는다.

Streaming 응답은 계속 후속 UX 개선 후보로 유지한다.

### AI response debug logging 정책

`AI_RESPONSE_PARSE_FAILED` 원인 확인을 위해 제한적 debug logging을 제공한다.

- `AI_RECOMMENDATION_DEBUG=1`일 때만 debug 로그를 출력한다.
- 기본값은 비활성화이며, 미설정 또는 `1` 외 값에서는 debug 로그를 출력하지 않는다.
- `.env.example`은 수정하지 않는다.
- OpenAI API key, request payload, full raw response는 로그로 출력하지 않는다.
- API 응답에도 raw response 전체를 포함하지 않는다.
- Responses API 응답 구조 확인용으로 response type, `output_text` 존재 여부, `output` 타입/count, 일부 output item의 content 타입/count만 출력할 수 있다.
- 텍스트 추출 후에는 raw text 길이, 빈 문자열 여부, `{` 시작 여부, `}` 종료 여부, 앞 200자 preview만 출력할 수 있다.
- JSON parse 실패 시에는 raw text 길이, 첫 `{` 위치, 마지막 `}` 위치, candidate 존재 여부, candidate 길이, candidate `}` 종료 여부, JSON decode error 위치/메시지만 출력할 수 있다.
- 실제 확인 후 debug mode는 꺼야 한다.

### Phase AI-1B 실제 검증 결과

사용자 로컬 환경에서 아래 항목을 확인했다.

- `posting_id=17` openai mode 호출 성공
- `posting_id=16` openai mode 호출 성공
- `meta.mode = openai`
- `meta.model = gpt-5.4-nano`
- `meta.saved = false`
- recommendation 구조 정상 반환
- `domain_categories` 없음
- debug 로그로 Responses API 응답 추출 경로 정상 확인
- `AI_RESPONSE_PARSE_FAILED` 재현 없음

## 후속 단계

- Phase AI-2: AI 추천 결과 히스토리 설계
- Phase AI-3: AI 추천 결과 히스토리 저장/조회 구현
- Phase AI-4: 저장된 추천 결과의 선택 반영 검토

## AI Recommendation History 설계

AI Recommendation History의 상세 설계 기준은 `docs/current/11_ai_recommendation_history_plan.md`를 따른다.

핵심 정책:

- openai mode 성공 결과 저장을 우선으로 한다.
- 저장 대상은 정규화된 recommendation JSON 전체를 우선으로 한다.
- `posting_id`, `mode`, `model`, `prompt_version`, `recommendation_json`, `created_at`, 실행 상태를 저장 대상으로 검토한다.
- API key, raw prompt 전체, raw OpenAI response 전체, request payload 전체는 저장하지 않는다.
- AI 추천 결과는 저장해도 자동 확정하지 않는다.
- 저장된 추천 결과도 review_items, analysis_results, config에 자동 반영하지 않는다.
- 저장과 선택 반영의 책임을 분리한다.
- Phase AI-4 준비 작업으로 선택 반영 결과 추적용 `applied_items_json` 컬럼을 추가했다.
- Phase AI-4 backend 1차 구현에서 `applied_status` 부분 갱신과 `applied_items_json` write를 처리한다.

### History backend 1차 구현 상태

- `ai_recommendation_runs` 테이블을 추가했다.
- `POST /api/ai-recommendations/postings/{posting_id}/runs`를 추가했다.
- `GET /api/ai-recommendations/postings/{posting_id}/history`를 추가했다.
- `GET /api/ai-recommendations/history/{run_id}`를 추가했다.
- 기존 `GET /api/ai-recommendations/postings/{posting_id}`는 저장 없이 호환 유지한다.
- POST `/runs`는 추천 실행 + 저장 API다.
- openai mode 성공 결과만 저장한다.
- mock mode는 저장하지 않고 `run=null`, `meta.saved=false`를 반환한다.
- 저장되는 `recommendation_json`은 정규화된 recommendation object만 포함한다.
- API key, raw prompt 전체, raw OpenAI response 전체, API 응답 전체 data/meta는 저장하지 않는다.
- 저장된 추천 결과도 자동 확정하지 않는다.
- 저장된 추천 결과도 review_items, analysis_results, config에 자동 반영하지 않는다.
- `applied_items_json` 컬럼과 선택 반영 backend API는 구현되었다.
- frontend 선택 반영 UI는 history 상세/비교 화면에 1차 연결되었다.

### History frontend 1차 연결 상태

- AI 추천 조회 버튼은 `POST /api/ai-recommendations/postings/{posting_id}/runs`를 호출한다.
- 기존 `GET /api/ai-recommendations/postings/{posting_id}` endpoint와 `fetchAiRecommendation()` client는 호환용으로 유지한다.
- POST `/runs` 응답의 `data.recommendation`은 기존 추천 결과 표시 구조로 렌더링한다.
- POST `/runs` 응답의 `data.run`과 `data.meta.saved`를 이용해 저장 상태를 표시한다.
- `data.run=null`이면 mock mode 또는 저장 없음으로 보고 run id/created_at은 표시하지 않는다.
- AI 추천 관리 화면에 공고별 history 목록 조회가 연결되었다.
- history 목록은 `GET /api/ai-recommendations/postings/{posting_id}/history`를 사용한다.
- backend 응답 구조는 `data.items`, `data.pagination` 기준으로 처리한다.
- 공고 선택 시 history page를 1로 초기화한 뒤 조회한다.
- POST `/runs` 성공 후 history page를 1로 초기화하고 refresh한다.
- history 목록에는 run metadata만 표시하며 recommendation JSON 전체는 표시하지 않는다.
- history 목록에서 `상세 보기`를 선택하면 `GET /api/ai-recommendations/history/{run_id}`로 저장된 추천 이력 상세를 조회한다.
- history 상세 화면은 run metadata, source, 저장된 recommendation을 현재 추천 결과 영역과 별도 섹션으로 표시한다.
- 기존 현재 recommendation 표시 JSX는 유지하고, history 상세 recommendation은 독립된 JSX 블록으로 표시한다.
- history 목록에서 같은 공고의 run 2개를 비교 대상으로 선택할 수 있다.
- `선택한 이력 비교` 버튼을 누르면 선택한 2개 run에 대해 `GET /api/ai-recommendations/history/{run_id}`를 각각 호출한다.
- history 비교 UI는 두 run의 metadata와 recommendation 요약을 좌우로 표시한다.
- 상세 보기와 비교 선택은 독립적으로 동작한다.
- 공고 변경, history page 이동, history refresh, POST `/runs` 성공 후 refresh 시 compare 상태를 초기화한다.
- 비교 UI는 선택 반영 UI까지 1차 연결되었으며, `applied_status` 직접 변경 UI는 후속 작업으로 둔다.

### 선택 반영 정책

- 선택 반영 정책 문서는 `docs/current/12_ai_recommendation_selective_apply_policy.md`를 따른다.
- Phase AI-4는 저장된 AI 추천 이력에서 사용자가 일부 항목만 선택해 `review_items`에 반영하는 단계다.
- 1차 선택 반영 대상은 `recommendation.skills`, `recommendation.competencies`, `review_item_candidates` 중 `field_type=skill|competency`인 항목이다.
- `industry_category`, `primary_domain_category`, `position_category`와 `field_type=industry|domain|position` 후보는 1차 반영 대상에서 제외한다.
- 기존 `unconfirmed`는 AI 추천 생성만으로 자동 `confirmed` 처리하지 않고, 사용자가 선택 반영할 때만 `confirmed` 갱신을 검토한다.
- 기존 `removed` 이력은 되살리지 않는다.
- `applied_items_json`은 선택 반영 결과 추적용 컬럼으로 추가했다.
- Phase AI-4 backend 1차 구현으로 `POST /api/ai-recommendations/history/{run_id}/apply`를 추가했다.
- 선택 반영 API는 `skill`/`competency` 항목만 `review_items`에 반영한다.
- 기존 `confirmed` 중복은 새로 생성하지 않고 skipped/reused 결과로 기록한다.
- 기존 `unconfirmed` 중복은 사용자 선택 반영으로 보고 `approved_value`를 채운 뒤 `confirmed`로 갱신한다.
- 기존 `removed` 이력은 되살리지 않고 `skipped_removed_history`로 기록한다.
- 신규 항목은 `status=confirmed`, `dictionary_apply=0`인 `review_items`로 생성한다.
- 처리 결과는 `applied_items_json`에 append 저장한다.
- 최소 1개 이상 applied되면 `applied_status=partially_applied`로 갱신한다.
- frontend 선택 반영 UI는 history 상세/비교 화면에 1차 연결되었다.
- `dictionary_candidates` 연동은 `review_items` 선택 반영 이후 별도 phase에서 검토한다.

## Phase AI-1B endpoint 정책

Phase AI-1B에서도 endpoint는 변경하지 않는다.

```text
GET /api/ai-recommendations/postings/{posting_id}
```

이유:

- frontend가 이미 해당 endpoint에 연결되어 있다.
- 현재 API는 DB 저장 없는 조회형 추천 API다.
- request body가 필요하지 않다.
- posting_id 기준 추천이라는 책임이 명확하다.

## Phase AI-1B mode 전환 정책

환경변수:

```text
AI_RECOMMENDATION_MODE=mock | openai
```

기본값:

```text
mock
```

정책:

- `AI_RECOMMENDATION_MODE`가 없으면 `mock`으로 동작한다.
- `AI_RECOMMENDATION_MODE=mock`이면 기존 Mock 응답을 반환한다.
- `AI_RECOMMENDATION_MODE=openai`이면 실제 OpenAI API를 호출한다.
- `AI_RECOMMENDATION_MODE` 값이 `mock`/`openai` 외 값이면 `AI_CONFIG_INVALID` 오류를 반환한다.
- `openai` mode에서 `OPENAI_API_KEY`가 없으면 `AI_CONFIG_MISSING` 오류를 반환한다.
- `openai` mode에서 `OPENAI_MODEL`이 없으면 `gpt-5.4-nano`를 기본값으로 사용한다.

## OpenAI 설정 정책

사용할 provider:

```text
OpenAI
```

기본 model:

```text
gpt-5.4-nano
```

환경변수:

- `AI_RECOMMENDATION_MODE`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`

의존성:

- OpenAI SDK는 `backend/requirements.txt`에서 관리한다.
- 기준 버전은 `openai>=1.0.0`이다.

기본값:

- `AI_RECOMMENDATION_MODE=mock`
- `OPENAI_MODEL=gpt-5.4-nano`

주의:

- OpenAI API key는 코드에 하드코딩하지 않는다.
- API key는 `.env` 또는 로컬 환경변수로만 관리한다.
- `.env` 파일은 Git commit 대상이 아니다.
- `.env.example` 수정은 실제 구현 단계에서 수행한다.

## Phase AI-1B 응답 구조 유지 정책

Phase AI-1B에서도 현재 응답 구조를 유지한다.

성공 응답:

```json
{
  "data": {
    "posting_id": 1,
    "source": {
      "company": "string",
      "position": "string"
    },
    "recommendation": {
      "industry_category": {
        "value": "string",
        "confidence": "high|medium|low",
        "reason": "string"
      },
      "primary_domain_category": {
        "value": "string",
        "confidence": "high|medium|low",
        "reason": "string"
      },
      "position_category": {
        "value": "string",
        "confidence": "high|medium|low",
        "reason": "string"
      },
      "skills": [],
      "competencies": [],
      "review_item_candidates": []
    },
    "meta": {
      "mode": "mock 또는 openai",
      "model": "string 또는 null",
      "saved": false,
      "generated_at": "ISO datetime"
    }
  },
  "error": null
}
```

주의:

- `domain_categories`는 Phase AI-1B 응답에도 포함하지 않는다.
- 복수 도메인 구조가 확정된 후 별도 phase에서 추가한다.
- `meta.saved`는 항상 `false`다.
- AI 결과는 사용자 검토용 추천이며 자동 확정이 아니다.

## AI 응답 JSON 검증 정책

OpenAI 응답은 Responses API + `text.format` json_schema Structured Outputs로 recommendation 구조를 강제한다. 그래도 응답은 그대로 신뢰하지 않고 parse 안정화와 normalize/검증을 수행한다.

Structured Outputs:

- schema name은 `ai_recommendation_response`다.
- 최상위 object는 `recommendation`을 필수로 요구한다.
- `recommendation` 안에는 `industry_category`, `primary_domain_category`, `position_category`, `skills`, `competencies`, `review_item_candidates`를 필수로 요구한다.
- `domain_categories`는 schema에 포함하지 않는다.
- 가능한 범위에서 `additionalProperties=false`, `strict=true`를 사용한다.

파싱 보정:

- 응답이 ```json code fence로 감싸져 있으면 fence를 제거한 뒤 JSON parse를 시도한다.
- 응답 앞뒤에 설명 문장이 붙어 있으면 첫 번째 JSON object를 추출해 JSON parse를 시도한다.
- 최상위 `recommendation` 키가 없더라도 `industry_category`, `primary_domain_category`, `position_category` 세 필드가 모두 object이면 `recommendation`으로 감싸서 보정한다.

최소 필수 구조:

- `recommendation`
- `recommendation.industry_category`
- `recommendation.primary_domain_category`
- `recommendation.position_category`

배열 필드:

- `recommendation.skills`
- `recommendation.competencies`
- `recommendation.review_item_candidates`

배열 필드 보정:

- 배열 필드가 없거나 배열이 아니면 빈 배열로 보정한다.
- `review_item_candidates.field_type`이 허용값이 아니면 해당 candidate는 최종 응답에서 제외한다.

객체 필드 보정:

- `value`가 없으면 `null`
- `confidence`가 없으면 `low`
- `reason`이 없으면 빈 문자열
- `confidence`가 `high`, `medium`, `low` 중 하나가 아니면 `low`

실패 처리:

- JSON parse 실패
- `recommendation` 키 없음
- 필수 객체 필드 없음
- 필수 객체 필드가 object가 아님

위 경우 `AI_RESPONSE_PARSE_FAILED`를 반환한다.

## Phase AI-1B 에러 코드 정책

| code | 상황 |
|---|---|
| `POSTING_NOT_FOUND` | posting이 없거나 삭제됨 |
| `AI_CONFIG_INVALID` | `AI_RECOMMENDATION_MODE` 값이 허용값이 아님 |
| `AI_CONFIG_MISSING` | openai mode에서 `OPENAI_API_KEY`가 없음 |
| `AI_RECOMMENDATION_FAILED` | OpenAI 호출 실패 |
| `AI_RESPONSE_PARSE_FAILED` | AI 응답 JSON 파싱 또는 최소 구조 검증 실패 |
| `AI_RECOMMENDATION_RUN_NOT_FOUND` | AI 추천 이력 run이 없음 |
| `AI_RECOMMENDATION_HISTORY_SAVE_FAILED` | AI 추천 이력 저장 실패 |

기존 공통 응답 포맷을 유지한다.

실패 응답:

```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "설명 메시지"
  }
}
```

## Phase AI-1B 제외 범위

아래 항목은 Phase AI-1B에서 구현하지 않는다.

- AI 추천 결과 DB 저장
- review_items 자동 생성
- analysis_results 자동 갱신
- config JSON 자동 수정
- dictionary_candidates 연동
- domain_categories 배열 추가
- 복수 도메인 DB 구조 추가
- frontend UI 대규모 변경
- 비용/토큰 사용량 저장
- 일괄 AI 추천 실행
- 공고 저장/수정 시 AI 자동 호출
## Frontend Selective Apply UI 현행화

- frontend AI 추천 history 상세/비교 화면에서 선택 반영 UI를 1차 연결했다.
- 선택 반영은 `POST /api/ai-recommendations/history/{run_id}/apply`를 사용한다.
- 선택 가능한 항목은 `recommendation.skills`, `recommendation.competencies`, `review_item_candidates` 중 `field_type=skill|competency` 항목으로 제한한다.
- `industry_category`, `primary_domain_category`, `position_category`, `field_type=industry|domain|position` 후보는 선택 반영 대상에서 제외한다.
- frontend는 `source_path`를 저장된 recommendation 원본 배열 index 기준으로 생성한다. 예: `skills[0]`, `competencies[1]`, `review_item_candidates[2]`.
- `review_item_candidates`를 필터링해 렌더링하더라도 `source_path`는 필터링 전 원본 배열 index를 유지한다.
- 선택 반영 성공 시 `applied_items`/`skipped_items` 결과를 화면에 표시한다.
- 선택 반영 성공 후 history 목록을 refresh하고, 현재 상세 run은 `GET /api/ai-recommendations/history/{run_id}`로 재조회해 최신 상태를 반영한다.
- backend 응답의 `applied_status`만 로컬 상세/비교 state에 덮어쓰는 방식은 사용하지 않는다.
- 비교 화면에서는 run별로 선택 항목을 분리하고, 한 번에 한 run 기준으로 apply API를 호출한다.
- AI 추천 화면의 주요 사용자 노출 label/컬럼명은 한글로 표시한다.
- `dictionary_candidates` 연동과 industry/domain/position 선택 반영은 후속 단계로 둔다.
## Phase AI-4 1차 완료 및 품질 검증 계획

### Phase AI-4 1차 완료 상태

- 선택 반영 backend API 구현 완료: `POST /api/ai-recommendations/history/{run_id}/apply`
- 선택 반영 frontend UI 구현 완료
- history 상세/비교 화면에서 skill/competency 항목 선택 반영 가능
- 선택한 항목은 `review_items`에 반영된다.
- industry/domain/position은 1차 선택 반영 대상에서 제외한다.
- `dictionary_candidates` 연동은 후속 단계로 둔다.
- 선택 반영 처리 결과는 `ai_recommendation_runs.applied_items_json`에 추적한다.
- 최소 1개 이상 반영되면 `applied_status=partially_applied`로 갱신된다.
- 사용자 로컬 검증에서 선택 항목의 `review_items` 반영이 정상 작동하는 것을 확인했다.
- 선택 반영 결과의 `applied_items`/`skipped_items`는 frontend에서 표시한다.
- AI 추천 화면 label/컬럼명은 한글로 정리했다.

### 다음 우선순위 — AI 추천 품질 검증

AI 추천 품질 검증을 다음 우선순위로 둔다.

검증 목적:

- 규칙 기반 classification이 놓친 항목을 AI가 얼마나 보완하는지 확인한다.
- AI 추천의 오추출률을 확인한다.
- classification phase 3와 dictionary_candidates 설계 우선순위를 데이터 기반으로 결정한다.

검증 지표:

1. 규칙 기반 단독 매칭률
2. AI 추천 단독 매칭률
3. 규칙 기반 + AI 추천 합산 매칭률
4. AI 추천 오추출률

목표 기준:

- 현재 규칙 기반 평균 매칭률 약 56%를 기준으로 비교한다.
- 합산 매칭률이 70% 이상으로 상승하면 AI 추천의 실질 기여로 판단한다.
- 오추출률이 높으면 prompt 개선 또는 후보 필터링을 우선 검토한다.
## AI Recommendation Quality Validation 문서

- AI 추천 품질 검증 문서: `docs/current/13_ai_recommendation_quality_validation.md`
- 품질 검증 지표:
  1. 규칙 기반 단독 매칭률
  2. AI 추천 단독 매칭률
  3. 규칙 기반 + AI 추천 합산 매칭률
  4. AI 추천 오추출률
- 검증은 기존 4개 공고를 시작점으로 하며, 필요 시 2~3개 공고를 추가한다.
- 품질 검증 결과는 classification phase 3 개선, 선택 반영 결과 표시 고도화, dictionary_candidates 구조 설계의 우선순위 판단 기준으로 사용한다.
