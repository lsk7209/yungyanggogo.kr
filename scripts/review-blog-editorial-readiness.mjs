import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const blogDir = path.join(process.cwd(), "content", "blog");
const outputPath = path.resolve(
  process.cwd(),
  process.argv[2] || "docs/quality/editorial-readiness-2026-09-12.json",
);

const files = readdirSync(blogDir).filter((file) => file.endsWith(".json")).sort();
const posts = files.flatMap((file) => {
  const parsed = JSON.parse(readFileSync(path.join(blogDir, file), "utf8"));
  return (Array.isArray(parsed) ? parsed : [parsed]).map((post) => ({ ...post, sourceFile: file }));
});

const publicProcessPatterns = [
  /사이트에 글을 쌓을 때/,
  /pSEO 사이트/,
  /검색 사용자가 실제 문제를 해결/,
  /이 글은 .*정리합니다/,
];
const knownLanguageDefects = [
  /직장인라면/,
  /기준 읽기을/,
  /질문 모음을/,
  /구매 순서을/,
  /비교 판단을 제품 추천/,
];

const headingCounts = new Map();
for (const post of posts) {
  for (const section of post.sections || []) {
    headingCounts.set(section.title, (headingCounts.get(section.title) || 0) + 1);
  }
}

function bodyText(post) {
  return (post.sections || []).flatMap((section) => section.body || []).join("\n");
}

function review(post) {
  const body = bodyText(post);
  const sourceCount = (post.sourceLinks || []).filter((source) => source.href?.startsWith("https://")).length;
  const repeatedHeadings = (post.sections || [])
    .map((section) => ({ title: section.title, corpusCount: headingCounts.get(section.title) || 0 }))
    .filter((entry) => entry.corpusCount >= 10);
  const issues = [];

  if (post.humanReview !== "approved") issues.push("human_review_not_approved");
  if (!post.research || typeof post.research !== "object") issues.push("missing_per_article_research_packet");
  if (sourceCount < 5) issues.push("fewer_than_5_sources");
  if (!post.qaEvidence || typeof post.qaEvidence !== "object") issues.push("missing_qa_evidence");
  if (typeof post.qualityScore === "number" && !post.qaEvidence) issues.push("unsupported_numeric_quality_score");
  if ((post.metricBars || []).some((metric) => typeof metric.value === "number") && !post.research) {
    issues.push("untraced_numeric_visual");
  }
  if (publicProcessPatterns.some((pattern) => pattern.test(body))) issues.push("public_editorial_process_language");
  if (knownLanguageDefects.some((pattern) => pattern.test(`${post.title}\n${post.subtitle}\n${body}`))) {
    issues.push("known_korean_language_defect");
  }
  if (repeatedHeadings.length > 0) issues.push("high_frequency_heading_template");

  return {
    slug: post.slug,
    title: post.title,
    sourceFile: post.sourceFile,
    decision: issues.length === 0 ? "approval_candidate" : "review_needed",
    sourceCount,
    bodyCharacters: body.length,
    repeatedHeadings: repeatedHeadings.slice(0, 5),
    issues,
  };
}

const reviews = posts.map(review);
const issueCounts = {};
for (const item of reviews) {
  for (const issue of item.issues) issueCounts[issue] = (issueCounts[issue] || 0) + 1;
}

const report = {
  generatedAt: new Date().toISOString(),
  scope: "local generated JSON posts only; no publication or external account action",
  policy: "persona-writer hard gates; automated scores are not human approval evidence",
  totals: {
    files: files.length,
    posts: posts.length,
    explicitApproved: posts.filter((post) => post.humanReview === "approved").length,
    approvalCandidates: reviews.filter((item) => item.decision === "approval_candidate").length,
    reviewNeeded: reviews.filter((item) => item.decision === "review_needed").length,
  },
  issueCounts,
  mostRepeatedHeadings: [...headingCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([title, count]) => ({ title, count })),
  reviews,
};

mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ outputPath, ...report.totals, issueCounts }, null, 2));

if (report.totals.approvalCandidates > 0) {
  console.error("Unexpected approval candidates require direct editorial inspection before approval.");
  process.exitCode = 2;
}
