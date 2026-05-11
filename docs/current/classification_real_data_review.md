# Classification Real Data Review

## Classification Phase 3-A 재분석 판단 결과

### 요약

| posting_id | 회사 | 핵심 확인 항목 | 판단 | 메모 |
|---:|---|---|---|---|
| 13 | 누아 | IATA/IA 오추출 제거 | pass | IATA 미추출, 직무 맥락 없는 IA 미추출 |
| 14 | 세나 | EMR/HIS/OCS 및 기존 정상 skill 유지 | pass | EMR/HIS/OCS, UX/UI, 스토리보드, 와이어프레임 유지 |
| 16 | 슈퍼진 | UX/UI 정상 유지 | pass | UX/UI 유지 |
| 17 | 바티에이아이 | SQL/ERD/API/AWS/RAG/Python 정상 유지 | pass | 주요 정상 기술 유지 |

### 전체 판단

- classification phase 3-A는 pass로 판단한다.
- IATA 같은 기관명/인증명 약어 오추출 제거 목적을 달성했다.
- 직무 맥락 없는 IA 오추출 제거 목적을 달성했다.
- EMR/HIS/OCS/SQL/ERD/API/AWS/RAG/Python 등 정상 약어/기술 추출 회귀는 발생하지 않았다.
- 현재 기준으로 phase 3-A 추가 보완은 필요하지 않다.
- phase 3-B 후보인 회사 기술스택 구분, Slack/HTML/CSS 필터링, 직무 유형별 기술스택 필터는 실사용 데이터 추가 누적 후 판단한다.

### posting_id=13 / 누아 / 웹서비스 기획자

- 사용자 재분석 결과 제공 여부: yes
- 핵심 확인:
  - IATA 추출 여부: 미추출
  - IA 추출 여부: 직무 맥락 없는 IA 미추출
- 판단: pass
- 근거: 사용자 로컬 재분석 결과 기준으로 IATA와 직무 맥락 없는 IA가 추출되지 않았다.
- 후속 조치: phase 3-A 추가 보완은 현재 필요하지 않다.

### posting_id=14 / 세나 / 서비스 기획 주니어

- 사용자 재분석 결과 제공 여부: yes
- 핵심 확인:
  - EMR 유지 여부: 유지
  - HIS 유지 여부: 유지
  - OCS 유지 여부: 유지
  - UX/UI/스토리보드/와이어프레임 유지 여부: 유지
- 판단: pass
- 근거: 사용자 로컬 재분석 결과 기준으로 `EMR`, `HIS`, `OCS`, `UX/UI`, `스토리보드`, `와이어프레임`이 유지되었다.
- 후속 조치: 정상 약어/기존 정상 skill 추출 회귀가 없어 phase 3-A 추가 보완은 현재 필요하지 않다.

### posting_id=16 / 슈퍼진 / 글로벌 서비스 기획/운영

- 사용자 재분석 결과 제공 여부: yes
- 핵심 확인:
  - UX/UI 유지 여부: 유지
- 판단: pass
- 근거: 사용자 로컬 재분석 결과 기준으로 `UX/UI`가 유지되었다.
- 후속 조치: 정상 skill 추출 회귀가 없어 phase 3-A 추가 보완은 현재 필요하지 않다.

### posting_id=17 / 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자

- 사용자 재분석 결과 제공 여부: yes
- 핵심 확인:
  - SQL 유지 여부: 유지
  - ERD 유지 여부: 유지
  - AWS 유지 여부: 유지
  - RAG 유지 여부: 유지
  - API 유지 여부: 유지
  - Python 유지 여부: 유지
