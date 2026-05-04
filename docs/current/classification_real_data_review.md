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
| 1 | 세나 / 서비스 기획 주니어 | position | 서비스 기획 주니어 | 서비스 기획 | confirm | 직무 대표값이 명확하고 주니어 수식어만 붙은 표현 | position-categories.json | alias 후보 |
| 2 | 누아 / 웹서비스 기획자 | position | 웹서비스 기획자 | 서비스 기획 | confirm | 웹서비스 기획 직무 표현이며 기존 서비스 기획 계열로 묶을 수 있음 | position-categories.json | 기존 approved_value는 웹기획자이나 대표값 정합성 재검토 필요 |
| 3 | 세나 / 서비스 기획 주니어 | competency | 원활한 커뮤니케이션 | 협업 | confirm | 협업/커뮤니케이션 역량 표현으로 반복 가능성이 높음 | competency-dictionary.json | 협업 alias 후보 |
| 4 | 누아 / 웹서비스 기획자 | competency | 요구사항 수집 분석 | 요구사항 분석 | confirm | 요구사항 분석 대표값으로 명확히 매핑 가능 | competency-dictionary.json | 현재 confirmed 이력 존재 |
| 5 | 세나 / 서비스 기획 주니어 | skill | EMR | EMR | confirm | 병원정보시스템 관련 명시적 시스템/약어 | skill-dictionary.json | HIS/OCS와 함께 의료 도메인 툴 후보 |
| 6 | 세나 / 서비스 기획 주니어 | skill | HIS | HIS | confirm | 병원정보시스템 관련 명시적 시스템/약어 | skill-dictionary.json | EMR/OCS와 함께 검토 |
| 7 | 세나 / 서비스 기획 주니어 | skill | OCS | OCS | confirm | 병원정보시스템 관련 명시적 시스템/약어 | skill-dictionary.json | EMR/HIS와 함께 검토 |
| 8 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | skill | AWS | AWS | confirm | 명시적 클라우드 기술 스택 | skill-dictionary.json | 하위 AWS 서비스와 대표값 분리 여부 검토 |
| 9 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | skill | RAG | RAG | confirm | LLM/AI 시스템 관련 명시적 기술 | skill-dictionary.json | AI/LLM 기술 alias 후보 |
| 10 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | domain | 정산 | 이커머스 | confirm | 이커머스 정산/재고 솔루션 맥락의 도메인 표현 | domain-categories.json | 단독 정산을 이커머스 alias로 둘지 검토 |
| 11 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | skill | Cursor | AI툴활용 | confirm | 명시적 AI 코딩 도구 | skill-dictionary.json | 현재 config에 alias가 있어 재분석 후보일 수 있음 |
| 12 | 누아 / 웹서비스 기획자 | skill | IATA | IATA | hold | 항공 유통 표준/기관 성격이 있어 skill로 둘지 애매함 | skill-dictionary.json | 여행/항공 도메인 전용 후보 |
| 13 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | competency | 데이터 흐름 | 시스템 설계 | hold | 데이터 흐름 이해/설계 역량으로 보이나 대표값 확정 필요 | competency-dictionary.json | 데이터 파이프라인/시스템 설계 중 선택 필요 |
| 14 | 슈퍼진 / 글로벌 서비스 기획/운영 | competency | 서비스 운영 | 프로세스 관리 | hold | 의미는 있으나 서비스 운영을 별도 역량으로 둘지 정책 필요 | competency-dictionary.json | 운영/프로세스 관리 대표값 검토 |
| 15 | 슈퍼진 / 글로벌 서비스 기획/운영 | domain | 상품 |  | remove | 게임/서비스 공고에서 상품 단어만 도메인으로 분리된 과추출 |  | classification phase 3 후보 |
| 16 | 슈퍼진 / 글로벌 서비스 기획/운영 | domain | 결제 |  | question | 유료 결제 모델 맥락이나 도메인으로 확정할지 정책 필요 | domain-categories.json | 복수 도메인 구조와 연결해 검토 |
| 17 | 누아 / 웹서비스 기획자 | skill | SBA |  | remove | 투자/기관명 맥락으로 skill 가치 낮음 |  | config 반영 금지 |
| 18 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | skill | NEST |  | remove | 지원사업/선정 이력 약어로 skill 가치 낮음 |  | config 반영 금지 |
| 19 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | skill | IDE |  | remove | 너무 넓은 일반 개발환경 표현 |  | config 반영 금지 |
| 20 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | competency | 함께 설계 |  | remove | 문장 일부가 잘린 표현 |  | removed 처리 또는 phase 3 후보 |

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
| 1 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | IT | industry | Commerce Intelligence Solution, AI 도구, 데이터 파이프라인, API, LLM 중심 솔루션 기업 | analysis_results.industry_category가 null |
| 2 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | SaaS | domain | B2B SaaS, 자동화 솔루션, CIS 솔루션 설계 | analysis_results.domain_category가 null |
| 3 | 슈퍼진 / 글로벌 서비스 기획/운영 | 게임 | industry | 글로벌 소셜 콘텐츠 & 게임 개발사, 인스턴트 게임 플랫폼 | analysis_results.industry_category가 null |
| 4 | 슈퍼진 / 글로벌 서비스 기획/운영 | 게임 | domain | 페이스북 인스턴트 게임, 신규 게임 출시 | analysis_results.domain_category가 null |
| 5 | 세나 / 서비스 기획 주니어 | 의료 | industry | 디지털 헬스케어 플랫폼, 전자의무기록, 병원정보시스템 | analysis_results.industry_category가 null |
| 6 | 세나 / 서비스 기획 주니어 | 헬스케어 | domain | 오름차트, 클레, 건강관리, 의료 생태계 | analysis_results.domain_category가 null |
| 7 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | Python | skill | tools 필드에 python, preferred에 Python/Pandas 경험 | 현재 review_items에는 unconfirmed로 남아 있어 재분석 필요 |
| 8 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | SQL | skill | tools 필드에 sql, requirements에 SQL 활용 능력 | 현재 review_items에는 unconfirmed로 남아 있어 재분석 필요 |

