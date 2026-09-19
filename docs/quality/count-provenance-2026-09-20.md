# F-006 건수 출처 구분 — 2026-09-20

## 결과와 범위

‘저장 건수 표시부터 진행’에 해당하는 F-006을 로컬에서 수정했다. 기존 F-001–F-004 변경과 감사 이력은 보존했다. 기준 HEAD는 `9f2c2d85b31950d58780b330e422208fcd93226c`이고 이번 변경도 미커밋 상태다.

DB에 저장된 고유 식품 수, 원천 응답의 총수, 현재 페이지에 표시한 수를 구분한다. 건수 누락·유효하지 않은 값은 `null`이며 정상 0건을 보존한다. 검색 결과는 해당 검색의 일치 건수로 표시한다.

## 변경

| 파일 | 내용 |
|---|---|
|`lib/nutrition-count.ts`|엄격한 nullable 건수 파서, 출처별 표시, 건수 미확인 시 페이지 이동. 별도 건강기능식품 신고 API의 기존 resolver는 호환성 유지.|
|`lib/data-go-kr-response.ts`|`reportedTotalCount` 추가. 다른 어댑터가 쓰는 기존 숫자형 추출 필드는 유지.|
|`lib/national-nutrition-api.ts`|원천 응답의 실제 건수만 해석. 실패는 전체 건수 `null`, 출처 `unknown`; 정상 응답은 `source`.|
|`lib/national-nutrition-db.ts`|DB 고유 항목 수에 `stored` 출처와 확인/최근 저장 시각을 추가. 기존 sync 메타데이터의 총수를 로컬 보유량으로 사용하지 않음. 캐시 키 갱신.|
|`components/NutritionCountSummary.tsx` 및 목록 두 화면|저장 전체/검색 일치/원천 응답/미확인 문구와 시각 표시. 정상 0건 목록은 실패 문구 대신 ‘현재 0개 항목 표시’.|
|`app/api/nutrition-data/route.ts`|출처·시각을 JSON에 포함. 다중 데이터셋 응답에 개별 `ok` 추가.|
|`scripts/sync-national-nutrition.mjs`|미확인 총수를 행 수나 0으로 저장하지 않음. 항목 저장은 유지하고 총수 메타데이터 갱신을 생략. 알려진 총수와 저장 행 수를 별도로 기록.|
|회귀·검증 스크립트|집계/표시/페이지 경계, 실제 어댑터·API·동기화의 격리 실행 검사. 기존 검증 runner에 작업별 증거 디렉터리·포트 인자 추가.|

스키마 마이그레이션과 새 의존성은 없다. `countCheckedAt`은 이 서버가 DB 집계 또는 응답을 확인한 시각이며 원천 서버의 최신 조회를 보장하지 않는다. Next 응답 캐시가 포함될 수 있음을 알린다. `latestStoredAt`은 해당 저장 자료 중 최근 저장 시각이며 전체 동기화 완료일이나 원자료 갱신일이 아니다. 원자료 `updatedAt`은 별도 항목 표시를 그대로 유지한다. 페이지 캐시는 시각을 결과와 함께 보존하므로 렌더링 때 새 시각을 만들지 않는다.

## 검증

증거: `output/playwright/count-provenance-20260920/`.

- 수정 전 회귀 FAIL: 건수 누락이 페이지 행 수 20으로 변환되는 문제를 확인했다 (`regression-before.log`).
- 건수 파서·출처·페이지 처리 **32 assertions PASS**.
- 인메모리 SQLite + 모의 fetch + 실제 어댑터/JSON API/SSR/동기화 스크립트 **79 assertions PASS**. 운영 DB 모듈과 네트워크는 테스트에서 대체했다.
- 안전한 회귀 스크립트 **30개 PASS**, TypeScript와 ESLint PASS. 이력 보고서를 다시 쓰는 corpus-map/contract-risk-priority 두 검사는 이전 작업과 동일하게 제외했다.
- 격리 `next build --webpack` PASS. 기존 `preferredRegion` 폐기 예정 경고는 남아 있다.
- 브라우저: 5개 데이터셋 × 저장 52건/원천 메타데이터 5,000건 자료에서 정확히 저장 52건 표시. 2페이지의 표시 2건, 검색 일치 1건, 적용 기준 150g과 비교 선택 보존 확인.
- 목록과 통합 화면의 360/390/1280px 페이지 가로 넘침 0. 콘솔 오류·경고 0. 기록한 브라우저 요청은 `127.0.0.1:3049`만 사용.
- 새로고침 전후 캐시된 확인 시각이 동일하고, 저장 시각과 원자료 갱신일이 구분되는 것을 확인.
- JSON API의 저장 총수 52/표시 4/출처·시각 확인. 실패는 HTTP 503 + `totalCount: null`. 정상 0건·미확인 응답은 격리 어댑터/API/SSR 검사로 확인했으며 실제 원천 응답을 조회하지 않았다.
- 현재 제품 파일 **18개 SHA256가 실행한 빌드와 일치**. 앞선 제품 파일은 의도적으로 수정한 데이터셋 건수 표시 외에 이전 해시를 유지한다.

