# Current Dev Handoff

## 사용 기준

새 작업을 시작할 때 가장 먼저 읽는 문서다. "현재 구현" 판단은 확인한 소스코드 기준으로 한다. 구성안과 코드가 다르면 그 차이를 이 문서에 기록한다.

## 현재 구현 상태

### Postings

소스코드에서 확인한 현재 구현:

- postings 생성/목록/상세/수정/삭제 API 존재
- 삭제는 `is_deleted` 기반 soft delete
- 개별 공고 분석 결과 API 존재
- 필수 필드: `company`, `position`, `duties`, `requirements`, `raw_text`
- 선택 필드는 빈 문자열 저장 가능
- 수정 시 분석을 다시 수행하고 review_items를 재생성

### Review Items

소스코드에서 확인한 현재 구현:

- review_items 목록 API는 pagination 지원
- 목록 API는 `status`, `field_type`, `dictionary_apply`, `keyword` 필터 지원
- status는 `unconfirmed`, `confirmed`, `removed`
- `removed`는 hard delete가 아니라 정제 대상 제외 의미
- 기본 목록 조회에서는 `removed` 제외
- `dictionary_apply`는 현재 같은 `field_type` + 정규화 `raw_value` 일괄 확정 의미
- removed 이력 기반 동일 후보 재생성 방지 구현
- 기준은 동일 `field_type + normalized raw_value`
- 살아있는 posting에 연결된 removed 이력이 하나라도 있으면 동일 후보를 새 `unconfirmed` review_item으로 생성하지 않음
- 삭제된 posting에만 연결된 removed 이력은 재생성 방지 기준에서 제외
- 유사 표현 제외와 confirmed 이력 재사용은 미구현

### Classification / Config

소스코드 기준 현재 상태:

- classification phase 1 개선: 완료로 판단
- classification phase 2 개선: 코드 반영은 보이나 실데이터 추가 검증 필요
- Skill / Competency / Position alias 지원: 현재 config 파일에 존재
- config 안전 반영 phase 1 완료
- phase 1 반영 파일: `config/position-categories.json`, `config/skill-dictionary.json`, `config/competency-dictionary.json`
- phase 1 반영 후 사용자 직접 재분석 검증 일부 완료: `posting_id=14` 세나, `posting_id=17` 바티에이아이 모두 phase 1 반영 대상 기준 pass
- phase 1에서 industry/domain config는 보류
- config 변경 후 기존 공고는 재분석이 필요
- Industry / Domain alias 지원: 현재 config 파일에 존재
- 필수 config 파일은 startup 시 로드됨
- `synonym-map.json`은 필수 로드 대상이지만, 확인한 classification 흐름에서 직접 사용은 검토 필요

### Dashboard

소스코드에서 확인한 현재 구현:

- `summary`, `charts`, `comparison` API 존재
- frontend dashboard 페이지 존재
- dashboard는 목록/표 기반 렌더링
- charts endpoint에는 현재 domain distribution이 없음

### AI Recommendation

소스코드에서 확인한 현재 구현:

- 현재 AI Recommendation은 Phase AI-1 완료 및 Phase AI-1B 구현/사용자 로컬 검증 완료 상태
- backend AI recommendation API 1차 Mock 구현 존재
- endpoint: `GET /api/ai-recommendations/postings/{posting_id}`
- 저장된 공고를 `posting_id`로 조회한 뒤 Mock recommendation JSON 반환
- 공고가 없거나 삭제된 경우 `POSTING_NOT_FOUND` 404 반환
- 기본 mode는 mock이며 OpenAI 결제/API key 없이 Swagger 테스트 가능
- `AI_RECOMMENDATION_MODE=openai`일 때 OpenAI API 실제 호출 성공
- 기본 model은 `gpt-5.4-nano`
- OpenAI 호출은 Responses API + Structured Outputs를 사용
- OpenAI SDK import는 openai mode 호출 시점에만 수행
- OpenAI SDK 의존성은 `backend/requirements.txt`의 `openai>=1.0.0` 기준으로 관리
- 사용자 로컬 검증에서 `posting_id=16`, `posting_id=17` openai mode 호출 성공
- 사용자 로컬 검증에서 `AI_RESPONSE_PARSE_FAILED`는 현재 재현되지 않음
- `review_item_candidates.field_type`이 허용값이 아니면 해당 candidate는 최종 응답에서 제외
- DB 저장 없음
- `analysis_results` 수정 없음
- `review_items` 생성/수정 없음
- `domain_categories`는 1차 응답에서 제외
- 추천 생성 로직은 `backend/app/ai_recommendations.py`에 격리
- frontend AI recommendation 화면은 Mock API 조회와 결과 표시를 지원
- frontend 연결 파일: `frontend/src/App.jsx`, `frontend/src/App.css`, `frontend/src/api/aiRecommendationsApi.js`
- AI 추천 관리 화면 진입 시 공고 목록이 비어 있으면 기존 postings 조회로 목록을 로드
- 공고 선택 후 `AI 추천 조회` 버튼을 눌렀을 때만 AI 추천 API 호출
- 공고 선택 변경 시 이전 추천 결과와 error 상태 초기화
- 추천 결과는 화면 표시용이며 DB 저장/자동 확정/review_items 반영 없음
- prompt 품질 개선 완료
- `raw_text_preview` 500자 적용 완료
- output length 제한과 배열 개수 제한 지시 적용 완료
- 제한 debug 로그 추가 완료