### 오추출 후보

| no | posting | raw_value | field_type | reason | suggested_action |
|---:|---|---|---|---|---|
| 1 | 세나 / 서비스 기획 주니어 | 점 도출 | competency | 단어 일부가 잘린 문장 찌꺼기 | removed 처리 후보 |
| 2 | 세나 / 서비스 기획 주니어 | 하여 개선 | competency | 조사/어미가 포함된 불완전 표현 | classification phase 3 개선 후보 |
| 3 | 세나 / 서비스 기획 주니어 | 다양한 도출 | competency | 너무 넓고 의미가 불명확한 표현 | config 반영 금지 |
| 4 | 슈퍼진 / 글로벌 서비스 기획/운영 | 수 있는 커뮤니케이션 | competency | 문장 일부가 잘린 표현 | classification phase 3 개선 후보 |
| 5 | 슈퍼진 / 글로벌 서비스 기획/운영 | 상품 | domain | 상품기획 문맥의 일반어가 domain 후보로 분리됨 | classification phase 3 개선 후보 |
| 6 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | ETC | skill | 기타 항목 라벨로 skill 가치 없음 | config 반영 금지 |
| 7 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | DATA | skill | DATA-Stars 선정 이력 일부로 추출된 약어 | config 반영 금지 |
| 8 | 누아 / 웹서비스 기획자 | 정보통신 기획 | competency | 과학기술정보통신부 문맥에서 잘린 표현 | classification phase 3 개선 후보 |

### 복수 도메인 후보

| no | posting | primary_domain | additional_domains | reason | note |
|---:|---|---|---|---|---|
| 1 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | SaaS | 이커머스, 데이터 분석 | B2B SaaS 성격의 커머스 데이터/정산/재고 솔루션 | 현재 단일 domain_category는 null |
| 2 | 세나 / 서비스 기획 주니어 | 헬스케어 | SaaS, 의료 | 클라우드 SaaS EMR과 개인 건강관리 앱이 함께 등장 | 현재 단일 domain_category는 null |
| 3 | 슈퍼진 / 글로벌 서비스 기획/운영 | 게임 | 콘텐츠, AI | 게임 개발사이면서 소셜 콘텐츠와 생성형 AI 신규 서비스가 함께 등장 | 현재 단일 domain_category는 null |
| 4 | 누아 / 웹서비스 기획자 | 여행 | AI | 여행 서비스/항공 유통이 주 도메인이고 AI 기술이 핵심 차별점으로 등장 | 현재 단일 domain_category는 여행 |

## config 반영 후보 요약

### industry-categories.json

| representative | alias_candidate | status | note |
|---|---|---|---|
| IT | Commerce Intelligence Solution | confirm | 바티에이아이 산업 분류 누락 보강 후보 |
| 게임 | 글로벌 소셜 콘텐츠 & 게임 개발사 | confirm | 슈퍼진 산업 분류 누락 보강 후보 |
| 의료 | 디지털 헬스케어 플랫폼 | confirm | 세나 산업 분류 누락 보강 후보 |

### domain-categories.json

| representative | alias_candidate | status | note |
|---|---|---|---|
| SaaS | B2B SaaS | confirm | 바티에이아이 preferred 문맥 |
| 이커머스 | 정산 | confirm | 커머스 정산/재고 데이터 솔루션 문맥 |
| 헬스케어 | 개인건강관리 서비스 | confirm | 세나 클레 서비스 문맥 |
| 게임 | 글로벌 게임 | confirm | 슈퍼진 게임 도메인 누락 보강 후보 |

