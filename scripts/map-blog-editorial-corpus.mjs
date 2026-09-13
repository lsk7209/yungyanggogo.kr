import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const root = process.cwd();
const blogDir = path.join(root, "content", "blog");
const candidateDir = path.join(root, "content", "editorial-candidates");
const decisionsPath = path.join(candidateDir, "decisions.json");
const outputJson = path.join(root, "docs", "quality", "editorial-corpus-map-2026-09-12.json");
const outputMarkdown = path.join(root, "docs", "quality", "editorial-corpus-map-2026-09-12.md");
const variants = ["basis", "mistake", "compare", "routine", "faq"];
const generatedFilePattern = /^scheduled-\d{4}-\d{2}-\d{2}(?:-phase\d+[a-z]*)?\.json$/i;
const knownLanguageDefects = [
  ["object_particle", /(?:당류|치즈|견과류|표시단위)을(?:\s|$)/],
  ["topic_particle", /(?:치즈|견과류)은(?:\s|$)/],
  ["person_particle", /사람라면/],
  ["direction_particle", /열량로/],
  ["nominalized_object", /기준 읽기을/],
];

function readPosts() {
  return readdirSync(blogDir)
    .filter((file) => generatedFilePattern.test(file))
    .sort()
    .flatMap((file) => {
      const parsed = JSON.parse(readFileSync(path.join(blogDir, file), "utf8"));
      const posts = Array.isArray(parsed) ? parsed : [parsed];
      return posts.map((post) => ({ ...post, sourceFile: file }));
    });
}

function readExplicitDecisions() {
  if (!existsSync(decisionsPath)) return new Map();
  const parsed = JSON.parse(readFileSync(decisionsPath, "utf8"));
  return new Map((parsed.decisions || []).map((decision) => [decision.slug, decision]));
}

function parseSlug(slug) {
  const variant = variants.find((item) => slug.endsWith(`-${item}`));
  if (!variant) return { clusterKey: slug, variant: "unknown" };
  return { clusterKey: slug.slice(0, -(variant.length + 1)), variant };
}

function stableSet(values) {
  return [...new Set(values)].sort();
}

function sourceSignature(post) {
  return JSON.stringify(stableSet((post.sourceLinks || []).map((source) => source.href)));
}

function keywordSignature(post) {
  return JSON.stringify(stableSet(post.expandedKeywords || []));
}

function openingSignature(post) {
  const opening = post.sections?.[0]?.body?.[0] || "";
  return normalizeText(opening.replaceAll(post.mainKeyword || "", "{main_keyword}"));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, "");
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sectionText(post) {
  return (post.sections || []).flatMap((section) => section.body || []).join("\n");
}

function headingSignature(post, normalized = false) {
  const value = (post.sections || []).map((section) => section.title).join(" | ");
  return normalized ? hash(normalizeText(value)) : hash(value);
}

function contractShapeSignature(post) {
  const shape = Object.entries(post)
    .filter(([key]) => key !== "sourceFile")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => {
      if (!Array.isArray(value)) return [key, value === null ? "null" : typeof value];
      const item = value[0];
      const itemShape = item && typeof item === "object" ? Object.keys(item).sort() : typeof item;
      return [key, "array", itemShape];
    });
  return hash(JSON.stringify(shape));
}

function semanticContentSignature(post) {
  const value = [
    post.mainKeyword,
    ...(post.expandedKeywords || []),
    ...(post.sections || []).flatMap((section) => [section.title, ...(section.body || [])]),
  ].join("\n");
  return hash(normalizeText(value));
}

