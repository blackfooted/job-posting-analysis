# 채용공고 정제 및 분석 대시보드 MVP PRD

## 1. 문서 개요

- 문서명: 채용공고 정제 및 분석 대시보드 MVP PRD
- 버전: v0.7
- 작성 기준일: 2026-04-29
- 목적: 채용공고를 누적·정제·분석하는 개인 커리어 리서치 도구의 MVP 요구사항을 현재 구현 상태에 맞게 현행화한다.
- 기준 문서:
  - `job_posting_dashboard_MVP_PRD_v0_3.md`
  - `frontend_ia_revised.md`
  - 2026-04-28 현재까지 구현·검증 완료된 backend/frontend 기능
- 대상 사용자:
  - 1차: 관리자 1인(서비스 사용자와 운영자 겸용)
  - 향후: 일반 사용자 + 관리자 분리 가능 구조

---

## 2. v0.7 주요 변경 요약

v0.7은 v0.6 현행화 이후, 다른 채팅방에서 개발을 이어갈 때 API 응답 구조와 frontend 상태 관리 정책이 임의 해석되지 않도록 구현 참조 정보를 추가 보강한다.

### 2.1 Backend 현행화

- `dashboard API` 3종 구현 완료
  - `GET /api/dashboard/summary`
  - `GET /api/dashboard/charts`
  - `GET /api/dashboard/comparison`
- `review_items.status` 변경 시 `analysis_results.unconfirmed_count` 동기화
- `dictionary_apply=1` 저장 시 동일 `field_type + 정규화 raw_value` 항목 일괄 확정 처리
- `review_items` 목록 응답에 공고 출처 정보 추가
  - `company`
  - `position`
- `review_items` 조회조건 추가
  - `status`
  - `field_type`
  - `dictionary_apply`
  - `keyword`
- frontend 연동용 CORS 설정 추가
  - `allow_origins=["http://localhost:3000"]`
- 채용공고 분석 전 입력 텍스트의 분석용 normalize 처리 1차 적용
  - 원문 저장값은 변경하지 않음

### 2.2 Frontend 현행화

- Vite + React + JavaScript 기반 frontend 초기화 완료
- frontend dev server port는 `3000`으로 고정
- `.env.example` / `.env.local` 기준 정리
  - `VITE_API_BASE_URL=http://127.0.0.1:8000`
- activePage 기반 화면 전환 구조 적용
- PC: 좌측 LNB
- Mobile: Header + hamburger drawer navigation
  - drawer open 시 body scroll lock 적용 완료
- Dashboard 화면 연결 완료
  - summary
  - charts
  - comparison
  - 수동 새로고침 버튼
- 개별 공고 분석 화면 연결 완료
  - 목록
  - 상세
  - 신규 등록
  - 수정
- 데이터 정제 관리 화면 연결 완료
  - 목록
  - pagination
  - inline edit
  - 저장
  - 조회조건
  - 초기화

### 2.3 후속으로 분리된 사항

- 공고 삭제 frontend 연결
- 개별 공고 분석 결과 전용 화면/API
- 정제 알고리즘 고도화
- synonym-map 자동 추가
- AI 의미 유사도 기반 정제
- 본격 UI/UX 고도화
- URL routing 및 컴포넌트 구조 분리
- 사전관리 UI
- AI 추천 관리 실제 기능

### 2.4 v0.5 피드백 반영 사항

- `[필수]`, `[우대]` 등 대괄호 레이블은 현재 normalize 제거 대상이 아니라 후속 개선 대상으로 명확화
- KST 처리 방식(`datetime('now', '+9 hours')`)의 배포 환경 주의사항 추가
- 개별 공고 분석 화면의 삭제 버튼 위치를 Posting Detail 구조에 후속 연결 예정으로 명시
- 모바일 hamburger drawer의 body scroll lock 구현 완료 항목 명시
- Vite 환경변수 접근 규칙(`VITE_`, `import.meta.env`) 명시
- 정제 화면 그리드 예시에 `created_at`, `updated_at` 컬럼 추가

### 2.5 v0.6 피드백 반영 사항

- `GET /api/review-items`의 실제 응답 data 구조를 `items`, `page`, `size`, `total` 기준으로 명시
- `POST /api/postings` 및 `PUT /api/postings/{id}` 요청 body인 `PostingInput` 필드 구조를 API 명세에 추가
- 현재 `App.jsx`에서 사용 중인 주요 상태 변수명을 별도 섹션으로 정리
- Dashboard 새로고침 버튼 클릭 시 dashboard API 3개를 병렬 호출한다는 정책 명시

### 2.6 v0.7 피드백 반영 사항

- `GET /api/postings` 목록 응답 data 구조와 `GET /api/postings/{id}` 단건 응답 data 구조를 API 명세에 추가
- `GET /api/dashboard/charts`의 배열 item 구조를 `{ name, count }` 기준으로 명시
- `App.jsx` 상태 변수 사용 원칙을 권고 수준이 아니라 기존 state 재사용 원칙으로 강화
- 신규 공고 등록 흐름에서 backend 분류/분석이 `POST /api/postings` 처리 중 동기적으로 수행된다는 순서를 명확화
- `dictionary_apply` query parameter의 frontend 문자열 전송 / backend 정수 처리 / truthy 체크 금지 주의사항 추가

---

## 3. 제품 배경

사용자는 다양한 사이트에서 채용공고를 반복적으로 확인하며, 공고별 핵심역량과 직무 적합도를 비교하고 싶다.  
기존 방식은 공고를 매번 새 채팅창에 붙여넣고 분석을 요청해야 하므로 반복성이 높고 누적 관리가 어렵다.

본 서비스는 다음 문제를 해결한다.

1. 채용공고를 안정적으로 저장·누적 관리하기 어렵다.
2. 누적 공고 기준의 산업/직무/역량/툴 분포를 확인하고 싶다.
3. 비정형 표현을 그대로 두면 분석 결과가 분산된다.
4. 모든 항목을 AI로 자동 분석하면 비용과 품질 통제가 어렵다.
5. 정제 기준을 직접 관리하면서 필요할 때만 AI 보조를 받고 싶다.
6. 정제 데이터가 많아질수록 조회조건, 출처 정보, 일괄 처리 기준이 필요하다.
7. PC와 모바일 모두에서 최소 사용 가능한 화면 구조가 필요하다.

---

## 4. 제품 목표

### 4.1 핵심 목표

