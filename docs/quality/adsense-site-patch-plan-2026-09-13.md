# SEO and AdSense local patch plan — 2026-09-13

## Outcome

The repository has a conservative ad-loading boundary, matching publisher IDs, working trust routes and healthy local technical endpoints. The remaining work is not an approval prediction: one reproducible canonical defect needs a reviewed patch, legacy content must continue through its editorial gate, and live consent/account state remains unknown.

## Prioritized actions

1. **Completed T2 — repaired inherited homepage canonical on 404 pages.** The root layout no longer assigns `/` globally, while `app/page.tsx` owns the homepage self-canonical. A new regression test and local production HTTP check prove the homepage remains canonicalized and a missing detail is `404` + `noindex` with no canonical.
2. **T3 — keep the 700-row legacy corpus non-public.** Continue the existing merge-or-research workflow. Seven researched candidates remain pending/noindex; human approval is still required before replacement or publication.
3. **External review — verify consent and live ad behavior.** The repository does not prove regional consent behavior, AdSense privacy-message configuration, deployed environment flags or account review state. Check those surfaces only through authorized live/account access; do not infer them from local code.
4. **Completed low-priority review — retained the sponsored banner `<img>` intentionally.** The live read-only endpoint check returned a redirect followed by `image/svg+xml`; routing that dynamic SVG through Next Image would not provide a justified optimization path. The component now documents the reason and suppresses only this specific lint rule while retaining explicit intrinsic dimensions and responsive containment.

## Claude review reconciliation

- Accepted: the banner warning is real, the monetization route is intentionally narrow, and the repository/account boundary must remain explicit.
- Rejected as stale: Claude reported a duplicate `NEXT_PUBLIC_GA_ID`, but the current `.env.example` contains it once.
- Deferred: FAQ structured data may describe visible FAQ content, but adding it is not treated as a ranking or rich-result guarantee and is lower priority than the reproduced canonical defect and content-quality work.

## Verification already collected

- Local Next.js 16.3.4 production build passed.
- Fourteen expected sample paths returned 200; one deliberately missing nutrition detail returned 404 and noindex.
- Sampled indexable pages emitted correct `https://yungyanggogo.kr/...` canonicals.
- `robots.txt`, sitemap index, core sitemap, feed, `ads.txt` and `llms.txt` returned 200 with expected content types.
- The local runtime emitted no AdSense loader because the feature flag is disabled by default.
- The new canonical-boundary regression passed 2 assertions; all 27 regression scripts pass 475 assertions.
- Local production HTTP output now proves homepage `200 + self-canonical` and missing nutrition detail `404 + noindex + no canonical`.

## Not performed

No publication, deployment, Git push, database write, GSC/AdSense submission, account mutation, production environment change or ad click was performed.