- 판단: pass
- 근거: 사용자 로컬 재분석 결과 기준으로 `SQL`, `ERD`, `API`, `AWS`, `RAG`, `Python`이 유지되었다.
- 후속 조치: 정상 기술 약어 추출 회귀가 없어 phase 3-A 추가 보완은 현재 필요하지 않다.

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
| 10 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | domain | 정산 | 이커머스 | hold | 이커머스 정산/재고 솔루션 맥락에서는 후보가 될 수 있으나 단독 alias 반영 시 오탐 위험이 있음 | domain-categories.json | 문맥 의존성이 있어 3순위 보류 |
| 11 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | skill | Cursor | AI툴활용 | confirm | 명시적 AI 코딩 도구 | skill-dictionary.json | 현재 config에 alias가 있어 재분석 후보일 수 있음 |
| 12 | 누아 / 웹서비스 기획자 | skill | IATA |  | remove | 국제항공운송협회(International Air Transport Association) 약어이며 회사 소개/인증 기관명 맥락으로 등장함 |  | skill/config 반영 제외 후보. phase 3에서 대문자 약어 자동 추출 시 기관명/인증명 맥락 필터링 후보 |
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
| 9 | 누아 / 웹서비스 기획자 | 항공권 유통 / 예약 플랫폼 / 여행 서비스 기획 | domain | 여행 산업, 항공 유통, 예약/발권 서비스 기획 맥락 | phase 2 domain alias 후보. IATA는 기관명/인증명으로 별도 제외 |
| 10 | 누아 / 웹서비스 기획자 | IA 추출 맥락 조건 강화 | skill | IA는 Information Architecture로 서비스기획 skill일 수 있으나, 이번 공고에서는 직무 수행 맥락 근거가 약함 | IA 자체 삭제가 아니라 추출 문맥 조건 강화 필요. IATA에서 IA가 잘렸는지 또는 별도 대문자 약어/IA 패턴 매칭인지 확인 필요 |
| 11 | 슈퍼진 / 글로벌 서비스 기획/운영 | 와이어프레임 | skill | 원문상 와이어프레임 작성/기획 산출물 맥락 | phase 2 또는 phase 3 후보 |
| 12 | 슈퍼진 / 글로벌 서비스 기획/운영 | FAQ | skill | FAQ 작성/운영 문맥 | phase 2 또는 phase 3 후보 |
| 13 | 슈퍼진 / 글로벌 서비스 기획/운영 | VOC | skill | 사용자 의견/VOC 관리 문맥 | phase 2 또는 phase 3 후보 |
| 14 | 슈퍼진 / 글로벌 서비스 기획/운영 | 정책 수립 | competency | 서비스 정책 수립 문맥 | phase 2 또는 phase 3 후보 |
| 15 | 슈퍼진 / 글로벌 서비스 기획/운영 | 운영 가이드 | competency | 운영 가이드 작성/정리 문맥 | phase 2 또는 phase 3 후보 |
| 16 | 슈퍼진 / 글로벌 서비스 기획/운영 | 서비스 운영 | competency | 서비스 운영 및 품질 유지 문맥 | phase 2 또는 phase 3 후보 |
| 17 | 슈퍼진 / 글로벌 서비스 기획/운영 | 프로젝트 리딩 / 서비스 개발·런칭 주도 | competency | 서비스 개발 및 런칭 주도 문맥 | phase 2 또는 phase 3 후보 |
| 18 | 슈퍼진 / 글로벌 서비스 기획/운영 | 협업/커뮤니케이션 | competency | 협업 및 커뮤니케이션 역량 문맥 | phase 2 또는 phase 3 후보 |
| 19 | 슈퍼진 / 글로벌 서비스 기획/운영 | 게임 / 콘텐츠 | industry/domain | 글로벌 소셜 콘텐츠와 게임 개발사 성격이 명확함 | industry/domain alias 보강 후보 |
| 20 | 세나 / 서비스 기획 주니어 | SaaS | domain | 클라우드 SaaS EMR 명시 | 추가 domain 후보 |
| 21 | 세나 / 서비스 기획 주니어 | 개인건강관리 서비스 | domain | 개인건강관리 서비스 문맥 | 헬스케어 domain alias 후보 |
| 22 | 세나 / 서비스 기획 주니어 | 요구사항 분석 | competency | 서비스 요구사항 분석 문맥 | phase 2 또는 phase 3 후보 |
| 23 | 세나 / 서비스 기획 주니어 | UX 설계 | competency | UX/UI, 화면 설계, 사용자 경험 개선 문맥 | phase 2 또는 phase 3 후보 |
| 24 | 세나 / 서비스 기획 주니어 | 서비스 개선 | competency | 서비스 개선 업무 문맥 | phase 2 또는 phase 3 후보 |
| 25 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | ERP | skill | 커머스/운영 시스템 문맥 | phase 2 skill 후보 |
| 26 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | WMS | skill | 물류/재고 시스템 문맥 | phase 2 skill 후보 |
| 27 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | Pandas | skill | Python/Pandas 경험 문맥 | phase 2 skill 후보 |
| 28 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | 프롬프트 엔지니어링 | skill | LLM/AI 도구 활용 문맥 | phase 2 skill 후보 |
| 29 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | 시스템 설계 | competency | 데이터 흐름/솔루션 설계 문맥 | phase 2 또는 phase 3 후보 |
| 30 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | 문서화 | competency | 기술 기획 문서 작성 문맥 | phase 2 또는 phase 3 후보 |
| 31 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | 데이터 분석 | competency | 커머스 데이터 분석 문맥 | phase 2 또는 phase 3 후보 |
| 32 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | 요구사항 분석 | competency | 고객/비즈니스 요구사항 분석 문맥 | phase 2 또는 phase 3 후보 |
| 33 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | 이커머스 / SaaS | domain | 커머스 데이터 솔루션, B2B SaaS 문맥 | domain alias 후보 |

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
| 9 | 누아 / 웹서비스 기획자 | IA | skill | 이번 공고에서는 직무 수행 맥락 근거가 약해 오추출 가능성이 높음. 단, IA는 Information Architecture로 일반 서비스기획 skill일 수 있음 | config에서 삭제하지 말고 추출 맥락 조건 강화 검토. IATA에서 IA가 잘렸는지 또는 별도 대문자 약어/IA 패턴 매칭인지 확인 필요 |
| 10 | 누아 / 웹서비스 기획자 | IATA | skill | 국제항공운송협회 약어이며 기관명/인증명 맥락으로 등장 | skill/config 반영 제외 후보. 기관명/인증명 필터링 후보 |
| 11 | 세나 / 서비스 기획 주니어 | 네이버 | company/proper_noun | 파트너사 고유명사 | config 반영 제외 후보 |
| 12 | 세나 / 서비스 기획 주니어 | 오름차트 | product/proper_noun | 제품 고유명사 | config 반영 제외 후보 |
| 13 | 세나 / 서비스 기획 주니어 | 클레 | product/proper_noun | 제품 고유명사 | config 반영 제외 후보 |
| 14 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | Bati CIS | product/proper_noun | 제품 고유명사 | config 반영 제외 후보 |
| 15 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | COSRX | customer/proper_noun | 고객사 고유명사 | config 반영 제외 후보 |
| 16 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 | 파마리서치 | customer/proper_noun | 고객사 고유명사 | config 반영 제외 후보 |

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
| 이커머스 | 정산 | hold | 커머스 정산/재고 데이터 솔루션 문맥에서는 후보이나 문맥 의존성이 있어 3순위 보류 |
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
- phase 2 config 후보는 안전 후보 / 보류 후보 / 제외 후보로 구분해서 검토