- 채용공고를 1건씩 입력받아 저장한다.
- 저장된 공고를 누적 관리한다.
- 공고별 개별 분석과 전체 누적 분석을 모두 제공한다.
- 데이터 정제는 수기 중심으로 운영한다.
- AI는 초기 MVP에서 사용하지 않는다.
- 향후 분석 품질을 보고 AI 보조를 도입할 수 있는 구조로 설계한다.
- 저장 시 선택적으로 사전에 반영하여 반복 정제 비용을 줄인다.
- 동일 원문 표현의 반복 정제 비용을 줄인다.
- dashboard / postings / review_items 화면 책임을 분리한다.
- 초기 MVP에서도 PC와 모바일에서 최소 사용 가능한 반응형 구조를 유지한다.

### 4.2 성공 기준

- 사용자가 신규 공고 1건을 입력하고 저장할 수 있다.
- 저장된 공고 목록을 조회할 수 있다.
- 저장된 공고의 상세 정보를 확인할 수 있다.
- 저장된 공고를 수정할 수 있다.
- 누적 공고 기준 요약/분포/비교 데이터를 확인할 수 있다.
- 미확인 항목을 수기로 정제할 수 있다.
- 정제 저장 시 `approved_value`, `status`, `dictionary_apply`를 수정할 수 있다.
- `dictionary_apply=1` 저장 시 동일 원문 표현을 일괄 확정할 수 있다.
- 정제 화면에서 status, field_type, dictionary_apply, keyword 조건으로 조회할 수 있다.
- 정제 화면에서 어떤 공고에서 발생한 항목인지 company/position으로 확인할 수 있다.
- 대시보드 데이터는 사용자가 수동 새로고침으로 최신 상태를 확인할 수 있다.

---

## 5. 사용자 및 권한 가정

### 5.1 MVP

- 로그인/권한 기능 없음
- 관리자 1인이 직접 사용
- 관리자 1인이 사용자와 운영자를 겸한다.

### 5.2 향후 확장

- 일반 사용자와 관리자 역할 분리 가능 구조 필요
- 데이터 정제 관리 / AI 추천 관리 / 사전 관리는 관리자 전용으로 확장 가능해야 함
- 장기적으로는 로그인 후 사용자별 데이터를 저장·조회하는 구조를 고려한다.

### 5.3 향후 역할 정의

#### User
- 채용공고 입력
- 개별 공고 분석 확인
- 대시보드 확인

#### Admin
- 데이터 정제 관리
- AI 추천 관리
- 사전 관리

---

## 6. 정보구조(IA) / 메뉴 구조

### 6.1 최상위 메뉴

1. 대시보드
2. 개별 공고 분석
3. 데이터 정제 관리
4. AI 추천 관리

### 6.2 현재 구현 방식

초기 MVP에서는 `react-router-dom`을 도입하지 않고, `activePage` 상태 기반으로 화면을 전환한다.

- PC
  - 좌측 LNB 제공
- Mobile
  - 상단 Header 제공
  - hamburger 버튼 제공
  - hamburger 클릭 시 왼쪽 drawer LNB 표시
  - drawer 바깥 클릭 시 닫힘
  - 메뉴 클릭 시 화면 전환 후 drawer 닫힘
  - drawer open 시 body scroll lock 적용

### 6.3 화면 책임 원칙

각 화면은 자신에게 필요한 API 중심으로 구성한다.

- 대시보드
  - dashboard API 중심
- 개별 공고 분석
  - postings API 중심
- 데이터 정제 관리
  - review_items API 중심
- AI 추천 관리
  - MVP에서는 placeholder

---

## 7. 핵심 사용자 흐름

### 7.1 신규 공고 입력 및 개별 분석

1. 사용자가 개별 공고 분석 화면에 진입한다.
2. 신규등록 버튼을 클릭한다.
3. 항목형 입력폼에 공고 내용을 입력한다.
4. 저장한다.
5. `POST /api/postings`가 호출된다.
6. backend에서 규칙 기반 1차 분류/분석이 `POST /api/postings` 처리 중 동기적으로 수행된다.
7. 분류 결과가 `analysis_results`와 `review_items`에 저장된다.
8. 공고 목록이 frontend에서 재조회된다.
9. 자동 판단이 어려운 항목은 데이터 정제 대상에 누적된다.

주의:
- 신규 공고 등록 후 분류/분석을 위해 별도 API를 추가 호출하지 않는다.
- 신규 공고 등록 응답은 backend 저장/분석 처리가 완료된 이후 반환되는 것으로 본다.

### 7.2 공고 상세 조회 및 수정

1. 사용자가 개별 공고 분석 화면에서 공고 목록을 확인한다.
2. 상세 보기 버튼을 클릭한다.
3. `GET /api/postings/{id}`가 호출된다.
4. 상세 정보가 Posting Detail 영역에 표시된다.
5. 사용자가 수정 버튼을 클릭한다.
6. Posting Detail 영역 안에 수정 form이 표시된다.
7. 수정 저장 시 `PUT /api/postings/{id}`가 호출된다.
8. 수정 성공 후 목록과 상세가 재조회된다.
9. 공고 수정 시 전체 재분류가 발생하며 기존 review_items와 confirmed 정제값이 초기화될 수 있음을 안내한다.

### 7.3 누적 분석 확인

1. 사용자가 대시보드 화면에 진입한다.
2. 저장된 전체 공고 기준 요약/분포/비교 데이터를 확인한다.
3. 정제 저장 후에는 사용자가 새로고침 버튼을 눌러 최신 dashboard 데이터를 확인한다.
4. 대시보드 새로고침 버튼은 dashboard API 3개를 병렬로 재호출한다.

### 7.4 수기 정제

1. 데이터 정제 관리 화면에 진입한다.
2. 조회조건을 설정한다.
   - status
   - field_type
   - dictionary_apply
   - keyword
3. 조회 버튼을 클릭한다.
4. review_items 목록을 확인한다.
5. approved_value, status, dictionary_apply를 수정한다.
6. 저장 버튼을 클릭한다.
7. `PUT /api/review-items/{id}`가 호출된다.
8. 저장 성공 후 현재 page와 현재 조회조건을 유지한 채 목록을 재조회한다.
9. `dictionary_apply=1`, `status=confirmed`, `approved_value` 존재 시 동일 field_type + 정규화 raw_value 항목이 함께 확정될 수 있다.

### 7.5 향후 AI 추천 보조

1. AI 추천 관리 화면에 진입한다.
2. MVP에서는 placeholder만 표시한다.
3. 향후 AI 추천 대상 항목을 선택하고 AI 호출 범위를 결정하는 방식으로 확장한다.

