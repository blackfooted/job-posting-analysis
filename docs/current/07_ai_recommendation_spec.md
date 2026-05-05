# AI Recommendation Spec

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

### Phase AI-1B — 다음 구현 범위

구현 상태:

- backend mode 분기 구현 완료
- `AI_RECOMMENDATION_MODE=mock` 기본 동작 유지
- `AI_RECOMMENDATION_MODE=openai`일 때 OpenAI 호출 경로 추가
- OpenAI 호출은 Responses API와 `text.format` json_schema Structured Outputs를 사용
- OpenAI 응답 JSON parse 및 normalize/검증 경로 추가

구현 범위:

- Mock recommendation 호출을 실제 OpenAI 호출로 교체할 수 있는 mode 분기
- 기존 endpoint 유지
- 기존 frontend 표시 구조 유지
- OpenAI API key가 설정되고 mode가 `openai`일 때만 실제 호출
- mode가 `mock`이거나 미설정이면 기존 Mock 응답 유지
- DB 저장 없음
- review_items 반영 없음
- analysis_results 갱신 없음

### Phase AI-2 — 후속

- 실제 AI 연동 결과의 UI 표시 품질 점검
- loading/error/empty 상태 고도화
- 비용/토큰 안내 또는 mode 표시 개선 검토

### Phase AI-3 — 후속

- AI 추천 결과를 review_items 또는 dictionary_candidates에 선택 반영할지 검토
- dictionary_candidates 구조 완료 후 진행 여부 판단

### Phase AI-4 — 후속

- 개별 review_item 단위 AI 추천 고도화
- 후보별 대표값/field_type 추천

## 현재 상태

확인한 소스코드 기준 현재 구현:

- backend AI recommendation API 1차 Mock 구현이 있다.
- Phase AI-1B backend mode 분기가 구현되어 있다.
- `backend/app/main.py`에 AI router가 등록되어 있다.
- endpoint: `GET /api/ai-recommendations/postings/{posting_id}`
- 기본 mode는 Mock recommendation 응답으로 Swagger 검증하는 단계다.
- `AI_RECOMMENDATION_MODE=openai`일 때만 OpenAI API 호출을 시도한다.
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

## 후속 단계

- Phase AI-1B: backend mode 분기 구현 완료. 실제 OpenAI SDK 의존성 설치 및 key 설정 후 openai mode 검증 필요
- Phase AI-2: 실제 OpenAI 연동 결과의 UI 표시 점검
- Phase AI-3: dictionary_candidates 구조 완료 후 AI 추천 결과 선택 반영 검토
- Phase AI-4: 개별 review_item 단위 추천 고도화

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
