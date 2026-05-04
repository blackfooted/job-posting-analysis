# Matching Rate And Config Coverage Plan

## 1. 문서 목적

이 문서는 `job-posting-analysis` 서비스의 규칙 기반 classification 매칭률을 개선하고, 장기적으로 config 커버리지를 확장하기 위한 후속 개발 기준을 정리한다.

현재 우선순위는 **AI 추천 기능 개발 마무리**다.  
정제 개선 구현은 후속 단계로 분리하되, 지금까지 확인한 판단 근거와 개발 방향을 문서화해 이후 작업이 반복 논의 없이 이어지도록 한다.

---

## 2. 현재 결론

현재 서비스는 config JSON 기반 규칙형 classification을 수행한다.  
사용자가 `review_items`를 수기 정제할 수 있지만, 정제 결과가 config 커버리지로 자동 반영되는 구조는 아니다.

현재 구조:

```text
공고 저장/수정
→ classification 실행
→ analysis_results 저장
→ 미확정 후보 review_items 생성
→ 사용자가 confirmed / removed 처리
```

현재 `dictionary_apply=1`의 의미:

```text
동일 field_type + normalized raw_value를 가진 review_items 일괄 confirmed
```

주의:

```text
dictionary_apply=1은 config/*.json write-back 기능이 아니다.
confirmed review_items는 신규 공고 classification에 자동 재사용되지 않는다.
```

따라서 장기 매칭률 개선을 위해서는 다음 구조가 필요하다.

```text
confirmed review_items
→ config 반영 후보 관리
→ 사용자 검토
→ 승인된 후보만 config 반영
→ 기존 공고 재분석
→ 매칭률 개선 확인
```

---

## 3. 현재 매칭률 진단

HR 페르소나 AI가 원문 공고에서 추출한 기대 키워드와 서비스 추출 결과를 비교한 결과, 현재 평균 매칭률은 약 56% 수준으로 확인되었다.

| 공고 | HR 기대 키워드 수 | 서비스 매칭 수 | 누락 수 | 오추출 수 | 매칭률 |
|---|---:|---:|---:|---:|---:|
| 세나클 | 21 | 13 | 8 | 0 | 62% |
| 바티에이아이 | 22 | 14 | 7 | 3 | 64% |
| 누아 | 18 | 11 | 6 | 1 | 61% |
| 슈퍼진 | 20 | 7 | 12 | 0 | 35% |
| 전체 평균 | - | - | - | - | 56% |

핵심 관찰:

- 세나클, 바티에이아이, 누아는 일부 config 보강 후 60%대 매칭률을 보였다.
- 슈퍼진은 게임/콘텐츠/글로벌 운영/규제·가이드라인 등 현재 config 커버리지가 약한 영역이라 35%로 낮았다.
- 신규 산업군이 추가되면 평균 매칭률은 단기적으로 하락할 수 있다.
- 전체 평균만 보는 것보다 산업/도메인별 매칭률을 별도로 추적하는 것이 더 정확하다.

---

## 4. 데이터 증가 시 매칭률 전망

### 4.1 단기 전망

새로운 공고가 늘어나면 단기적으로 매칭률은 하락할 가능성이 있다.

판단 근거:

- 현재 config는 소수 공고 기반으로 구축되어 있다.
- 새로운 산업/직무/도메인 표현이 들어오면 기존 alias로 커버되지 않는 표현이 늘어난다.
- HR 기대 키워드 수는 증가하지만 서비스 매칭 수는 즉시 따라가지 못한다.
- 특히 게임, 콘텐츠, 금융, 제조, 보안, 에너지 등 미검증 산업군에서는 매칭률 변동이 클 수 있다.

### 4.2 중장기 전망

config를 지속 보강하면 매칭률은 상승할 수 있다.  
다만 규칙 기반 방식만으로는 70~80% 수준에서 정체될 가능성이 있다.

| 운영 방식 | 기대 수준 | 비고 |
|---|---:|---|
| 현재 상태 | 약 56% | 초기 실데이터 기준 |
| config 보강 지속 | 약 65~75% | 명시적 skill/competency 중심 개선 |
| config + classification.py 추출 로직 개선 | 약 70~80% | 오추출/누락 패턴 완화 |
| config + 추출 로직 개선 + AI 추천 | 80% 이상 가능 | 문맥 의존 항목 보완 |

수치는 보장값이 아니라 목표 범위다.  
실제 매칭률은 공고 산업 분포, config 품질, 재분석 운영 방식에 따라 달라진다.

---

## 5. 개선 항목 분류

## 5.1 config 보강으로 개선 가능한 항목

아래 항목은 alias 또는 대표값 보강으로 개선 가능성이 높다.

