# 애드센스 심사 준비 재검토 (2026-10-16)

승인 가능성은 보장하지 않으며 수치로 예측하지 않는다. 변경은 로컬 작업 트리에만 있고 commit/push/배포는 하지 않았다.

## 재현된 문제 → 수정
| # | 문제 | 수정 | 보호 테스트 |
|---|---|---|---|
| 1 | `humanReview !== "pending"`이면 공개 → `"rejected"`·오타도 공개됨 | `lib/blog-visibility.ts`: 파일 글은 정확히 `approved`만 승인, 그 외 비공개. seed 글(상태 필드 없음)만 예외 | `test-blog-visibility.mjs` |
| 2 | 707개 중 약 695개가 `updatedAt <= publishedAt`. 화면·JSON-LD·OG·사이트맵 lastmod에 그대로 노출 | `lib/blog-dates.ts`: 발행일보다 뒤인 실제 수정일만 노출, 아니면 생략. 화면은 한국어 날짜, 기계값은 ISO+시간대(+09:00). 피드 pubDate도 같은 기준. 원본 JSON은 수정하지 않음 | `test-blog-dates.mjs` |
| 3 | seed 글의 "pSEO 사이트에서는 같은 템플릿…" 운영자 문장 | 독자 질문(비교 목적→기준량 순서)에 맞게 재작성. JSON 707개와 홈·목록·정책 문구 스캔은 추가 발견 없음 | `test-public-internal-wording.mjs` |
| 4 | 개인정보처리방침에 광고 쿠키·맞춤 광고 해제·Google 데이터 사용 안내 없음 | Google 공식 필수 고지(support.google.com/adsense/answer/1348695) 기준으로 추가, 개정일 명시, 분석/광고 도구 구분, 설정에 따라 켜질 수 있다는 점 명시 | `test-privacy-policy.mjs` |
| 5 | 건기식 페이지가 검색·서버 필터링이 있는 것처럼 설명(실제는 첫 12개 고정) | 제목·소개·FAQ를 "신고정보 확인 방법과 데이터 미리보기"로 정정, 공식 조회 경로 안내. 검색 기능은 구현하지 않음 | `test-health-functional-foods-claims.mjs` |

기존 문자열 검사 2건(`test-blog-trust-boundary`, `test-remaining-acceptance-boundary`)은 옛 문구를 검사하고 있어 새 동작에 맞게 갱신했다(검사 삭제·완화 아님).

## 이미 해결됨 / 해당 없음
- 프롬프트의 `run-regression-tests.mjs`, `PROJECT_STATE.md`, `test:regression`, `test:http`는 이 저장소에 없다.
- 5-2: 요청이 가리킨 `NutritionBasisCalculator.tsx`·`/tools/label-converter`가 없어, 기존 `lib/nutrition-comparison.ts`의 `normalizeNutrientForComparison`을 그대로 재사용하는 최소 구현으로 신설했다(`lib/label-converter.ts`, `components/NutritionBasisCalculator.tsx`, `app/tools/label-converter/page.tsx`, 헤더 메뉴·core 사이트맵 추가, CSS 추가). 입력 전 중립 안내, 입력 후에만 오류 표시, 빈칸≠0·실제 0 구분, 음수/0 기준량/미량·미검출 거부, g↔ml 차단, 0kcal·열량 결측 시 100kcal 환산 차단, 예시 값 "실제 제품 아님" 표시, 초기화, aria-live 결과. 입력은 브라우저 안에서만 계산(비GET 요청 0건 확인). 테스트: `test-label-converter.mjs`(30g/7g→45g=10.5g, 100g=23.33g, 200ml/10g→500ml=25g, 200kcal/18g→100kcal=9g 등), 브라우저 26단계(360·1280px).
- 검색→상세→선택→비교 흐름은 2026-09-20 릴리스에서 브라우저 검증됨. 이번에 해당 코드는 건드리지 않았고 브라우저 재검증은 하지 않았다.

## 콘텐츠 현황 (`content-url-inventory-2026-10-16.csv`)
- 승인+공개 7 + seed 1 = 공개 8건. 승인 대기 629(발행일 경과, 비공개), 대기+예약 71. 대기 글은 사람 검토 전까지 404(자동 승인 금지, 일괄 승인 스크립트 미실행).
- 통합·리디렉션·noindex 변경은 하지 않았다. 대기 글 대량 정리는 별도 승인 대상.