---

## 8. 화면별 요구사항

## 8.1 대시보드

### 목적

누적된 전체 공고를 기준으로 시장 흐름과 직무 적합도 탐색에 필요한 종합 분석 제공

### 연결 API

- `GET /api/dashboard/summary`
- `GET /api/dashboard/charts`
- `GET /api/dashboard/comparison`

### 주요 구성

#### Page Header

- 페이지 제목
- 새로고침 버튼
  - 클릭 시 dashboard API 3개 재호출
  - `summary`, `charts`, `comparison` API는 병렬 호출한다.
  - 구현 기준: `Promise.all` 또는 이에 준하는 동시 요청 방식
  - 3개 API의 응답 순서는 화면 정책에 영향을 주지 않는다.
  - review_items 저장 후 dashboard 자동 갱신은 하지 않음

#### Summary Cards Section

- 전체 공고 수
- 산업 카테고리 수
- 도메인 카테고리 수
- 직무 카테고리 수
- 미확정 정제 항목 수

#### Charts Section

- 산업 분포
- 직무 분포
- 상위 역량
- 상위 기술/툴
- `domain_distribution`은 현 MVP charts 범위에서 제외

#### Comparison Section

- 회사명
- 포지션
- 산업 카테고리
- 도메인 카테고리
- 직무 카테고리
- 기술/툴
- 역량
- 미확정 항목 수

### 기능

- 누적 기준 분석 결과 표시
- soft delete된 공고는 집계 제외
- 정제 저장 후 사용자가 새로고침 버튼을 눌러 최신 결과 반영
- dashboard 화면에서는 개별 공고 입력/수정/삭제 기능 없음
- dashboard 화면에서는 review item 수정 기능 없음

### 후속 개선

- 차트 라이브러리 적용
- 도넛/막대 차트 시각화
- dashboard UI/UX 고도화

---

## 8.2 개별 공고 분석

### 목적

공고 1건 단위의 입력, 저장, 조회, 수정, 삭제, 분석 결과 확인

### 현재 구현 범위

- 공고 목록 조회
- 공고 상세 조회
- 신규 공고 등록
- 기존 공고 수정
- 삭제 API는 backend에 있으나 frontend 연결은 후속 단계
- 개별 분석 결과 전용 API/UI는 후속 단계

### 연결 API

- `POST /api/postings`
- `GET /api/postings`
- `GET /api/postings/{id}`
- `PUT /api/postings/{id}`
- `DELETE /api/postings/{id}` — backend 제공, frontend 연결 후속
- `GET /api/postings/{id}/analysis` — 후속 검토

### 입력 정책

- 공고는 한 번에 1건씩 입력
- 완전 자유 텍스트가 아니라 항목형 입력폼으로 수집
- 모든 필드는 필수
- 빈 값 저장 시 backend에서 400 응답 가능
- frontend 상세 validation은 후속 개선 대상

### 입력 필드

- company
- position
- duties
- requirements
- preferred
- tools
- experience
- employment_type
- work_type
- industry_memo
- raw_text

### 화면 구성

```text
Posting Analysis Page
├─ Page Header
│  ├─ 개별 공고 분석
│  └─ 신규등록 버튼
├─ Posting List Section
│  ├─ 회사명
│  ├─ 포지션
│  ├─ 고용형태
│  ├─ 근무형태
│  ├─ 생성일
│  └─ 상세 보기 버튼
├─ Create Posting Section
│  └─ 신규등록 버튼 클릭 시에만 표시
└─ Posting Detail Section
   ├─ 공고 미선택 안내
   ├─ 상세 보기 모드
   │  ├─ 수정 버튼
   │  └─ 삭제 버튼 (후속 연결 예정)
   └─ 수정 모드
```

### 신규 등록 정책

- 화면 진입 시 신규 form은 바로 표시하지 않음
- 신규등록 버튼 클릭 시 신규 form 표시
- 신규 등록 성공 후:
  - `GET /api/postings` 재조회
  - 신규 form 초기화
  - 신규 form 닫힘
- 신규 등록 후 selectedPosting은 기존 상태를 유지할 수 있음

### 수정 정책

- 상세 보기 클릭 시 `GET /api/postings/{id}` 호출
- 같은 응답 데이터로 상세 보기와 수정 form state를 동기화
- 수정 버튼 클릭 시 Posting Detail 영역 안에서 수정 form 표시
- 수정 저장 시 `PUT /api/postings/{id}` 호출
- 수정 성공 후:
  - `GET /api/postings` 재조회
  - `GET /api/postings/{id}` 재조회
  - selectedPosting 최신화
  - editFormState 최신화
  - 수정 form 닫힘
  - 상세 보기 모드로 복귀
- 공고 수정 시 전체 재분류가 발생하며 기존 review_items와 confirmed 정제값이 초기화될 수 있음을 UI에 표시

### 삭제 정책

- Backend API는 soft delete 방식 제공
- frontend 삭제 연결은 후속 단계
- 삭제 시 예상 정책:
  - confirm 후 삭제
  - 삭제 성공 후 목록 재조회
  - selectedPosting 초기화
  - form 상태 정리

### 분석 결과

현재는 개별 분석 결과 전용 API/UI가 별도로 구현되지 않았다.  
후속 단계에서 다음 중 하나를 결정해야 한다.

1. `GET /api/postings/{id}/analysis` 별도 API 구현
2. `GET /api/postings/{id}` 응답에 analysis_results 포함
3. dashboard comparison 일부를 활용

---

## 8.3 데이터 정제 관리

### 목적

규칙 기반으로 자동 확정되지 않은 항목을 관리자가 직접 정제하는 운영 화면

### 연결 API

- `GET /api/review-items?page=1&size=15`
- `GET /api/review-items?page=1&size=15&status=unconfirmed`
- `GET /api/review-items?page=1&size=15&field_type=competency`
- `GET /api/review-items?page=1&size=15&dictionary_apply=1`
- `GET /api/review-items?page=1&size=15&keyword=문서화`
- `PUT /api/review-items/{id}`

### 조회조건

- status
  - 전체
  - unconfirmed
  - confirmed
- field_type
  - 전체
  - industry
  - domain
  - position
  - skill
  - competency
- dictionary_apply
  - 전체
  - 미반영(0)
  - 반영(1)
- keyword
  - raw_value / approved_value 부분 일치 검색