### phase 2 검토 후보

| category | candidate | note |
|---|---|---|
| skill | ERP | 바티에이아이 원문 기준 skill 후보 |
| skill | WMS | 바티에이아이 원문 기준 skill 후보 |
| skill | Pandas | 바티에이아이 원문 기준 skill 후보 |
| skill | 프롬프트 엔지니어링 | 바티에이아이 원문 기준 skill 후보 |
| domain | SaaS | 세나/바티에이아이 추가 domain 후보 |
| domain | 개인건강관리 서비스 → 헬스케어 | 세나 domain alias 후보 |
| industry/domain | 게임/콘텐츠 | 슈퍼진 industry/domain alias 후보 |
| skill/competency | 와이어프레임, FAQ, VOC, 정책 수립, 운영 가이드 | 슈퍼진 누락 후보 |
| classification rule | IA 추출 맥락 조건 강화 | IA는 일반 서비스기획 skill일 수 있으나 누아 공고에서는 오추출 가능성이 높음 |
| classification rule | IATA 기관명/인증명 필터링 | IATA는 국제항공운송협회 약어로 skill 반영 제외 후보 |

### 보류 또는 제외 후보

| candidate | decision | note |
|---|---|---|
| 정산 → 이커머스 | 보류 | 문맥 의존성이 있어 3순위 보류. 단독 alias 반영 시 오탐 위험 검토 필요 |
| 네이버 | 제외 | 파트너사 고유명사 |
| 오름차트, 클레 | 제외 | 제품 고유명사 |
| Bati CIS | 제외 | 제품 고유명사 |
| COSRX, 파마리서치 | 제외 | 고객사 고유명사 |
| IATA | 제외 | 기관명/인증명으로 skill 반영 제외 |
| IA | 맥락 조건 강화 | 누아 공고에서는 오추출 가능성이 있으나 일반 skill로는 유효할 수 있어 삭제 대상 아님 |

## Phase 2 후보 분류

이번 섹션은 Phase 2 config 반영 전 후보를 분류하기 위한 작업 메모다. 이 단계에서는 config JSON을 수정하지 않는다.

### 안전 반영 후보

