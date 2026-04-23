# 채용공고 정제 및 분석 대시보드 — 구현 핸드오프 문서

## 1. 이 문서의 목적
이 문서는 새로운 채팅에서 서비스 구현에 바로 집중할 수 있도록, 지금까지 결정된 기획/정책/구조를 압축 정리한 구현용 기준 문서입니다.

이 문서를 기반으로 새로운 채팅에서 아래처럼 요청하면 됩니다.

> 이 문서를 기준으로 MVP 구현을 진행해줘.  
> 먼저 백엔드/프론트엔드 폴더 구조와 DB 초기화부터 구현하고, 이후 API → 화면 순서로 진행하자.

---

## 2. 제품 한 줄 정의
채용공고를 1건씩 입력하여 누적 저장하고,  
규칙 기반으로 1차 분류한 뒤,  
수기 정제를 통해 데이터를 정리하고,  
누적된 공고를 기준으로 대시보드 분석을 제공하는 개인 커리어 리서치 도구.

---

## 3. MVP 범위

### 포함
- 대시보드
- 개별 공고 분석
- 데이터 정제 관리
- 규칙 기반 1차 분류
- SQLite + JSON config 기반 저장
- 사전 반영 체크박스
- soft delete
- 대시보드 수동 새로고침

### 제외
- 로그인 / 회원가입
- 권한 관리
- 다중 사용자
- export
- 사전관리 전용 UI
- AI 추천 관리의 실제 동작
- 고급 자동 의미 해석
- 완전 자동 카테고리 확정

### 후속 확장
- AI 추천 관리 활성화
- 사전관리 화면
- 사용자별 데이터 분리
- 공고 적합도(FIT) 분석

---

## 4. 사용자 및 권한 가정
- 현재 MVP는 관리자 1인이 직접 사용하는 로컬/웹 하이브리드 MVP
- 로그인 없음
- 향후 일반 사용자와 관리자 역할을 분리할 수 있는 구조를 고려

---

## 5. 메뉴 구조 (LNB)
1. 대시보드
2. 개별 공고 분석
3. 데이터 정제 관리
4. AI 추천 관리 (후속 단계, 지금은 비활성 또는 placeholder)

---

## 6. 핵심 사용자 흐름

### 6.1 공고 입력 및 개별 분석
1. 사용자가 개별 공고 분석 화면 진입
2. 항목형 폼으로 공고 1건 입력
3. 저장
4. 공고 목록에 1건 추가
5. 규칙 기반 1차 분류 실행
6. 개별 분석 결과 노출
7. 자동 확정 불가 항목은 `review_items`로 누적

### 6.2 공고 수정
1. 기존 공고 선택
2. 내용 수정 후 저장
3. 전체 재분류
4. 기존 `analysis_results`는 UPDATE 덮어쓰기
5. 기존 `review_items`는 초기화 후 재생성
6. 기존 confirmed 정제값도 초기화

### 6.3 대시보드 확인
1. 사용자가 대시보드 진입
2. 누적 데이터 기준 카드/차트 확인
3. 사용자가 새로고침 버튼 클릭 시 재계산

### 6.4 데이터 정제
1. 데이터 정제 관리 화면 진입
2. 미확인 항목 목록 확인
3. 후보값 SELECT BOX 선택
4. 필요 시 직접입력
5. 저장
6. 체크 시 사전에 반영

---

## 7. 입력 정책

### 공고는 1건씩 입력
완전 자유 텍스트 다건 파싱이 아니라 항목형 입력폼으로 받는다.

### 모든 필드 필수
- 회사명
- 직무명
- 담당업무
- 자격요건
- 우대사항
- 툴/기술
- 경력요건
- 고용형태
- 근무형태
- 산업/도메인 메모
- 원문 전체

---

## 8. 기술 스택

### 권장 스택
- Frontend: React
- Backend: FastAPI
- DB: SQLite
- Config: JSON files
- Charts: Recharts

### 구조 원칙
- 프론트/백 분리
- 로컬에서도 실행 가능
- 장기적으로 웹서비스 확장 가능

---

## 9. 저장 구조

### SQLite
운영 데이터 저장
- `postings`
- `review_items`
- `analysis_results`
- `ai_call_history` (후속 단계용 자리만 고려)

### JSON config
정책/사전 관리
- `industry-categories.json`
- `domain-categories.json`
- `position-categories.json`
- `competency-dictionary.json`
- `skill-dictionary.json`
- `synonym-map.json`

---

## 10. DB 스키마 초안

### postings
```sql
CREATE TABLE postings (
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
  created_at       TEXT DEFAULT (datetime('now')),
  updated_at       TEXT DEFAULT (datetime('now'))
);
```