- 초기화
  - 모든 조회조건을 전체/빈값으로 초기화
  - `page=1&size=15` 전체 조회

### 목록 표시 컬럼

- company
- position
- field_type
- raw_value
- approved_value
- status
- dictionary_apply
- created_at
- updated_at
- action

### Inline Edit

- approved_value
  - text input
- status
  - select
  - unconfirmed
  - confirmed
- dictionary_apply
  - checkbox
- 저장 버튼

### 페이지네이션

- 기본 page size: 15
- 이전/다음 버튼 방식
- page size 변경 UI는 MVP 제외
- 조회조건 유지한 상태로 pagination 이동
- 저장 후 현재 page와 현재 조회조건 유지

### 저장 정책

- 현재 row의 approved_value, status, dictionary_apply 저장
- 저장 후 현재 page와 현재 조회조건으로 목록 재조회
- dashboard 자동 갱신은 하지 않음
- 필요한 경우 dashboard에서 수동 새로고침

### dictionary_apply 일괄 적용 정책

다음 조건을 모두 만족할 때 일괄 적용한다.

- 저장 요청의 dictionary_apply 값이 1
- 저장 요청의 status 값이 confirmed
- 최종 approved_value가 null 또는 빈 문자열이 아님
- 기존 review item과 field_type이 동일
- raw_value를 정규화했을 때 동일
- 대상 review_items.status = unconfirmed
- 대상 review_items가 soft delete되지 않은 posting에 연결됨
- 현재 저장 중인 review_item_id 자기 자신은 제외

일괄 적용 결과:

- approved_value 동일 적용
- status = confirmed
- dictionary_apply = 1
- updated_at 갱신
- 영향 받은 모든 posting_id의 analysis_results.unconfirmed_count 재계산

### 조회 정렬

- unconfirmed 우선
- updated_at 내림차순
- id 내림차순

### 주의사항

- soft delete된 공고의 review_items는 표시하지 않음
- 개별 공고 원문 수정은 이 화면에서 하지 않음
- 이 화면은 정제 전용 화면으로 유지
- 저장된 항목도 조회 가능해야 함

---

## 8.4 AI 추천 관리

### 목적

후속 단계 placeholder 화면

### 현재 구현

- 메뉴는 존재
- placeholder 표시
- 실제 API 없음

### 후속 범위

- AI 추천 대상 목록
- 선택 항목 AI 호출
- 예상 토큰/비용 표시
- AI 추천 결과 검토
- 수기정제 또는 저장으로 연결

---

## 9. 데이터 정제 정책

### 9.1 정제 정의

원문 표현을 분석에 활용 가능한 대표값으로 통일하는 작업

예:

- 유관부서 조율 → 협업 역량
- 운영 체계 고도화 → 운영 역량
- Jira 사용 경험 → Jira

### 9.2 정제 대상 분류

- 산업 카테고리
- 도메인 카테고리
- 직무 카테고리
- 역량
- 스킬/툴

### 9.3 정제 원칙

- 원문은 보존
- 대표값은 별도 저장
- 자동 확정이 애매한 값만 미확인으로 남김
- 최종 저장은 관리자가 수행
- 동일/유사 표현은 사전과 문자열 비교를 우선 활용
- AI는 초기 MVP에서는 사용하지 않음

### 9.4 정제 기능 한계와 후속 고도화

현재 정제 로직은 exact / alias / contains 중심이다.  
분석용 list/bullet normalize를 1차 적용했으나, 긴 문장 내 핵심 표현 추출이나 의미 기반 분류는 아직 충분하지 않다.

후속 고도화 대상:

- 긴 문장 내 핵심 표현 추출
- bullet/list 문장 단위 분리
- dictionary alias 확장
- synonym-map 자동 반영
- exact/contains 매칭 정책 보완
- field_type별 추출 기준 정교화
- AI 기반 유사 표현 추천

---

## 10. 규칙 기반 1차 분류 정책

### 10.1 기본 원칙

- 규칙 기반 자동 분류를 우선 적용한다.
- 명확히 판단 가능한 경우에만 자동 확정한다.
- 판단이 애매하면 미확인으로 분류한다.

### 10.2 자동 확정 조건

#### 스킬/툴

- alias 포함 매칭 허용
- 예:
  - Jira 사용 경험 → Jira
  - SQL 기반 분석 → SQL
  - Confluence 활용 가능 → Confluence

#### 산업 / 도메인 / 직무 / 역량

- exact match 또는 alias match일 때만 자동 확정
- 복수 후보가 동시에 걸리면 미확인 처리
- 문맥 추론 기반 자동 확정은 MVP에서 수행하지 않음

### 10.3 포함 매칭 허용 범위

- 스킬/툴만 포함 매칭 허용
- 산업 / 도메인 / 직무 / 역량에는 포함 매칭을 적용하지 않음

### 10.4 미확인 처리 조건

- 사전에 없는 신규 표현
- 복수 후보가 동시에 매칭되는 경우
- exact/alias 기준으로도 명확히 분류할 수 없는 경우
- 사람이 판단해야 한다고 보는 경우

### 10.5 분석용 텍스트 normalize 정책

공고 저장 원문은 보존하되, classification 내부 분석용 copy에만 normalize를 적용한다.

처리 대상:

- HTML list 태그
  - ul
  - ol
  - li
- 줄바꿈 태그
  - br
  - br/
  - br />
- 기타 HTML 태그
- 줄 앞 bullet / 도형 / 번호 / 원문자 숫자
  - •
  - -
  - *
  - ·
  - ㆍ
  - □
  - ■
  - ▶
  - ▷
  - ①~⑩
  - 1.
  - 1)
  - (1)
  - 가.
  - 가)
  - ㄱ.
  - ㄱ)
- 연속 공백 정리
- 줄 단위 의미 유지

이번 단계 후속 개선 대상:

- [필수], [우대] 등 대괄호 레이블 처리
  - 현재 구현에서는 제거하지 않음
  - 대괄호 레이블은 섹션 의미를 가질 수 있어 후속 정책 결정 필요
- 의미 유사도 처리
- synonym-map 자동 추가
- 기타 특수 패턴 확장

---

## 11. AI 활용 정책

### 11.1 기본 원칙

- 초기 MVP는 AI 없이 시작
- 분석 품질을 본 뒤 AI 도입 검토
- 향후 도입 시에도 AI는 잔여 미확인 항목에 대해 선택적으로 사용
- AI 결과는 후보 제안일 뿐, 자동 확정하지 않음

