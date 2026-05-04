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

- backend AI recommendation API 1차 Mock 구현 존재
- endpoint: `GET /api/ai-recommendations/postings/{posting_id}`
- 저장된 공고를 `posting_id`로 조회한 뒤 Mock recommendation JSON 반환
- 공고가 없거나 삭제된 경우 `POSTING_NOT_FOUND` 404 반환
- OpenAI API 호출 없음
- OpenAI SDK 추가 없음
- OpenAI 결제/API key 없이 Swagger 테스트 가능
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
- config JSON 직접 수정은 아직 하지 않음

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

1. AI recommendation 실제 OpenAI 연동
   - OpenAI API 결제/API key 설정 후 Mock 추천 함수를 실제 `gpt-4o-mini` 호출로 교체한다.
   - 다른 backend 모듈이 OpenAI SDK에 직접 의존하지 않도록 `ai_recommendations.py` 내부에 provider 로직을 유지한다.
   - DB 저장 없는 조회형 API 원칙은 유지한 뒤 저장/반영 정책은 별도 단계에서 결정한다.
   - frontend는 실제 OpenAI 연동 이후에도 사용자 버튼 트리거 원칙을 유지한다.

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
   - `docs/current/classification_real_data_review.md`의 confirm 후보를 검토한 뒤 별도 config 반영 작업을 진행한다.
   - hold/question 후보는 추가 공고 사례를 보고 대표값 또는 정책을 결정한다.
   - 반복 오추출은 classification phase 3 후보로 기록한다.
   - config 반영 후 기존 공고는 재분석해 누락/오추출 개선 여부를 확인한다.

주의:

- config inventory 점검은 사람이 먼저 확인할 항목이지, Codex의 즉시 개발 작업이 아니다.
- AI recommendation은 자동 확정이 아니라 사용자 검토용 추천이다.
