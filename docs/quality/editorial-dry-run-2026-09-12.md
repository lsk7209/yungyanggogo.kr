# Generated Content Editorial Dry Run — 2026-09-12

## Decision

The five-row dry run stops before rewriting or approval. All 700 generated JSON posts remain `review_needed` and non-public. The existing numeric `qualityScore` values are automated placeholders without per-article research or QA evidence and must not be treated as editorial approval.

## Representative Rows

| Slug | Cluster / angle | Decision | Blocking evidence |
|---|---|---|---|
| `phase6t-energy-drink-basis` | energy drink / basis | approval_candidate_pending_human_review | rebuilt in a separate candidate packet with six official/primary sources, a distinct decision tree, 4,502 body characters, and QA evidence; not public |
| `phase6t-energy-drink-mistake` | energy drink / mistake | failed | rejected as a cannibalizing sibling of the rebuilt basis article; a warning suffix does not create a separate reader decision |
| `phase6t-dried-fruit-basis` | dried fruit / basis | review_needed | `당류을`, `식이섬유은`, `사람라면`; generic database sources do not substantiate article-specific dried-fruit guidance |
| `phase6t-salad-topping-basis` | salad topping / basis | review_needed | `견과류과`, `견과류은`, `치즈은`; no product/category evidence; shared seven-heading skeleton |
| `phase6t-salad-topping-faq` | salad topping / FAQ | failed | rejected as a cannibalizing sibling; FAQ addition does not create a distinct search intent or evidence path |

## Corpus Evidence

- 7 files and 700 generated posts inspected.
- 0 explicit approvals and 0 approval candidates.
- 700 lack per-article research packets, 700 have fewer than five sources, 700 lack QA evidence, and 700 carry unsupported automated numeric scores.
- 680 contain a heading repeated at least ten times across the corpus.
- Four generic headings each repeat 300 times in the Phase 6T corpus.
- 432 contain public-facing editorial/process language; 321 match known Korean language defects; 310 contain untraced numeric visual values.

The machine-readable evidence is `docs/quality/editorial-readiness-2026-09-12.json`.

## Safe Continuation Rule

Do not bulk-correct particles or flip `humanReview` to `approved`. Select one article contract, research it from 5–8 current sources with at least two official/primary sources for YMYL claims, rewrite it independently, produce `research.json` and `qa.json`, and only then consider an explicit per-row approval. Sibling titles with the same reader decision should be merged or rejected before drafting.

## Side Effects Not Performed

No generated post was approved, published, scheduled through an external system, submitted to GSC or AdSense, or deployed. No production account or database mutation occurred.