검증 중 두 가지 실행 문제를 바로잡았다. 백업한 `.tsx`가 TypeScript 검사 대상에 포함되어 백업 확장자를 `.tsx.txt`로 변경했다. 건수 helper를 공유하던 별도 신고 API의 호환성을 유지하도록 기존 helper와 새 nullable 파서를 분리한 뒤 전체 타입 검사를 통과했다. 최초 패치 도구가 같은 경로의 삭제/추가를 거부해 일반 수정 패치로 재시도했으며, 해당 거부 시 소스 변경은 없었다.

## 독립 검토

Spark 시작이 `Unknown model`로 실패하여 동일한 소비처 조사·읽기 전용 검토를 Luna(max)로 한 번 재시도했다. 소비처 조사에서 별도 건강기능식품 API의 helper 호환성, 동기화 스크립트, JSON 경계, 캐시 키와 페이지 계산을 확인하고 해당 경로를 구현·검증에 포함했다. 최종 검토 결과는 완료 점검에서 기록한다.

## 한계·후속 작업

`/api/nutrition-data`의 `totalCount`는 이제 `number | null`이다. 외부 소비자는 숫자 여부와 `countScope`, 개별 `ok`를 확인해야 한다. 저장된 부분 자료가 전체 원천과 같다는 의미는 없다. 과거 sync 메타데이터는 마이그레이션하지 않았으며 공개 건수의 근거로 쓰지 않는다.

F-005의 로컬 정상 0건 문구는 이번 표시 수정에 함께 바로잡았지만 실제 건강기능식품 조회 실패의 원인은 미확인이다. F-005 전체 해결, F-010 계산 극단값 방어, F-008 사이트맵 정합성, 기타 감사 항목의 완료를 주장하지 않는다. 다음 독립 로컬 단계는 F-010의 계산 결과 유한성 검사다.

운영 DB/API, 실제 동기화, 계정·광고 설정, 커밋·푸시·배포는 실행하지 않았다. 동기화 CLI는 인메모리 DB와 모의 응답으로만 실행했다.

## 재실행·복구

- 회귀: `node scripts/verify-review-repair.mjs --checks --task=count-provenance-20260920`.
- 집중 검사: `node scripts/test-national-nutrition-db-count.mjs`, `node scripts/test-nutrition-count-provenance.mjs`.
- 격리 빌드/서버: `node scripts/verify-review-repair.mjs --task=count-provenance-20260920 --port=3049`. 증거 디렉터리의 합성 `nutrition-fixture.db`가 필요하며 `.env`는 복사하지 않고 자식 환경의 운영 키를 제거한다.
- 브라우저 입력: `browser-count.txt`; 원기록 `browser-count.log`, 요약 `browser-proof.json`, 모바일 스크린샷 2개.
- 롤백: 이번 F-006 변경만 되돌린다. 기존 dirty 상태는 `baseline.patch`, 이전 데이터셋 페이지와 runner는 `baseline/`에 보존했다. 기존 전체 diff를 일괄 초기화하면 앞선 완료 작업을 잃으므로 해당 작업의 변경을 유지한다.

## 완료 점검 — 2026-09-20T08:27:47+09:00

독립 검토에서 남은 중대한 결함이 없었고 C1–C6가 모두 PASS다. 작업용 브라우저와 서버3049를 종료했으며 기존31847 서버를 보존했다. 18개 제품 파일의 빌드 일치와 최종 공백 검사를 확인했다. 최종 기록: `output/playwright/count-provenance-20260920/completion-audit.json`.

배포 기록 참고: 위 `output/` 원기록과 `docs/audits/` 감사 자료는 로컬 보존 증거이며 GitHub 푸시 대상에 포함하지 않는다. 이 요약 문서와 제품·회귀 코드는 배포 커밋에 포함한다.
