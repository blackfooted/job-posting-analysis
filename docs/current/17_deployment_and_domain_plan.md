# Deployment and Domain Plan

## Frontend Deployment Readiness Check 결과

- Render Static Site 배포 전 frontend readiness를 점검했다.
- `frontend/package.json` 기준 production build script는 `vite build`이며, local 검증 명령은 아래와 같다.

```powershell
cd frontend
npm.cmd run build
```

- Render Static Site 설정은 frontend 디렉터리를 root로 두는 구성을 1차 권장한다.

권장안 A:

```text
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: dist
Environment Variables:
  VITE_API_BASE_URL=https://api.<domain>
```

대안 B:

```text
Root Directory: .
Build Command: cd frontend && npm install && npm run build
Publish Directory: frontend/dist
Environment Variables:
  VITE_API_BASE_URL=https://api.<domain>
```

- 권장안 A를 우선한다. frontend Static Site 설정이 단순하고, publish directory가 `dist`로 명확하며, backend와 build context를 분리할 수 있기 때문이다.
- frontend API client는 `import.meta.env.VITE_API_BASE_URL`을 우선 사용하고, 값이 없으면 local 기본값 `http://127.0.0.1:8000`을 사용한다.
- local 개발 예시는 `VITE_API_BASE_URL=http://127.0.0.1:8000`이다.
- 배포 예시는 `VITE_API_BASE_URL=https://api.<domain>`이다.
- Vite의 `VITE_` 접두사 환경변수는 browser bundle에 노출될 수 있으므로, `VITE_API_BASE_URL`에는 public backend API base URL만 둔다.
- `OPENAI_API_KEY`는 frontend env에 두지 않는다. OpenAI key는 backend Render Web Service의 secret env로만 관리한다.
- `frontend/.env.example`에는 local `VITE_API_BASE_URL` 예시가 이미 존재하므로 이번 점검에서 추가 수정하지 않았다.
- Recharts는 `frontend/package.json`에 포함되어 있으며, dashboard Recharts import를 포함한 frontend build가 통과했다.
- build 중 chunk size warning이 표시될 수 있으나, 이번 점검에서는 build 실패로 이어지지 않았다.

Frontend deployment smoke test checklist:

- 배포 전 local
  - `npm.cmd run build` 통과
  - `VITE_API_BASE_URL` local 값 확인
  - dashboard 화면 build 문제 없음
  - Recharts chart build 문제 없음
- 배포 후
  - frontend domain 접속
  - browser console error 없음
  - API 요청이 backend API domain으로 나가는지 확인
  - CORS 오류 없음
  - dashboard 조회
  - postings 목록 조회
  - review_items 조회
  - AI recommendation 화면 진입
  - OpenAI key가 frontend bundle/env에 노출되지 않음
  - 새로고침 후 라우팅 유지 여부 확인

## Backend Deployment Readiness Check 결과

- backend production command 후보는 아래 기준으로 유지한다.

```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

- local 개발 command의 `--reload`는 개발 전용이며 production command에서는 사용하지 않는다.
- `.venv` 기준 `backend.app.main:app` import 가능 여부를 확인했다.
- `backend/requirements.txt`에는 `fastapi`, `uvicorn`, `openai>=1.0.0`이 포함되어 있으며, 이번 점검에서 추가 dependency는 확인되지 않았다.
- CORS allowed origins는 `ALLOWED_ORIGINS` 환경변수로 관리할 수 있도록 보완했다.
- `ALLOWED_ORIGINS`가 없으면 local 기본값 `http://127.0.0.1:3000`, `http://localhost:3000`을 사용한다.
- 배포 예시는 아래와 같다.

```text
ALLOWED_ORIGINS=https://job.<domain>
```

- SQLite DB 경로는 `DB_PATH` 환경변수로 분리할 수 있도록 보완했다.
- `DB_PATH`가 없으면 기존 local 기본 경로 `backend/job_posting_analysis.db`를 유지한다.
- Render persistent disk 사용 시 예시는 아래와 같다.