| no | candidate | field_type | target_config | proposed_representative | action | reason | note |
|---:|---|---|---|---|---|---|---|
| 1 | ERP | skill | skill-dictionary.json | ERP | add_representative | 원문에 시스템/업무 도구 맥락으로 명시되고 회사명/제품명이 아님 | 바티에이아이 skill 후보 |
| 2 | WMS | skill | skill-dictionary.json | WMS | add_representative | 물류/재고 시스템 약어로 의미가 명확하고 반복 정제 비용을 줄일 수 있음 | 바티에이아이 skill 후보 |
| 3 | Pandas | skill | skill-dictionary.json | Pandas | needs_check | Python/Pandas 경험으로 원문에 명시되어 skill 후보로 타당함 | Python 하위 라이브러리 alias로 둘지 독립 skill 대표값으로 둘지 확인 필요 |
| 4 | 프롬프트 엔지니어링 | skill | skill-dictionary.json | 프롬프트 엔지니어링 | add_representative | LLM/AI 도구 활용 역량으로 의미가 명확함 | 바티에이아이 skill 후보 |
| 5 | FAQ | competency | competency-dictionary.json | 운영 문서화 | needs_check | 슈퍼진 원문에 운영 산출물로 명시됨 | skill/산출물로 둘지 competency alias로 둘지 정책 확인 필요 |
| 6 | VOC | competency | competency-dictionary.json | VOC 분석 | needs_check | 고객 의견/운영 개선 맥락의 반복 가능한 업무 역량 후보 | 고객 요구사항 분석으로 매핑할지 별도 대표값을 둘지 확인 필요 |
| 7 | 와이어프레임 | skill | skill-dictionary.json | 와이어프레임 | needs_check | 서비스기획 산출물로 의미가 명확하고 원문에 명시됨 | 기존 config 존재 여부 확인 후 add_representative 또는 already_exists 처리 |
| 8 | 정책 수립 | competency | competency-dictionary.json | 정책 수립 | needs_check | 서비스 정책 수립 업무가 명확함 | 기존 config 존재 여부 확인 후 add_alias 또는 already_exists 처리 |
| 9 | 운영 가이드 | competency | competency-dictionary.json | 운영 정책 수립 | needs_check | 운영 가이드 작성/정리 산출물이 명확함 | 문서화 대표값으로 둘지 운영 정책 수립 alias로 둘지 확인 필요 |
| 10 | 서비스 운영 | competency | competency-dictionary.json | 서비스 운영 | needs_check | 서비스 운영 및 품질 유지 문맥이 명확함 | 프로세스 관리와 별도 대표값 중 선택 필요 |
| 11 | 문서화 | competency | competency-dictionary.json | 문서화 | needs_check | 기술 기획 문서 작성 역량으로 의미가 명확함 | 기존 config 존재 여부 확인 후 add_alias 또는 already_exists 처리 |
| 12 | 데이터 분석 | competency | competency-dictionary.json | 데이터 분석 | needs_check | 커머스 데이터 분석 업무 맥락이 명확함 | 기존 config 존재 여부 확인 후 add_alias 또는 already_exists 처리 |
| 13 | 시스템 설계 | competency | competency-dictionary.json | 시스템 설계 | needs_check | 데이터 흐름/솔루션 설계 업무 맥락이 명확함 | 기존 config 존재 여부 확인 후 add_alias 또는 already_exists 처리 |
| 14 | 요구사항 분석 | competency | competency-dictionary.json | 요구사항 분석 | already_exists | 누아 confirmed 이력 및 phase 1 skipped 이력에서 기존 alias 존재가 확인됨 | 추가 alias가 필요한 표현만 별도 검토 |
| 15 | 협업/커뮤니케이션 | competency | competency-dictionary.json | 협업 | already_exists | phase 1에서 협업 alias가 반영되었고 여러 공고에서 반복되는 역량임 | 슈퍼진 표현을 추가 alias로 넣을지는 별도 확인 |

### 보류 후보

| no | candidate | field_type | possible_representative | hold_reason | decision_needed | note |
|---:|---|---|---|---|---|---|
| 1 | SaaS | domain | SaaS | 세나/바티에이아이 모두에서 domain 후보이나 현재 저장 구조가 단일 domain_category라 복수 도메인 정책과 연결됨 | 대표 도메인 1개 + 전체 도메인 N개 구조 확정 후 반영 여부 결정 | industry가 아니라 domain 후보로 우선 관리 |
| 2 | 개인건강관리 서비스 | domain | 헬스케어 | 세나 원문에서는 타당하지만 제품/서비스 설명문에 가까워 alias 범위가 넓어질 수 있음 | 헬스케어 domain alias로 둘지, 공고별 설명문으로만 둘지 결정 | 제품명인 오름차트/클레와 구분 필요 |
| 3 | 게임 / 콘텐츠 | industry/domain | 게임, 콘텐츠 | 슈퍼진에는 타당하지만 산업과 도메인 양쪽 후보이며 복수 도메인 구조와 연결됨 | industry 대표값, primary domain, additional domain 분리 정책 결정 | 게임 개발사와 소셜 콘텐츠 서비스 성격을 함께 반영할지 검토 |
| 4 | 여행 / 항공권 유통 / 예약 플랫폼 | domain | 여행 | 누아에는 타당하지만 항공권 유통/예약 플랫폼을 여행 alias로 둘지 정책 결정 필요 | 여행 domain alias 범위와 항공/예약 플랫폼 세부 alias 정책 결정 | IATA 기관명/인증명 제외 정책과 별도로 검토 |
| 5 | 이커머스 / SaaS | domain | 이커머스, SaaS | 바티에이아이에는 두 도메인이 모두 타당하나 현재 단일 domain 구조에서는 우선순위 결정이 필요함 | primary domain과 additional domain 기준 결정 | 커머스 데이터 솔루션 문맥 |
| 6 | 정산 | domain | 이커머스 | 커머스 정산 문맥에서는 타당하지만 금융/회계/운영 문맥 오탐 위험이 큼 | 단독 alias 반영 여부와 문맥 조건 필요 여부 결정 | 3순위 보류 |
| 7 | 커머스 데이터 솔루션 - 기술 기획자 | position | 서비스 기획 또는 프로덕트 기획 | 특정 공고명에 가까워 일반 position alias로 쓰기 어려움 | 기술 기획자를 서비스 기획으로 볼지 프로덕트 기획으로 볼지 정책 결정 | position_category null 후속 검토 대상 |
| 8 | IATA | domain | 여행 또는 항공 | 항공/여행 특수용어처럼 보일 수 있으나 현재 원문에서는 기관명/인증명 맥락임 | 도메인 특수용어로 관리하지 않을지, 기관명 필터로만 관리할지 결정 | skill config에는 반영 제외 |

