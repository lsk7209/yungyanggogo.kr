# 영양고고 품질 감사

기준: 2026-09-12, 로컬 저장소 `E:\web\yungyanggogo`, `main` (운영 변경 없음)

## 확인된 현황

- 대상 근거: 패키지명 `yungyanggogo`, README 브랜드 `영양고고`, 기본 URL `https://yungyanggogo.kr`, Git 원격 `lsk7209/yungyanggogo.kr`.
- 스택: Next.js manifest `^16.2.7`, 현재 lock/build 16.3.4 App Router, React manifest `^19.2.7`, TypeScript manifest `^6.0.3`, Turso/libSQL 선택 구성, Vercel 설정.
- 기존 사용자 변경: `app/globals.css`, 패키지 파일, 콘텐츠 감사 스크립트, 예약 콘텐츠와 검증 파일이 작업 전부터 dirty/untracked. 되돌리거나 덮어쓰지 않음.
- 데이터 경로: 공공데이터 표준 API, FoodSafetyKorea, 선택적 Turso 캐시, 로컬 검증 스냅샷.
- SEO/광고: Metadata API, `app/robots.ts`, `app/sitemap.ts`, 정적 ads.txt. Analytics와 AdSense는 각각 명시적 public 환경 플래그가 필요하며 AdSense 로더는 실제 영양 상세 레코드가 확인된 뒤에만 렌더된다. 쿠팡 제휴 광고 런타임은 2026-09-13 요청에 따라 제거됐다.

## 이 작업에서 확인하고 수정한 문제

| issue_id | priority | evidence | root_cause | fix | status |
|---|---|---|---|---|---|
| DATA-ENVELOPE-01 | P0 | 두 표준 어댑터가 `body.items` 자체를 행으로 처리 | 실제 표준 응답의 `items.item` 중첩 미처리 | 공통 파서와 배열/객체/빈값 fixture 추가 | fixed-local |
| PUBLIC-OPS-01 | P0 | 공개 페이지/API에 환경변수명, API 키, 개발계정 안내 | 운영자 진단과 사용자 상태가 같은 UI에 노출 | 사용자용 데이터 상태·출처 문구로 교체 | fixed-local |
| CLAIMS-01 | P0 | 홈에 가상 수치/백분위/법정 고단백 수치와 단정 | 검증 예시와 실서비스 설명 혼합 | 가상 판정 제거, 비교 방법·결측 안내로 교체 | fixed-local |
| COUNT-01 | P0 | totalCount가 문자열/0/결측일 때 `||` fallback | 원천 total과 페이지 행 수 경계가 약함 | 유효한 0 보존, 유한 비음수 검사 | fixed-local |
| SEARCH-01 | P1 | 질의 스냅샷 키와 첫 페이지에 묶인 검색/전체 목록 | 저장 레코드 전체 탐색과 고유 식품 집계 부재 | escaped parameterized LIKE, food-code dedupe, all-record listing, cache-key 갱신 | fixed-local |
| COMPARE-01 | P1 | 실제 레코드 2~3개 비교·교체 경로 부재 | 예시 상세과 안내 문구만 존재 | 목록/상세 진입, 기준별 계산·거부, add/remove URL round-trip | fixed-local |
| RUNTIME-REQUEST-01 | P0 | 로컬에서도 기본 GA ID 전송, 전역 광고가 부존재 상세 경로만으로 허용 가능 | opt-out 기본값과 pathname-only gate | explicit opt-in flags, real-detail-only ad rendering | fixed-local |
| BLOG-TRUST-01 | P0 | JSON-LD에 근거 없는 데이터 편집팀 작성자와 `updatedAt`의 검토 라벨 | 생성 메타데이터가 사람 역할/검수 상태를 과장 | 작성자 생략, 수정 라벨, noindex sitemap 제외, 대표 가이드 문구 교정 | fixed-local |
| FETCH-SECURITY-01 | P0 | 표준 어댑터가 HTTPS 실패 뒤 키 포함 URL을 HTTP로 재요청하고 공통 재시도 한계가 없음 | 복구 경로가 전송 보안과 호출 상한을 보존하지 않음 | HTTPS 강등 제거, 일시 오류/네트워크만 최대 2회 재시도하는 공통 helper 적용 | fixed-local |
| FAILURE-HTTP-01 | P0 | 원천 실패가 성공 상태 또는 원문 오류로 보일 수 있음 | 내부 실패와 공개 HTTP 계약 분리 부족 | 단일 원천 실패 상태 전달, 전체 실패 502, 공개 오류 일반화 | fixed-local |
| COUNT-C003-01 | P0 | FoodSafetyKorea `total_count`의 0/invalid/음수 처리 불안정 | truthy fallback과 무검증 Number 변환 | 공통 비음수 유한 count resolver 적용 및 fixture 추가 | fixed-local |
| FAILURE-DISPLAY-01 | P0 | 원천 장애 상태에서도 전체 0건으로 읽힐 수 있음 | 실패 객체의 sentinel count를 성공 count처럼 표시 | 성공일 때만 전체 건수 표시, 실패는 확인 불가로 분리 | fixed-local |
| PAGINATION-01 | P1 | 다음 링크가 현재 50행 여부에 의존하고 범위 초과가 빈 200 가능 | totalCount 기반 마지막 페이지 계산 부재 | totalCount 기반 next 및 범위 초과 notFound | fixed-local |
| NAV-CATEGORY-01 | P1 | 서로 다른 홈 카테고리 카드가 모두 같은 무필터 목록으로 이동 | 실제 분류 필터 없는 탐색 UI | 카테고리 UI 제거, 실제 식품명 검색 단일 진입으로 교체 | fixed-local |
| CONTENT-REVIEW-01 | P1 | 생성 콘텐츠에 사람 검수 상태가 없음 | 날짜만으로 공개/색인 가능 | 생성 JSON은 명시적 `humanReview: approved` 전 기본 noindex; URL/원문 보존 | fixed-local-policy; human-review-NOT-RUN |

## 아직 가설 또는 차단

- 운영 DB 레코드 수, 고유 식품 수, 공개 상세 URL 수, Google 색인 수는 서로 별개이며 현재 계정/DB 읽기 없이 확정하지 않음.
- AdSense Auto ads·URL 제외·CMP의 실제 계정 상태는 계정 접근 없이 확정하지 않음.
- 전체 콘텐츠의 사람 검수·권리·법정 강조표시 최신 원문 적용은 별도 사람/법률 검토가 필요함.
- 승인된 읽기 전용 운영 자격 증명으로 검색→상세→비교를 재검증하지 않았으며, 현재 증거는 로컬 SQLite 테스트 픽스처에 한정됨.