```text
DB_PATH=/var/data/job_posting_analysis.db
```

- OpenAI 관련 환경변수는 backend service secret env에서만 관리한다.

```text
AI_RECOMMENDATION_MODE=openai
OPENAI_API_KEY=<secret>
OPENAI_MODEL=gpt-5.4-nano
AI_RECOMMENDATION_DEBUG=0
```

- `OPENAI_API_KEY`는 frontend env에 두지 않는다.
- 이번 점검에서 실제 Render 배포, DNS 설정, OpenAI 호출은 수행하지 않았다.

Backend smoke test command:

Windows PowerShell:

```powershell
$env:PORT="8000"
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $env:PORT
```

Render command:

```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

검증 URL:

```text
http://127.0.0.1:8000/docs
http://127.0.0.1:8000/openapi.json
```

## 1. 문서 목적

이 문서는 현재 로컬 개발 중심의 `job-posting-analysis` 서비스를 도메인으로 접근 가능한 배포 구조로 전환하기 위한 계획 문서다.

목적:

- 배포 플랫폼 후보 비교
- 권장 배포 구조 정의
- frontend/backend 도메인 구조 정의
- 환경변수 관리 기준 정의
- Render 무료/유료 플랜 운영 차이 검토
- SQLite 운영 리스크와 대응 방안 정의
- `DB_PATH` 또는 `DATABASE_URL` 분리 필요성 검토
- CORS 정책 정의
- production start command 확정
- 배포 전후 검증 checklist 제공
- 후속 Codex 구현/설정 지시 기준 제공

## 2. 현재 서비스 구조

- frontend: Vite + React
- backend: FastAPI
- DB: SQLite
- AI recommendation: backend에서 OpenAI API 호출
- config: `config/` 하위 JSON files
- local backend default: `127.0.0.1:8000`
- local frontend default: `127.0.0.1:3000`
- frontend API base URL: `VITE_API_BASE_URL` 기반
- backend CORS 설정 필요
- OpenAI API key는 frontend가 아니라 backend 환경변수에서 관리
- 현재 SQLite DB 경로는 배포 환경에서 재검토 필요

## 3. 배포 플랫폼 후보 비교

### 후보 A. Render 단일 플랫폼

구조:

```text
Frontend: Render Static Site
Backend: Render Web Service
DB: SQLite + Persistent Disk 또는 PostgreSQL
Domain:
- app.example.com 또는 job.example.com
- api.example.com
```

장점:

- frontend/backend를 한 플랫폼에서 관리 가능
- GitHub 연동 기반 배포 가능
- custom domain 연결 가능
- TLS 자동 관리 가능
- backend FastAPI 배포에 적합
- MVP 운영에 단순함

주의:

- Render 무료 플랜 Web Service는 비활성 시 sleep 상태가 될 수 있음
- sleep 이후 첫 요청은 cold start로 지연될 수 있음
- 유료 인스턴스 전환 시 상시 활성 유지 가능
- 단기 MVP 운영에는 무료 플랜도 가능하나, 접속 지연을 감수해야 함
- SQLite 사용 시 persistent disk 또는 PostgreSQL 검토 필요
- Render Web Service는 public 요청을 받기 위해 `0.0.0.0` 및 `PORT` 환경변수 기준 실행 필요
- 기본 파일시스템은 ephemeral이므로 DB 파일 위치 주의 필요

권장도:

- 1차 권장

### 후보 B. Vercel + Render

구조:

```text
Frontend: Vercel
Backend: Render Web Service
DB: SQLite + Persistent Disk 또는 PostgreSQL
```

장점:

- Vercel은 frontend 배포 경험이 좋음
- frontend custom domain 연결이 편리함
- backend는 Render로 분리 가능

단점:

- 운영 플랫폼이 2개로 나뉨
- CORS/환경변수 관리 지점이 늘어남
- 현재 MVP에서는 관리 복잡도 증가

권장도:

- 대안

### 후보 C. Railway 또는 Fly.io

장점:

- backend 배포 유연성 높음
- Docker/컨테이너 기반 확장 가능

단점:

- 현재 MVP에는 설정 난이도가 높을 수 있음
- 문서화/운영 기준이 더 복잡해질 수 있음

권장도:

- 후속 검토

## 4. 1차 권장 구조

- Platform: Render
- Frontend: Render Static Site
- Backend: Render Web Service
- DB short-term: SQLite + Persistent Disk 검토
- DB mid-term: PostgreSQL 전환 검토

권장 도메인 구조:

```text
Frontend:
https://job.<domain>
또는
https://career.<domain>

