## 2026-09-30 11:02 (세션 종료)

### 수행 작업
- 개발 서버 확인: 실행 중 아님(이전 세션에 이미 종료), output/server.pid 정리
- 이번 세션 최종 상태: main 브랜치 902185c, PR #14~#17 모두 머지·배포 완료

### 설정 변경
- 없음

### 미결 사항
- 10/1~10/30 09:00 KST에 식품군 블로그 글 30개가 매일 하나씩 자동 공개됨(재배포 불필요). 10/1 공개 후 실제 화면 확인 권장
- 저장 데이터 범위 확대(추가 동기화, 운영 DB 쓰기)는 사용자 승인 대기 중 — 다음 세션에서 이어갈 것
- GSC 사이트맵 마지막 확인: 제출 4772건, 오류 0건, 처리 대기였음 — 인식 완료 여부 재확인 필요 (읽기 전용)
- 블로그 글 Article 구조화 데이터, 식품군 표 스키마 존재 여부 미확인

---

## 2026-09-30 10:47

### 수행 작업
- [content/editorial-data/food-group-approvals.json, content/blog/drafts-2026-10-food-groups-30.json] 30개 예약 글 전체 승인 처리 (검토자: "영양고고 데이터 편집팀", 근거: 자동 대조 0건 불일치 + 금지표현 검사 통과). humanReview: pending→approved, noindex: true→false
- typecheck·lint·regression 34/34·build·test:http 193건 통과 확인 후 PR #17 머지

### 설정 변경
- 없음

### 미결 사항
- 10/1~10/30 09:00 KST에 순차적으로 자동 공개됨 (시간별 ISR로 재배포 불필요) — 공개 후 실제 화면 확인 권장
- 저장 데이터 범위 확대(추가 동기화)는 운영 DB 쓰기라 사용자 승인 필요

---

## 2026-09-30 10:23

