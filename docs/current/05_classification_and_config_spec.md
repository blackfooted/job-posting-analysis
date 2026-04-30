# Classification And Config Spec

> 이 문서는 `seed_data_cleaning_criteria_v3.md`를 대체하는 현행 classification 기준 문서다.  
> `seed_data_cleaning_criteria_v3.md`는 참고 문서로만 유지하며, 현재 개발 기준은 본 문서를 따른다.

## field_type 정의

review_items 검증 로직과 classification 출력 기준으로 확인한 현재 field_type:

| field_type | 의미 |
|---|---|
| `industry` | 회사 수준 산업 분류 |
| `domain` | 제품/서비스 도메인 분류 |
| `position` | 포지션 카테고리 |
| `skill` | 도구, 기술, 명시적 skill 항목 |
| `competency` | 업무 역량 또는 수행 능력 |

## 현재 허용 산업 대표값

현행 config 기준으로 사용하는 산업 대표값은 다음과 같다.

- 커머스
- 금융
- 게임
- 교육
- 여행
- 의료
- 마케팅
- 콘텐츠
- IT
- 부동산
- 자동차

주의:

- IT, 부동산, 자동차는 기존 seed 기준 이후 추가된 현행 대표값이다.
- 산업은 회사의 주된 제품 또는 수익 모델 기준으로 판단한다.
- SW / 솔루션 / SaaS / 플랫폼 기업은 산업 기준에서 IT로 볼 수 있다.

## 현재 허용 도메인 대표값

현행 config 기준으로 사용하는 도메인 대표값은 다음과 같다.

- 이커머스
- 금융
- 게임
- 교육
- 여행
- 의료
- 마케팅
- 부동산
- 모빌리티
- SaaS
- HR
- 헬스케어
- 미디어
- 제조
- 물류

주의:

- 부동산, 모빌리티, SaaS, HR, 헬스케어, 미디어, 제조, 물류는 현행 config 보강 과정에서 추가된 도메인 대표값이다.
- 도메인은 제품/서비스가 다루는 시장 또는 업무 영역 기준으로 판단한다.
- 현재 DB는 `analysis_results.domain_category` 단일값 구조다.
- 후속 개선에서는 `posting_domains` 별도 테이블을 통해 대표 도메인 1개와 전체 도메인 N개를 관리하는 구조를 도입할 예정이다.

## Classification 개선 이력

### Phase 1 — 완료

목적:

- raw data에서 문장 전체가 `review_items.raw_value`로 들어가는 문제를 줄인다.
- line/segment 기반 후보 분리 품질을 개선한다.

주요 변경:

- bullet/list 문장 전체 `raw_value` 저장 방지
- `및/또는` 과분리 방지
- `데이터`, `서비스`, `팀`, `개발`, `디자인` 같은 단독 일반 명사 후보 제외
- industry/domain 매칭 대상 필드 확장
  - `industry_memo`
  - `duties`
  - `requirements`
  - `preferred`

### Phase 2 — 코드 반영, 실데이터 기반 추가 검증 필요

목적:

- 주요 후보 누락을 줄이고, 특정 오추출 케이스를 보완한다.

주요 변경:

- `COMPOUND_CANDIDATES` / `SKILL_CANDIDATES` 누락 항목 추가
- 서비스 개선 / 데이터 분석 추출 조건 정교화
- QA 추출 조건 보완
- phase 1 실테스트에서 나온 문장 찌꺼기 후보 일부 제거
  - 예: `경험한 우대합니다. 분석`
  - 예: `대한 이해와 개선`
- `커뮤니케이션과 히스토리 관리`를 더 작은 후보로 분리

주의:

- classification phase 2는 코드 반영 상태이나, 실공고 기준 추가 검증이 필요하다.
- 실데이터에서 발견되는 누락/오추출은 phase 3 후보로 기록한다.
- 실테스트에서 추가 누락/오추출이 발견되면 phase 3 후보로 `09_current_dev_handoff.md`에 기록한다.
- phase 2는 코드 반영 상태이나, 실데이터 검증 결과에 따라 phase 3 개선 범위를 별도로 정의한다.

## 현재 classification 흐름

`backend/app/classification.py`에서 확인한 현재 구현:

1. `load_all_configs()`로 필수 JSON config를 로드한다.
2. 공고 텍스트를 분석용으로 정규화한다.
3. 지정된 소스 필드에서 industry 단일 매칭을 시도한다.
4. 지정된 소스 필드에서 domain 단일 매칭을 시도한다.
5. `position` 필드에서 exact-or-alias 방식으로 position 매칭을 시도한다.
6. `tools`를 분리해 skill dictionary contains 매칭을 시도한다.
7. 여러 텍스트 필드에서 패턴 추출로 skill, competency, review item 후보를 생성한다.
8. category 값, 추출 배열, review item 초안을 저장한다.