### 제외 또는 Phase 3 코드 개선 후보

| no | candidate | observed_as | issue_type | suggested_action | reason | note |
|---:|---|---|---|---|---|---|
| 1 | 네이버 | partner/company name | partner_name | exclude_from_config | 파트너사 고유명사로 classification config에 넣을 대상이 아님 | 세나 원문 |
| 2 | 오름차트 | product name | product_name | exclude_from_config | 제품 고유명사 | 세나 원문 |
| 3 | 클레 | product name | product_name | exclude_from_config | 제품 고유명사 | 세나 원문 |
| 4 | Bati CIS | product name | product_name | exclude_from_config | 제품 고유명사 | 바티에이아이 원문 |
| 5 | COSRX | customer name | customer_name | exclude_from_config | 고객사 고유명사 | 바티에이아이 원문 |
| 6 | 파마리서치 | customer name | customer_name | exclude_from_config | 고객사 고유명사 | 바티에이아이 원문 |
| 7 | IATA | skill acronym | organization_name | add_stopword_or_filter | 국제항공운송협회 약어이며 기관명/인증명 맥락으로 등장 | skill/config 반영 제외. 대문자 약어 기관명 필터 후보 |
| 8 | IA | extracted skill | acronym_false_positive | strengthen_context_rule | 누아 공고에서는 직무 맥락 근거가 약한 오추출 가능성이 높음 | Information Architecture 자체는 유효 skill일 수 있으므로 삭제가 아니라 맥락 조건 강화 |
| 9 | SBA | skill acronym | organization_name | add_stopword_or_filter | 투자/기관명 맥락으로 skill 가치가 낮음 | config 반영 금지 |
| 10 | NEST | skill acronym | program_or_award_name | add_stopword_or_filter | 지원사업/선정 이력 약어로 보임 | config 반영 금지 |
| 11 | DATA | skill acronym | acronym_false_positive | strengthen_context_rule | DATA-Stars 선정 이력 일부로 추출된 약어 | 대문자 약어 추출 조건 개선 후보 |
| 12 | ETC | skill | too_generic | add_stopword_or_filter | 기타 항목 라벨로 skill 가치가 없음 | config 반영 금지 |
| 13 | 상품 | domain | too_generic | phase3_extraction_fix | 상품기획 문맥의 일반어가 domain 후보로 분리됨 | domain 과추출 개선 후보 |
| 14 | 함께 설계 | competency | broken_phrase | phase3_extraction_fix | 문장 일부가 잘린 표현 | removed 처리 또는 phase 3 후보 |
| 15 | 점 도출 | competency | broken_phrase | phase3_extraction_fix | 단어 일부가 잘린 문장 찌꺼기 | removed 처리 후보 |
| 16 | 하여 개선 | competency | broken_phrase | phase3_extraction_fix | 조사/어미가 포함된 불완전 표현 | phase 3 추출 개선 후보 |
| 17 | 수 있는 커뮤니케이션 | competency | broken_phrase | phase3_extraction_fix | 문장 일부가 잘린 표현 | phase 3 추출 개선 후보 |
| 18 | 정보통신 기획 | competency | extraction_rule_issue | phase3_extraction_fix | 과학기술정보통신부 문맥에서 잘린 표현 | 기관명/부처명 맥락 필터 후보 |

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
| 2026-05-04 | phase 2 safe | skill-dictionary.json | ERP | ERP | added representative | 명시적 skill 안전 후보 |
| 2026-05-04 | phase 2 safe | skill-dictionary.json | WMS | WMS | added representative | 명시적 skill 안전 후보 |
| 2026-05-04 | phase 2 safe | skill-dictionary.json | 프롬프트 엔지니어링 | 프롬프트 엔지니어링 | skipped | 기존 대표값이 이미 존재해 중복 추가하지 않음 |
| 2026-05-04 | phase 2 safe | skill-dictionary.json | Pandas | Pandas | skipped | Python alias 또는 독립 skill 여부 정책 확인 필요 |
| 2026-05-04 | phase 2 safe | competency-dictionary.json | 문서화 | FAQ | added alias | 운영 산출물/문서화 안전 후보 |
| 2026-05-04 | phase 2 safe | competency-dictionary.json | VOC 설계 | VOC | added alias | 고객 의견/VOC 업무 안전 후보 |
| 2026-05-04 | phase 2 safe | competency-dictionary.json | 문서화 | 운영 가이드 | added alias | 운영 산출물/문서화 안전 후보 |
| 2026-05-04 | phase 2 safe | competency-dictionary.json | 서비스 운영 | 서비스 운영 | added representative | 서비스 운영 및 품질 유지 competency 안전 후보 |