Backend API:
https://api-job.<domain>
또는
https://api.<domain>
```

정책:

- frontend와 backend는 subdomain으로 분리한다.
- frontend는 API key를 절대 보관하지 않는다.
- backend에만 `OPENAI_API_KEY`를 설정한다.
- CORS는 frontend 배포 도메인만 허용한다.
- local 개발 origin은 별도로 유지한다.
- Render 무료 플랜을 사용할 경우 cold start 지연을 허용 가능한 운영 제약으로 기록한다.
- 상시 응답성이 필요하면 유료 플랜 전환을 검토한다.

## 5. Backend 배포 고려사항

Render Web Service 기준으로 정리한다.

### 실행 명령

현재 local command:

```powershell
python -m uvicorn backend.app.main:app --reload
```

배포 command 후보:

```powershell
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

주의:

- production에서는 `--reload`를 사용하지 않는다.
- Render에서는 서비스가 `0.0.0.0` host와 `PORT` 환경변수 기준으로 bind되어야 한다.
- Render 기본 expected port는 10000이지만, `PORT` 환경변수 사용을 우선한다.
- Phase DEP-2에서 실제 start command를 확정하고 local build/start 검증 지시문을 별도로 작성한다.

### Backend 환경변수 후보

```text
AI_RECOMMENDATION_MODE=openai
OPENAI_API_KEY=<secret>
OPENAI_MODEL=gpt-5.4-nano
ALLOWED_ORIGINS=<frontend domain>
DB_PATH=<persistent disk path if SQLite 유지 시>
DATABASE_URL=<PostgreSQL 전환 시>
```

주의:

- `OPENAI_API_KEY`는 secret env로만 관리한다.
- GitHub에 commit하지 않는다.
- frontend env에 넣지 않는다.
- `DB_PATH`는 backend에서 지원한다. `DATABASE_URL`은 PostgreSQL 전환 시 별도 구현 검토가 필요하다.
- 현재 코드가 SQLite 경로를 하드코딩하거나 relative path로 사용한다면 배포 전 환경변수 기반으로 분리해야 한다.

### CORS

배포 시 허용 origin 후보:

```text
https://job.<domain>
https://career.<domain>
```

local 개발 유지:

```text
http://127.0.0.1:3000
http://localhost:3000
```

## 6. DB 경로와 SQLite 운영 리스크

현재 DB:

```text
backend/job_posting_analysis.db
```

리스크:

- 기본 배포 파일시스템이 ephemeral이면 재배포/재시작 시 DB 파일 유실 가능
- SQLite는 동시 쓰기와 확장성에 한계
- persistent disk 없이 운영하면 누적 공고/정제 데이터가 사라질 수 있음
- 현재 코드의 DB 파일 경로가 배포 환경의 persistent disk mount path와 일치하지 않으면 DB를 못 찾거나 ephemeral 영역에 새 DB가 생성될 수 있음

단기 대응:

- SQLite 유지 시 persistent disk 사용 검토
- DB 파일을 persistent disk mount path 하위에 위치시키도록 `DB_PATH` 환경변수 지원 필요

예:

```text
DB_PATH=/var/data/job_posting_analysis.db
```

