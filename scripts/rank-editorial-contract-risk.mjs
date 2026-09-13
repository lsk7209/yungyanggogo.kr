import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const corpusPath = path.join(root, "docs", "quality", "editorial-corpus-map-2026-09-12.json");
const outputJson = path.join(root, "docs", "quality", "editorial-contract-risk-priority-2026-09-13.json");
const outputMarkdown = path.join(root, "docs", "quality", "editorial-contract-risk-priority-2026-09-13.md");
const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));

const ymylReviewTerms = [
  "카페인", "에너지드링크", "프로틴", "단백질", "대체당", "감미료", "나트륨",
  "당류", "포화지방", "콜레스테롤", "건강", "임산부", "어린이", "다이어트",
];

function riskSignals(row) {
  const text = `${row.title} ${(row.expandedKeywords || []).join(" ")}`;
  const signals = {
    languageDefects: row.knownLanguageDefectFlags.length,
    repeatedHeadings: row.repeatedHeadingCount,
    duplicateHeadingGroup: row.headingSignatureNormalizedGroupSize > 1,
    thinLegacyBody: row.bodyCharacterCount < 3500,
    fewerThanFiveSources: row.sourceCount < 5,
    ymylReviewSignal: ymylReviewTerms.some((term) => text.includes(term)),
  };
  const score = signals.languageDefects * 20
    + signals.repeatedHeadings * 3
    + (signals.duplicateHeadingGroup ? 10 : 0)
    + (signals.thinLegacyBody ? 5 : 0)
    + (signals.fewerThanFiveSources ? 5 : 0)
    + (signals.ymylReviewSignal ? 8 : 0);
  return { signals, score };
}

const ranked = corpus.queue
  .filter((row) => row.editorialDecision === "contract_review_required")
  .map((row) => ({
    slug: row.slug,
    title: row.title,
    category: row.category,
    bodyCharacterCount: row.bodyCharacterCount,
    sourceCount: row.sourceCount,
    ...riskSignals(row),
  }))
  .sort((a, b) => b.score - a.score || b.signals.ymylReviewSignal - a.signals.ymylReviewSignal || a.bodyCharacterCount - b.bodyCharacterCount || a.slug.localeCompare(b.slug));

const report = {
  generatedAt: "2026-09-13",
  policy: "Priority is based only on repository evidence. It is not a traffic, ranking, medical-risk, or AdSense-approval prediction.",
  scoring: {
    languageDefectEach: 20,
    repeatedHeadingEach: 3,
    duplicateHeadingGroup: 10,
    bodyUnder3500Characters: 5,
    fewerThanFiveSources: 5,
    ymylKeywordReviewSignal: 8,
  },
  summary: {
    rankedAnchors: ranked.length,
    anchorsWithLanguageDefects: ranked.filter((row) => row.signals.languageDefects > 0).length,
    anchorsWithRepeatedHeadings: ranked.filter((row) => row.signals.repeatedHeadings > 0).length,
    anchorsWithYMYLReviewSignal: ranked.filter((row) => row.signals.ymylReviewSignal).length,
  },
  nextAnchor: ranked[0]?.slug || null,
  ranked,
};

const topRows = ranked.slice(0, 20).map((row) =>
  `| ${row.slug} | ${row.score} | ${row.signals.languageDefects} | ${row.signals.repeatedHeadings} | ${row.signals.ymylReviewSignal ? "review" : "-"} | ${row.bodyCharacterCount} |`,
).join("\n");

const markdown = `# Editorial contract risk priority — 2026-09-13

This is a repository-evidence review queue, not a traffic, ranking, medical-risk, or AdSense-approval prediction.

## Summary

- Ranked contract-review anchors: ${report.summary.rankedAnchors}
- Anchors with known language defects: ${report.summary.anchorsWithLanguageDefects}
- Anchors with repeated headings: ${report.summary.anchorsWithRepeatedHeadings}
- Anchors requiring a YMYL keyword review: ${report.summary.anchorsWithYMYLReviewSignal}
- Next anchor by deterministic score: \`${report.nextAnchor}\`

## Top 20

| Slug | Score | Language defects | Repeated headings | YMYL review | Body chars |
|---|---:|---:|---:|---|---:|
${topRows}

The full ranked queue and scoring weights are in \`editorial-contract-risk-priority-2026-09-13.json\`.
`;

writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(outputMarkdown, markdown, "utf8");
console.log(JSON.stringify({ outputJson, outputMarkdown, summary: report.summary, nextAnchor: report.nextAnchor }, null, 2));