## Config 반영 후 재분석 검증

| no | posting | reanalyzed | expected_change | actual_result | status | note |
|---:|---|---|---|---|---|---|
| 1 | 누아 / 웹서비스 기획자 | yes | phase 1 반영 대상 기준: `position_category=서비스 기획`, 요구사항 분석 등 기존 안전 후보 유지 | 여행 산업/도메인, 서비스 기획, 요구사항 분석, 정책 수립은 원문과 부합. `extracted_skills=["IA"]` 확인 | pass | phase 1 반영 대상 기준 pass. 다만 `IA`는 이번 공고에서 직무 맥락 근거가 약해 오추출 가능성이 높음. `IATA`는 국제항공운송협회 약어로 회사 소개/인증 기관명 맥락이므로 config 반영 제외 후보. IA는 일반적으로 서비스기획 skill일 수 있으므로 제거가 아니라 추출 맥락 조건 강화 필요. `IATA`에서 `IA`가 잘렸는지 또는 별도 대문자 약어/IA 패턴 매칭인지 확인 필요 |
| 2 | 슈퍼진 / 글로벌 서비스 기획/운영 | yes | phase 1 반영 대상 기준: `position_category=서비스 기획`, 일부 기획 관련 후보 개선 | `position_category=서비스 기획`, `UX/UI`, `기능 정의`는 원문과 부합하나 industry/domain은 null | partial | partial 유지. 원문에는 와이어프레임, FAQ, VOC, 정책 수립, 운영 가이드, 서비스 운영, 서비스 품질 유지, 서비스 개발 및 런칭 주도, 프로젝트 리딩, 협업/커뮤니케이션이 명확하나 추출되지 않음. 게임/콘텐츠 industry/domain alias와 competency/skill 후보를 phase 2에서 함께 검토 필요 |
| 3 | 세나 / 서비스 기획 주니어 (`posting_id=14`) | yes | phase 1 반영 대상 기준: `position_category=서비스 기획`, `EMR/HIS/OCS` skill 추출, `협업` competency 추출, 관련 unconfirmed 후보 감소 | 재분석 후 `domain_category=헬스케어`, `position_category=서비스 기획`, `extracted_skills=UX/UI, 스토리보드, 와이어프레임, OCS, EMR, HIS`, `extracted_competencies=협업`, `unconfirmed_count=22` 확인 | pass | config alias phase 1 반영 대상 기준 pass. 전체 classification 기준에서는 `industry_category`가 null이므로 의료 industry alias 보강 필요. `클라우드 SaaS EMR`이 명시되어 SaaS는 추가 domain 후보. `개인건강관리 서비스`는 헬스케어 domain alias 후보. `네이버`는 파트너사, `오름차트`와 `클레`는 제품 고유명사로 config 반영 제외 후보 |
| 4 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 (`posting_id=17`) | yes | phase 1 반영 대상 기준: `AWS/RAG` skill 추출 | `extracted_skills`에 Python, LLM, SQL, API, AI툴활용, ChatGPT, ERD, HTML/CSS, AWS, RAG, Jira, Slack 포함. `extracted_competencies`에 기능 정의, 비즈니스 분석 포함. `unconfirmed_count` 62 → 53 감소. industry/domain/position은 null | pass | phase 1 반영 대상인 AWS/RAG는 정상 반영되었고 Python, SQL, ERD, AI툴활용 등 skill 추출 품질도 개선됨. 전체 classification 기준에서는 industry/domain/position null 후속 검토 필요. ERP, WMS, Pandas, 프롬프트 엔지니어링은 skill 후보. `Bati CIS`는 제품, `COSRX`, `파마리서치`는 고객사 고유명사로 제외 후보. `정산`은 이커머스 domain alias 후보이나 오탐 위험이 있어 3순위 보류 |

## Phase 2 safe config 반영 후 재분석 검증

