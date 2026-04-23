
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
7. 자동 확정 불가 항목은 review_items로 누적

### 6.2 공고 수정
1. 기존 공고 선택
2. 내용 수정 후 저장
3. 전체 재분류
4. 기존 analysis_results는 UPDATE 덮어쓰기
5. 기존 review_items는 초기화 후 재생성
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
- postings
- review_items
- analysis_results
- ai_call_history (후속 단계용 자리만 고려)

### JSON config
정책/사전 관리
- industry-categories.json
- domain-categories.json
- position-categories.json
- competency-dictionary.json
- skill-dictionary.json
- synonym-map.json

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