Phase AI-1B backend 구현 기준:

- `AI_RECOMMENDATION_MODE` 기반 `mock`/`openai` mode 분기 추가 완료
- 기본 mode는 `mock`
- `AI_RECOMMENDATION_MODE=openai`일 때만 OpenAI API 호출
- OpenAI mode는 Responses API + `text.format` json_schema Structured Outputs로 recommendation 구조를 강제
- openai mode에서만 `OPENAI_API_KEY` 필요
- `OPENAI_MODEL` 기본값은 `gpt-5.4-nano`
- OpenAI 응답이 code fence로 감싸지거나 앞뒤 설명 문장을 포함해도 JSON object를 추출해 parse하도록 보강됨
- 최상위 `recommendation` 키가 없는 OpenAI 응답도 필수 category 객체 3개가 있으면 `recommendation` wrapper로 보정함
- OpenAI prompt는 `skills`/`competencies` 구분 기준을 강화해 `커뮤니케이션`, `협업`, `데이터 기반 의사결정` 같은 업무 역량이 `skills`에 들어가지 않도록 안내한다.
- OpenAI prompt는 제출 서류/전형 절차/지원 조건/포트폴리오 제출, 고객사명/파트너사명/제품명/기관명/인증명/수상명/지원사업명/회사 소개용 고유명사를 recommendation과 `review_item_candidates`에서 제외하도록 안내한다.
- OpenAI prompt는 회사 기술스택 섹션의 개발 기술이 직무 직접 활용 요구가 아닐 때 제외하도록 안내하며, 기획자/PM/서비스기획 직무의 단순 회사 스택 나열을 `review_item_candidates`에 넣지 않도록 안내한다.
- OpenAI prompt는 각 item의 `value`를 짧은 대표값으로 쓰고 자세한 설명은 `reason`에 쓰도록 안내한다.
- OpenAI prompt에는 good/bad few-shot 예시가 포함되어 있다.
- OpenAI 호출 속도 개선 1차로 prompt에 `raw_text` 전체를 넣지 않고 `raw_text_preview` 500자만 포함한다.
- `duties`, `requirements`, `preferred`, `tools` 등 구조화 필드는 prompt에 계속 포함한다.
- OpenAI 호출 latency 개선 2차로 Responses API 기준 `max_output_tokens=900`을 적용한다.
- 현재 호출 방식은 `client.responses.create(...)`이므로 Chat Completions API의 `max_tokens`/`max_completion_tokens`와 혼용하지 않는다.
- prompt에는 `value`를 짧은 대표값으로 작성하고 `reason`을 한 문장/가능하면 80자 이내로 작성하라는 지시가 포함되어 있다.
- prompt에는 `skills` 최대 8개, `competencies` 최대 8개, `review_item_candidates` 최대 5개 제한이 포함되어 있다.
- prompt에는 이미 `skills` 또는 `competencies`에 포함한 개념을 `review_item_candidates`에 중복하지 말고 긴 문장형 후보를 제외하라는 지시가 포함되어 있다.
- Streaming은 현재 구현 범위가 아니며, Responses API + Structured Outputs JSON 완성 응답 구조를 유지한다. Streaming은 후속 UX 개선 후보로만 둔다.
- 추가 OpenAI 회귀 검증이 필요하면 API key가 설정된 사용자 로컬 환경에서 수행해야 한다.
- `AI_RESPONSE_PARSE_FAILED` 원인 확인용 제한 debug 로그가 있다.
- debug 로그는 `AI_RECOMMENDATION_DEBUG=1`일 때만 출력되며 기본 비활성화다.
- debug 로그는 response 구조 요약, 추출 raw text 길이/빈 문자열 여부/JSON 시작·종료 여부/앞 200자 preview, parse 실패 위치 정보를 출력한다.
- OpenAI API key, request payload, full raw response는 로그나 API 응답에 포함하지 않는다.
- endpoint와 응답 구조는 유지
- Mock mode는 유지

Phase AI-1B 사용자 로컬 검증 결과:

- `posting_id=16` openai mode 호출 성공
- `posting_id=17` openai mode 호출 성공
- `meta.mode = openai`
- `meta.model = gpt-5.4-nano`
- `meta.saved = false`
- recommendation 구조 정상 반환
- `domain_categories` 없음
- 제한 debug 로그로 Responses API 응답 추출 정상 확인
- `AI_RESPONSE_PARSE_FAILED` 현재 재현 없음

Phase AI-1B에서도 아래는 제외한다.

- review_items 반영
- analysis_results 갱신
- config 수정
- `domain_categories` 추가
- dictionary_candidates 연동

