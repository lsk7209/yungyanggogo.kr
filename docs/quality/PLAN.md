# 품질 개선 실행 계획

1. 완료: 저장소/dirty 상태/스택/라우트 확인.
2. 완료: 표준 API 파서와 공개 운영자 문구·가상 주장 P0 수정.
3. 완료: 대표 URL, canonical, robots, sitemap, 공개 API 상태를 로컬 빌드와 HTTP로 검증.
4. 완료(로컬): 실제 데이터 검색/상세에서 2~3개 비교 진입, 결측/단위 계산 모델, URL별 광고 정책.
5. 운영 전: 테스트 복제 DB 마이그레이션, 사람 콘텐츠 검수, 계정 설정, 배포/rollback rehearsal.

재개 지점: 전체 로컬 회귀 스크립트와 typecheck/lint/build를 실행한 뒤, 읽기 전용 자격 증명이 준비된 환경에서 실제 데이터 2~3개 비교 E2E를 수행한다. 생성 콘텐츠는 개별 `humanReview: approved`가 없으면 URL을 보존한 채 noindex가 기본이다.