| no | posting | reanalyzed | before | after | status | note |
|---:|---|---|---|---|---|---|
| 1 | 슈퍼진 / 글로벌 서비스 기획/운영 (`posting_id=16`) | yes | `position_category=서비스 기획`, `extracted_skills=UX/UI`, `extracted_competencies=기능 정의`, `unconfirmed_count=27` | `industry_category=null`, `domain_category=null`, `position_category=서비스 기획`, `extracted_skills=UX/UI`, `extracted_competencies=기능 정의, 서비스 운영`, `unconfirmed_count=26`, `analyzed_at=2026-05-04 14:10:34` | partial | phase 2 safe config 반영 후 `서비스 운영` competency가 추가 추출되고 unconfirmed_count가 1 감소했다. 다만 industry/domain은 여전히 null이고 FAQ, VOC, 운영 가이드 등 일부 슈퍼진 누락 후보가 남아 있어 partial 유지 |
| 2 | 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자 (`posting_id=17`) | yes | phase 2 safe config 반영 전 기준: ERP/WMS 등 일부 safe skill 후보가 config 미반영 상태 | 사용자 직접 재분석 검증 결과 phase 2 safe config 반영 기준 pass | pass | phase 2 safe config 반영 후 검증 대상 공고로 확인됨. industry/domain/position 보류 후보와 Pandas 정책 검토는 별도 후속 작업으로 유지 |

## Classification Phase 3 후보 범위 분리

이번 섹션은 classification phase 3 구현 전에 안전 적용 후보와 보류 후보를 분리하기 위한 기준이다. 이 문서화 작업에서는 backend/frontend/config/DB를 수정하지 않고, API 호출도 실행하지 않는다.

### 1. Phase 3-A — 즉시 안전 개선 후보

- `IATA` 같은 기관명/인증명 stopword 처리
- 회사 소개/인증/기관명 맥락에서 등장한 대문자 약어를 skill 후보에서 제외
- `IA`는 원문에 Information Architecture 또는 화면설계/IA 산출물/서비스 구조 설계 맥락이 명확하지 않으면 제외

#### Phase 3-A 적용 이유

- `IATA`는 국제항공운송협회(International Air Transport Association)의 약어로, 누아 원문에서는 회사 소개/인증 기관명 맥락이다.
- 채용 직무 수행 skill/competency가 아니므로 추출 대상이 아니다.
- 기관명/인증명 약어는 skill로 반영될 가능성이 낮고 오탐 위험이 명확하다.
- 다만 정상 직무 약어까지 제거하지 않도록 제한적으로 적용해야 한다.

#### Phase 3-A 구현 원칙

- 단순 대문자 약어 전체 제거 금지
- 특정 stopword 또는 문맥 조건 기반으로만 제외
- 정상 skill 약어 유지
- 기존 config 정상 추출을 훼손하지 않음

### 2. Phase 3-B — 실테스트 후 적용 후보

아래 항목은 즉시 구현하지 않고 보류 후보로 분리한다.

- 회사 기술스택과 직무 직접 요구 기술 구분
- Slack, HTML/CSS 같은 범용/비핵심 skill 오추출 필터링
- 직무 유형별 기술스택 필터

#### Phase 3-B 보류 이유

- 같은 기술이라도 직무에 따라 유효/무효가 달라진다.
- SQL/API/ERD는 기획자에게도 유효할 수 있다.
- HTML/CSS도 웹기획 공고에서는 이해 역량으로 볼 수 있다.
- Slack은 일반 협업도구지만 특정 운영/협업 툴 역량으로 요구될 수도 있다.
- 단순 제외 시 정상 추출까지 제거할 위험이 있다.
- 실사용 공고와 removed/review_items 데이터가 더 쌓인 뒤 반복 오추출 패턴 기준으로 설계한다.

### 3. 회귀 검증 통과 기준

#### posting_id=13 / 누아 / 웹서비스 기획자

통과 기준:

- `IATA`가 extracted_skills 또는 review_items에서 skill/competency 후보로 생성되지 않아야 한다.
- `IA`도 원문에 직무 수행 맥락이 없으면 skill로 추출되지 않아야 한다.
- 단, 향후 다른 공고에서 `IA`가 Information Architecture 또는 화면설계/서비스 구조 설계 맥락으로 명확히 등장하면 추출 가능해야 한다.

실패 기준:

- `IATA`가 skill/competency 후보로 계속 생성되면 실패
- `IA`가 직무 맥락 없이 계속 생성되면 실패

#### posting_id=14 / 세나 / 서비스 기획 주니어

통과 기준:

- extracted_skills에 `EMR`, `HIS`, `OCS`가 계속 포함되어야 한다.
- `UX/UI`, `스토리보드`, `와이어프레임` 등 기존 정상 추출도 유지되어야 한다.