중기 대응:

- PostgreSQL 전환 검토

정책:

- MVP 단일 운영자는 SQLite + persistent disk로 시작 가능
- Render 무료 플랜에서는 persistent disk 사용 가능 여부와 플랜 제약을 확인해야 함
- 공고/정제 데이터가 중요해지는 시점에는 PostgreSQL 전환
- 배포 전 DB backup/export 방법 필요
- `backend/app/database.py`는 `DB_PATH` 환경변수를 지원한다.

## 7. Render 무료 플랜 sleep/cold start 정책

정책:

- Render 무료 플랜 Web Service는 일정 시간 요청이 없으면 sleep 상태가 될 수 있다.
- sleep 이후 첫 요청은 cold start로 지연될 수 있다.
- 단일 운영자 MVP에서는 무료 플랜도 허용 가능하지만, 오래 사용하지 않다가 접속하면 느릴 수 있다.
- 외부 사용자에게 공유하거나 상시 접근성이 필요하면 유료 플랜 전환을 검토한다.
- 유료 인스턴스는 상시 활성 유지 측면에서 더 적합하다.

운영 판단:

| 조건 | 권장 |
|---|---|
| 개인 테스트/단일 운영자 | 무료 플랜 허용 가능 |
| 매일 자주 사용 | 무료 또는 저가 유료 비교 |
| 외부 공유/포트폴리오 공개 | 유료 플랜 검토 |
| API 응답 지연을 허용할 수 없음 | 유료 플랜 권장 |

## 8. Frontend 배포 고려사항

Render Static Site 기준으로 정리한다.

build command 후보:

```powershell
npm install
npm run build
```

Windows local verification:

```powershell
npm.cmd run build
```

publish directory 후보:

```text
frontend/dist
```

단, Render Static Site root 설정에 따라 `dist` 또는 `frontend/dist`가 달라질 수 있으므로 실제 설정 시 확인 필요하다.

Frontend 환경변수:

```text
VITE_API_BASE_URL=https://api.<domain>
```

주의:

- OpenAI API key는 절대 frontend 환경변수로 두지 않는다.
- `VITE_` 접두사 변수는 browser bundle에 노출될 수 있다.

## 9. Custom Domain 연결 계획

Render 기준 절차:

1. Render service 생성
2. frontend static site에 custom domain 추가
3. backend web service에 API custom domain 추가
4. DNS provider에서 CNAME/A record 설정
5. Render Dashboard에서 verify
6. HTTPS 인증서 발급 확인
7. frontend `VITE_API_BASE_URL`을 API 도메인으로 설정
8. backend CORS allowed origin을 frontend 도메인으로 설정

주의:

- apex/root domain과 subdomain 설정 방식은 DNS provider에 따라 다름
- DNS 전파 시간이 걸릴 수 있음
- Render custom domain은 HTTPS/TLS 자동 적용 가능
- HTTP 접근은 HTTPS로 redirect되는지 확인

## 10. 배포 전 준비 체크리스트

### Repository 상태

- [ ] main branch 최신화
- [ ] working tree clean
- [ ] 최근 commit push 완료
- [ ] `.env` / `.env.local` 미커밋 확인

### Backend

- [ ] production start command 확정
- [ ] `--reload` 제거
- [ ] `$PORT` 사용
- [ ] `0.0.0.0` bind
- [ ] CORS 배포 origin 추가 필요 여부 확인
- [ ] `OPENAI_API_KEY` secret env 설정
- [ ] SQLite persistent disk 또는 PostgreSQL 방향 결정
- [ ] `DB_PATH` 환경변수 설정 확인
- [ ] PostgreSQL 전환 시 `DATABASE_URL` 지원 구현 여부 확인
- [ ] DB init 방식 확인
- [ ] Swagger 접근 여부 확인
- [ ] 무료 플랜 sleep/cold start 허용 여부 결정

### Frontend

