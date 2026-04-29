# 채용공고 정제 및 분석 대시보드 MVP — 신규 채팅방 개발 인수인계 문서

## 1. 문서 목적

이 문서는 신규 채팅방에서 현재 서비스 개발을 이어가기 위한 인수인계 문서이다.

목적:
- PRD v0.7 기준 현재까지 구현된 개발 내용을 누락 없이 전달
- 신규 채팅방에서 이미 완료된 기능을 재구현하지 않도록 방지
- 다음 구현 과제를 작은 단위로 이어서 진행하기 위한 기준 제공
- Codex를 활용하되 토큰 사용량을 최소화하는 개발 방식을 유지

기준 문서:
- `job_posting_dashboard_MVP_PRD_v0_7.md`

---

## 2. 개발 진행 원칙

- 한 번에 전체 기능을 구현하지 않는다.
- 반드시 작은 단계로 나눠서 진행한다.
- 이미 완료된 단계는 다시 구현하지 않는다.
- 정책 결정은 임의로 하지 않고 PRD v0.7 기준을 따른다.
- frontend와 backend를 동시에 수정해야 하는 경우에는 수정 범위를 명확히 제한한다.
- API 연동과 UI 고도화를 한 번에 진행하지 않는다.
- 자동 git push / merge는 하지 않는다.
- 각 단계 완료 후 commit 메시지만 제안한다.
- push / merge는 사용자가 직접 확인 후 수행한다.

---

## 3. 현재까지 개발 완료 요약

### 3.1 Backend 완료

- FastAPI backend 기본 구조 구현 완료
- SQLite 기반 DB 구조 구현 완료
- JSON config loader 구현 완료
- postings API 구현 완료
  - `POST /api/postings`
  - `GET /api/postings`
  - `GET /api/postings/{id}`
  - `PUT /api/postings/{id}`
  - `DELETE /api/postings/{id}` backend 제공
- review_items API 구현 완료
  - `GET /api/review-items`
  - `PUT /api/review-items/{id}`
- dashboard API 구현 완료
  - `GET /api/dashboard/summary`
  - `GET /api/dashboard/charts`
  - `GET /api/dashboard/comparison`
- frontend 연동용 CORS 설정 완료
  - `allow_origins=["http://localhost:3000"]`

---

### 3.2 Backend 보완 완료

- `review_items.status` 변경 시 `analysis_results.unconfirmed_count` 동기화
- `dictionary_apply=1` 저장 시 동일 `field_type + 정규화 raw_value` 항목 일괄 confirmed 처리
- `review_items` 목록에 공고 출처 정보 추가
  - `company`
  - `position`
- `review_items` 조회조건 추가
  - `status`
  - `field_type`
  - `dictionary_apply`
  - `keyword`
- classification 분석용 텍스트 normalize 1차 적용
  - bullet/list/html list 형식 입력 대응
  - 원문 저장값은 변경하지 않음

---

### 3.3 Frontend 완료

- Vite + React + JavaScript frontend 초기화 완료
- dev server port `3000` 설정 완료
- `.env.example` / `.env.local` 기준 정리 완료
  - `VITE_API_BASE_URL=http://127.0.0.1:8000`
- `activePage` 기반 화면 전환 구현 완료
- PC 좌측 LNB 구현 완료
- 모바일 hamburger drawer navigation 구현 완료
  - drawer open 시 body scroll lock 적용
- dashboard 화면 구현 완료
  - summary 표시
  - charts 표시
  - comparison 표시
  - 수동 새로고침 버튼
- postings 화면 구현 완료
  - 목록 표시
  - 상세 보기
  - 신규 등록
  - 기존 공고 수정
  - 신규/수정 form 배치 개선
- review_items 화면 구현 완료
  - 목록 표시
  - company / position 출처 표시
  - pagination
  - inline edit
  - 저장
  - status / field_type / dictionary_apply / keyword 조회조건
  - 조회조건 초기화

---

## 4. 현재 구현상 중요한 원칙

### 4.1 Frontend 구조

- frontend는 아직 `react-router-dom`을 사용하지 않는다.
- 화면 전환은 `App.jsx`의 `activePage` state 기반이다.
- 기존 `App.jsx` state를 중복 생성하지 말고 재사용한다.
- 동일 역할의 state를 새로 만들지 않는다.
- 신규 state 추가 시 기존 변수명과 충돌하지 않게 한다.