### review_items
```sql
CREATE TABLE review_items (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  posting_id        INTEGER NOT NULL,
  field_type        TEXT NOT NULL,   -- skill | competency | industry | domain | position
  raw_value         TEXT NOT NULL,
  approved_value    TEXT,
  status            TEXT DEFAULT 'unconfirmed', -- unconfirmed | confirmed
  dictionary_apply  INTEGER DEFAULT 0,
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (posting_id) REFERENCES postings(id)
);
```

### analysis_results
```sql
CREATE TABLE analysis_results (
  id                     INTEGER PRIMARY KEY AUTOINCREMENT,
  posting_id             INTEGER NOT NULL UNIQUE,
  industry_category      TEXT,
  domain_category        TEXT,
  position_category      TEXT,
  extracted_skills       TEXT,    -- JSON 배열 문자열
  extracted_competencies TEXT,    -- JSON 배열 문자열
  unconfirmed_count      INTEGER DEFAULT 0,
  analyzed_at            TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (posting_id) REFERENCES postings(id)
);
```

---

## 11. 삭제 정책
- Soft delete 채택
- `postings.is_deleted = 1` 처리
- 대시보드/공고 목록에서는 제외
- `review_items` / `analysis_results`는 DB에 유지
- 단, 정제 화면에서는 soft delete된 공고의 `review_items`를 노출하지 않음
- 공고 복구 기능은 MVP 제외

---

## 12. 규칙 기반 1차 분류 정책

### 기본 원칙
- 규칙 기반 자동 분류 우선
- 명확한 경우만 자동 확정
- 애매하면 미확인

### 분류 실행 단위
- 필드별 분류
- `raw_text` 전체 파싱은 MVP에서 하지 않음

### 자동 확정 기준

#### 스킬/툴
- alias 포함 매칭 허용
- 예:
  - "Jira 사용 경험" → Jira
  - "SQL 기반 분석" → SQL
  - "Confluence 활용 가능" → Confluence

#### 산업 / 도메인 / 직무 / 역량
- exact match 또는 alias match일 때만 자동 확정
- 복수 후보가 걸리면 미확인
- 문맥 추론형 자동 확정 없음

### 포함 매칭 허용 범위
- 스킬/툴만 포함 매칭 허용
- 산업 / 도메인 / 직무 / 역량에는 포함 매칭 금지

### 미확인 처리 조건
- 사전에 없는 신규 표현
- 복수 후보 동시 매칭
- exact/alias로도 명확하지 않은 경우
- 사람이 판단해야 하는 경우

### 다중값 구분자
`tools/skills` 필드는 아래 구분자를 허용
- 쉼표(,)
- 줄바꿈
- 슬래시(/)

---

## 13. 시드 데이터(seed data) 정책

### 원칙
- 개발 착수 전 최소 seed data 필요
- seed data는 내가 직접 준비하거나 검토
- 구현 도구는 seed data를 읽어 사용하는 역할만 담당

### 최소 기준
- `skill-dictionary.json`: 20개 이상
- `industry-categories.json`: 5개 이상
- `position-categories.json`: 5개 이상
- `domain-categories.json`: 5개 이상
- `competency-dictionary.json`: 10개 이상
- `synonym-map.json`: 비워도 됨

### seed data 관련 구현 원칙
- alias 매칭은 대소문자 구분 없이 처리
- 한글/영문 혼용 표현 고려
- seed data는 코드 하드코딩 금지

---

## 14. API 계약 초안

### 공통 응답 포맷

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

### 엔드포인트 목록

#### 공고 관리
- `POST /api/postings`
- `GET /api/postings`
- `GET /api/postings/{id}`
- `PUT /api/postings/{id}`
- `DELETE /api/postings/{id}`

#### 개별 분석
- `GET /api/postings/{id}/analysis`

#### 데이터 정제
- `GET /api/review-items?page=1&size=15`
- `PUT /api/review-items/{id}`

#### 대시보드
- `GET /api/dashboard/summary`
- `GET /api/dashboard/charts`
- `GET /api/dashboard/comparison`

#### 사전 조회
- `GET /api/dictionary/{type}`

---

## 15. 화면 요구사항 요약

### 15.1 대시보드
- 누적 공고 수
- 산업 카테고리 수
- 직무 카테고리 수
- 미확인 항목 수
- 산업 분포 파이차트
- 직무 분포 파이차트
- 공통 요구역량 상위 10개 막대그래프
- 툴/기술 상위 10개 막대그래프
- 공고 비교 요약
- 새로고침 버튼 필수

### 15.2 개별 공고 분석
- 좌측: 공고 목록 (등록일시 내림차순)
- 우측 상단: 입력/수정 폼
- 우측 하단: 개별 분석 결과
- 검색/필터 없음