Phase AI-2 이후는 AI Recommendation History 설계를 우선 검토한다.
상세 설계 문서는 `docs/current/11_ai_recommendation_history_plan.md`다.
핵심 정책은 openai mode 성공 결과 저장 우선, 정규화된 recommendation JSON 저장, API key/raw prompt/raw OpenAI response 전체 저장 금지, 저장과 선택 반영 책임 분리다.

AI Recommendation History backend 1차 구현 상태:

- `ai_recommendation_runs` 테이블 추가
- `POST /api/ai-recommendations/postings/{posting_id}/runs` API 추가
- `GET /api/ai-recommendations/postings/{posting_id}/history` 목록 API 추가
- `GET /api/ai-recommendations/history/{run_id}` 상세 API 추가
- 기존 `GET /api/ai-recommendations/postings/{posting_id}`는 저장 없이 유지
- POST `/runs`는 openai mode 성공 결과만 저장
- mock mode POST `/runs`는 저장하지 않고 `run=null`, `meta.saved=false` 반환
- `recommendation_json`에는 정규화된 recommendation object만 저장
- raw prompt 전체, raw OpenAI response 전체, API key는 저장하지 않음
- frontend history 상세 UI는 1차 연결 완료
- frontend history 비교 UI는 1차 연결 완료
- AI Recommendation 선택 반영 정책 문서 작성 완료: `docs/current/12_ai_recommendation_selective_apply_policy.md`
- frontend 선택 반영 UI는 1차 연결 완료이며 dictionary_candidates 연동은 후속
- 1차 반영 위치는 `review_items`
- `dictionary_candidates`는 후속
- industry/domain/position은 1차 반영 제외
- 기존 `unconfirmed`는 사용자가 선택 반영할 때만 `confirmed` 갱신 검토
- `removed` 이력은 존중해 되살리지 않음
- `ai_recommendation_runs.applied_items_json` 컬럼 추가 완료
- 신규 DB 생성용 schema와 기존 DB 보강 로직에 모두 반영
- 선택 반영 backend API 구현 완료

AI Recommendation frontend 1차 연결 상태:

- frontend AI recommendation 화면이 POST `/runs` API에 연결됨
- `frontend/src/api/aiRecommendationsApi.js`에 `createAiRecommendationRun(postingId)` 추가
- 기존 `fetchAiRecommendation(postingId)`는 호환용으로 유지
- `frontend/src/App.jsx`의 AI 추천 조회 버튼 클릭 핸들러가 POST `/runs`를 호출
- 기존 recommendation 표시 구조 유지
- POST `/runs` 응답의 `data.run`과 `data.meta.saved` 기반으로 저장 상태 표시
- `fetchAiRecommendationHistory(postingId, { page, size })` 추가
- 공고 선택 시 history page 1로 초기화 후 목록 조회
- POST `/runs` 성공 후 history page 1로 refresh
- history 목록은 `data.items`, `data.pagination` 기준으로 표시
- history 목록에는 run id, model, prompt_version, status, applied_status, created_at 표시
- `fetchAiRecommendationHistoryDetail(runId)` 추가
- history 목록에서 상세 보기 가능
- history 상세 recommendation은 기존 현재 추천 결과 JSX와 독립된 별도 JSX로 표시
- 공고 선택 변경, history page 이동, POST `/runs` refresh 시 상세 상태 초기화
- history 목록에서 비교 대상 run을 최대 2개 선택 가능
- 선택한 2개 run 상세를 조회해 metadata와 recommendation 요약을 좌우 비교 표시
- 상세 보기와 비교 선택은 독립 동작
- 공고 선택, history page 이동, history refresh, POST `/runs` 성공 후 refresh 시 compare 상태 초기화
- backend 수정 없음
- 선택 반영 UI, `applied_status` 관리, history note, 비교 결과 품질 판단 기록은 후속

AI Recommendation 선택 반영 정책:

- 정책 문서: `docs/current/12_ai_recommendation_selective_apply_policy.md`
- backend 선택 반영 API 구현 완료: `POST /api/ai-recommendations/history/{run_id}/apply`
- 1차 선택 반영 위치는 `review_items`이며 `dictionary_candidates`는 후속이다.
- 1차 반영 field_type은 `skill`/`competency`만 허용한다.
- industry/domain/position은 현재 `analysis_results.domain_category` 단일값 구조와 dashboard 영향 때문에 1차 반영에서 제외한다.
- 신규 항목은 `review_items`에 `status=confirmed`, `dictionary_apply=0`으로 생성한다.
- 기존 `unconfirmed`는 AI 추천만으로 자동 확정하지 않고, 사용자가 선택 반영할 때만 `confirmed`로 갱신한다.
- 기존 `confirmed` 중복은 신규 생성하지 않고 reused/skipped 결과로 기록한다.
- 기존 `removed` 이력은 존중해 되살리지 않는다.
- 선택 반영 결과 추적을 위한 `applied_items_json` DB 스키마 보완은 완료되었다.
- 선택 반영 API는 `applied_items_json`에 처리 결과를 append하고, 최소 1개 이상 applied되면 `applied_status=partially_applied`로 갱신한다.
- frontend 선택 반영 UI 구현은 완료되었다.
- 다음 작업 후보는 applied result를 항목별로 표시하는 고도화와 dictionary_candidates 구조 설계다.