### 4.2 Dashboard

- dashboard 새로고침은 dashboard API 3개를 병렬 호출한다.
  - `GET /api/dashboard/summary`
  - `GET /api/dashboard/charts`
  - `GET /api/dashboard/comparison`
- 구현 기준은 `Promise.all` 또는 이에 준하는 동시 요청 방식이다.
- `summary / charts / comparison` 응답 순서는 화면 정책에 영향을 주지 않는다.
- `review_items` 저장 후 dashboard는 자동 갱신하지 않는다.
- dashboard 최신값은 dashboard 화면의 수동 새로고침으로 확인한다.

### 4.3 Postings

- `GET /api/postings` 목록 응답은 목록 화면 표시 기준으로만 사용한다.
- 공고 상세 화면 렌더링 및 수정 form 값 채움은 반드시 `GET /api/postings/{id}`를 별도 호출하여 받은 단건 상세 응답을 기준으로 한다.
- 공고 등록 시 backend에서 규칙 기반 분석이 `POST /api/postings` 처리 중 동기적으로 수행된다.
- 공고 수정 시 전체 재분류가 발생하며 기존 `review_items`와 confirmed 정제값이 초기화될 수 있다.
- frontend 삭제 기능은 아직 연결되지 않았다.

### 4.4 Review Items

- `GET /api/review-items` 응답 구조는 다음을 사용한다.

```json
{
  "items": [],
  "page": 1,
  "size": 15,
  "total": 100
}
```

- `items`는 현재 page의 목록이다.
- `page`, `size`, `total`은 pagination 구현에 사용한다.
- `total`은 현재 적용된 조회조건 기준의 전체 건수이다.
- `company`, `position`은 review item이 발생한 공고 출처 정보이다.
- `dictionary_apply` query parameter는 frontend에서 문자열 `"0"` 또는 `"1"`로 전달된다.
- frontend에서 `dictionaryApply`는 truthy 체크로 처리하면 안 된다.
  - `0`이 유효값이므로 별도 조건으로 query 포함 여부를 판단해야 한다.
- 저장 후 현재 page와 현재 조회조건을 유지한 채 목록을 재조회한다.

---

## 5. 주요 API 구조 요약

### 5.1 POST /api/postings 요청 body

`POST /api/postings`와 `PUT /api/postings/{id}`는 동일한 `PostingInput` 구조를 사용한다.

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

---

### 5.2 GET /api/postings 목록 응답

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
- `id`
- `company`
- `position`
- `employment_type`
- `work_type`
- `created_at`
- `is_deleted`

주의:
- `GET /api/postings` 응답은 frontend 목록 화면 표시 기준으로만 사용한다.
- 실제 backend 응답에 상세 입력 필드가 포함되어 있더라도, frontend는 목록 응답을 상세 화면 또는 수정 form 데이터로 사용하지 않는다.
- 공고 상세 화면 렌더링 및 수정 form 값 채움은 반드시 `GET /api/postings/{id}`를 별도 호출하여 받은 단건 상세 응답을 기준으로 한다.

---

### 5.3 GET /api/postings/{id} 단건 응답

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

---

### 5.4 GET /api/review-items 응답

기본:

```text
GET /api/review-items?page=1&size=15
```

지원 query parameter:
- `page`
- `size`
- `status`
- `field_type`
- `dictionary_apply`
- `keyword`

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

---

### 5.5 PUT /api/review-items/{id} 요청 body

```json
{
  "approved_value": "문서화",
  "status": "confirmed",
  "dictionary_apply": 1
}
```

저장 정책:
- 현재 row 저장
- status 변경 시 `analysis_results.unconfirmed_count` 동기화
- `dictionary_apply=1`, `status=confirmed`, `approved_value` 존재 시 동일 `field_type + 정규화 raw_value` 항목 일괄 confirmed
- soft delete된 posting의 review_items는 제외
- 자기 자신은 일괄 업데이트 대상에서 제외
- 영향 받은 `posting_id`의 `unconfirmed_count` 모두 재계산

---

### 5.6 GET /api/dashboard/charts 응답

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

공통 item 구조:

