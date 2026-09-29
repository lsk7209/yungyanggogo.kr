# 2026-09-28 후속 개선 — 테스트·전후 증거

기준: 시작 HEAD `d6c3866`, 작업 브랜치 `improve/2026-09-28-followup`. 모든 결과는 로컬 실행이며 운영 반영 없음(`production_changed: false`).

## 실행한 명령과 결과 (2026-09-29, Windows, Node v24.13.0)

| 명령 | 결과 | 비고 |
|---|---|---|
| `npm ci` | PASS | lockfile 동기화 후 (기준선은 FAIL) |
| `npm run typecheck` | PASS | |
| `npm run lint` | PASS | |
| `npm run test:regression` | PASS 33/33 | 기존 32 + 신규 `test-followup-state-contract.mjs` 1 |
| `git diff --exit-code` (회귀 후) | PASS | 리포트 재생성 스크립트 결정성 확인 |
| `npm run build` | PASS | 23 pages, 기존 `preferredRegion` 경고만 |
| `npm run test:http` | PASS 108 assertions | `next start` + `output/playwright/` file DB, 공급자 키 비움 |
| `git diff --check` | PASS | |
| 브라우저 여정 (360/390/1440px) | PASS | 아래 참고. 스크린샷은 대화 중 확인, 파일 저장 없음 |

### 테스트가 실제로 실패를 잡는지(뮤테이션) 확인
- 상세 대표행 정렬을 `query_key DESC`로 변경 → `R13` FAIL (runner exit 1)
- 빈 페이지 원천 전환 복원 → `R07` FAIL
- core sitemap에 `/compare` 재추가 → HTTP 테스트 `R33` FAIL
- 미분류 `scripts/test-*.mjs` 추가 → runner exit 2 (R50: 조용히 빠지는 테스트 없음)

## 요구사항별 결과