### 11.2 향후 AI가 필요한 영역

- 의미가 애매한 표현 해석
- 사전에 없는 신규 표현 후보 제안
- 문맥상 여러 후보가 가능한 항목에 대한 제안
- 유사 표현 묶기 보조

### 11.3 AI 없이 처리 가능한 영역

- 공고 저장/삭제/목록 관리
- 시각화
- 정규화된 스킬/툴 매칭
- 사전 기반 카테고리 분류
- review queue 생성
- 수기 정제 및 일괄 확정

---

## 12. 사전 관리 정책

### 12.1 사전이 필요한 이유

- 동일/유사 표현 재사용
- 반복 정제 비용 최소화
- 향후 AI 호출 최소화
- 정제 기준 일관성 유지
- 차트/집계 안정성 확보

### 12.2 초기 사전 유형

- 산업 카테고리 사전
- 도메인 카테고리 사전
- 직무 카테고리 사전
- 역량 대표값 사전
- 스킬/툴 사전
- 유사 표현 매핑 사전

### 12.3 사전 반영 방식

현재 MVP에서는 `dictionary_apply`가 다음 의미를 가진다.

- 현재 row 저장
- 조건 충족 시 동일 field_type + 정규화 raw_value 항목 일괄 확정
- synonym-map 자동 추가는 아직 구현하지 않음

후속 단계에서는 다음을 검토한다.

- dictionary_apply=1 저장 시 synonym-map 자동 추가
- 이후 신규 공고 분석 시 자동 매칭
- 중복 synonym 처리 정책
- config reload 정책

### 12.4 향후 필요 화면

- 사전관리 화면은 후속 단계에서 별도 구축 예정
- MVP에서는 JSON 파일 기반 관리 가능
- 장기적으로는 UI 기반 사전관리 화면 필요

---

## 13. 기술 스택 / 아키텍처

### 13.1 실행 환경

- MVP는 로컬 실행 가능해야 함
- 장기적으로 웹서비스 배포 가능한 구조를 전제로 설계

### 13.2 기술 스택

- Frontend
  - Vite
  - React
  - JavaScript
  - npm
- Backend
  - FastAPI
- 운영 데이터 저장
  - SQLite
- 설정/사전 데이터
  - JSON config
- 차트
  - 현재 MVP는 리스트/테이블 기반 표시
  - 후속 UI 고도화에서 차트 라이브러리 도입 검토

### 13.3 Frontend 실행 기준

- frontend dev server port: 3000
- API base URL:
  - `.env.local`
  - `VITE_API_BASE_URL=http://127.0.0.1:8000`
- `.env.local`은 Git commit 대상에서 제외
- `.env.example`은 commit 대상
- Vite 환경변수 규칙
  - 브라우저에서 접근해야 하는 환경변수는 반드시 `VITE_` 접두사를 사용한다.
  - frontend 코드에서는 `import.meta.env.VITE_API_BASE_URL`로 접근한다.
  - `process.env` 또는 `REACT_APP_` 방식은 사용하지 않는다.

### 13.4 Backend 실행 기준

- API server: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`
- CORS:
  - `http://localhost:3000`

### 13.5 아키텍처 원칙

- 현재는 로그인 없음
- 향후 로그인/권한/사용자별 데이터 분리 가능한 구조 유지
- 프론트/백 분리형 구조
- 초기에는 activePage 기반 화면 전환
- 후속 단계에서 routing / component split 검토

### 13.6 현재 App.jsx 주요 상태 변수

다른 채팅방에서 기존 `App.jsx`를 수정할 때 중복 state 생성 또는 잘못된 참조를 방지하기 위해, 현재 주요 상태 변수명을 유지한다.

#### 화면 전환 / Navigation

- `activePage`
  - 현재 표시 화면
  - 값: `'dashboard' | 'postings' | 'reviewItems' | 'aiRecommendations'`
- `isNavigationOpen`
  - 모바일 hamburger drawer open 여부

#### Dashboard

- `summary`
- `loading`
- `error`
- `charts`
- `chartsLoading`
- `chartsError`
- `comparison`
- `comparisonLoading`
- `comparisonError`
- `isRefreshingDashboard`

#### Postings

- `postings`
- `postingsLoading`
- `postingsError`
- `selectedPosting`
- `selectedPostingLoading`
- `selectedPostingError`
- `isCreateFormOpen`
  - 신규 공고 form 표시 여부
- `isEditingPosting`
  - 공고 수정 모드 여부
- `createFormState`
  - 신규 등록 form state
- `editFormState`
  - 수정 form state
- `postingSaveError`
- `isSavingPosting`

#### Review Items

- `reviewItems`
- `reviewItemsPageInfo`
  - 구조: `{ page, size, total }`
- `reviewItemsLoading`
- `reviewItemsError`
- `reviewItemsStatusFilter`
- `reviewItemsFieldTypeFilter`
- `reviewItemsDictionaryApplyFilter`
- `reviewItemsKeywordFilter`
- `savingReviewItemId`
  - 저장 중인 review item id
- `reviewItemSaveError`

주의:
- 기존 `App.jsx`에 이미 존재하는 상태 변수는 수정 작업에서 재사용한다.
- 동일한 역할의 state를 새로 생성하지 않는다.
- 새 기능을 위한 state 추가 시에는 기존 변수명과 충돌하지 않는 이름을 사용한다.
- `reviewItemsPageInfo`는 pagination과 저장 후 재조회에 사용되므로 이름을 유지한다.
- `createFormState`와 `editFormState`는 신규/수정 form 상태가 섞이지 않도록 분리해서 관리한다.

---

## 14. DB 스키마

### 14.1 공통 원칙

- 기본 PK는 `INTEGER PRIMARY KEY AUTOINCREMENT`
- 삭제 정책은 soft delete
- `created_at`, `updated_at` 관리
- 시간 타입은 SQLite TEXT 기준 사용
- 현재 구현에서는 한국 시간 기준 보정을 위해 `datetime('now', '+9 hours')`를 사용한다.
- KST 처리 주의사항
  - 현재 방식은 로컬 단일 환경에서는 정상 동작한다.
  - 서버 타임존이 이미 KST인 환경에 배포하면 `UTC+18`처럼 시간이 중복 보정되는 버그가 발생할 수 있다.
  - 비로컬 배포 또는 환경 이전 전에는 Python layer에서 시간 처리하거나 UTC 저장 방식으로 전환하는 것을 검토해야 한다.

### 14.2 postings