```json
{
  "name": "string",
  "count": 0
}
```

적용 대상:
- `industry_distribution`
- `position_distribution`
- `top_competencies`
- `top_skills`

주의:
- `domain_distribution`은 현재 MVP charts 범위에서 제외한다.
- frontend charts/list 렌더링은 `item.name`, `item.count`를 기준으로 한다.

---

## 6. 현재 App.jsx 주요 상태 변수

다른 채팅방에서 기존 `App.jsx`를 수정할 때 중복 state 생성 또는 잘못된 참조를 방지하기 위해, 현재 주요 상태 변수명을 유지한다.

### 6.1 화면 전환 / Navigation

- `activePage`
  - 현재 표시 화면
  - 값: `'dashboard' | 'postings' | 'reviewItems' | 'aiRecommendations'`
- `isNavigationOpen`
  - 모바일 hamburger drawer open 여부

### 6.2 Dashboard

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

### 6.3 Postings

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

### 6.4 Review Items

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

## 7. 현재 남은 주요 구현 과제

### 7.1 1순위 — 공고 삭제 frontend 연결

현재 backend에는 `DELETE /api/postings/{id}`가 있지만 frontend 연결은 아직 후속으로 남아 있다.

작업 범위:
- Posting Detail 영역에 삭제 버튼 추가
- 수정 모드에서는 삭제 버튼 숨김
- 삭제 클릭 시 `window.confirm`으로 확인
- 확인 시 `deletePosting(selectedPosting.id)` 호출
- 삭제 성공 후 `fetchPostings()`로 목록 재조회
- `selectedPosting` 초기화
- `isEditingPosting` false
- `editFormState` 초기화
- `createFormState`와 `isCreateFormOpen`은 변경하지 않음

하지 않을 것:
- backend 수정
- hard delete 구현
- 복구 기능
- 삭제 이력 화면
- dashboard 자동 갱신

제안 commit 메시지:

```text
Connect posting delete action
```

---

### 7.2 2순위 — 개별 공고 분석 결과 표시 방식 결정 및 구현

현재 공고 저장 시 backend에서 규칙 기반 분석이 동기적으로 수행되고 `analysis_results`, `review_items`에 저장된다. 다만 개별 공고 상세 화면에서 분석 결과를 별도 표시하는 UI/API는 아직 미구현이다.

선택지:
- `GET /api/postings/{id}/analysis` 별도 API 추가
- `GET /api/postings/{id}` 응답에 `analysis_results` 포함
- dashboard comparison 일부 활용

권장:
- 먼저 API 설계만 확정한 뒤 backend와 frontend를 분리해서 진행한다.

---

### 7.3 3순위 — 정제 알고리즘 고도화

현재 classification은 exact / alias / contains 중심이다. bullet/list/html normalize 1차 적용은 완료했지만, 긴 문장 내 핵심 표현 추출이나 의미 기반 분류는 충분하지 않다.

후속 검토 범위:
- 긴 문장 내 핵심 표현 추출
- bullet/list 문장 단위 분리 개선
- dictionary alias 확장
- synonym-map 자동 반영
- exact/contains 매칭 정책 보완
- field_type별 추출 기준 정교화
- AI 기반 유사 표현 추천

주의:
- 현재는 화면 필수 기능 구현을 우선한다.
- 정제 알고리즘 고도화는 별도 작업으로 분리한다.

---

### 7.4 4순위 — synonym-map 자동 추가

현재 `dictionary_apply=1`은 동일 `field_type + 정규화 raw_value` 항목 일괄 확정까지만 의미한다. `synonym-map` 자동 추가는 아직 구현하지 않았다.

이 작업은 다음 정책이 필요하다.
- config JSON 수정 정책
- 중복 synonym 처리
- config reload 정책

따라서 backend 단일 수정으로 끝내지 말고 별도 설계 후 진행한다.

---

### 7.5 5순위 — UI/UX 고도화

현재는 기능 검증 중심의 최소 UI다.

후속 개선 후보:
- dashboard 차트 라이브러리 적용
- 도넛/막대 차트 시각화
- comparison table 사용성 개선
- 데이터 정제 관리 table 보기/수정 모드 분리
- 공고 입력 form validation
- 저장 성공/실패 UX 개선
- mobile layout refinement