## 테스트
- `scripts/test-*.mjs` 35개 전부 통과(보고서를 덮어쓰는 `editorial-corpus-map`, `editorial-contract-risk-priority` 2개는 제외). 환경: 로컬 dev 서버(포트 3061), 외부 API 키 없음.
- 로컬 HTTP 스모크: `/`, `/blog`, `/compare`, `/nutrition-data`, `/privacy`, `/about`, `/editorial-policy`, `/robots.txt`, `/sitemap.xml`, `/sitemaps/core.xml`, `/feed.xml`, `/ads.txt` 200, 없는 글 404.
- typecheck(`tsc --noEmit`) 0 오류, eslint 0 오류·경고, `next build` 성공(사용자 승인 후 순차 실행).
- 브라우저(Playwright, 프로덕션 빌드 + 합성 fixture DB, 390·1280px) 비교 흐름 26개 단계 통과, 콘솔 오류 0: 선택 2개→검색·2페이지·뒤로가기·새로고침 후 유지→세 번째 추가→4번째 비활성→비교표→항목 제거→중복·잘못된 코드→100g 기준→섭취량 45g 입력 반영, 페이지 전체 가로 밀림 없음. 360px에서 `/privacy`, `/health-functional-foods`, `/blog`, 글 상세도 가로 밀림 없음. 증거: `output/playwright/adsense-review-20261016/`(로컬 전용).
- 일부 항목 조회 실패: 존재하지 않는 코드 1개 + 정상 2개로 비교 시 "일부 식품을 불러오지 못했습니다" 안내와 정상 2개 열이 유지됨(390·1280px). 이 브라우저 실행은 API 키가 없는 환경이라 DB에 없는 코드가 제공처 호출(503 실패 결과)을 거친 경우다. 추가로 `test-compare-partial-upstream-failure.mjs`가 mock fetch로 HTTP 500·네트워크 예외·키 없음이 예외 없이 실패 결과(`ok:false`, `foods:[]`)로 돌아오는지, 비교 화면이 항목별 독립 조회·실패 항목만 안내하는지 검증한다. 실제 운영 제공처의 장애는 재현하지 않았다.
- 수정 전 실패(red) 확인: 신규 테스트 5개 모두 해당 파일을 수정 전 상태로 되돌렸을 때 실패, 복원 후 통과.
- 운영 읽기 전용 스모크(GET 10건 순차, 2026-10-16): `/`·`/robots.txt`·`/ads.txt`(pub-3050601904412736)·`/sitemap.xml`·`/sitemaps/core.xml`·`/privacy`·`/health-functional-foods`·`/blog`·글 상세 200, 없는 글 404, http→https 308, www→apex 307. **운영은 아직 이번 수정 이전 버전**: `/privacy`에 맞춤 광고 해제 링크 없음, 건기식 제목 미변경, 글 상세에 "pSEO" 문장과 `dateModified` 존재. 미배포 상태이므로 정상.
- 미실행: 운영 DB/API, 운영 제공처 장애 재현.

## 미검증·확인 불가
- 운영 반영 여부, 실제 GA/AdSense 환경변수 설정, 문의 메일 수신 여부.
- EEA/영국/스위스 트래픽에 Google 인증 CMP가 필요한지: 정책 확인 및 실제 광고 활성화 계획에 따라 판단 필요(배너 하나로 해결됐다고 보지 않음).
- `ads.txt`의 pub-3050601904412736과 실제 신청 계정 일치 여부(변경 안 함).

## 별도 승인 필요
push/배포, 승인 대기 글 검토·공개 범위, 대량 noindex/통합/리디렉션, 광고 계정·자동 광고, GSC 제출, 재심사 신청, CMP 도입, 건기식 검색 기능 신규 개발.

## 롤백
변경 파일을 `git checkout -- <파일>`로 되돌리고 신규 파일(`lib/blog-visibility.ts`, `lib/blog-dates.ts`, 신규 테스트 5개, 이 문서·CSV) 삭제.





