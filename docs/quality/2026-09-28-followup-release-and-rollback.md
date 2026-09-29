# 2026-09-28 후속 개선 — 변경·보존·미완료·롤백

상태: 로컬 커밋만(브랜치 `improve/2026-09-28-followup`). push·PR·배포·운영 DB 변경 없음. `production_changed: false`.

## 해결한 문제 (fixed_local → verified_local)

| ID | 변경 | 파일 |
|---|---|---|
| F01 | core sitemap에서 noindex `/compare` 제외 | `app/sitemaps/core.xml/route.ts` |
| F02/F05 | 허브: 데이터셋별 실패 격리, 정상 0건과 장애 문구 분리, 전부 실패 시 5xx | `app/nutrition-data/page.tsx`, `lib/national-nutrition-db.ts` |
| F03 | 저장 범위 고정. 원천 전환은 ① `source=upstream` 명시 ② 데이터셋 저장 0행(초기) ③ page 1의 DB 장애일 때만, 그리고 결과에 `searchScope`/`scopeReason` 표기 | `lib/national-nutrition-db.ts`, 목록 페이지, `NutritionDatasetBrowser` |
| F04 | 상세 결과를 `found / not_in_stored_scope / not_found / temporarily_unavailable`로 분리. 장애는 throw → 5xx(ISR 기존 페이지 보존), 부존재만 404 | `lib/national-nutrition-db.ts`, 상세 페이지, `app/error.tsx` |
| — | 실패 결과는 `unstable_cache`에 1시간 고정되지 않음 | `lib/national-nutrition-db.ts` |
| F06/F07 | 허브 "이 검색 결과 더 보기"(q 유지), 카드별 "비교 목록에 담기", 선택 상태 전달, 표시 분모 명시 | 허브, `NutritionFoodCard` |
| F08 | 관련 식품 = 같은 대표식품 > 중분류 > 대분류, 관계 라벨 표시, 근거 없으면 영역 생략 | `readRelatedNationalNutritionItemsFromDb`, 상세 |
| F09 | 목록·검색·상세·관련·sitemap 대표행 규칙 통일 (`synced_at DESC, query_key ASC`). 검색은 대표행 기준으로 필터 | `lib/national-nutrition-db.ts` |
| F10 | 섭취량 숫자 + g/ml 선택. `amountValue/amountUnit` 서버 처리(no-JS), 기존 `amount=` 유지 | `app/compare/page.tsx`, `lib/comparison-selection.ts` |
| F11 | CI: `npm ci`, lint, 회귀 runner, 리포트 결정성, build, HTTP 계약 | `.github/workflows/ci.yml`, `scripts/run-regression-tests.mjs` |
| F12 | 실제 `next start` HTTP 계약 테스트 | `scripts/test-http-contract.mjs` |
| F15 | 원천 코드 없는 행 저장 중단(앱·sync). 과거 합성 코드는 비노출·noindex·sitemap 제외 | `lib/national-nutrition-db.ts`, `scripts/sync-national-nutrition.mjs` |
| T04 | `-`/0 대신 자료 없음·미검출·미량 표시, 모호한 쉼표 숫자 거부, 환산 결과 유한성 검사 | `lib/nutrition-comparison.ts`, 카드·상세 |
| T05 | 홈 검색창·목적별 앵커, 메뉴 이름 정리, 개발용 REST/JSON 설명 접기, 검증 불가한 "갱신 주기" 문구 교체 | `app/page.tsx`, `app/layout.tsx`, `app/rankings/page.tsx` |
| T06 | 열별 기준량 표시, reported 기준 차이 경고, 1개 남은 비교 동선 | `app/compare/page.tsx` |
| T07 | 한국어 404(검색 포함, HTTP 404 유지). 블로그 미존재 slug는 `dynamicParams=false`로 404 HTML 본문 제공 | `app/not-found.tsx`, `app/blog/[slug]/page.tsx` |
| T09 | JSON-LD `</script>` 경계 이스케이프(전 페이지), Dataset의 `creator`→`publisher` | `lib/json-ld.ts` 외 |
| T11 | `/api/foods`, `/api/health-functional-food-nutrition` q·pageNo·numOfRows 상한. 상세 metadata+본문 조회 중복 제거(`react.cache`) | API 라우트, 상세 페이지 |
| T00 | `.gitattributes`(LF) — Windows CRLF로 인한 테스트 2건 실패 해소, lockfile 동기화 | `.gitattributes`, `package-lock.json` |

## 보존한 것
- URL 구조, 비교 URL `item/basis/amount` 호환, 최대 3개·중복·4번째 부활 방지
- 결측/0·질량/부피·0kcal 계산 보호(강화만 함), 미검토 글 공개 게이트, 검색·선택 URL noindex
- 광고·분석 비활성 설정, 공급자 결과 저장 조건(무검색 정상 응답만) — 단 초기 데이터셋 한정으로 좁힘

## 동작 변화 — 배포 전 확인 필요
1. **저장 자료가 일부만 있는 데이터셋**: 이전에는 저장 결과가 비면 원천을 조용히 조회했음. 이제 저장 범위 0건으로 답하고, 원천 키가 있으면 "공식 원천에서 추가 검색" 링크를 제공. 운영 저장 범위가 작다면 검색 체감 결과가 줄 수 있음.
2. **상세 페이지 미저장 코드 + 원천 키 없음**: 404 (이전과 동일). 원천 장애는 이제 404가 아니라 500 → 이미 생성된 ISR 페이지는 유지됨.
3. **허브·목록의 전면 장애**: 200 빈 화면 → 500 오류 화면.
4. 코드 없는 원천 행은 더 이상 저장되지 않음(sync 요약 `skippedWithoutCode`).

## 미완료 (BLOCKED / NOT RUN / deferred)
- F16/R38: all·세부 동일 코드의 값 동일성 → 운영 DB 필요(BLOCKED)
- T04 표본(닭고기덮밥·달걀찜 100mL) 원천 대조 → 공급자 키 필요(BLOCKED)
- 과거 합성 코드 행 dry-run 집계: `SELECT COUNT(*) FROM national_nutrition_items WHERE food_code = dataset_slug || '-' || food_name;` → 운영 DB 읽기 권한 필요(BLOCKED). 삭제는 별도 승인
- T08 대표 글 3개 개선·작성자 정보·콘텐츠 결정표 → 사람 검토 필요(deferred)
- T10 GA4 이벤트, T09 AdSense 실제 요청 → 계정·활성화 승인 필요(BLOCKED)
- `/blog/triangle-kimbap-calorie-compare`: 404 유지. 대체 연결 여부는 사람 결정
- CWV 실측, `EXPLAIN QUERY PLAN` 대량 데이터 측정 → NOT RUN
- `npm audit`: next 16.2.7 critical 등 — 명세상 자동 업그레이드 금지, 별도 보안 작업 권장
- 알려진 한계: 온디맨드 ISR 상세의 404 본문은 RSC로 클라이언트 렌더(상태 404는 정상)

## 롤백
- 커밋 단위: `7f3a052`(기준선·LF·lockfile), 후속 커밋(기능+테스트+CI). `git revert <sha>`로 되돌림. 강제 push/reset 금지.
- DB 스키마 변경 없음 → 데이터 롤백 불필요. 캐시 키가 `v4-search-scope`로 바뀌어 배포 직후 1시간 캐시는 새로 채워짐.

## 다음 한 단계 (승인 필요)
운영 DB 읽기 권한으로 ① 데이터셋별 저장 행 수 ② 합성 코드 행 수를 확인해 위 "동작 변화 1"의 영향 범위를 판단한 뒤 push/배포 여부 결정.