주의:
- UI 고도화는 화면 기능 안정화 이후 진행한다.

---

### 7.6 6순위 — URL routing 및 컴포넌트 구조 분리

현재는 `App.jsx` 단일 파일과 `activePage` 기반 전환 구조다.

후속 구조:

```text
frontend/src/
  app/layout/
  pages/
    DashboardPage.jsx
    PostingAnalysisPage.jsx
    ReviewManagementPage.jsx
    AIRecommendationPage.jsx
  features/
  api/
```

주의:
- routing/component split은 기능 안정화 이후 진행한다.
- 지금 당장 `react-router-dom`을 설치하지 않는다.

---

## 8. 다음 채팅방에서 바로 진행할 첫 작업 추천

```text
작업명:
Connect posting delete action
```

이유:
- postings CRUD 중 frontend에서 삭제만 남아 있음
- backend DELETE API는 이미 존재함
- 수정 파일 범위를 `frontend/src/App.jsx`, `frontend/src/App.css`로 제한 가능
- 현재 화면 구조상 Posting Detail 영역에 삭제 버튼을 추가하기 쉬움
- PRD v0.7에서 후속 연결 예정으로 명시된 항목임

---

## 9. 다음 작업용 Codex 지시문

```text
첨부한 PRD v0.7 문서를 기준으로, 개별 공고 분석 화면의 posting 삭제 기능만 연결해줘.

중요:
- 이번 작업은 postings 삭제 기능 연결 단계다.
- backend 코드는 절대 수정하지 않는다.
- postings API client는 이미 frontend/src/api/postingsApi.js에 구현되어 있으므로 수정하지 않는다.
- 이번 단계에서는 deletePosting()만 추가 사용한다.
- 기존 fetchPostings(), fetchPosting(), createPosting(), updatePosting() 동작은 유지한다.
- dashboard 화면은 수정하지 않는다.
- review_items 화면은 수정하지 않는다.
- LNB / 모바일 hamburger navigation은 유지한다.
- 라우팅은 추가하지 않는다.
- URL 라우팅은 구현하지 않는다.
- UI 라이브러리, Tailwind, 상태관리 라이브러리는 설치하지 않는다.
- package.json은 수정하지 않는다.
- .env.local은 수정/재생성/삭제하지 않는다.
- backend 삭제 정책은 기존 DELETE /api/postings/{id} soft delete API를 따른다.
- frontend에서 hard delete 정책을 새로 만들지 않는다.
- 불필요한 리팩토링은 하지 않는다.
- 자동 push / merge 하지 말고, 작업 후 diff와 검증 방법만 알려줘.

현재 완료 상태:
- postings 목록 표시 완료
- posting 상세 보기 완료
- 신규 공고 등록 완료
- 기존 공고 수정 완료
- 신규/수정 form 배치 개선 완료
- deletePosting(postingId)는 API client에 이미 존재하지만 화면에 연결되지 않은 상태다.
- 이번 단계에서는 선택 공고 삭제 기능만 추가한다.

이번 작업 범위:
- frontend/src/App.jsx를 수정하여 deletePosting()을 추가 사용한다.
- 필요 시 frontend/src/App.css만 최소 수정한다.
- 삭제 버튼은 Posting Detail 영역의 상세 보기 모드에서만 표시한다.
- 수정 form이 열려 있는 상태에서는 삭제 버튼을 표시하지 않는다.
- 공고가 선택되지 않은 상태에서는 삭제 버튼을 표시하지 않는다.
- 삭제 버튼 클릭 시 window.confirm으로 확인한다.
- confirm 취소 시 아무 API도 호출하지 않는다.
- confirm 확인 시 deletePosting(selectedPosting.id)을 호출한다.
- 삭제 성공 후 fetchPostings()로 목록을 재조회한다.
- 삭제 성공 후 selectedPosting을 null로 초기화한다.
- 삭제 성공 후 isEditingPosting을 false로 변경한다.
- 삭제 성공 후 editFormState를 빈 값으로 초기화한다.
- createFormState와 isCreateFormOpen은 변경하지 않는다.
- 삭제 실패 시 최소 error 문구를 표시한다.
- 삭제 중에는 삭제 버튼을 disabled 처리한다.

수정 허용 파일:
1. frontend/src/App.jsx
2. frontend/src/App.css

수정 금지 파일:
- backend/**
- frontend/src/api/postingsApi.js
- frontend/src/api/dashboardApi.js
- frontend/src/api/reviewItemsApi.js
- frontend/src/main.jsx
- frontend/src/index.css
- frontend/package.json
- frontend/package-lock.json
- frontend/vite.config.js
- frontend/.env.example
- frontend/.env.local
- config/**
- docs/**

구현 기준:
1. App.jsx에서 deletePosting을 import한다.
2. 기존 fetchPostings, fetchPosting, createPosting, updatePosting import는 유지한다.
3. 삭제 중 상태를 추가한다.
   - 예: deletingPostingId
4. 삭제 실패 에러 상태를 추가해도 된다.
   - 예: postingDeleteError
5. handleDeletePosting 같은 handler를 추가한다.
6. handler는 selectedPosting이 없으면 아무 동작도 하지 않는다.
7. handler는 window.confirm으로 삭제 확인을 받는다.
8. confirm 결과가 false이면 deletePosting을 호출하지 않는다.
9. confirm 결과가 true이면 deletePosting(selectedPosting.id)을 호출한다.
10. 삭제 성공 후:
    - fetchPostings()로 목록 재조회
    - selectedPosting = null
    - isEditingPosting = false
    - editFormState = 빈 값
11. 삭제 실패 시 error 문구를 표시한다.
12. 삭제 버튼은 Posting Detail 상세 보기 모드에서만 표시한다.
13. 수정 모드에서는 삭제 버튼을 표시하지 않는다.
14. 삭제 버튼 텍스트는 “삭제”로 한다.
15. 삭제 버튼 스타일은 기존 버튼 스타일 범위에서 최소로 추가한다.
16. dashboard/review_items 화면에는 영향을 주지 않는다.

검증 방법:
1. frontend build
   cd C:\Users\전유현\OneDrive\Desktop\개인\Codex\job-posting-analysis\frontend
   npm.cmd run build

2. backend 서버 실행
   cd C:\Users\전유현\OneDrive\Desktop\개인\Codex\job-posting-analysis
   .\.venv\Scripts\activate
   python -m uvicorn backend.app.main:app --reload

3. frontend 서버 실행
   cd C:\Users\전유현\OneDrive\Desktop\개인\Codex\job-posting-analysis\frontend
   npm.cmd run dev

4. 브라우저 접속
   http://localhost:3000

5. 개별 공고 분석 메뉴 클릭

6. 삭제 버튼 표시 검증
   - 공고 미선택 상태에서는 삭제 버튼이 보이지 않는다.
   - 상세 보기 클릭 후 상세 보기 모드에서 삭제 버튼이 보인다.
   - 수정 모드에서는 삭제 버튼이 보이지 않는다.

7. 삭제 취소 검증
   - 삭제 버튼 클릭
   - confirm에서 취소
   - DELETE /api/postings/{id}가 호출되지 않는다.
   - 목록과 상세가 그대로 유지된다.

8. 삭제 실행 검증
   - 테스트용 공고를 하나 선택한다.
   - 삭제 버튼 클릭
   - confirm에서 확인
   - DELETE /api/postings/{id}가 호출된다.
   - 삭제 성공 후 GET /api/postings가 다시 호출된다.
   - 삭제된 공고가 목록에서 사라진다.
   - 상세 영역은 “공고를 선택하면 상세 정보가 표시됩니다.” 상태로 돌아간다.
   - 수정 form은 닫힌다.

9. 기존 화면 검증
   - dashboard 화면이 기존처럼 동작한다.
   - review_items 화면이 기존처럼 동작한다.
   - CORS 에러가 없다.
   - frontend/.env.local은 git status에 표시되지 않는다.

작업 완료 후 아래만 요약해줘:
1. 수정 파일
2. backend 수정 여부
3. API client 수정 여부
4. 사용한 postings API
5. 삭제 버튼 표시 조건
6. 삭제 확인 방식
7. 삭제 성공 후 상태 정리 방식
8. 구현하지 않은 범위
9. 검증 방법
10. 실제 검증 여부
11. 제안 commit 메시지

제안 commit 메시지:
Connect posting delete action
```

---

## 10. 실행 명령어

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