```sql
CREATE TABLE IF NOT EXISTS postings (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  company          TEXT NOT NULL,
  position         TEXT NOT NULL,
  duties           TEXT NOT NULL,
  requirements     TEXT NOT NULL,
  preferred        TEXT NOT NULL,
  tools            TEXT NOT NULL,
  experience       TEXT NOT NULL,
  employment_type  TEXT NOT NULL,
  work_type        TEXT NOT NULL,
  industry_memo    TEXT NOT NULL,
  raw_text         TEXT NOT NULL,
  is_deleted       INTEGER DEFAULT 0,
  created_at       TEXT DEFAULT (datetime('now', '+9 hours')),
  updated_at       TEXT DEFAULT (datetime('now', '+9 hours'))
);
```

### 14.3 review_items

```sql
CREATE TABLE IF NOT EXISTS review_items (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  posting_id        INTEGER NOT NULL,
  field_type        TEXT NOT NULL,
  raw_value         TEXT NOT NULL,
  approved_value    TEXT,
  status            TEXT DEFAULT 'unconfirmed',
  dictionary_apply  INTEGER DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now', '+9 hours')),
  updated_at        TEXT DEFAULT (datetime('now', '+9 hours')),
  FOREIGN KEY (posting_id) REFERENCES postings(id)
);
```

### 14.4 analysis_results

```sql
CREATE TABLE IF NOT EXISTS analysis_results (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  posting_id             INTEGER NOT NULL UNIQUE,
  industry_category      TEXT,
  domain_category        TEXT,
  position_category      TEXT,
  extracted_skills       TEXT,
  extracted_competencies TEXT,
  unconfirmed_count      INTEGER DEFAULT 0,
  analyzed_at            TEXT DEFAULT (datetime('now', '+9 hours')),
  FOREIGN KEY (posting_id) REFERENCES postings(id)
);
```

---

## 15. API 엔드포인트

### 15.1 공통 응답 포맷

성공:

```json
{
  "data": {},
  "error": null
}
```

실패:

```json
{
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "message": "설명 메시지"
  }
}
```

### 15.2 공고 관리 API

#### PostingInput 요청 body

`POST /api/postings`와 `PUT /api/postings/{id}`는 동일한 요청 body 구조를 사용한다.

```json
{
  "company": "string",
  "position": "string",
  "duties": "string",
  "requirements": "string",
  "preferred": "string",
  "tools": "string",
  "experience": "string",
  "employment_type": "string",
  "work_type": "string",
  "industry_memo": "string",
  "raw_text": "string"
}
```

주의:
- 현재 backend 기준 모든 필드는 필수이다.
- 빈 값 저장 시 validation error 또는 400 계열 응답이 발생할 수 있다.
- frontend 상세 validation은 후속 개선 대상이다.

#### `POST /api/postings`

- 공고 저장
- 요청 body: `PostingInput`
- 규칙 기반 자동 분류 실행
- analysis_results 저장
- review_items 생성

#### `GET /api/postings`

- 공고 목록 조회
- `is_deleted = 0`
- 등록일시 내림차순

주의:
- `GET /api/postings` 응답은 frontend 목록 화면 표시 기준으로만 사용한다.
- 목록 화면에서는 `id`, `company`, `position`, `employment_type`, `work_type`, `created_at`, `is_deleted`를 기준 필드로 사용한다.
- 실제 backend 응답에 상세 입력 필드가 포함되어 있더라도, frontend는 목록 응답을 상세 화면 또는 수정 form 데이터로 사용하지 않는다.
- 공고 상세 화면 렌더링 및 수정 form 값 채움은 반드시 `GET /api/postings/{id}`를 별도 호출하여 받은 단건 상세 응답을 기준으로 한다.

응답 data 예시:

```json
[
  {
    "id": 1,
    "company": "string",
    "position": "string",
    "employment_type": "string",
    "work_type": "string",
    "created_at": "2026-04-27 12:23:33",
    "is_deleted": 0
  }
]
```

목록 화면 표시 기준 필드:

```text
id
company
position
employment_type
work_type
created_at
is_deleted
```

주의:
- frontend 목록 화면은 위 필드를 기준으로 표시한다.
- 목록 응답에 상세 입력 필드가 포함될 수 있더라도, 상세 화면은 `GET /api/postings/{id}` 응답을 기준으로 동기화한다.

#### `GET /api/postings/{id}`

- 공고 단건 조회

응답 data 예시:

```json
{
  "id": 1,
  "company": "string",
  "position": "string",
  "duties": "string",
  "requirements": "string",
  "preferred": "string",
  "tools": "string",
  "experience": "string",
  "employment_type": "string",
  "work_type": "string",
  "industry_memo": "string",
  "raw_text": "string",
  "created_at": "string",
  "updated_at": "string"
}
```

#### `PUT /api/postings/{id}`

- 공고 수정
- 요청 body: `PostingInput`
- 재분류 실행
- 기존 review_items 삭제 후 재생성
- 기존 confirmed 정제값 초기화 가능

#### `DELETE /api/postings/{id}`

- soft delete 처리
- frontend 연결은 후속 단계

### 15.3 데이터 정제 API

#### `GET /api/review-items`

기본:

```text
GET /api/review-items?page=1&size=15
```

응답 data 구조:

```json
{
  "items": [
    {
      "id": 1,
      "posting_id": 1,
      "company": "string",
      "position": "string",
      "field_type": "competency",
      "raw_value": "string",
      "approved_value": "string",
      "status": "unconfirmed",
      "dictionary_apply": 0,
      "created_at": "2026-04-27 12:23:33",
      "updated_at": "2026-04-27 13:43:58"
    }
  ],
  "page": 1,
  "size": 15,
  "total": 100
}
```

주의:
- `items`는 현재 page의 목록이다.
- `page`, `size`, `total`은 pagination 구현에 사용한다.
- `total`은 현재 적용된 조회조건 기준의 전체 건수이다.
- `company`, `position`은 review item이 발생한 공고 출처 정보이다.

지원 query parameter:

```text
page
size
status
field_type
dictionary_apply
keyword
```

#### `status`

허용값:

```text
unconfirmed
confirmed
```

#### `field_type`

허용값:

```text
industry
domain
position
skill
competency
```

#### `dictionary_apply`

허용값:

```text
0
1
```

query string 처리 기준:

```text
- frontend에서는 "0" 또는 "1"을 query string으로 전송한다.
- query string은 문자열로 전달되지만, backend에서는 `int | None`으로 받아 정수 0/1로 검증·처리한다.
- frontend 구현 시 0은 falsy 값이므로 truthy 체크로 처리하면 안 된다.
- `dictionaryApply !== '' && dictionaryApply !== null && dictionaryApply !== undefined`처럼 별도 조건으로 query 포함 여부를 판단한다.
```

#### `keyword`

검색 대상:

```text
raw_value
approved_value
```

검색 방식:

```text
LIKE 부분 일치
```

응답 item 추가 필드:

```text
company
position
```

#### `PUT /api/review-items/{id}`

요청 body:

```json
{
  "approved_value": "문서화",
  "status": "confirmed",
  "dictionary_apply": 1
}
```

저장 정책:

- 현재 row 저장
- status 변경 시 analysis_results.unconfirmed_count 동기화
- dictionary_apply=1, status=confirmed, approved_value 존재 시 동일 field_type + 정규화 raw_value 항목 일괄 confirmed
- soft delete된 posting의 review_items는 제외
- 자기 자신은 일괄 업데이트 대상에서 제외
- 영향 받은 posting_id의 unconfirmed_count 모두 재계산

### 15.4 대시보드 API

#### `GET /api/dashboard/summary`

응답 data:

```json
{
  "total_postings": 0,
  "total_industry_categories": 0,
  "total_domain_categories": 0,
  "total_position_categories": 0,
  "total_unconfirmed_items": 0
}
```

#### `GET /api/dashboard/charts`

응답 data:

```json
{
  "industry_distribution": [
    {
      "name": "IT/테크",
      "count": 5
    }
  ],
  "position_distribution": [
    {
      "name": "서비스 기획",
      "count": 4
    }
  ],
  "top_competencies": [
    {
      "name": "문서화",
      "count": 8
    }
  ],
  "top_skills": [
    {
      "name": "Jira",
      "count": 6
    }
  ]
}
```

배열 item 구조:

```json
{
  "name": "string",
  "count": 0
}
```

공통 적용 대상:

```text
industry_distribution
position_distribution
top_competencies
top_skills
```

주의:

- domain_distribution은 현재 MVP charts 범위에서 제외
- frontend charts/list 렌더링은 `item.name`, `item.count`를 기준으로 한다.

#### `GET /api/dashboard/comparison`

응답 data:

```json
[
  {
    "company": "string",
    "position": "string",
    "industry_category": "string",
    "domain_category": "string",
    "position_category": "string",
    "extracted_skills": [],
    "extracted_competencies": [],
    "unconfirmed_count": 0
  }
]
```

### 15.5 후속 API

#### 개별 분석 결과

```text
GET /api/postings/{id}/analysis
```

- 아직 미구현
- 후속 검토

#### 사전 조회

```text
GET /api/dictionary/{type}
```

- 아직 미구현
- 후속 검토

---

## 16. Seed Data 정책

### 16.1 목적

사전 초기값이 없으면 규칙 기반 분류가 동작하지 않으므로 MVP 시작 전에 최소 seed data가 필요하다.

### 16.2 초기 준비 대상

- `skill-dictionary.json`
- `position-categories.json`
- `industry-categories.json`
- `domain-categories.json`
- `competency-dictionary.json`
- `synonym-map.json`

### 16.3 관리 방식

- JSON 파일 기반 관리
- config loader로 로드
- 코드에 seed data hardcoding 금지
- seed data 고도화는 서비스 운영/검증 결과를 보고 별도 진행

---

## 17. 에러 / 예외 처리 정책

### 공통 정책

- API는 공통 응답 포맷 유지
- HTTPException은 공통 error 구조로 반환
- validation error는 공통 error 구조로 반환
- config load error는 서버 error로 반환

### Frontend 최소 처리

- loading 문구 표시
- error 문구 표시
- CORS error는 console에서 확인
- toast 라이브러리 미사용
- 상세 validation은 후속 개선

---

## 18. 파일 / 데이터 구조 요구사항

현재 구조:

```text
project/
  backend/
    app/
      main.py
      database.py
      config_loader.py
      classification.py
      postings.py
      review_items.py
      dashboard.py
  config/
    industry-categories.json
    domain-categories.json
    position-categories.json
    competency-dictionary.json
    skill-dictionary.json
    synonym-map.json
  frontend/
    src/
      App.jsx
      App.css
      api/
        dashboardApi.js
        postingsApi.js
        reviewItemsApi.js
```

후속 권장 구조:

```text
frontend/src/
  app/
    layout/
  pages/
    DashboardPage.jsx
    PostingAnalysisPage.jsx
    ReviewManagementPage.jsx
    AIRecommendationPage.jsx
  features/
    dashboard/
    postings/
    review-items/
  services/ 또는 api/
```

---

## 19. 기능 요구사항 상세

### 19.1 공고 입력

- 사용자는 공고를 1건씩 입력 가능해야 함
- 입력폼은 항목형으로 제공
- 모든 필드는 필수
- 신규등록 버튼 클릭 시 form 표시
- 신규 저장 성공 후 목록 재조회 및 form 초기화

### 19.2 공고 관리

- 저장된 공고 목록 조회
- 공고 상세 조회
- 공고 수정
- 공고 삭제는 backend API 존재, frontend 연결 후속
- 기본 정렬은 등록일시 내림차순
- soft delete 정책 유지

### 19.3 개별 분석

- 저장 직후 backend에서 규칙 기반 분석 수행
- 분석 결과는 analysis_results에 저장
- 개별 분석 결과 전용 UI는 아직 미구현
- 후속에서 분석 결과 표시 방식을 결정

### 19.4 누적 분석

- 전체 공고를 기준으로 산업/직무/역량/툴 분포 표시
- 저장/삭제/정제 반영 후 사용자가 수동 새로고침으로 최신 상태 반영
- 현재는 리스트/테이블 기반 표시
- chart UI 고도화는 후속

### 19.5 수기 정제

- 미확인 항목을 table 형태로 표시
- company / position으로 공고 출처 확인
- 조회조건 지원
  - status
  - field_type
  - dictionary_apply
  - keyword
- pagination 지원
- approved_value 수정
- status 변경
- dictionary_apply 체크
- 저장
- 저장 시 현재 page와 조회조건 유지
- dictionary_apply=1 조건 충족 시 동일 raw_value 일괄 확정

### 19.6 AI 추천

- MVP에서는 placeholder
- 실제 기능은 후속 단계

---

## 20. 비기능 요구사항

### 20.1 비용 통제

