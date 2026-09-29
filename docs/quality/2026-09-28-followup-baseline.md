# 2026-09-28 후속 개선 기준선 (T00)

- 관측: 2026-09-29 19:40 KST, 로컬 Windows, Node v24.13.0
- 저장소: github.com/lsk7209/yungyanggogo.kr, 시작 HEAD `d6c386666fc3c0c076efb1ad191c1bbaeb3d42ea` (명세 기준 커밋과 동일)
- 작업 브랜치: `improve/2026-09-28-followup` (로컬 전용, push/배포 없음)
- 사용자 미커밋 변경: 없음 (새 클론)
- 운영 비밀값: 로컬 `.env` 없음. Turso/공공데이터 키 미설정 상태로 실행 → 테스트·빌드가 운영 DB/API에 연결되지 않음

## 기준선 결과

| 항목 | 결과 | 비고 |
|---|---|---|
| `npm ci` | FAIL | lockfile 불일치: `@emnapi/runtime`, `@emnapi/core` 누락, `@emnapi/wasi-threads` 버전 불일치. CI가 `npm install`이라 드러나지 않았음 |
| `npm install` | PASS | lockfile의 `@emnapi/*` 항목만 갱신. 선언 의존성 변경 없음 |
| `npm run typecheck` | PASS | |
| `npm run lint` | PASS | |
| `npm run build` | PASS | `preferredRegion` 경고는 기존 |
| `scripts/test-*.mjs` 32개 (autocrlf=true 체크아웃) | 30 PASS / 2 FAIL | editorial-generation-boundary, persona-writer-gates: CRLF 변환으로 본문 글자 수 불일치. 기존 환경 문제 |
| 동일 32개 (LF 체크아웃, `.gitattributes` 추가 후) | 32 PASS | |
| `npm audit --omit=dev` | 5건 (critical 1: next 16.2.7) | 명세상 패키지 자동 최신화 금지 → 별도 보안 과제로 남김 |

## 주의
- `test-editorial-corpus-map`, `test-editorial-contract-risk-priority`, `test-editorial-promotion-boundary`는 실행 시 `docs/quality/*`, `content/blog/approved-editorial-2026-09-13.json`을 재생성한다(내용 동일 시 diff 없음). 외부 호출·DB 쓰기는 없음.
- 기존 CI는 install/typecheck/build만 실행 → 회귀 테스트 미실행(F11).

## 명세 항목 대조 (완료 / 남음 / 불명)

| ID | 현재 코드 상태 | 분류 |
|---|---|---|
| F01 | core sitemap에 `/compare` 존재, 페이지는 noindex | 남음 |
| F02 | 허브가 `foods.length===0`이면 ok 여부와 무관하게 장애 안내 | 남음 |
| F03 | `cached.foods.length > 0`일 때만 DB 반환, 아니면 원천 API | 남음 |
| F04 | 상세가 `{item:null}`만 반환 | 남음 |
| F05 | 허브·비교 `Promise.all`, DB 예외 미격리 | 남음 |
| F06 | 허브 4건, 분류 링크 q 미전달 | 남음 |
| F07 | 허브가 비교 상태 미전달 | 남음 |
| F08 | 관련 식품 = 최근 저장순 | 남음 |
| F09 | 목록/상세/sitemap 대표행 규칙 상이 | 남음 |
| F10 | amount 단일 텍스트 입력 | 남음 |
| F11 | CI 테스트 미호출 | 남음 |
| F12 | 정적 패턴 테스트만 존재 | 남음 |
| F15 | 코드 없는 행에 `${dataset}-${name}` 합성 코드 저장 | 남음 |
| 결측/0·g/mL·0kcal 보호 | `lib/nutrition-comparison.ts` + 테스트 | 완료(보존) |
| 비교 선택 유지·4번째 부활 방지 | `lib/comparison-selection.ts` + 테스트 | 완료(보존) |
| 미검토 글 공개 게이트 | `lib/blog.ts` + 테스트 | 완료(보존) |
| F16/F17, GA4/AdSense 계정, 운영 원자료 대조 | 자격증명·계정 필요 | BLOCKED |
