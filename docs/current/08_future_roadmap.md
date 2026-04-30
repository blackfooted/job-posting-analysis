# Future Roadmap

## 단기

- 실데이터 기준 classification/config 동작 검증
- config 운영 사이클 정착
- removed 이력 기반 동일 후보 재생성 방지 정책 확정
- 1차 AI recommendation 조회 API 추가

## 중기

- removed 이력 기반 동일 후보 재생성 방지 구현
- confirmed review 이력을 신규 classification에 활용할지 결정
- `posting_domains`와 같은 복수 도메인 저장 구조 도입
- 공고 1건당 대표 도메인 1개 + 전체 도메인 N개 지원
- dashboard를 전체 도메인 기준 집계로 확장
- 사용자 트리거형 AI recommendation UI 추가

## 장기

- 사전관리 전용 UI
- export
- 고급 dashboard 필터 및 시각화
- 제품 범위가 변경될 경우 사용자 분리 및 권한 구조 검토

## 현재 범위 밖 항목

다음 항목은 현재 구현 확정 범위가 아니다.

- AI 자동 확정
- 공고 저장 시 AI 자동 실행
- 사용자 검토 없는 최종 카테고리 자동 확정
