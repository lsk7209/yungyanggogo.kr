# 테스트 결과

| test | command | status | evidence/limitation |
|---|---|---|---|
| SAFE-01 | Git/package/domain inspection | PASS | origin and site config match yungyanggogo.kr |
| SAFE-02/03 | pre-change git status and scope audit | PASS | existing dirty work preserved; no production mutation |
| DATA-01..04/07 | `node --experimental-strip-types scripts/test-national-nutrition-parser.mjs` | PASS | 12 fixture assertions |
| DATA-08 DB COUNT | `node --experimental-strip-types scripts/test-national-nutrition-db-count.mjs` | PASS | 8 assertions; stored zero preserved instead of page-row fallback |
| DATA-13/UX-06/07 failure integrity | `node --experimental-strip-types scripts/test-nutrition-failure-integrity.mjs` | PASS | 15 assertions; upstream failure cannot publish/cache unrelated static samples and public routes retain failure HTTP status with generic copy |
| DATA-10 cache identity boundary | `node scripts/test-nutrition-cache-identity.mjs` | PASS | 3 assertions; query-specific results are not persisted as duplicate source records |
| DATA-01/02 sync parser parity | `node scripts/test-nutrition-sync-parser-boundary.mjs` | PASS | 4 assertions; sync uses shared nested `items.item` parser; sync itself not run because it writes DB |
| UX-02/03 provider and query boundaries | query/provider scripts | PASS | query 12 + provider 7 assertions; bounded parameters and DB-first access without requiring API key |
| UX-13/PUBLIC-OPS | `node scripts/test-public-quality-boundary.mjs` | PASS | 10 assertions; operator and unverified copy absent |
| Existing example boundary | `node scripts/test-example-boundary.mjs` | PASS | 5/5 |
| UX-01/05/06/08 comparison calculation | `node --experimental-strip-types scripts/test-nutrition-comparison.mjs` | PASS | 24 assertions; serving basis, custom same-dimension intake, zero/missing/ND/trace/invalid, precision and unsafe conversion refusal |
| UX-08 selection round-trip | `node --experimental-strip-types scripts/test-comparison-selection.mjs` | PASS | 14 assertions; canonical item encoding, dedupe/max-three, removal and collection round-trip preserve selection |
| DB stored-record search | `node scripts/test-nutrition-db-search-boundary.mjs` | PASS | 8 assertions; parameterized escaped search and deduplicated all-record listing use distinct food codes |
| ADS-01/02 URL policy | `node --experimental-strip-types scripts/test-ad-policy.mjs` | PASS | 11 assertions; only real nutrition-detail paths are AdSense-eligible and unreviewed blog paths remain blocked |
| Coupang affiliate removal boundary | `node scripts/test-affiliate-ad-boundary.mjs` | PASS | 4 assertions; runtime/page/CSS/env sources contain no Coupang component, affiliate flag or banner-management/measurement endpoint |
| Analytics/ad existence boundary | `node scripts/test-runtime-script-boundary.mjs` | PASS | 9 assertions; analytics has no default ID and requires opt-in; AdSense renders only after a real detail record passes `notFound`; Coupang is absent |
| SEO-02/04/06 query index policy | `node scripts/test-query-index-policy.mjs` | PASS | 6 assertions; query-wide robots block removed, search noindex, pagination self-canonical |
| SEO/OPS blog pagination | `node scripts/test-blog-pagination-boundary.mjs` | PASS | 6 assertions; 24 posts/page and out-of-range 404 |
| Blog thumbnail origin | `node scripts/test-thumbnail-origin-boundary.mjs` | PASS | 4 assertions; cards use current-origin paths while metadata retains absolute URLs |
| Blog trust/sitemap boundary | `node scripts/test-blog-trust-boundary.mjs` | PASS | 9 assertions; no invented author/review state, representative guide claim boundary, noindex sitemap exclusion |
| Fetch retry/transport boundary | `node scripts/test-fetch-retry-boundary.mjs` | PASS | 17 assertions; only transient/network failures retry, maximum two attempts, no keyed HTTPS-to-HTTP downgrade across four adapters |
| Remaining acceptance boundaries | `node --experimental-strip-types scripts/test-remaining-acceptance-boundary.mjs` | PASS | 18 assertions; FoodSafetyKorea count, failure display, totalCount pagination, nonfunctional navigation removal, generated-content review gate |
| Full local regression set | all `scripts/test-*.mjs` | PASS | 21 scripts, 207 assertions |
| OPS-01 typecheck | `npm run typecheck` | PASS | completed after parser refactor |
| OPS-01 lint | `npm run lint` | PASS | 0 errors; one pre-existing `no-img-element` warning |
| OPS-03 build | `npm run build` | PASS | Next.js 16.3.4; 716 generated pages |
| Local HTTP smoke | production server on 127.0.0.1:3021 | PASS | five pages/robots/sitemap 200; four unavailable APIs 503 with safe copy; invalid URL 404 |
| Final failure HTTP smoke | production server on 127.0.0.1:3034 | PASS | unavailable nutrition provider 503; no internal key names; exact listener stopped and port released |
| Comparison HTTP smoke | production server on 127.0.0.1:3022 | PASS | empty and invalid-selection compare pages 200/noindex; no ad loader or secret names; blog index and nutrition index 200; port released |
| Search/SEO/ad HTTP smoke | production servers on 127.0.0.1:3023-3025 | PASS | blog HTML reduced about 937KB to 62KB; page 2 self-canonical; out-of-range 404; search noindex; dataset page 2 self-canonical; robots permits query crawl; ineligible pages contain no AdSense/affiliate request URLs; ports released |
| UX-10/11 Playwright mobile | Chromium at 360x800, local production 3026-3028 | PASS | compare and blog page 2 scrollWidth=clientWidth=360; first Tab reaches named home link; page 2 has exactly 24 cards, zero broken images and final console 0 errors; screenshots in `output/playwright/` |
| UX-01/08 fixture-backed comparison E2E | local SQLite fixture, production server 3030-3033, Playwright Chromium 360x900 | PASS | search→detail→2 items→100g refusal/value→retain selection→add third→100kcal zero-energy refusal; removal URLs preserve remaining items/basis; scrollWidth=clientWidth=360; external resources `[]`; console errors 0; screenshots under `output/playwright/` |
| UX-01 credential-backed real-data comparison | authorized read-only production API/DB credentials | NOT RUN | fixture-backed integration is complete, but it is not proof against current production data |
| CALC-09/11/13 source metadata | current upstream item schema | NOT RUN | nutrient-specific basis/unit and preparation-state metadata are not available; implementation refuses to infer them |
| SEO example boundary | local HTML and sitemap | PASS | example noindex,follow; excluded from 487-URL sitemap |
| OPS-09 production | deployment/live post-deploy smoke | NOT RUN | no deployment authority |

수용 테스트 전체를 통과했다는 문서가 아니다. 비교 UI와 계산/광고 정책은 로컬 구현됐지만 실제 DB 자격 증명 E2E, 운영 계정, 사람 검수 항목은 남아 있다.