- [ ] `npm.cmd run build` 통과
- [ ] `VITE_API_BASE_URL` 배포값 설정
- [ ] API 호출 정상 확인
- [ ] Recharts build 정상 확인
- [ ] domain 연결 후 HTTPS 확인

### Data

- [ ] 기존 local SQLite data migration 필요 여부 결정
- [ ] 초기 배포 시 빈 DB로 시작할지, 기존 DB를 이관할지 결정
- [ ] DB backup/export 절차 필요 여부 결정

## 11. 배포 후 검증 체크리스트

- [ ] frontend domain 접속
- [ ] backend API health 또는 Swagger 접속
- [ ] cold start 체감 시간 확인
- [ ] 공고 등록
- [ ] 공고 상세 조회
- [ ] classification 결과 생성
- [ ] review_items 표시
- [ ] dashboard 표시
- [ ] AI 추천 openai mode 실행
- [ ] AI 추천 history 저장
- [ ] skill/competency 선택 반영
- [ ] category 후보 저장
- [ ] category 후보 accepted/rejected
- [ ] category 후보 analysis_results 반영
- [ ] dashboard 반영 확인
- [ ] CORS 오류 없음
- [ ] HTTPS 정상
- [ ] OpenAI key 노출 없음
- [ ] 재배포/재시작 후 DB 유지 여부 확인

## 12. 단계별 실행 계획

### Phase DEP-1 — 배포/도메인 계획 문서화

- 현재 문서

### Phase DEP-2 — backend deployment readiness check

- production start command 확정
- `--host 0.0.0.0 --port $PORT`
- CORS env 기반화 검토
- `DB_PATH`/persistent disk 설정 검토
- PostgreSQL 전환 시 `DATABASE_URL` 구현 검토
- Render 무료 플랜 sleep/cold start 운영 판단
- Render Web Service 설정 문서화

### Phase DEP-3 — frontend deployment readiness check

- `VITE_API_BASE_URL` 배포값 설정
- Render Static Site 또는 Vercel 설정
- build 검증

### Phase DEP-4 — domain/DNS 연결

- frontend domain
- backend API domain
- HTTPS 검증

### Phase DEP-5 — 데이터/운영 검증

- 공고 등록부터 AI 추천/대시보드까지 전체 smoke test
- cold start 체감 확인
- DB 유지 확인

### Phase DEP-6 — DB 안정화

- SQLite persistent disk 적용 또는 PostgreSQL 전환 검토

## 13. 결정 필요 항목

| 항목 | 선택지 | 권장 |
|---|---|---|
| 배포 플랫폼 | Render / Vercel+Render / Railway / Fly.io | Render |
| frontend 배포 | Render Static Site / Vercel | Render Static Site |
| backend 배포 | Render Web Service / Railway / Fly.io | Render Web Service |
| Render 플랜 | Free / Starter 이상 | 단기 Free 가능, 외부 공유 시 유료 검토 |
| backend start command | local reload / production uvicorn | production uvicorn |
| DB 단기 | SQLite ephemeral / SQLite persistent disk / PostgreSQL | SQLite persistent disk 또는 PostgreSQL |
| DB 경로 | 코드 고정 / DB_PATH env | DB_PATH env 지원 |
| DB 중기 | SQLite 유지 / PostgreSQL 전환 | PostgreSQL 전환 검토 |
| domain 구조 | 단일 domain path routing / subdomain 분리 | subdomain 분리 |
| OpenAI key 위치 | frontend / backend env | backend env |
| CORS | 전체 허용 / frontend domain만 허용 | frontend domain만 허용 |

## 14. 다음 작업 제안

다음 Codex 작업 후보:

- backend deployment readiness check
- frontend deployment readiness check
- CORS 환경변수화 지시문 작성
- `DB_PATH`/persistent disk 대응 설계
- production start command 검증
- Render 배포 설정 checklist 작성
- 실제 Render 배포 진행
