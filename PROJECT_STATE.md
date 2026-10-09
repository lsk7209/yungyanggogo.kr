# Yungyanggogo project state — 2026-10-09

Turso investigation found the dynamic nutrition-data API bypassing the existing success-only1h cache. Stored single/multi-dataset reads now use that wrapper; explicit upstream stays uncached. Input/query/page/row bounds, dataset selection/fanout, valid empty success and failure status/JSON contracts remain unchanged. No production DB/auth/env/cron/deployment changes; actual Turso DB slug binding remains unverified.

Changed app/api/nutrition-data/route.ts, scripts/test-nutrition-api-cache.mjs, scripts/run-regression-tests.mjs. Focused5 regression tests/typecheck/lint/build PASS. Actual GET was executed with isolated dependencies, not real Next cache or production DB. Build had no configured DB and empty credential process overrides; preferredRegion deprecation warning remains. Build-generated next-env.d.ts edits reverted to the original baseline only. Independent review: no BLOCKER/HIGH.

Main incident evidence D:/web/multi-dashboard/reports/turso-usage-20261009/REPORT.ko.md; active root harness turso-usage-20261009. Next: deployment approval, verify runtime DB identity, repeated same-key cache hits/SQL counts, successful upstream and failed-result recovery. No bill reduction claim until real equal-period usage observed.