### position-categories.json

| representative | alias_candidate | status | note |
|---|---|---|---|
| 서비스 기획 | 서비스 기획 주니어 | confirm | 세나 confirmed review 이력 |
| 서비스 기획 | 웹서비스 기획자 | confirm | 누아 confirmed review 이력 기반, 대표값 재검토 필요 |
| 서비스 기획 | 글로벌 서비스 기획/운영 | confirm | 슈퍼진 unconfirmed position 후보 |
| 서비스 기획 | 커머스 데이터 솔루션 - 기술 기획자 | confirm | 바티에이아이 unconfirmed position 후보 |

### skill-dictionary.json

| representative | alias_candidate | status | note |
|---|---|---|---|
| EMR | EMR | confirm | 의료/병원정보시스템 관련 명시적 시스템 |
| HIS | HIS | confirm | 의료/병원정보시스템 관련 명시적 시스템 |
| OCS | OCS | confirm | 의료/병원정보시스템 관련 명시적 시스템 |
| AWS | AWS | confirm | 바티에이아이 기술 스택 |
| RAG | RAG | confirm | 바티에이아이 AI/LLM 기술 스택 |

### competency-dictionary.json

| representative | alias_candidate | status | note |
|---|---|---|---|
| 협업 | 원활한 커뮤니케이션 | confirm | 세나 confirmed review 이력 |
| 요구사항 분석 | 요구사항 수집 분석 | confirm | 누아 confirmed review 이력 |

## 다음 작업 후보

- confirm 상태 alias 후보를 config JSON에 반영
- hold 상태 후보 추가 검토
- remove 상태 후보가 반복되면 removed 처리 또는 classification phase 3 개선 후보로 기록
- 복수 도메인 구조 도입 전까지 primary_domain 기준을 별도 관리

## Config 반영 이력

| date | phase | config_file | representative | alias_or_value | action | note |
|---|---|---|---|---|---|---|
| 2026-05-04 | phase 1 | position-categories.json | 서비스 기획 | 서비스 기획 주니어 | added alias | 안전 후보 우선 반영 |
| 2026-05-04 | phase 1 | position-categories.json | 서비스 기획 | 웹서비스 기획자 | added alias | 안전 후보 우선 반영 |
| 2026-05-04 | phase 1 | position-categories.json | 서비스 기획 | 글로벌 서비스 기획/운영 | added alias | 안전 후보 우선 반영 |
| 2026-05-04 | phase 1 | skill-dictionary.json | EMR | EMR | added representative | 안전 후보 우선 반영 |
| 2026-05-04 | phase 1 | skill-dictionary.json | HIS | HIS | added representative | 안전 후보 우선 반영 |
| 2026-05-04 | phase 1 | skill-dictionary.json | OCS | OCS | added representative | 안전 후보 우선 반영 |
| 2026-05-04 | phase 1 | skill-dictionary.json | AWS | AWS | added representative | 안전 후보 우선 반영 |
| 2026-05-04 | phase 1 | skill-dictionary.json | RAG | RAG | added representative | 안전 후보 우선 반영 |
| 2026-05-04 | phase 1 | competency-dictionary.json | 협업 | 원활한 커뮤니케이션 | added alias | 안전 후보 우선 반영 |
| 2026-05-04 | phase 1 | competency-dictionary.json | 요구사항 분석 | 요구사항 수집 분석 | skipped | 기존 alias가 이미 존재해 중복 추가하지 않음 |

## Config 반영 후 재분석 검증

| no | posting | reanalyzed | expected_change | actual_result | status | note |
|---:|---|---|---|---|---|---|
| 1 | 세나 / 서비스 기획 주니어 (`posting_id=14`) | yes | phase 1 반영 대상 기준: `position_category=서비스 기획`, `EMR/HIS/OCS` skill 추출, `협업` competency 추출, 관련 unconfirmed 후보 감소 | 재분석 후 `domain_category=헬스케어`, `position_category=서비스 기획`, `extracted_skills=UX/UI, 스토리보드, 와이어프레임, OCS, EMR, HIS`, `extracted_competencies=협업`, `unconfirmed_count=22` 확인 | pass | config alias phase 1 반영 대상 기준 pass. `industry_category`는 null로 남아 phase 1에서 보류한 industry 정책 후속 검토 필요 |
| 2 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 (`posting_id=17`) | yes | phase 1 반영 대상 기준: `AWS/RAG` skill 추출 | 사용자 직접 재분석 검증에서 config alias phase 1 반영 대상 기준 pass로 확인 | pass | industry/domain 및 `position_category`는 이번 phase 1 보류 영역이므로 후속 정책 검토 대상 |