## 현재 정책 기준

- 산업 = 회사의 주된 제품/수익 모델
- 도메인 = 제품/서비스가 다루는 시장/업무 영역
- 현재 저장 구조 = `analysis_results.domain_category` 단일값
- 후속 목표 구조 = 대표 도메인 1개 + 전체 도메인 N개
- 후속 dashboard 목표 = 복수 도메인 구조 도입 후 전체 도메인 기준 집계
- AI는 추천 전용이며 자동 확정하지 않음

## 현재 데이터 정제 운영 흐름

- 공고 입력 시 classification이 자동 실행된다.
- 자동 확정값은 `analysis_results`에 저장된다.
- 미확정 후보는 `review_items`에 생성된다.
- 사용자는 `review_items`에서 `confirmed` 또는 `removed`로 정제한다.
- confirmed는 현재 config 자동 반영이 아니라 `review_items` 상태값이다.
- `dictionary_apply`는 동일 raw_value 일괄 확정 기능이다.
- removed는 정제 대상 제외 의미이며, 동일 `field_type + normalized raw_value` 후보 재생성 방지에 활용된다.

## 구성안과 코드 사이 차이

- 구성안은 `seed_data_cleaning_criteria_v3.md`를 archive/참고 문서로 취급하지만, 실제 파일은 아직 `docs/current/` 아래에 남아 있다.
- 구성안은 구형 PRD/handoff 문서의 archive 성격을 전제하지만, 실제 파일 위치는 아직 `docs/current/`이다.
- dashboard summary는 distinct domain count를 계산하지만, charts endpoint는 domain 분포를 아직 제공하지 않는다.
- 현재 `dictionary_apply`는 review_items 일괄 확정 로직일 뿐이며, config 파일 write-back은 구현되어 있지 않다.

## 사람이 먼저 확인할 항목

- `config/*.json` 실제 값과 인코딩 상태 점검
- config 대표값/alias inventory가 현재 정책과 맞는지 최종 확인
- 실데이터 재분석 결과에서 산업/도메인/직무 추출 품질 확인
- 실데이터 classification 품질 검토 문서: `docs/current/classification_real_data_review.md`
- 현재 로컬 DB 기준 1차 검토 후보가 `classification_real_data_review.md`에 누적됨
- config 안전 반영 phase 1 결과와 재분석 검증 결과가 `classification_real_data_review.md`에 기록됨

## Phase 2 진입 전 교차 검토 결과

### 누아 / 웹서비스 기획자

- phase 1 반영 대상 기준 pass 판단은 유지한다.
- 여행 산업/도메인, 서비스 기획, 요구사항 분석, 정책 수립은 원문과 부합한다.
- `IA`는 이번 공고에서 직무 수행 맥락 근거가 약해 오추출 가능성이 있다.
- `IA`는 Information Architecture로 일반 서비스기획 skill일 수 있으므로 config에서 삭제할 대상이 아니라 추출 맥락 조건 강화 대상이다.
- `IATA`는 국제항공운송협회(International Air Transport Association) 약어이며, 누아 원문에서는 회사 소개/인증 기관명 맥락으로 등장한다.
- `IATA`는 채용 직무 수행 skill이나 competency가 아니므로 skill/config 반영 제외 후보로 본다.
- phase 3에서는 `IATA` 같은 기관명/인증명 약어가 skill로 추출되지 않도록 대문자 약어 추출 필터링을 검토한다.
- `IA` 오추출 원인은 `IATA`에서 `IA`가 잘렸을 가능성과 `IATA`와 무관한 대문자 약어 또는 IA 패턴 별도 매칭 가능성을 모두 열어 두고 확인한다.

### 슈퍼진 / 글로벌 서비스 기획/운영

- partial 판단은 유지한다.
- `position_category=서비스 기획`, `UX/UI`, `기능 정의`는 원문과 부합한다.
- 와이어프레임, FAQ, VOC, 정책 수립, 운영 가이드, 서비스 운영, 프로젝트 리딩/런칭 주도, 협업/커뮤니케이션이 누락 후보로 남아 있다.
- 원문에는 서비스 품질 유지, 서비스 개발 및 런칭 주도 맥락도 명확하므로 competency/skill 후보로 후속 분류가 필요하다.
- 산업/도메인은 원문상 게임/콘텐츠 성격이 명확하지만 null로 남아 있으므로 게임/콘텐츠 industry/domain alias 보강이 필요하다.

### 세나 / 서비스 기획 주니어