| 패턴 | 개선 방식 | 비고 |
|---|---|---|
| 데이터 분석 / 지표 분석 / 데이터 기반 의사결정 | competency alias 추가 | 반복 누락 |
| 협업 / 커뮤니케이션 / 유관부서 조율 | competency alias 추가 | 반복 누락 |
| 프로젝트 관리 / PM / 프로젝트 리딩 | competency alias 추가 | 누아·슈퍼진 누락 |
| 문서화 / FAQ / 운영 매뉴얼 | competency alias 추가 | 후보 생성 여부 확인 필요 |
| ERP / WMS / 프롬프트 엔지니어링 | skill 대표값 또는 alias 추가 | 바티에이아이 |
| EMR / HIS / OCS / AWS / RAG | skill 대표값 추가 | 일부 반영 완료 |

주의:

- config에 추가해도 원문에서 후보로 추출되지 않으면 효과가 없다.
- 이미 config에 있는데도 미추출되는 항목은 `classification.py` 후보 생성 로직 문제로 분리한다.

---

## 5.2 classification.py 수정이 필요한 항목

아래 항목은 config만으로 해결하기 어렵고, 후보 추출/필터링/정규화 로직 개선이 필요하다.

| 항목 | 필요한 개선 |
|---|---|
| IA 오추출 | IA 추출 시 주변 문맥 조건 강화 |
| IATA 오추출 | 기관명/인증명 stopword 또는 약어 필터 추가 |
| SBA / NEST / DATA / ETC | 기관명·수상명·일반 라벨 필터링 |
| HTML/CSS / Slack 오추출 | 직무 유형별 skill 필터 또는 제외 정책 |
| ChatGPT와 AI툴활용 중복 | 대표값 통합 또는 중복 제거 로직 확인 |
| FAQ / VOC / 운영 가이드 미추출 | 원문 후보 생성 패턴 보강 |
| 프롬프트 엔지니어링 미추출 | compound candidate 또는 alias 매칭 조건 확인 |

---

## 5.3 AI 추천이 필요한 항목

아래 항목은 문맥 의존성이 높아 규칙 기반만으로는 한계가 있다.

| 항목 | 이유 |
|---|---|
| 복수 도메인 판단 | 현재 DB는 단일 domain_category 구조 |
| 슈퍼진의 게임/콘텐츠/생성형 AI/일본 시장 | 대표 도메인 판단이 문맥 의존적 |
| 세나의 의료/헬스케어/SaaS 복합 구조 | 산업·도메인·서비스 형태가 중첩 |
| 바티에이아이의 이커머스/SaaS/AI 데이터 솔루션 | 여러 도메인이 동시에 등장 |
| End-to-End 기획, 콘텐츠 규제 대응 | 단순 alias보다 의미 해석 필요 |

AI는 자동 확정자가 아니라 사용자 검토용 추천 도구로 사용한다.

---

## 6. dictionary_candidates 도입 필요성

### 6.1 문제 정의

현재는 정제 결과가 config 커버리지로 자동 연결되지 않는다.

문제:

```text
confirmed review_item이 늘어나도 config JSON은 그대로다.
사용자가 같은 유형의 표현을 반복 정제해야 한다.
config 반영은 문서와 Codex 지시문을 통한 수작업에 의존한다.
```

### 6.2 목표 구조

장기적으로는 아래 구조를 목표로 한다.

```text
review_item confirmed
→ 사용자가 config 후보 등록
→ dictionary_candidates에 후보 생성
→ 후보 목록에서 검토
→ approved 처리
→ config JSON 반영
→ 기존 공고 재분석
```

### 6.3 바로 config write-back을 하지 않는 이유

confirmed review item을 바로 config에 쓰는 방식은 위험하다.

위험:

- 잘못 확정한 값이 전체 classification에 영향을 준다.
- industry/domain처럼 문맥 의존성이 큰 값이 config를 오염시킬 수 있다.
- config 변경 이력 추적이 어렵다.
- 되돌리기 어렵다.

따라서 중간 후보 관리 레이어가 필요하다.

---

## 7. review_items, dictionary_apply, dictionary_candidates 관계

### 7.1 review_items

`review_items`는 classification이 확정하지 못한 후보를 수기 검토 대상으로 저장한다.

| status | 의미 |
|---|---|
| unconfirmed | 아직 검토 필요 |
| confirmed | 사용자가 대표값 확정 |
| removed | 정제 대상에서 제외 |

### 7.2 dictionary_apply

현재 기능을 유지한다.

```text
dictionary_apply=1
→ 동일 field_type + normalized raw_value를 가진 unconfirmed review_items 일괄 confirmed
```

주의:

```text
dictionary_apply는 config 반영 기능으로 재정의하지 않는다.
```

### 7.3 dictionary_candidates

`dictionary_candidates`는 config 반영 후보를 관리하는 별도 레이어다.

역할 분리:

