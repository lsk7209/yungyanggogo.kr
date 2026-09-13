# Editorial persona-writer audit — 2026-09-13

## Final decision

- Scope: the seven candidate packets under `content/editorial-candidates`.
- Public state: all seven remain `humanReview: pending` and `noindex: true`.
- Completion state: all seven now pass the deterministic persona-writer packet and draft hard gates and are `approval_candidate_pending_human_review`. This is editorial-candidate readiness, not publication approval.
- Research inventory: all seven retain 3–5 research runs, 5–8 sources, source uses, typed section-linked data points, an article research question, reader outcome, original contribution, source interpretation, at least two article-specific details, at least two official sources, `ymyl_review: pass`, and no recorded unresolved claims. Strict packet validation still fails where noted below.
- Body-length correction: the prior QA counted every body character. The installed persona-writer contract requires at least 3,500 Korean characters. The deterministic audit now counts Hangul syllables (`[가-힣]`) separately.

## Candidate results

| Candidate | Total body chars | Korean chars | Decision |
| --- | ---: | ---: | --- |
| `bakery-snack-serving-basis` | 6,386 | 3,522 | `approval_candidate_pending_human_review` |
| `phase6t-bagel-basis` | 6,006 | 3,502 | `approval_candidate_pending_human_review` |
| `phase6t-dried-fruit-basis` | 6,124 | 3,565 | `approval_candidate_pending_human_review` |
| `phase6t-energy-drink-basis` | 5,656 | 3,504 | `approval_candidate_pending_human_review` |
| `phase6t-konjac-jelly-basis` | 6,086 | 3,709 | `approval_candidate_pending_human_review` |
| `phase6t-pickle-basis` | 6,118 | 3,670 | `approval_candidate_pending_human_review` |
| `phase6t-salad-topping-basis` | 6,336 | 3,568 | `approval_candidate_pending_human_review` |

Resolved strict-gate findings: dried-fruit source roles now use the allowed enum; dried-fruit and energy-drink have `internal_link_targets` and `separate_reason`; official source records used by konjac-jelly and salad-topping factual data points are classified as `official`; and every `data_points[].supports_section` now maps to an exact rendered H2.

## Release boundary

The audit does not authorize publication. All seven candidates clear the local machine-checkable draft gates but still require human editorial approval. No candidate was added to the public loader, sitemap, deployment, indexing, or AdSense submission path.