- phase 1 반영 대상 기준 pass 판단은 유지한다.
- EMR/HIS/OCS, 서비스 기획, 협업은 정상 반영되었다.
- 재분석 결과 `domain_category=헬스케어`, `position_category=서비스 기획`, `extracted_skills=UX/UI, 스토리보드, 와이어프레임, OCS, EMR, HIS`, `extracted_competencies=협업`이 확인되었다.
- `industry_category`는 null로 남아 의료 industry alias 검토가 필요하다.
- 원문에 `클라우드 SaaS EMR`이 명시되어 있으므로 SaaS는 추가 domain 후보로 검토한다.
- `개인건강관리 서비스`는 헬스케어 domain alias 후보로 검토한다.
- `네이버`는 파트너사 고유명사, `오름차트`와 `클레`는 제품 고유명사이므로 config 반영 제외 후보로 둔다.

### 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자

- phase 1 반영 대상 기준 pass 판단은 유지한다.
- AWS/RAG는 정상 반영되었고, Python, SQL, ERD, AI툴활용 등 skill 추출 품질도 개선되었다.
- 재분석 결과 `extracted_skills`에 Python, LLM, SQL, API, AI툴활용, ChatGPT, ERD, HTML/CSS, AWS, RAG, Jira, Slack이 포함되었다.
- `extracted_competencies`에는 기능 정의, 비즈니스 분석이 포함되었고, `unconfirmed_count`는 62에서 53으로 감소했다.
- industry/domain/position은 null로 남아 후속 정책 검토가 필요하다.
- ERP, WMS, Pandas, 프롬프트 엔지니어링은 skill 후보로 둔다.
- `정산`은 이커머스 domain alias 후보이나 문맥 의존성과 오탐 위험이 있어 3순위 보류 항목으로 둔다.
- `Bati CIS`는 제품 고유명사, `COSRX`와 `파마리서치`는 고객사 고유명사이므로 config 반영 제외 후보로 둔다.

### Phase 2 후보 분리 기준

- 안전 후보: 원문 직무 수행 맥락이 명확하고 기존 대표값과 충돌하지 않는 skill/competency/domain alias.
- 보류 후보: 특정 공고에서는 타당하지만 단독 alias로 반영하면 오탐 위험이 있는 항목. 예: `정산 → 이커머스`.
- 제외 후보: 파트너사, 고객사, 제품명, 기관명, 인증명처럼 classification config에 넣으면 안 되는 고유명사.
- IA 오추출 여부와 추출 맥락 조건 강화는 phase 3 classification rule 후보로 검토한다.
- IATA 같은 기관명/인증명 약어는 skill 후보에서 제외하는 필터링을 검토한다.
- 슈퍼진 누락 항목은 config 후보와 classification phase 3 후보로 나누어 분류한다.
- industry/domain alias는 오탐 위험을 검토한 뒤 별도 phase로 진행한다.

## Phase 2 classification/config 후보 분류 상태

- Phase 2 진입 전 후보를 안전 반영 후보 / 보류 후보 / 제외 또는 phase 3 코드 개선 후보로 분류했다.
- 문서 위치: `docs/current/classification_real_data_review.md`의 `Phase 2 후보 분류`.
- 이번 단계에서는 후보 분류만 완료했고 config JSON은 수정하지 않았다.
- backend/frontend/DB 수정도 없다.

다음 작업 기준:

1. 안전 반영 후보 중 `add_representative` 또는 `add_alias` 항목만 config JSON 반영 대상으로 검토한다.
2. `needs_check` 항목은 대표값 정책과 기존 config 존재 여부를 확인한 뒤 반영한다.
3. 보류 후보는 industry/domain/position/복수 도메인 정책 확정 후 별도 phase에서 반영한다.
4. 제외 또는 phase 3 후보는 config에 넣지 않고 classification 추출 로직 개선 또는 stopword/filter 정책으로 별도 처리한다.

## Phase 2 안전 후보 config 반영 상태

- Phase 2 안전 후보 일부를 config JSON에 반영했다.
- 반영한 config 파일:
  - `config/skill-dictionary.json`
  - `config/competency-dictionary.json`
- skill 반영:
  - `ERP` 대표값 추가
  - `WMS` 대표값 추가
  - `프롬프트 엔지니어링`은 기존 대표값이 이미 있어 중복 추가하지 않음
- competency 반영:
  - `FAQ`를 `문서화` alias로 추가
  - `VOC`를 `VOC 설계` alias로 추가
  - `운영 가이드`를 `문서화` alias로 추가
  - `서비스 운영` 대표값 추가
- 이번 단계에서 `config/industry-categories.json`, `config/domain-categories.json`, `config/position-categories.json`, `config/synonym-map.json`은 수정하지 않았다.
- Pandas는 Python alias로 둘지 독립 skill로 둘지 정책 결정이 필요해 이번 단계에서 보류했다.
- config 변경 후 기존 공고는 재분석이 필요하다.
- 사용자가 직접 수행한 phase 2 safe config 재분석 검증 결과:
  - `posting_id=16` 슈퍼진 / 글로벌 서비스 기획/운영: partial
  - `posting_id=17` 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자: pass
