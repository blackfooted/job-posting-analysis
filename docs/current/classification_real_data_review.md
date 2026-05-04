# Classification Real Data Review

## 문서 목적

실제 채용공고 분석 결과를 기준으로 classification 품질을 검토하고, config 보강 후보를 누적 관리한다.

이 문서는 config/*.json을 직접 수정하기 전 검토용 문서다.

## 검토 원칙

- confirmed 후보만 config 반영 대상으로 검토한다.
- 판단이 애매한 후보는 hold로 남긴다.
- 불필요하거나 잘못 추출된 후보는 remove로 분류한다.
- config 반영은 별도 Codex 작업에서 수행한다.
- 산업, 도메인, 직무, skill, competency는 서로 구분해서 관리한다.
- 동일 alias 중복 추가는 피한다.
- 현재 DB는 단일 domain_category 구조이므로 복수 도메인 판단은 별도 메모로 남긴다.

## 검토 상태값

| status | 의미 |
|---|---|
| confirm | config 반영 후보 |
| hold | 추가 판단 필요 |
| remove | config 반영하지 않음 |
| question | 정책 결정 필요 |

## 검토 테이블

| no | source_posting | field_type | raw_value | suggested_value | status | reason | config_target | note |
|---:|---|---|---|---|---|---|---|---|

## field_type 기준

| field_type | 의미 | config target |
|---|---|---|
| industry | 회사 수준 산업 분류 | config/industry-categories.json |
| domain | 제품/서비스 도메인 분류 | config/domain-categories.json |
| position | 포지션 카테고리 | config/position-categories.json |
| skill | 도구, 기술, 명시적 skill | config/skill-dictionary.json |
| competency | 업무 역량 또는 수행 능력 | config/competency-dictionary.json |

## 검토 예시

| no | source_posting | field_type | raw_value | suggested_value | status | reason | config_target | note |
|---:|---|---|---|---|---|---|---|---|
| 1 | 예시회사 / 서비스기획 | competency | 유관부서 조율 | 협업 | hold | 표현이 넓어 단일 역량으로 확정하기 어려움 | competency-dictionary.json | 추가 사례 필요 |
| 2 | 예시회사 / 서비스기획 | skill | Jira 사용 경험 | Jira | confirm | 명시적 툴 표현 | skill-dictionary.json | alias 후보 |
| 3 | 예시회사 / 서비스기획 | competency | 경험한 우대합니다. 분석 |  | remove | 문장 찌꺼기 오추출 |  | removed 처리 후보 |

## 발견 이슈

### 누락 후보

| no | posting | expected_value | field_type | evidence | note |
|---:|---|---|---|---|---|

### 오추출 후보

| no | posting | raw_value | field_type | reason | suggested_action |
|---:|---|---|---|---|---|

### 복수 도메인 후보

| no | posting | primary_domain | additional_domains | reason | note |
|---:|---|---|---|---|---|

## config 반영 후보 요약

### industry-categories.json

| representative | alias_candidate | status | note |
|---|---|---|---|

### domain-categories.json

| representative | alias_candidate | status | note |
|---|---|---|---|

### position-categories.json

| representative | alias_candidate | status | note |
|---|---|---|---|

### skill-dictionary.json

| representative | alias_candidate | status | note |
|---|---|---|---|

### competency-dictionary.json

| representative | alias_candidate | status | note |
|---|---|---|---|

## 다음 작업 후보

- confirm 상태 alias 후보를 config JSON에 반영
- hold 상태 후보 추가 검토
- remove 상태 후보가 반복되면 removed 처리 또는 classification phase 3 개선 후보로 기록
- 복수 도메인 구조 도입 전까지 primary_domain 기준을 별도 관리
