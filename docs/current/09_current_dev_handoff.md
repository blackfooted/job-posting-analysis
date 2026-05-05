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

- 현재 AI Recommendation은 Phase AI-1 완료 및 Phase AI-1B backend mode 분기 구현 상태
- backend AI recommendation API 1차 Mock 구현 존재
- endpoint: `GET /api/ai-recommendations/postings/{posting_id}`
- 저장된 공고를 `posting_id`로 조회한 뒤 Mock recommendation JSON 반환
- 공고가 없거나 삭제된 경우 `POSTING_NOT_FOUND` 404 반환
- 기본 mode는 mock이며 OpenAI 결제/API key 없이 Swagger 테스트 가능
- `AI_RECOMMENDATION_MODE=openai`일 때 OpenAI API 호출 경로 존재
- OpenAI SDK import는 openai mode 호출 시점에만 수행
- OpenAI SDK 의존성은 `backend/requirements.txt`의 `openai>=1.0.0` 기준으로 관리
- openai mode 실제 호출 검증은 `OPENAI_API_KEY` 설정 후 가능
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
- OpenAI 실제 재검증은 API key가 설정된 사용자 로컬 환경에서 수행해야 한다.
- `AI_RESPONSE_PARSE_FAILED` 원인 확인용 제한 debug 로그가 있다.
- debug 로그는 `AI_RECOMMENDATION_DEBUG=1`일 때만 출력되며 기본 비활성화다.
- debug 로그는 response 구조 요약, 추출 raw text 길이/빈 문자열 여부/JSON 시작·종료 여부/앞 200자 preview, parse 실패 위치 정보를 출력한다.
- OpenAI API key, request payload, full raw response는 로그나 API 응답에 포함하지 않는다.
- endpoint와 응답 구조는 유지
- Mock mode는 유지

Phase AI-1B에서도 아래는 제외한다.

- review_items 반영
- analysis_results 갱신
- config 수정
- `domain_categories` 추가
- dictionary_candidates 연동

Phase AI-3/AI-4는 dictionary_candidates 구조 완료 후 검토한다.

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

1. AI Recommendation Phase AI-1B 검증 및 의존성 정리
   - `AI_RECOMMENDATION_MODE=mock`에서 기존 Mock 응답이 유지되는지 확인한다.
   - `AI_RECOMMENDATION_MODE`가 허용값 외 값이면 `AI_CONFIG_INVALID`가 반환되는지 확인한다.
   - `AI_RECOMMENDATION_MODE=openai`이고 `OPENAI_API_KEY`가 없으면 `AI_CONFIG_MISSING`이 반환되는지 확인한다.
   - `OPENAI_API_KEY` 설정 후 `AI_RECOMMENDATION_MODE=openai` 실제 호출을 사용자 로컬에서 재검증한다.
   - `OPENAI_MODEL` 기본값은 `gpt-5.4-nano`로 유지한다.
   - OpenAI 응답 구조는 Responses API + Structured Outputs schema로 강제한다.
   - endpoint `GET /api/ai-recommendations/postings/{posting_id}`와 응답 구조는 유지한다.
   - DB 저장 없는 조회형 API 원칙을 유지한다.
   - review_items 반영, analysis_results 갱신, config 수정, domain_categories 추가, dictionary_candidates 연동은 제외한다.
   - frontend는 원칙적으로 수정하지 않는다.

2. removed 이력 기반 후보 제외 고도화
   - 현재 구현은 동일 `field_type + normalized raw_value` 기준만 적용한다.
   - 유사 표현 제외는 후속 고도화로 둔다.
   - confirmed 이력 재사용은 별도 정책 결정 후 검토한다.

3. AI recommendation 추천 결과 저장/반영 정책 결정
   - 추천 결과를 review_items에 반영할지 여부와 저장 범위를 별도 정책으로 정의한다.
   - AI recommendation은 자동 확정이 아니라 사용자 검토용 추천으로 유지한다.

4. 복수 도메인 저장 구조와 API 형태 정의
   - AI recommendation 응답 구조의 `domain_categories` 배열과 연관되므로 실제 구조 확정 이후 진행을 권장한다.
   - 후속 목표는 대표 도메인 1개 + 전체 도메인 N개 구조다.
   - 현재는 `analysis_results.domain_category` 단일값 구조임을 유지해서 명시한다.

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