### 수행 작업
- [lib/nutrition-group.ts, lib/national-nutrition-db.ts, lib/nutrition-group-data.ts, app/nutrition-data/[dataset]/group/[slug]/page.tsx] 이름·업체·기준량·영양값이 동일한 중복 등록 자료를 통계·발행 기준에서 한 번만 세도록 수정 (운영에서 12건 확인, PR #15 머지)
- [scripts/render-food-group-review.mjs] 검토용 HTML 패키지 생성 (`npm run blog:review -- --live`로 운영 페이지와 자동 대조, 현재 0건 불일치)
- [scripts/approve-food-group-post.mjs] 검토자 실명+날짜 기록 승인/철회 CLI (`npm run blog:approve`)
- [scripts/build-food-group-drafts.mjs] 승인 파일을 반영해 approved/pending을 자동 반영하도록 수정, `--stdout` 옵션 추가
- [scripts/test-food-group-schedule.mjs] 승인 상태·검토자 기재 검증 추가; 생성물 비교를 바이트 비교 대신 파싱된 JSON 비교로 변경 (CI Node 패치버전 간 Intl 포맷팅 차이로 인한 불안정 수정)
- [scripts/build-food-group-drafts.mjs] CI(Linux)에서 `process.exit(0)`이 파이프에 쓰던 stdout을 잘라먹는 문제 수정 (PR #16 머지)
- 30개 글 재수집 데이터로 재생성, 운영 대조 0건 불일치 확인

### 설정 변경
- 없음

### 미결 사항
- 30개 글 사람 검토 후 `npm run blog:approve -- <slug> --reviewer "이름"` 실행 → PR 머지해야 날짜에 맞춰 공개됨 (10/1 글은 오늘 안에 승인 필요)
- 저장 데이터 범위 확대(추가 동기화)는 운영 DB 쓰기라 사용자 승인 필요

---

## 2026-09-30 07:00

### 수행 작업
- [app/blog/[slug]/page.tsx] revalidate 3600 추가: 예약 글이 publishedAt 이후 재배포 없이 공개됨 (로컬 프로브 404→200 확인)
- [app/sitemaps/core.xml/route.ts] revalidate 86400→3600
- [scripts/collect-food-group-pages.mjs, scripts/snapshot-food-group-data.mjs] 운영 식품군 페이지 읽기 전용 수집 → content/editorial-data/food-groups-2026-09-30.json 스냅샷 (중앙값 운영 페이지와 일치)
- [scripts/build-food-group-drafts.mjs] 30개 식품군 글 생성기로 재작성, content/blog/drafts-2026-10-food-groups-30.json (2026-10-01~10-30 09:00, 전부 pending+noindex), 기존 3개 초안 파일 대체
- [scripts/test-food-group-schedule.mjs] 신규 회귀 테스트 (재현성, pending/noindex, 연속 날짜, 가상 예시 표시)
- PR #14 머지 (586ab7e), 운영: 30개 모두 404·사이트맵/목록 미노출 확인

### 설정 변경
- 없음

### 미결 사항
- 30개 글 사람 검토 후 humanReview "approved", noindex false 로 변경해야 날짜에 맞춰 공개됨

---
# WORK_LOG

## 2026-09-30 01:28 — 상세 식품군 비교·관련 식품군

### 수행 작업
- PR #13: 상세 페이지에 같은 식품군 중앙값·범위 대비 값(순위 아님), 식품군 페이지에 관련 식품군 링크. HTTP 테스트에 DB 장애 중 ISR 기존 페이지 유지 검증 추가(139)
- 운영 확인: 샌드위치 상세 열량 202kcal vs 중앙값 239kcal(15% 낮음), 관련 식품군 8개 링크

### 미결 사항
- 사용자 요청(중단됨): 글 30개 매일 예약 공개 — 사람 검토 게이트와 충돌, 방식 합의 필요

---

## 2026-09-30 00:54 — GSC 제출·블로그 초안

### 수행 작업
- GSC 사이트맵 제출(workflow_dispatch submit=true): sitemap_submit=ok, lastSubmitted 2026-09-29T15:55:47Z, errors 0, submitted 4772. Google 다운로드 대기(pending)
- PR #11: 사람 검토 대기 초안 3개(샌드위치 232·닭튀김 91·샐러드 57, humanReview=pending) — 운영 404·sitemap 미포함 확인
- PR #12: GSC 워크플로가 제출 후 pending만으로 실패 처리되던 문제 수정(errors>0만 실패)

### 미결 사항
- 초안 공개: 검토자가 수치·표현 확인, 공공데이터 데이터셋 상세 URL 보완 후 humanReview=approved, noindex=false
- 원천 sync: 로컬에 Turso·API 자격증명 없음, 예약 워크플로 없음 → 실행하려면 자격증명 또는 sync 워크플로 추가 승인 필요
- GSC 다운로드 결과는 다음 화요일 예약 점검에서 확인

---

## 2026-09-29 23:48 — 품질 마무리(접근성·ISR)

### 수행 작업
- PR #9: Lighthouse 실패 수정(색 대비 --ink-3·trust-card·키워드 칩, dl 구조, 블로그 카드 중복 링크, llms.txt 링크), 홈에 식품군 링크, eslint output/ 제외
- PR #10: 상세·식품군 페이지가 매 요청 동적 렌더(no-store, MISS)였던 문제 → generateStaticParams([])로 ISR. 운영 HIT 14~175ms, 샌드위치 페이지 LCP 2053→355ms
- 운영 Lighthouse(mobile): 홈·식품군·상세 접근성/권장사항/SEO 모두 100

### 미결 사항
- 원천 sync(운영 DB 쓰기), GSC 제출, 블로그 실데이터 글은 승인/사람 검토 필요

---

## 2026-09-29 23:15 — 식품군 비교 페이지

### 수행 작업
- PR #7: /nutrition-data/{food,process,material}/group(목록)·/group/{slug}(비교). 대표식품 기준 5개 이상, 같은 g/ml 기준만 비교, 최저·중앙값·최고, 순위 아님. /sitemaps/groups.xml, 상세·목록에서 링크
- PR #8: 같은 단위 자료 5개 미만 군은 sitemap·목록 제외(운영 검증에서 noindex 12개 발견)
- 운영 확인: groups.xml 158개 전부 200·index·자기 canonical, 샌드위치 232종 100g당 열량 중앙값 239kcal

### 미결 사항
- 원천 sync는 예약 없음(수동·운영 DB 쓰기 → 승인 필요)
- GSC에 groups.xml 반영 확인(색인 제출은 별도 승인)
- 실데이터 블로그 글은 사람 검토 절차 필요

---

## 2026-09-29 20:51 — 자율 진행: 원천 API 원인 해결 + 계산기 도구

### 수행 작업
- PR #3: `/tools/label-converter`(100g·100kcal·섭취량 환산), 상세 페이지 섭취량 계산기, 안전한 `failureReason` 진단 코드
- PR #4: 원천 JSON 구조 진단(키 이름만) → 운영에서 `{header, body}` 래퍼 없는 응답 확인
- PR #5: 래퍼 없는 응답 파싱 (lib/data-go-kr-response.ts, sync) → 운영 원천 검색 정상화, 미저장 상세 404 복구
- PR #6: 원인·릴리스 문서화
- 모든 PR: CI verify·Vercel 통과 후 main 병합, 운영 GET 스모크 확인

### 미결 사항
- 예약 sync가 새 파서로 정상 저장하는지 다음 실행 결과 확인
- 제안 남음: 식품군 비교 페이지, 실데이터 글(사람 검토 필요)

---

## 2026-09-29 20:25 — GitHub 배포 + 추가 개선

### 수행 작업
- [package.json/lock] next·eslint-config-next 16.2.7→16.3.7, postcss override ^8.5.28, npm audit 0건 (커밋 725208d)
- [lib/national-nutrition-db.ts 등] 운영 저장량(데이터셋별 500~1,747건) 확인 후: 새 검색(page 1)에서 저장 일치 0건이면 원천을 별도 범위(stored_no_match)로 조회, 원천 실패 시 저장 0건 유지 (f93d2ab)
- PR #1 → CI(verify)·Vercel 통과 후 main 병합 (b798632). 운영 스모크: 홈·검색·목록·상세·비교·sitemap 200, /compare sitemap 제외, 삭제 글 404
- [lib/national-nutrition-api.ts, sync] data.go.kr 03(NODATA)을 정상 0건으로 처리 — PR #2 병합 (6d8d1d7)

### 발견 (미해결)
- 운영에서 원천 API 호출이 빠르게(0.5~1.4초) 실패함: `?source=upstream` 검색과 미저장 코드 상세가 500. 이전 코드는 실패를 빈 결과/404로 숨겼음(HANDOFF F-005 "provider cause unknown"과 같은 현상으로 추정)
- 원인 확인에는 Vercel 함수 로그 또는 DATA_GO_KR_NUTRITION_KEY 유효성 확인 필요 (Vercel/env 접근은 규칙상 금지 → 사용자 확인 필요)

### 미결 사항
- 원천 API 키/응답 확인 후 필요하면 수정
- 제안(글·유틸리티) 사용자 선택 대기

---

## 2026-09-29 19:33 — 심층개선 실행명세(2026-09-28) T00~T12 로컬 구현

### 수행 작업
- 브랜치 `improve/2026-09-28-followup` 생성. 커밋 `7f3a052`(LF 고정 `.gitattributes`, lockfile 동기화, 기준선 문서) + 후속 기능 커밋
- [lib/national-nutrition-db.ts] 검색 범위 고정(stored/upstream, scopeReason), 상세 상태 계약(found/not_in_stored_scope/not_found/temporarily_unavailable), 대표행 규칙 통일, 관련 식품 분류 기준, 코드 없는 행 저장 금지, 실패 결과 캐시 금지
- [app/nutrition-data/*] 허브 실패 격리·빈 결과 문구·더 보기·비교 담기, 목록 source 파라미터, 상세 5xx/404 분리·출처 시점 분리
- [app/compare/page.tsx] 숫자+단위 입력, 열별 기준량, 일시 장애 보존, 1개 남은 비교 동선
- [app/page.tsx, layout.tsx, rankings] 홈 검색·메뉴 이름·앵커·검증 불가 문구 교체
- [app/sitemaps/core.xml] /compare 제외, [app/not-found.tsx, app/error.tsx] 신규, [app/blog/[slug]] dynamicParams=false
- [lib/json-ld.ts] JSON-LD 이스케이프(전 페이지), Dataset publisher
- [app/api/foods, health-functional-food-nutrition] 파라미터 상한
- [scripts] test-followup-state-contract(56), test-http-contract(108), run-regression-tests(33/33), 정적 테스트 6개 갱신, sync 코드 없는 행 스킵
- [.github/workflows/ci.yml] npm ci + lint + regression + diff 검사 + build + http
- [docs/quality] 2026-09-28-followup-baseline / -tests / -release-and-rollback

### 설정 변경
- 로컬 repo `core.autocrlf=false`. 패키지 추가 없음. npm scripts `test:regression`, `test:http` 추가

### 미결 사항
- push/배포 미실행(승인 필요). 배포 전 운영 DB로 데이터셋별 저장 행 수·합성 코드 행 수 확인 권장
- BLOCKED: 원천 표본 대조, GA4/AdSense, all·세부 동일성, T08 콘텐츠 사람 검토
- next 16.2.7 critical 취약점 업그레이드(별도 작업)

---

## 2026-09-29 19:29

### 수행 작업
- GitHub lsk7209/yungyanggogo.kr 클론 (HEAD d6c3866), 검토 실행
- typecheck/lint/build 통과, scripts/test-*.mjs 32개 중 30개 통과
- 실패 2개(editorial-generation-boundary, persona-writer-gates)는 Windows autocrlf CRLF 변환 때문임 확인. LF 클론에서는 통과
- 테스트가 재생성한 리포트 파일(EOL만 바뀜)은 git checkout으로 복원

### 설정 변경
- npm install 실행 (npm ci 실패: lock 파일 불일치). package-lock.json 변경은 커밋하지 않고 남겨 둠

### 미결 사항
- package-lock.json 동기화 커밋 + CI를 npm ci로 전환
- .gitattributes 추가 (`* text=auto eol=lf`)
- next 16.2.7 critical 취약점 → 16.3.3 이상으로 업그레이드
- /api/foods, /api/health-functional-food-nutrition 페이징 파라미터 범위 제한
- 사용 중단 예정인 preferredRegion 설정 정리

---