| 항목 | 역할 |
|---|---|
| review_items | 공고 분석 중 발생한 검토 후보 관리 |
| dictionary_apply | 동일 raw_value 일괄 확정 |
| dictionary_candidates | config 반영 후보 관리 |
| config JSON | 최종 승인된 대표값/alias 저장 |

---

## 8. dictionary_candidates 정책 초안

### 8.1 후보 생성 트리거

초기 권장안은 **사용자 명시적 등록**이다.

| 방식 | 판단 |
|---|---|
| confirmed 저장 시 자동 후보 생성 | 보류 |
| 사용자가 후보 등록 버튼을 눌러 생성 | 권장 |
| dictionary_apply=1이면 자동 후보 생성 | 비권장 |
| confirmed + dictionary_apply=1이면 자동 후보 생성 | 보류 |

권장 이유:

- confirmed는 해당 review item 정제를 의미할 뿐 config 반영 승인은 아니다.
- 사용자가 명시적으로 “사전 후보 등록”을 눌러야 의도가 분명하다.
- config 후보 오염을 줄일 수 있다.
- 초기 구현 범위를 줄일 수 있다.

### 8.2 중복 처리 기준

권장 중복 기준:

```text
field_type + approved_value + alias_candidate
```

후보 생성 시 raw_value를 alias_candidate로 볼 수 있다.

중복 처리 원칙:

- 동일 후보가 여러 공고에서 발생하면 새 row를 만들지 않고 source_count를 증가시킨다.
- source_review_item_ids 또는 source_posting_ids를 추적한다.
- 반복 빈도가 높은 후보를 우선 검토 대상으로 보여준다.

### 8.3 후보 상태값

권장 상태값:

| status | 의미 |
|---|---|
| pending | 후보 등록됨, 아직 검토 전 |
| approved | config 반영 승인 |
| rejected | config 반영하지 않음 |
| applied | config 반영 완료 |
| needs_review | 추가 판단 필요 |

### 8.4 초기 대상 field_type

초기에는 아래만 대상으로 한다.

```text
position
skill
competency
```

초기에서 industry/domain을 제외하는 이유:

- 문맥 의존성이 크다.
- 복수 도메인 구조와 연결되어 있다.
- dashboard 집계 품질에 직접 영향을 준다.
- 잘못 반영하면 오분류 영향이 크다.

industry/domain 후보 관리는 후속 phase로 둔다.

---

## 9. 개발 Phase

### Phase 2-A. config JSON 안전 후보 반영

상태:

- 일부 완료
- EMR/HIS/OCS/AWS/RAG/ERP/WMS 등 반영
- 서비스 운영 등 일부 competency 반영

범위:

- 명시적 skill/competency alias 보강
- JSON 문법 검증
- config load 검증
- 기존 공고 재분석 효과 확인

### Phase 2-B. dictionary candidate management plan 작성

다음 정제 개선의 1순위 작업이다.

범위:

- dictionary_candidates 목적 정의
- review_items와의 관계 정의
- dictionary_apply와의 관계 정의
- 후보 생성 트리거 결정
- 중복 병합 기준 결정
- DB 스키마 초안
- API 초안
- UI 초안
- config apply 정책

주의:

- 이 단계는 구현 전 설계 문서 작업이다.
- DB 구조 결정이 필요하다.
- 이 단계가 끝나야 backend/API/UI 구현으로 넘어간다.

### Phase 2-C. dictionary_candidates backend API 구현

Phase 2-B 완료 후 진행한다.

예상 범위:

- dictionary_candidates 테이블 추가
- 후보 등록 API
- 후보 목록 API
- 후보 상태 변경 API
- 후보 중복 병합 로직
- 아직 config write-back은 하지 않을 수 있음

### Phase 2-D. dictionary_candidates frontend UI 구현

Phase 2-C 완료 후 진행한다.

예상 범위:

- 후보 목록 화면
- 후보 등록 버튼
- approve/reject 처리
- source review item 확인
- config 반영 전 검토 UI

### Phase 2-E. approved 후보 config apply 기능

Phase 2-C/D 이후 별도 phase로 진행한다.

범위:

- approved 후보를 config JSON에 반영
- 중복 alias 방지
- config load 검증
- 적용 이력 기록

재분석 정책:

```text
config apply 후 기존 공고 재분석은 기존 PUT /api/postings/{id}로 사용자가 수동 재저장하는 방식을 유지한다.
일괄 재분석 API는 Phase 2-E 범위가 아니다.
일괄 재분석이 필요하면 별도 Phase로 분리한다.
```

이유:

- config 반영과 대량 재분석은 영향 범위가 다르다.
- 일괄 재분석은 기존 `review_items` 재생성, confirmed/removed 이력 처리, dashboard 집계 변화 등 별도 정책이 필요하다.
- 따라서 Phase 2-E에서는 config apply까지만 다루고, 재분석은 기존 수동 재저장 흐름을 유지한다.