### 15.3 데이터 정제 관리
- 구분값
- 원문 표현
- 상태
- 후보값(SELECT BOX)
- 사전에 반영(체크박스)
- 저장

#### 정제 화면 기본 노출 정책
- 미확인 우선 정렬 후 15개
- 정렬 기준:
  1. 상태(미확인 우선)
  2. `updated_at` 내림차순
- 저장된 항목도 화면에서 조회 가능
- 필터는 MVP 제외

### 15.4 AI 추천 관리
- 후속 단계
- 현재는 placeholder 수준으로만 두거나 아예 제외 가능

---

## 16. 에러/예외 처리 정책
- 저장 성공: 성공 toast
- 저장 실패: 실패 toast + 원인 메시지
- 필수 필드 누락: 인라인 에러
- 서버 연결 실패: 상단 배너
- SQLite 저장 실패: toast + 재시도 안내
- JSON config 로드 실패: 서버 시작 실패 처리
- 직접입력 시 동일값 존재: 경고 표시(차단 안 함)

---

## 17. 구현 시 Codex 역할 최소화 원칙

### 내가 직접 결정한 것
- 기획/정책
- PRD
- seed data 구조와 내용
- 카테고리 체계
- 정제 정책
- 저장 정책
- 삭제 정책

### Codex가 해야 할 것
- 폴더 구조 생성
- SQLite 초기화 코드
- JSON config loader
- FastAPI API 구현
- React 화면 뼈대 구현
- CRUD 연결
- 차트 구현
- 규칙 기반 분류 로직 구현

### 중요 원칙
- Codex에게 정책 결정 맡기지 말 것
- Codex에게는 정해진 기준을 코드로 구현만 맡길 것
- 한 번에 전체 구현시키지 말 것
- 기능 단위로 쪼개서 구현할 것

---

## 18. Codex 사용량을 최소화하는 구현 순서

### 1단계
프로젝트 골격만 생성
- `frontend/`
- `backend/`
- `config/`
- DB 초기화 파일

### 2단계
SQLite + JSON config loader만 구현

### 3단계
postings API만 구현
- 저장
- 목록
- 단건 조회
- 수정(전체 재분류 포함)
- 삭제(soft delete)

### 4단계
review_items API만 구현
- 목록
- 저장

### 5단계
대시보드 API 구현
- summary
- charts
- comparison

### 6단계
React LNB + 빈 화면 뼈대

### 7단계
개별 공고 분석 화면 구현

### 8단계
데이터 정제 관리 화면 구현

### 9단계
대시보드 연결

---

## 19. Codex에게 지시할 때의 원칙

### 좋은 방식
- 이번 작업은 postings API만 구현해
- 이번 작업은 DB 스키마와 init_db만 구현해
- 이번 작업은 데이터 정제 그리드만 구현해

### 나쁜 방식
- PRD 전체 구현해줘
- MVP 전체를 한 번에 만들어줘
- 백엔드와 프론트를 다 완성해줘

### 추천 프롬프트 스타일
- 범위를 명확히 제한
- 수정/생성할 파일 범위를 지정
- 이번 턴에서 제외할 것까지 명시
- 출력물(생성 파일 목록, 실행 방법)까지 요구

---

## 20. 새 채팅에서 바로 쓸 시작 문장 예시

### 예시 1: 프로젝트 초기화
이 문서를 기준으로 MVP 구현을 시작하자.  
이번 작업 범위는 아래만 구현해.

1. backend / frontend / config 폴더 구조 생성
2. SQLite 초기화 코드
3. postings / review_items / analysis_results 스키마 생성
4. JSON config loader 생성

중요:
- 정책 결정은 하지 말고 문서 기준만 구현할 것
- 아직 API/프론트 화면은 구현하지 말 것
- 생성된 파일 목록과 실행 방법을 마지막에 요약할 것

### 예시 2: postings API 구현
이 문서를 기준으로 이번에는 postings API만 구현해.

범위:
- `POST /api/postings`
- `GET /api/postings`
- `GET /api/postings/{id}`
- `PUT /api/postings/{id}`
- `DELETE /api/postings/{id}`

조건:
- soft delete 적용
- 수정 시 전체 재분류
- `analysis_results`는 UPDATE 방식
- 공통 응답 포맷 준수
- `review_items`는 재분류 시 초기화 후 재생성

중요:
- 다른 API는 만들지 말 것
- 프론트엔드는 건드리지 말 것

---

## 21. 오픈 이슈
- review / AI 이력의 삭제 연쇄 정책 상세화
- 직접입력 시 유사값 중복 경고 수준
- 저장된 정제 항목 표시 방식(숨김/표시 토글)
- 향후 AI 추천 도입 시 입출력 인터페이스 정의
- 공고 적합도(FIT) 분석을 언제 범위에 넣을지