- 초기 MVP는 AI 미사용
- 향후 AI 도입 시 선택 항목에 대해서만 호출
- 전체 공고 자동 AI 분석 금지

### 20.2 확장성

- 사전/카테고리/매핑 규칙은 하드코딩 금지
- JSON 파일 기반 관리 가능
- 향후 사용자/관리자 권한 구조 확장 가능
- routing 및 component split 가능 구조로 전환 예정

### 20.3 유지보수성

- 화면 책임 분리
- 데이터 정제와 AI 추천 기능 분리
- review queue 기반 정제 흐름 유지
- API client는 기능 단위로 분리
  - dashboardApi
  - postingsApi
  - reviewItemsApi

### 20.4 품질 관리

- 애매한 항목은 자동 확정하지 않고 미확인 처리
- 최종 저장은 관리자 확인 필수
- 사전 반영은 명시적 체크를 통해서만 수행
- 일괄 확정은 동일 field_type + 정규화 raw_value 기준으로 제한

---

## 21. MVP 포함 / 제외 범위

### 21.1 현재 포함

- 대시보드
- 개별 공고 분석
- 데이터 정제 관리
- AI 추천 관리 placeholder
- 규칙 기반 1차 분류
- SQLite + JSON 기반 저장 구조
- dashboard API
- postings API
- review_items API
- frontend API client
- activePage 기반 화면 전환
- PC LNB
- 모바일 hamburger drawer navigation
- 모바일 drawer open 시 body scroll lock
- 기본 반응형 CSS
- CORS 설정

### 21.2 현재 제외 또는 후순위

- 로그인/회원가입
- 권한 관리
- 다중 사용자
- export
- 사전관리 전용 UI
- AI 추천 관리 실제 사용
- 고급 자동 의미 해석
- 완전 자동 카테고리 확정
- synonym-map 자동 추가
- 차트 라이브러리 기반 시각화
- URL routing
- component split
- frontend 삭제 기능 연결
- 개별 분석 결과 전용 API/UI
- page size 변경 UI
- 날짜 범위 필터
- field별 고급 검색
- 정렬 조건 변경

---

## 22. 향후 확장 방향

1. 공고 삭제 frontend 연결
2. 개별 분석 결과 표시 방식 확정
3. 정제 알고리즘 고도화
4. synonym-map 자동 추가
5. 사전관리 전용 화면 추가
6. UI/UX 고도화
7. 차트 라이브러리 도입
8. 라우팅 도입
9. 컴포넌트 구조 분리
10. AI 추천 관리 활성화
11. 사용자 등록 및 권한 분리
12. 사용자별 공고 저장 공간 분리
13. 공고 적합도(FIT) 분석 로직 연결

---

## 23. 의사결정 요약

- 공고는 1건씩 입력
- 입력은 항목형 폼
- 모든 입력 필드는 필수
- 대시보드는 누적 분석, 개별 공고 분석은 단건 중심
- 데이터 정제는 수기 중심 운영
- AI는 초기 MVP에서 제외
- 저장 구조는 SQLite + JSON config
- 공고 목록 정렬은 등록일시 내림차순
- 공고 삭제는 soft delete
- 대시보드는 새로고침 버튼으로 재계산 제어
- 정제 화면은 저장된 항목도 표시
- 정제 화면 기본 노출은 15개
- 정제 화면은 page button 방식
- 정제 조회조건은 status / field_type / dictionary_apply / keyword
- dictionary_apply=1은 현 단계에서 동일 raw_value 일괄 확정 의미
- synonym-map 자동 추가는 후속
- 규칙 기반 자동 확정은 명확한 매칭에 한정
- 포함 매칭은 스킬/툴에만 허용
- 공통 API 응답 포맷 통일
- frontend는 activePage 기반 화면 전환
- PC LNB / 모바일 hamburger drawer 사용
- 최소 반응형은 모든 신규 화면의 기본 조건
- UI 고도화는 화면 기능 안정화 이후 진행

---

## 24. 오픈 이슈

1. 공고 삭제 frontend 연결
2. 개별 분석 결과 API/UI 설계
3. 정제 알고리즘 고도화
4. synonym-map 자동 추가 정책
5. 사전관리 UI 설계
6. AI 추천 관리 실제 기능 정의
7. 정제 화면 날짜 범위 필터
8. page size 변경 UI
9. dashboard 차트 시각화 방식
10. URL routing 도입 여부
11. 컴포넌트 구조 분리 시점
12. 공고 적합도(FIT) 분석 포함 시점
13. 중복/유사 정제값 경고 수준
14. 공고 수정 시 confirmed 정제값 초기화 안내 및 복구 정책

---

## 25. 부록: 정제 화면 그리드 예시

| company | position | field_type | raw_value | approved_value | status | dictionary_apply | created_at | updated_at | action |
|---|---|---|---|---|---|---|---|---|---|
| 테스트회사 | 서비스 기획 | competency | 문서화 경험 | 문서화 | confirmed | Y | 2026-04-27 12:23:33 | 2026-04-27 13:43:58 | 저장 |
| 테스트회사 | 서비스 기획 | skill | Jira | Jira | confirmed | N | 2026-04-23 15:37:10 | 2026-04-23 15:37:10 | 저장 |

---

## 26. 부록: 규칙 기반 분류 예시

| 필드 | 원문 | 규칙 | 결과 |
|---|---|---|---|
| 스킬 | Jira 사용 경험 | 포함 매칭 허용 | Jira 자동 확정 |
| 스킬 | SQL 기반 분석 | 포함 매칭 허용 | SQL 자동 확정 |
| 직무 | 서비스 운영 기획 | exact/alias 불명확 | 미확인 |
| 역량 | 유관부서 조율 | alias 없으면 자동 확정 안 함 | 미확인 |
| 역량 | 문서화 경험 | dictionary_apply 일괄 확정 가능 | 문서화 |

---

## 27. 부록: 실행 및 검증 명령어

### Backend 실행

```powershell
cd C:\Users\전유현\OneDrive\Desktop\개인\Codex\job-posting-analysis
.\.venv\Scripts\activate
python -m uvicorn backend.app.main:app --reload
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

### Frontend 실행

```powershell
cd C:\Users\전유현\OneDrive\Desktop\개인\Codex\job-posting-analysis\frontend
npm.cmd run dev
```

Frontend:

```text
http://localhost:3000
```

### Frontend build

```powershell
cd C:\Users\전유현\OneDrive\Desktop\개인\Codex\job-posting-analysis\frontend
npm.cmd run build
```