function candidateFor(clusterKey) {
  const rootPath = path.join(candidateDir, `${clusterKey}-basis`);
  const contractPath = path.join(rootPath, "contract.json");
  const researchPath = path.join(rootPath, "research.json");
  const draftPath = path.join(rootPath, "draft.mdx");
  const qaPath = path.join(rootPath, "qa.json");
  if (![contractPath, researchPath, draftPath, qaPath].every(existsSync)) return null;
  const contract = JSON.parse(readFileSync(contractPath, "utf8"));
  const research = JSON.parse(readFileSync(researchPath, "utf8"));
  const qa = JSON.parse(readFileSync(qaPath, "utf8"));
  const draft = readFileSync(draftPath, "utf8");
  const sources = research.sources || research.sourceLedger || [];
  if (
    !(qa.status === "approval_candidate_pending_human_review" || qa.status.startsWith("review_needed"))
    || contract.article_id !== `${clusterKey}-basis`
    || !Array.isArray(sources)
    || sources.length < 5
    || draft.trim().length === 0
  ) return null;
  return {
    slug: `${clusterKey}-basis`,
    path: path.relative(root, rootPath).replaceAll("\\", "/"),
    score: qa.score,
    status: qa.status,
    readyForHumanReview: qa.status === "approval_candidate_pending_human_review",
    packetFilesPresent: true,
    researchSourceCount: sources.length,
  };
}

const posts = readPosts();
const explicitDecisions = readExplicitDecisions();
const exactTitleCounts = new Map();
const normalizedTitleCounts = new Map();
const exactHeadingSignatureCounts = new Map();
const normalizedHeadingSignatureCounts = new Map();
const headingTextCounts = new Map();

for (const post of posts) {
  const exactHeading = headingSignature(post);
  const normalizedHeading = headingSignature(post, true);
  const normalizedTitle = normalizeText(post.title);
  exactTitleCounts.set(post.title, (exactTitleCounts.get(post.title) || 0) + 1);
  normalizedTitleCounts.set(normalizedTitle, (normalizedTitleCounts.get(normalizedTitle) || 0) + 1);
  exactHeadingSignatureCounts.set(exactHeading, (exactHeadingSignatureCounts.get(exactHeading) || 0) + 1);
  normalizedHeadingSignatureCounts.set(normalizedHeading, (normalizedHeadingSignatureCounts.get(normalizedHeading) || 0) + 1);
  for (const section of post.sections || []) {
    headingTextCounts.set(section.title, (headingTextCounts.get(section.title) || 0) + 1);
  }
}
const grouped = new Map();

for (const post of posts) {
  const parsed = parseSlug(post.slug);
  const row = { ...post, ...parsed };
  if (!grouped.has(parsed.clusterKey)) grouped.set(parsed.clusterKey, []);
  grouped.get(parsed.clusterKey).push(row);
}

