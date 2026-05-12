# Architecture Current State

## Frontend Deployment Readiness Note

- frontend는 Vite build 결과물(`dist`)을 Render Static Site 같은 정적 사이트 호스팅으로 배포할 수 있다.
- 배포 시 frontend는 backend API domain을 `VITE_API_BASE_URL`로 참조한다.
- local 기본값은 `http://127.0.0.1:8000`이며, 배포 예시는 `https://api.<domain>`이다.
- `VITE_` 접두사 환경변수는 browser bundle에 노출될 수 있으므로 frontend에는 public API base URL만 둔다.
- OpenAI secret은 frontend에 두지 않는다. OpenAI 호출과 `OPENAI_API_KEY` 관리는 backend 책임이다.
- Render Static Site 권장 설정은 `Root Directory: frontend`, `Build Command: npm install && npm run build`, `Publish Directory: dist`이다.

## Deployment Target Architecture Note

- 현재 구조는 local development architecture 기준이다.
- 배포 목표 architecture는 frontend/backend subdomain 분리를 전제로 한다.
- 1차 후보는 Render Static Site + Render Web Service 조합이다.
- Render 무료 플랜 사용 시 Web Service sleep/cold start 지연을 운영 제약으로 고려해야 한다.
- SQLite 운영 시 persistent disk 사용 또는 PostgreSQL 전환을 검토해야 한다.
- SQLite DB 경로는 `DB_PATH` 환경변수로 분리 가능하다. 값이 없으면 local 기본 경로 `backend/job_posting_analysis.db`를 사용한다.
- CORS allowed origins는 `ALLOWED_ORIGINS` 환경변수로 관리 가능하다. 값이 없으면 local origin 기본값을 사용한다.
- PostgreSQL 전환 시에는 별도 `DATABASE_URL` 지원 검토가 필요하다.
- backend production start command는 `0.0.0.0` bind와 `$PORT` 사용을 기준으로 검토한다.
- 상세 계획은 `docs/current/17_deployment_and_domain_plan.md`를 따른다.

## 기술 스택

소스코드에서 확인한 현재 구현:

- Frontend: Vite + React + JavaScript
- Backend: FastAPI
- Runtime DB: SQLite
- Config 소스: `config/` 하위 JSON 파일

## 로컬 실행 명령어

프로젝트 루트 기준으로 실행한다.

### Backend

```powershell
.\.venv\Scripts\activate
python -m uvicorn backend.app.main:app --reload
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

### Frontend

```powershell
cd frontend
npm.cmd run dev
```

기본 접속 URL:

```text
http://localhost:3000
```

## Backend 구조

소스코드에서 확인한 현재 구현:

- `backend/app/main.py`
  - postings, review-items, dashboard router 등록
  - `http://localhost:3000` 대상 CORS 설정
  - `HTTPException`, 요청 validation, config load 오류 핸들러 등록
- `backend/app/database.py`
  - SQLite 스키마 초기화
- `backend/app/config_loader.py`
  - 필수 JSON config 로드
- `backend/app/classification.py`
  - 규칙 기반 classification과 review item 초안 생성
- `backend/app/postings.py`
  - postings CRUD 및 분석 결과 조회
- `backend/app/review_items.py`
  - review_items 목록/수정 정책
- `backend/app/dashboard.py`
  - dashboard summary/charts/comparison API

## Frontend 구조

소스코드에서 확인한 현재 구현:

- `frontend/src/App.jsx`
  - `activePage` 기반 단일 화면 구조
  - 페이지: `dashboard`, `postings`, `reviewItems`, `aiRecommendations`
  - AI recommendation 페이지는 현재 placeholder
- `frontend/src/api/postingsApi.js`
  - postings API client
- `frontend/src/api/reviewItemsApi.js`
  - review_items API client
- `frontend/src/api/dashboardApi.js`
  - dashboard API client

프런트 API client는 모두 `VITE_API_BASE_URL`이 있으면 그 값을 사용하고, 없으면 `http://127.0.0.1:8000`을 기본값으로 사용한다.

## 데이터베이스 스키마

`backend/app/database.py`에서 확인한 현재 구현:

### `postings`

- 모든 입력 필드를 `TEXT NOT NULL`로 저장
- soft delete용 `is_deleted` 포함
- `created_at`, `updated_at` 포함

주요 컬럼:

- `company`
- `position`
- `duties`
- `requirements`
- `preferred`
- `tools`
- `experience`
- `employment_type`
- `work_type`
- `industry_memo`
- `raw_text`

### `review_items`

- 수기 검토가 필요한 추출값 저장
- `approved_value`, `status`, `dictionary_apply` 포함

### `analysis_results`

- 공고당 1행 분석 결과 저장
- `industry_category`, `domain_category`, `position_category`는 단일값 컬럼
- `extracted_skills`, `extracted_competencies`는 JSON 문자열 저장
- `unconfirmed_count` 저장

## 현재 구조 한계

소스코드에서 확인한 현재 구현:

- 도메인은 `analysis_results.domain_category` 단일값만 저장한다.
- AI recommendation router는 아직 없다.
- 확정된 review 이력이 config 파일로 자동 반영되는 흐름은 없다.
- `synonym-map.json`은 필수 config로 로드되지만, 확인한 classification 흐름에서 직접 사용은 확인되지 않았다.

## 후속 계획

- 사용자 트리거형 AI recommendation API 추가
- 공고 1건당 복수 도메인 저장 구조 도입
- 확정/제외 이력을 향후 classification에 어떻게 반영할지 정책 정리