- 슈퍼진은 재분석 후 `서비스 운영` competency가 추가 추출되고 `unconfirmed_count`가 27에서 26으로 감소했으나, industry/domain null과 FAQ/VOC/운영 가이드 등 누락 후보가 남아 partial 유지.
- 바티에이아이는 phase 2 safe config 반영 후 사용자 직접 검증 기준 pass로 기록되었다.

다음 작업 후보:

1. 기존 공고 재분석 후 skill/competency 추출 개선 여부 확인
2. Pandas 처리 정책 결정
3. industry/domain 보류 후보 정책 검토
4. IA/IATA 등 오추출 후보는 classification phase 3에서 필터/맥락 조건 개선

## AI Recommendation 검증 방법

Phase AI-1B openai mode는 사용자 로컬에서 `posting_id=16`, `posting_id=17` 기준 호출 성공이 확인되었다. 아래 항목은 회귀 검증이 필요할 때 확인한다.

PowerShell 기준:

```powershell
.\.venv\Scripts\activate
python -m uvicorn backend.app.main:app --reload
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

검증 항목:

- `GET /api/ai-recommendations/postings/{posting_id}` endpoint 노출 확인
- 정상 posting_id 호출 시 HTTP 200, `meta.mode = "mock"`, `meta.saved = false`, `meta.model = null` 확인
- 응답에 `industry_category`, `primary_domain_category`, `position_category`, `skills`, `competencies`, `review_item_candidates` 포함 확인
- 응답에 `domain_categories`가 없는지 확인
- 없는 posting_id 또는 삭제된 posting_id 호출 시 HTTP 404, `error.code = "POSTING_NOT_FOUND"` 확인
- API key 없이 정상 posting_id 호출이 가능한지 확인
- frontend 실행 후 `AI 추천 관리` 화면 진입 확인
- 공고 선택 전 `AI 추천 조회` 버튼 비활성화 확인
- 공고 선택 후 버튼 클릭 시에만 AI 추천 API가 호출되는지 Network 탭에서 확인
- 추천 결과, skills, competencies, review item candidates, meta 표시 확인
- 공고 선택 변경 시 이전 추천 결과와 error 상태가 초기화되는지 확인
- dashboard, postings, review_items 기존 화면 정상 표시 확인

## Removed Review Item 재생성 방지 검증 방법

검증 항목:

- removed 이력이 없는 후보는 기존처럼 `unconfirmed` review_item으로 생성되는지 확인
- 살아있는 posting에 연결된 동일 `field_type + normalized raw_value` removed 이력이 있으면 새 후보가 생성되지 않는지 확인
- 공백만 다른 동일 후보도 normalized raw_value 기준으로 생성되지 않는지 확인
- field_type이 다르면 같은 raw_value라도 생성 가능한지 확인
- 삭제된 posting에만 연결된 removed 이력은 재생성 방지 기준에서 제외되는지 확인
- removed 이력으로 제외된 후보가 `analysis_results.unconfirmed_count`에 포함되지 않는지 확인

## 다음 Codex 작업

1. AI Recommendation History 설계
   - AI 추천 결과를 저장하는 히스토리 관리 구조의 backend 1차 구현은 완료되었다.
   - 상세 기준은 `docs/current/11_ai_recommendation_history_plan.md`를 따른다.
   - frontend API client와 `App.jsx`는 POST `/runs`로 1차 연결되었다.
   - history 목록 UI 1차 연결은 완료되었다.
   - history 상세 UI 1차 연결은 완료되었다.
   - history 비교 UI 1차 연결은 완료되었다.
   - 선택 반영 UI는 1차 구현 완료이며, 다음 단계에서는 항목별 반영 상태 표시를 고도화한다.
   - `model`, `prompt_version`, `mode`, `recommendation_json`, `created_at` 관리 기준을 정한다.
   - API key, raw prompt, raw OpenAI response 전체는 저장하지 않는다.
   - 저장 대상은 openai mode 성공 결과를 우선으로 검토한다.
   - mock 결과 저장 여부는 별도 결정한다.
   - 1차 history 저장 구현에서는 `applied_status`와 `applied_items_json` 컬럼을 둔다.
   - POST /runs 전환 시 frontend 영향 범위는 `frontend/src/api/aiRecommendationsApi.js`와 `frontend/src/App.jsx`다.
   - 기존 GET endpoint는 호환성을 위해 유지하거나 deprecated 처리 검토가 필요하다.
   - frontend 변경 범위를 최소화하려면 GET 유지 + 내부 저장 방식이 빠르지만, 장기적으로는 POST /runs가 더 적절하다.
   - review_items/dictionary_candidates 반영은 history 설계 이후 검토한다.
   - 선택 반영 UI는 1차 연결 완료이며, `applied_status` 표시 고도화는 후속 단계로 유지한다.

2. AI Recommendation 선택 반영
   - 정책 문서 작성은 완료되었다: `docs/current/12_ai_recommendation_selective_apply_policy.md`
   - `applied_items_json` DB 스키마 보완은 완료되었다.
   - 선택 반영 backend API 구현은 완료되었다.
   - frontend 선택 반영 UI 구현은 완료되었다.
   - 1차 반영 위치는 `review_items`이며, `dictionary_candidates`는 후속 구조 확정 후 검토한다.
   - industry/domain/position은 1차 반영 대상에서 제외한다.
   - 기존 `unconfirmed`는 사용자가 선택 반영할 때만 `confirmed` 갱신한다.
   - `removed` 이력은 존중해 되살리지 않는다.
   - history 상세/비교 화면에 반영 상태와 applied result를 표시하는 UI를 검토한다.

3. AI Recommendation 실제 응답 품질 검토 추가
   - 세나, 누아, 슈퍼진, 바티에이아이 결과를 비교한다.
   - prompt 개선 전후 차이를 기록한다.
   - `review_item_candidates` 과다 후보와 중복 후보 여부를 검토한다.
   - skills/competencies 분리 품질과 고유명사 제외 품질을 확인한다.

4. Streaming UX 개선 검토
   - 현재는 후속 후보로만 둔다.
   - Structured Outputs 완성 JSON 구조와 충돌 가능성이 있으므로 별도 설계가 필요하다.
   - frontend 응답 방식, JSON 조립, error 처리 설계가 필요하다.

4. removed 이력 기반 후보 제외 고도화
   - 현재 구현은 동일 `field_type + normalized raw_value` 기준만 적용한다.
   - 유사 표현 제외는 후속 고도화로 둔다.
   - confirmed 이력 재사용은 별도 정책 결정 후 검토한다.

5. 실데이터 classification 품질 검토와 config 반영
   - config 안전 반영 phase 1은 `posting_id=14` 세나, `posting_id=17` 바티에이아이 재분석에서 phase 1 반영 대상 기준 pass로 기록되었다.
   - phase 2 안전 후보 일부는 `config/skill-dictionary.json`과 `config/competency-dictionary.json`에 반영되었다.
   - phase 2 안전 후보 config 변경 후 사용자 직접 재분석 검증이 일부 완료되었다. `posting_id=16` 슈퍼진은 partial, `posting_id=17` 바티에이아이는 pass로 기록되었다.
   - phase 2 진입 전 교차 검토 결과는 이 문서의 `Phase 2 진입 전 교차 검토 결과`와 `docs/current/classification_real_data_review.md`를 기준으로 확인한다.
   - phase 2 config 후보는 `docs/current/classification_real_data_review.md`의 `Phase 2 후보 분류` 기준에 따라 안전 반영 후보 / 보류 후보 / 제외 또는 phase 3 코드 개선 후보로 분리되어 있다.
   - 안전 반영 후보 중 `add_representative` 또는 `add_alias`만 다음 config 반영 대상으로 검토한다.
   - `needs_check` 항목은 대표값 정책과 기존 config 존재 여부를 먼저 확인한다.
   - IA 오추출 여부와 추출 맥락 조건 강화를 검토한다.
   - IATA 같은 기관명/인증명 약어는 skill 후보에서 제외하는 필터링을 검토한다.
   - 슈퍼진 누락 항목은 classification phase 3 후보 또는 config 후보로 분류한다.
   - industry/domain alias는 오탐 위험을 검토한 뒤 별도 phase로 진행한다.
   - 아직 재분석하지 않은 기존 공고는 필요 시 같은 기준으로 `analysis_results`와 `review_items` 개선 여부를 확인한다.
   - 보류한 industry/domain alias 정책을 검토한다.
   - hold/question 후보는 추가 공고 사례를 보고 대표값 또는 정책을 결정한다.
   - 반복 오추출은 classification phase 3 후보로 기록한다.
   - 다음 config 반영 전 `docs/current/classification_real_data_review.md`의 confirm 후보와 보류 사유를 재확인한다.

주의:

- config inventory 점검은 사람이 먼저 확인할 항목이지, Codex의 즉시 개발 작업이 아니다.
- AI recommendation은 자동 확정이 아니라 사용자 검토용 추천이다.
- openai mode 호출은 비용이 발생한다.
- AI 추천은 사용자가 버튼을 눌렀을 때만 호출한다.
- 공고 저장/수정 시 AI 자동 호출은 금지한다.
- debug mode는 검증 시에만 켜고 평소에는 끈다.
- OpenAI API key는 frontend에 두지 않고 backend 환경변수로만 관리한다.
## AI Recommendation Selective Apply UI 현행화

- frontend 선택 반영 UI 1차 구현이 완료되었다.
- `frontend/src/api/aiRecommendationsApi.js`에 `applyAiRecommendationItems(runId, items)` client를 추가했다.
- history 상세/비교 화면에서 skill/competency 항목을 선택해 `POST /api/ai-recommendations/history/{run_id}/apply`를 호출할 수 있다.
- 선택 반영 대상은 skills, competencies, review_item_candidates 중 `field_type=skill|competency` 항목이다.
- industry/domain/position 항목은 1차 선택 반영 UI에서 제외한다.
- `source_path`는 저장된 recommendation 원본 배열 index 기준을 유지한다. 필터링된 `review_item_candidates`의 렌더링 index를 사용하지 않는다.
- 선택 반영 성공 결과는 `applied_items`와 `skipped_items`로 표시한다.
- apply 성공 후 history 목록을 refresh하고, 현재 선택된 상세 run은 상세 API로 재조회한다.
- backend 응답의 `applied_status`만 로컬 state에 직접 반영하지 않고 재조회 결과를 기준으로 화면을 갱신한다.
- AI 추천 화면의 주요 label/컬럼명은 한글로 정리했다.
- 다음 작업 후보는 applied result를 history 상세/비교 항목별로 표시하는 고도화, dictionary_candidates 구조 설계, 선택 반영 UX 개선이다.
## AI Recommendation Phase AI-4 완료 및 다음 우선순위

### 현재 상태

- Phase AI-4 1차 구현 완료
- 선택 반영 backend API 구현 완료: `POST /api/ai-recommendations/history/{run_id}/apply`
- 선택 반영 frontend UI 구현 완료
- 사용자 로컬에서 선택 반영 정상 작동 확인
- 선택 항목의 `review_items` 반영 확인
- 선택 반영 결과 `applied_items`/`skipped_items` 표시
- AI 추천 화면 label/컬럼명 한글화 완료
- 선택 반영은 `review_items` 대상으로만 수행한다.
- `dictionary_candidates` 연동은 후속 단계다.

### 다음 작업 우선순위

1. AI 추천 품질 검증 문서화
   - 기존 4개 공고 기준 규칙 기반 결과와 AI 추천 결과 비교
   - 규칙 기반 단독 / AI 단독 / 합산 매칭률 / 오추출률 산출
   - 필요 시 2~3개 공고 추가

2. classification phase 3 개선
   - AI 추천 품질 검증 결과를 바탕으로 반복 누락/오추출 패턴 개선
   - IA/IATA, 고유명사/기관명, 대문자 약어 필터링 등 검토

3. 선택 반영 결과 표시 고도화
   - `applied_items_json` 기반 항목별 반영 상태 표시
   - skipped 사유 표시 고도화

4. dictionary_candidates 구조 설계
   - `review_items` confirmed 결과를 config 후보로 연결하는 구조
   - 품질 검증과 classification 개선 이후 진행

### AI 추천 품질 검증 기준

- 기존 4개 공고: 누아, 슈퍼진, 세나, 바티에이아이
- 추가 권장 공고: 금융/핀테크, 교육/에듀테크, 문맥 의존 표현이 많은 공고 중 2~3개
- 총 6~8개 공고 기준 1차 방향성을 판단한다.
- HR 페르소나 기대값 기준으로 비교한다.
- 오추출 항목은 별도 목록화한다.
  - 기획 직무에 불필요한 기술 스택
  - 고유명사/기관명
  - 태도/성향 표현
## AI Recommendation 품질 검증 다음 작업

- 다음 우선순위는 AI 추천 품질 검증이다.
- 품질 검증 문서: `docs/current/13_ai_recommendation_quality_validation.md`
- 검증 대상은 기존 4개 공고인 누아, 슈퍼진, 세나, 바티에이아이부터 시작한다.
- 필요 시 금융/핀테크, 교육/에듀테크, 문맥 의존 표현이 많은 공고 중 2~3개를 추가한다.
- 후속 순서는 품질 검증 → classification phase 3 → 선택 반영 결과 표시 고도화 → dictionary_candidates 구조 설계다.

## Classification Phase 3-A 안전 개선

다음 classification 구현 작업 후보는 Phase 3 전체가 아니라 Phase 3-A 안전 개선으로 한정한다. 이 범위는 `docs/current/classification_real_data_review.md`의 `Classification Phase 3 후보 범위 분리` 기준을 따른다.

목표:

- `IATA` 같은 기관명/인증명 약어가 skill/competency로 추출되지 않게 한다.
- `IA`는 직무 수행 맥락이 없으면 skill로 추출되지 않게 한다.
- 정상 약어/기술인 `EMR`, `HIS`, `OCS`, `SQL`, `ERD`, `AWS`, `RAG`, `API`는 유지한다.

범위:

- 즉시 구현 대상:
  - IATA/기관명/인증명 stopword 또는 맥락 필터
  - 대문자 약어 추출 맥락 조건 강화

- 보류 대상:
  - 회사 기술스택과 직무 직접 요구 기술 구분
  - Slack/HTML/CSS 일괄 필터링
  - 직무 유형별 기술스택 필터

검증 기준:

- 누아: `IATA`, 직무 맥락 없는 `IA` 제거
- 세나: `EMR`, `HIS`, `OCS` 유지
- 슈퍼진: `UX/UI` 유지
- 바티에이아이: `SQL`, `ERD`, `AWS`, `RAG`, `API` 유지

주의:

- 단순 대문자 약어 전체 제거 금지
- config JSON 수정 금지
- 정상 skill 약어 회귀 발생 시 실패로 판단
- 구현 후 `classification_real_data_review.md`에 재분석 결과 기록