const clusters = [...grouped.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([clusterKey, rows]) => {
    const orderedRows = [...rows].sort((a, b) => variants.indexOf(a.variant) - variants.indexOf(b.variant));
    const candidate = candidateFor(clusterKey);
    const presentVariants = orderedRows.map((row) => row.variant);
    const keywordSignatures = stableSet(orderedRows.map(keywordSignature));
    const sourceSignatures = stableSet(orderedRows.map(sourceSignature));
    const openingSignatures = stableSet(orderedRows.map(openingSignature));

    return {
      clusterKey,
      rowCount: orderedRows.length,
      presentVariants,
      completeFiveVariantSet: variants.every((variant) => presentVariants.includes(variant)),
      identicalExpandedKeywords: keywordSignatures.length === 1,
      identicalSourceSet: sourceSignatures.length === 1,
      identicalNormalizedOpening: openingSignatures.length === 1,
      candidate,
      clusterDecision: candidate?.readyForHumanReview
        ? "candidate_verified_pending_human_review"
        : candidate
          ? "candidate_revision_required"
        : explicitDecisions.get(`${clusterKey}-basis`)?.legacyDecision === "reject_cannibalizing_sibling"
          ? "merged_into_existing_topic_owner"
          : explicitDecisions.get(`${clusterKey}-basis`)?.legacyDecision === "defer_research_needed"
            ? "deferred_pending_research"
          : "contract_review_required",
      rows: orderedRows.map((row) => {
        let editorialDecision;
        let mergeTarget = null;
        const explicitDecision = explicitDecisions.get(row.slug);

        if (explicitDecision?.legacyDecision === "reject_cannibalizing_sibling") {
          editorialDecision = explicitDecision.legacyDecision;
          mergeTarget = explicitDecision.mergeTarget || null;
        } else if (explicitDecisions.get(`${clusterKey}-basis`)?.legacyDecision === "defer_research_needed") {
          editorialDecision = row.variant === "basis" ? "defer_research_needed" : "hold_for_research_needed";
          mergeTarget = row.variant === "basis" ? null : `${clusterKey}-basis`;
        } else if (candidate && row.variant === "basis") {
          editorialDecision = candidate.readyForHumanReview ? "replace_after_human_approval" : "revise_candidate_before_human_review";
        } else if (candidate) {
          editorialDecision = "reject_cannibalizing_sibling";
          mergeTarget = candidate.slug;
        } else if (row.variant === "basis") {
          editorialDecision = "contract_review_required";
        } else {
          editorialDecision = "hold_for_cluster_contract_review";
          mergeTarget = `${clusterKey}-basis`;
        }

        const body = sectionText(row);
        const defectFlags = knownLanguageDefects
          .filter(([, pattern]) => pattern.test(`${row.title}\n${row.subtitle}\n${row.description}\n${body}`))
          .map(([name]) => name);
        const exactHeading = headingSignature(row);
        const normalizedHeading = headingSignature(row, true);

        return {
          sourceFile: row.sourceFile,
          slug: row.slug,
          variant: row.variant,
          title: row.title,
          normalizedTitle: normalizeText(row.title),
          mainKeyword: row.mainKeyword,
          category: row.category,
          expandedKeywords: row.expandedKeywords || [],
          publishedAt: row.publishedAt,
          updatedAt: row.updatedAt,
          structureType: row.structureType,
          sectionCount: (row.sections || []).length,
          bodyCharacterCount: body.length,
          sourceCount: (row.sourceLinks || []).length,
          internalLinkCount: (row.internalLinks || []).length,
          repeatedHeadingCount: (row.sections || []).filter((section) => (headingTextCounts.get(section.title) || 0) > 1).length,
          headingSignatureExact: exactHeading,
          headingSignatureNormalized: normalizedHeading,
          headingSignatureExactGroupSize: exactHeadingSignatureCounts.get(exactHeading),
          headingSignatureNormalizedGroupSize: normalizedHeadingSignatureCounts.get(normalizedHeading),
          contractShapeSignature: contractShapeSignature(row),
          semanticContentSignature: semanticContentSignature(row),
          knownLanguageDefectFlags: defectFlags,
          researchPresent: false,
          qaEvidencePresent: false,
          humanReview: row.humanReview || "pending",
          editorialDecision,
          mergeTarget,
        };
      }),
    };
  });

const queue = clusters.flatMap((cluster) => cluster.rows.map((row) => ({ clusterKey: cluster.clusterKey, ...row })));
const decisionCounts = queue.reduce((counts, row) => {
  counts[row.editorialDecision] = (counts[row.editorialDecision] || 0) + 1;
  return counts;
}, {});
const suffixCounts = queue.reduce((counts, row) => {
  const { variant } = parseSlug(row.slug);
  counts[variant] = (counts[variant] || 0) + 1;
  return counts;
}, {});
const suffixStructureMap = Object.fromEntries(variants.map((variant) => [
  variant,
  stableSet(queue.filter((row) => parseSlug(row.slug).variant === variant).map((row) => row.structureType)),
]));
const normalizedHeadingDuplicateGroups = [...normalizedHeadingSignatureCounts.values()].filter((count) => count > 1);