### Phase 3. classification.py 추출 로직 개선

예상 범위:

- IA/IATA 오추출 개선
- 기관명/고객사명/제품명 필터링
- FAQ/VOC/운영 가이드 후보 생성 보강
- 프롬프트 엔지니어링 미추출 원인 개선
- 직무별 skill 필터 검토

### Phase AI. AI 추천 기능 마무리 및 실제 연동

현재 완료 상태:

```text
Phase AI-1 수준 완료
- backend Mock recommendation API 구현
- frontend Mock recommendation 조회 화면 구현
- 사용자가 버튼을 눌렀을 때만 추천 API 호출
- 추천 결과는 DB에 저장하지 않음
```

다음 마무리 범위:

```text
Phase AI-1B
- OpenAI 또는 선택한 AI provider의 API key/결제 준비 후 Mock 호출을 실제 호출로 교체
- 기존 GET /api/ai-recommendations/postings/{posting_id} 조회형 구조 유지
- DB 저장 없음
- review_items 자동 반영 없음
- analysis_results 자동 갱신 없음
- frontend는 기존 버튼 트리거/결과 표시 구조를 유지
```

후속 범위:

```text
Phase AI-2
- 실제 AI 연동 결과의 UI 표시 품질 점검
- loading/error/empty 상태 고도화
- 비용/토큰 안내 또는 mode 표시 개선 검토

Phase AI-3
- AI 추천 결과를 review_items 또는 dictionary_candidates에 선택 반영할지 검토
- dictionary_candidates 구조 완료 후 진행 여부 판단

Phase AI-4
- 개별 review_item 단위 AI 추천 고도화
- 후보별 대표값/field_type 추천
```

주의:

```text
현재 “AI 추천 기능 마무리”는 Phase AI-1B, 즉 Mock 호출을 실제 AI 호출로 교체하는 범위로 한정한다.
AI 추천 결과를 review_items에 반영하거나 dictionary_candidates와 연결하는 작업은 현재 마무리 범위가 아니다.
Phase AI-3/AI-4는 dictionary_candidates 구조 완료 후 검토한다.
```

---

## 10. 현재 우선순위

현재 결정:

```text
정제 개선 구현은 후속으로 둔다.
AI 추천 기능 개발을 먼저 마무리한다.
```

다만 정제 개선을 재개할 때의 기준 문서로 본 문서를 유지한다.

권장 순서:

| 순위 | 작업 | 상태 |
|---:|---|---|
| 1 | AI 추천 기능 마무리: Phase AI-1B 실제 AI 호출 교체 | 현재 우선 |
| 2 | dictionary_candidate_management_plan.md 작성 | 후속 정제 개선 시작점 |
| 3 | dictionary_candidates backend API 구현 | 설계 완료 후 |
| 4 | dictionary_candidates frontend UI 구현 | backend 이후 |
| 5 | approved 후보 config apply 구현 | 후보 관리 UI 이후 |
| 6 | classification.py phase 3 개선 | 후보/오추출 패턴 확정 후 |
| 7 | industry/domain 복수 구조 검토 | 별도 중기 과제 |

---

## 11. 다음 문서 제안

정제 개선을 재개할 때 가장 먼저 작성할 문서:

```text
docs/current/dictionary_candidate_management_plan.md
```

포함할 내용:

1. dictionary_candidates 도입 목적
2. review_items와의 관계
3. dictionary_apply와의 관계
4. 후보 생성 트리거
5. 중복 병합 기준
6. 상태값 정의
7. DB 스키마 초안
8. API 초안
9. UI 초안
10. config apply 정책
11. 제외 범위
12. 단계별 구현 계획
13. 검증 방법

---

## 12. 결론

매칭률을 단기적으로 높이는 작업은 config 보강으로 가능하다.  
그러나 장기적으로 config 커버리지를 확장하려면 정제 결과를 config 반영 후보로 관리하는 구조가 필요하다.

현 시점의 결론:

```text
1. 정제 개선 방향은 dictionary_candidates 기반으로 가는 것이 적절하다.
2. dictionary_apply는 현재 일괄 confirmed 기능으로 유지한다.
3. config write-back은 자동이 아니라 승인 기반으로 설계한다.
4. 초기 dictionary_candidates 대상은 position / skill / competency로 제한한다.
5. industry/domain은 복수 도메인 구조와 함께 별도 검토한다.
6. 현재는 AI 추천 기능 개발을 먼저 마무리한다.
7. AI 추천 기능 마무리는 Mock → 실제 AI 호출 교체까지로 한정한다.
8. AI 추천 결과를 review_items/dictionary_candidates에 반영하는 작업은 dictionary_candidates 구조 완료 후 검토한다.
```