실패 기준:

- phase 3-A 적용 후 `EMR`, `HIS`, `OCS`가 사라지면 회귀 실패

#### posting_id=16 / 슈퍼진 / 글로벌 서비스 기획/운영

통과 기준:

- extracted_skills에 `UX/UI`가 계속 포함되어야 한다.
- `와이어프레임`이 config/rule에 의해 잡히는 경우 제거되면 안 된다.

실패 기준:

- phase 3-A 적용 후 `UX/UI`가 사라지면 회귀 실패

#### posting_id=17 / 바티에이아이 / 커머스 데이터 솔루션 - 기술 기획자

통과 기준:

- extracted_skills에 `SQL`, `ERD`, `AWS`, `RAG`가 계속 포함되어야 한다.
- `API`, `Python` 등 기존 정상 기술 추출도 제거되면 안 된다.

실패 기준:

- phase 3-A 적용 후 `SQL`, `ERD`, `AWS`, `RAG`, `API` 등 직무 수행 맥락이 명확한 약어/기술이 사라지면 회귀 실패

### 4. 공통 실패 기준

- `IA/IATA` 오추출은 줄었지만 정상 약어가 함께 제거되면 실패
- `EMR`, `HIS`, `OCS`, `SQL`, `ERD`, `AWS`, `RAG`, `API`처럼 직무 수행 맥락이 명확한 약어/기술이 사라지면 회귀 실패
- 실패 시 stopword/맥락 조건을 더 좁혀 재적용한다.
- phase 3-A는 정상 skill 약어를 줄이는 방식이 아니라, 기관명/인증명/회사소개 맥락 오추출만 줄이는 방향이어야 한다.

### 5. Phase 3-A 구현 전제

- 이번 문서화 작업에서는 구현하지 않는다.
- 다음 Codex 작업에서 `backend/app/classification.py` 또는 관련 classification helper를 확인해 최소 수정한다.
- config JSON 수정은 원칙적으로 하지 않는다.
- IATA 같은 제외 후보는 config에 넣는 것이 아니라 classification rule/filter에서 처리하는 방향을 우선한다.
- 구현 후 기존 4개 공고를 재분석해 통과/실패 기준을 기록한다.

### 6. Phase 3-A 구현 상태

구현 상태:

- `backend/app/classification.py`에 phase 3-A acronym filtering을 적용했다.
- `IATA`는 기관명/인증명 약어 제외 값으로 처리해 skill 후보와 skill review item 후보에서 제외한다.
- `IA`는 전역 stopword로 처리하지 않고, 직무 수행 맥락이 없으면 제외한다.
- `IA`는 `Information Architecture`, `IA 설계`, `IA 작성`, `화면 IA`, `서비스 구조 설계`, `정보구조`, `정보 구조`, `메뉴 구조`, `화면 구조` 맥락에서만 skill 후보로 유지할 수 있다.
- 기관명/인증명 맥락 필터는 `인증`, `인증명`, `기관`, `협회`, `Association`, `인증을 받은`, `국제항공운송협회` 주변의 대문자 약어에만 제한적으로 적용한다.
- `EMR`, `HIS`, `OCS`, `SQL`, `API`, `ERD`, `AWS`, `RAG`는 보호 약어로 유지한다.
- config JSON은 수정하지 않았다.
- phase 3-B 후보인 회사 기술스택/Slack/HTML/CSS/직무 유형별 기술스택 필터는 구현하지 않았다.

수행한 검증:

- `python -m py_compile backend/app/classification.py`
- helper-level 검증:
  - `IATA 인증을 받은 여행사`에서 `IATA` 제외
  - `IATA 국제항공운송협회`에서 `IATA` 제외
  - `IA 설계 및 화면 구조 정의`에서 `IA` 유지 가능
  - `IATA 인증`에서 `IA` 별도 skill 생성 방지
  - `EMR/HIS/OCS` 제외되지 않음
  - `SQL/ERD/API/AWS/RAG` 제외되지 않음
- synthetic `analyze_posting` 검증:
  - `IATA 인증을 받은 여행사`에서 extracted_skills 비어 있음
  - tools 값 `IATA 인증`에서도 `IA` 또는 `IATA`가 extracted_skills로 생성되지 않음
  - `EMR/HIS/OCS`는 extracted_skills에 유지됨
  - `SQL/ERD/API/AWS/RAG`는 extracted_skills에 유지됨

미수행 검증:

- DB를 직접 수정하지 않는 작업 범위이므로 기존 `posting_id=13/14/16/17` 재분석은 수행하지 않았다.
- API 호출 금지 조건에 따라 backend API 재분석 호출은 수행하지 않았다.
- 기존 4개 공고 재분석 결과 기록은 사용자 로컬 검증 후 이 문서에 추가로 반영해야 한다.