const report = {
  generatedAt: "2026-09-12",
  policy: "This is a planning queue, not human approval. Only independently researched candidate packets may reach approval_candidate_pending_human_review, and publication remains separate.",
  summary: {
    files: stableSet(posts.map((post) => post.sourceFile)).length,
    posts: posts.length,
    clusters: clusters.length,
    completeFiveVariantClusters: clusters.filter((cluster) => cluster.completeFiveVariantSet).length,
    clustersWithIdenticalExpandedKeywords: clusters.filter((cluster) => cluster.identicalExpandedKeywords).length,
    clustersWithIdenticalSourceSets: clusters.filter((cluster) => cluster.identicalSourceSet).length,
    clustersWithIdenticalNormalizedOpenings: clusters.filter((cluster) => cluster.identicalNormalizedOpening).length,
    recognizedCandidatePackets: clusters.filter((cluster) => cluster.candidate).length,
    uniqueExactTitles: exactTitleCounts.size,
    uniqueNormalizedTitles: normalizedTitleCounts.size,
    exactTitleDuplicateRows: [...exactTitleCounts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count, 0),
    normalizedTitleDuplicateRows: [...normalizedTitleCounts.values()].filter((count) => count > 1).reduce((sum, count) => sum + count, 0),
    uniqueExactHeadingSignatures: exactHeadingSignatureCounts.size,
    uniqueNormalizedHeadingSignatures: normalizedHeadingSignatureCounts.size,
    normalizedHeadingDuplicateGroups: normalizedHeadingDuplicateGroups.length,
    normalizedHeadingDuplicateRows: normalizedHeadingDuplicateGroups.reduce((sum, count) => sum + count, 0),
    uniqueContractShapeSignatures: new Set(queue.map((row) => row.contractShapeSignature)).size,
    rowsWithKnownLanguageDefects: queue.filter((row) => row.knownLanguageDefectFlags.length > 0).length,
    suffixCounts,
    suffixStructureMap,
    decisionCounts,
  },
  priorityRule: "Review one basis row per unreviewed cluster; accept, merge, reject, or re-angle its contract before deciding the four held siblings. Do not draft from held rows.",
  clusters,
  queue,
};

const markdown = `# Editorial Corpus Map — 2026-09-12

This report is a planning queue, not publication approval.

## Corpus shape

- Source files: ${report.summary.files}
- Legacy posts: ${report.summary.posts}
- Topic clusters: ${report.summary.clusters}
- Complete five-variant clusters: ${report.summary.completeFiveVariantClusters}
- Clusters sharing one expanded-keyword set across all variants: ${report.summary.clustersWithIdenticalExpandedKeywords}
- Clusters sharing one source set across all variants: ${report.summary.clustersWithIdenticalSourceSets}
- Clusters with identical normalized openings: ${report.summary.clustersWithIdenticalNormalizedOpenings}
- Recognized complete candidate packets: ${report.summary.recognizedCandidatePackets}
- Unique exact / normalized titles: ${report.summary.uniqueExactTitles} / ${report.summary.uniqueNormalizedTitles}
- Duplicate normalized heading groups / rows: ${report.summary.normalizedHeadingDuplicateGroups} / ${report.summary.normalizedHeadingDuplicateRows}
- Contract-shape signatures: ${report.summary.uniqueContractShapeSignatures}
- Rows matching known Korean language defects: ${report.summary.rowsWithKnownLanguageDefects}

## Queue

| Decision | Rows |
|---|---:|
${Object.entries(decisionCounts).sort(([a], [b]) => a.localeCompare(b)).map(([decision, count]) => `| ${decision} | ${count} |`).join("\n")}

## Safe continuation rule

${report.priorityRule}

The complete 700-row machine-readable queue, candidate paths, merge targets, source files, and cluster signals are in \`editorial-corpus-map-2026-09-12.json\`.
`;

writeFileSync(outputJson, `${JSON.stringify(report, null, 2)}\n`, "utf8");
writeFileSync(outputMarkdown, markdown, "utf8");

console.log(JSON.stringify({ outputJson, outputMarkdown, summary: report.summary }, null, 2));