| ID | 테스트 | 결과 | 근거 |
|---|---|---|---|
| R01 | 정상 0건 안내, 장애 문구 없음 | PASS | state-contract(허브 렌더), http(목록) |
| R02 | HTTP 200 + 원천 오류코드 = 실패 | PASS | state-contract |
| R03 | 5개 중 1개 실패 시 나머지 표시, 전부 실패 시 5xx | PASS | state-contract, http(T01-HTTP) |
| R04 | DB 미일치 + 원천 타임아웃 → not_found 아님, 상세 5xx | PASS | state-contract, http(DB 손상 시 상세 500) |
| R05 | 원천 정상 응답+코드 불일치만 not_found → 404 | PASS | state-contract, http |
| R06 | 비교 중 일시 장애: 선택 보존, 재시도/제거 분리 | PASS | state-contract |
| R07 | 저장 25건/12개, page 4에서 원천 전환 없음 | PASS | state-contract (fetch 0회) |
| R08 | 저장 0건과 명시적 원천 추가 검색 구분 | PASS | state-contract |
| R09 | 원천 범위 page 2: q·source·분모 유지 | PASS | state-contract |
| R10 | DB 오류 ≠ 정상 0건, page>1 장애 시 원천 전환 없음 | PASS | state-contract |
| R11 | `%` `_` `\` 리터럴 검색 | PASS | state-contract |
| R12 | 동명·다른 코드 각각 유지, 카드에 급식/제조사 구분 | PASS | state-contract |
| R13 | 동일 코드·동일 저장시각 → 목록·상세 같은 대표행 | PASS | state-contract (뮤테이션 확인) |
| R14 | 저장 최신 우선, sitemap lastmod도 같은 행 | PASS | state-contract |
| R15 | 관련 결과 동일 코드 중복 없음 | PASS | state-contract |
| R16 | 무관한 최근 저장 식품을 관련으로 제시하지 않음 | PASS | state-contract |
| R17 | 100mL 원자료 보존, g 환산 거부 | PASS | state-contract |
| R18 | 빈값/ND/미량/0 표시 구분 | PASS | state-contract |
| R19–R22 | 환산 계산·0kcal·밀도 없는 mL 거부 | PASS | state-contract + 기존 test-nutrition-comparison |
| R23 | 모호한 쉼표 숫자 거부, 오버플로 → 계산 불가 | PASS | state-contract |
| R24 | 원천 코드 없는 행 저장 안 함, 과거 합성 코드 비노출·sitemap 제외·noindex | PASS | state-contract |
| R25–R27 | 허브 더 보기 q 유지, 표시 분모 명시, item/basis/amount 전달 | PASS | state-contract, http, 브라우저 |
| R28–R29 | 숫자+단위 선택, 기존 `amount=120g` 호환, no-JS 서버 처리 | PASS | state-contract, http, 브라우저 |
| R30 | reported 기준량 차이 경고 + 열별 기준 표시 | PASS | state-contract |
| R31–R32 | 숨은 4번째 부활 없음, 1개 남은 비교 동선 | PASS | state-contract, 브라우저 |
| R33 | `/compare` noindex 유지 + sitemap 제외 | PASS | http (뮤테이션 확인) |
| R34 | page 2 자기 canonical·다른 행, 범위 밖 404 | PASS | http |
| R35 | 미검토 글 404, sitemap 없음 | PASS | http (표본 5개) |
| R36 | 삭제 글 404 유지, 리디렉션 없음, HTML 본문에 한국어 404+검색 | PASS | http |
| R37 | 승인된 구 URL 매핑 | NOT RUN | 승인된 매핑 없음(사람 결정 필요) |
| R38 | all·세부 동일 코드 canonical 통합 금지 | PASS(현상 유지) | 코드는 데이터셋별 자기 canonical 유지. 동일성 판정은 BLOCKED(운영 데이터) |
| R39 | 비포스트 lastmod가 빌드일로 바뀌지 않음 | PASS | http |
| R40–R41 | 콘텐츠 실제/가상 구분, 허구 작성자 없음 | NOT RUN | T08 콘텐츠 개선은 사람 검토 필요 → 범위 제외 |
| R42/R44 | 광고·분석 비활성 시 스크립트 없음 | PASS | http |
| R43 | SPA 이동 뒤 광고 잔존 | NOT RUN | 광고 활성화 금지 조건 |
| R45–R46 | GA 이벤트 중복·검색어 전달 | BLOCKED | GA4 계정·활성화 필요 |
| R47 | 저장 페이지 조회 = SQL 2회, 원천 0회 | PASS | state-contract |
| R48 | 원천 실패가 저장 자료를 덮어쓰지 않음 | PASS | state-contract |
| R49 | 원격 fixture DB URL 거부 | PASS | http (가드 assert) + 기존 seed 가드 |
| R50 | 회귀 하나 실패 시 CI 실패 | PASS | runner 뮤테이션 exit 1 |
| R51 | sitemap URL 전체 HTTP 200·index·자기 canonical | PASS | http (24 URL) |
| R52 | 360/390/1440px 페이지 가로 넘침 없음 | PASS | 브라우저: 허브·목록·비교 `scrollWidth - innerWidth = 0` |

## 브라우저 여정 (로컬 `next start` + fixture DB, 임시 Chrome 프로필)
홈 검색 → 허브 미리보기 → 허브에서 1번 담기 → "이 검색 결과 더 보기"(q·선택 유지, 9건) → 2번 체크 → 상세(저장 시각·원자료 기준일 분리, "같은 대표식품" 관련) → 뒤로가기(선택 유지) → 비교 → 기준 perIntake + 250 g(250 kcal, 125 mg) → 1개 제거(추가 동선) → 허브 검색으로 가공식품 추가 → 비교 → 새로고침 / 공유 URL 재열기. 콘솔 오류 0.
참고: 자동화 도구의 `click`이 모바일 에뮬레이션에서 두 번 시간 초과됨. DOM click으로는 정상 동작해 제품 결함은 아닌 것으로 판단(실기기 미검증).