## 현재 코드가 사용하는 소스 필드

`classification.py` 상수 기준 현재 구현:

- category 매칭 소스 필드
  - `industry_memo`
  - `duties`
  - `requirements`
  - `preferred`
- 패턴 추출 소스 필드
  - `duties`
  - `requirements`
  - `preferred`
  - `tools`
  - `industry_memo`
  - `raw_text`

## 현재 매칭 동작

소스코드에서 확인한 현재 구현:

- industry와 domain은 정확히 1개 category만 매칭될 때만 자동 확정된다.
- industry 또는 domain이 확정되지 않고 `industry_memo`가 비어 있지 않으면, 현재 코드는 `industry_memo`를 기반으로 review item을 생성한다.
- position은 `position` 필드에서 exact-or-alias 방식으로 매칭한다.
- `tools` 기반 skill 추출은 contains-style alias 매칭을 사용한다.
- 추가 skill/competency 후보는 정규화된 라인 단위 패턴 추출로 생성한다.
- `analysis_results.unconfirmed_count`는 분석 시 생성된 review item 수를 기준으로 저장된다.

## 현재 config 파일

`backend/app/config_loader.py`에서 확인한 필수 config:

- `config/industry-categories.json`
- `config/domain-categories.json`
- `config/position-categories.json`
- `config/competency-dictionary.json`
- `config/skill-dictionary.json`
- `config/synonym-map.json`

## config와 코드의 현재 관계

확인한 소스코드 기준:

- classification 로직은 industry, domain, position, skill, competency config 파일을 직접 참조한다.
- `synonym-map.json`은 필수 config로 로드된다.
- 다만 확인한 `classification.py` 흐름에서는 `synonym-map.json`의 직접 사용이 확인되지 않았다.

## Config 운영 사이클

config는 자동 생성하지 않고, 사용자가 검토한 alias 후보를 기반으로 단계적으로 보강한다.

현재 권장 운영 사이클:

1. 사용자가 실제 채용공고를 frontend에 입력한다.
2. classification 결과와 review_items 후보를 확인한다.
3. 별도 데이터 정제 채팅방에서 공고 원문 기반 alias 후보를 검수한다.
4. alias 후보를 `alias_candidates.md` 같은 정리 문서로 누적한다.
5. Codex 지시문으로 config JSON 파일에 반영한다.
6. 기존 공고는 `PUT /api/postings/{posting_id}`로 재저장해 재분석한다.
7. `GET /api/postings/{posting_id}/analysis`와 데이터 정제 관리 화면에서 개선 결과를 확인한다.

config 반영 원칙:

- confirmed 후보만 config에 반영한다.
- review / hold / remove 후보는 바로 반영하지 않는다.
- 대표값 추가와 alias 추가는 구분한다.
- 중복 alias는 추가하지 않는다.
- Industry / Domain / Position / Skill / Competency는 서로 다른 config 파일에 관리한다.
- 판단이 애매한 표현은 config에 넣지 않고 검토 대상으로 남긴다.

주의:

- `dictionary_apply=1`은 config 파일 write-back이 아니다.
- config 변경은 기존 분석 결과에 자동 반영되지 않는다.
- config 변경 후 기존 공고는 재분석이 필요하다.

## 현행 정책 기준

현재 개발 기준으로 사용할 정책:

- 산업은 회사의 주된 제품 또는 수익 모델 기준이다.
- 도메인은 제품/서비스가 다루는 시장 또는 업무 영역 기준이다.
- 현재 DB 구조는 `analysis_results.domain_category`에 대표 도메인 1개만 저장한다.
- 후속 개선에서는 공고 1건당 도메인 N개 저장을 위한 별도 구조가 필요하다.
- 목표 구조는 대표 도메인 1개 + 전체 도메인 N개다.
- 대시보드도 후속 구조에서는 대표 도메인만이 아니라 전체 도메인 기준 집계를 목표로 한다.

## 현재 구현과 후속 정책의 구분

소스코드에서 확인한 현재 구현:

- 현재는 단일 `domain_category` 저장만 존재한다.
- `posting_domains` 같은 별도 도메인 테이블은 없다.
- config 자동 write-back 흐름은 확인되지 않았다.

후속 계획:

- 별도 도메인 테이블 구조 정의
- config 유지보수 방식을 문서화
- 확정 review 결과를 향후 config 또는 classification에 연결할지 정책 결정
