import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidatesRoot = path.join(root, "content", "editorial-candidates");
const outputPath = path.join(root, "content", "blog", "approved-editorial-2026-09-13.json");
const approvalPath = path.join(candidatesRoot, "approval-2026-09-13.json");
const candidateIds = [
  "bakery-snack-serving-basis",
  "phase6t-bagel-basis",
  "phase6t-dried-fruit-basis",
  "phase6t-energy-drink-basis",
  "phase6t-konjac-jelly-basis",
  "phase6t-pickle-basis",
  "phase6t-salad-topping-basis",
];
const approval = JSON.parse(readFileSync(approvalPath, "utf8"));

if (approval.approval_scope !== "local_public_snapshot" || approval.deployment_authorized !== false) {
  throw new Error("editorial approval scope is missing or exceeds local publication");
}
if (JSON.stringify([...approval.candidate_ids].sort()) !== JSON.stringify([...candidateIds].sort())) {
  throw new Error("editorial approval does not cover the exact candidate set");
}

function cleanInline(value) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)]\((?:https?:\/\/|\/)[^)]+\)/g, "$1")
    .replace(/[`*_]/g, "")
    .replace(/\{[^{}]*\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function bodyFromDraft(draft) {
  return draft.replace(/^---\s*[\s\S]*?\s*---\s*/, "");
}

function frontmatterValue(draft, key) {
  const frontmatter = draft.match(/^---\s*([\s\S]*?)\s*---/)?.[1] ?? "";
  return frontmatter.match(new RegExp(`^${key}:\\s*["'](.+)["']\\s*$`, "m"))?.[1] ?? "";
}

function sectionsFromBody(body) {
  const chunks = body.split(/^##\s+/gm);
  return chunks.slice(1).map((chunk, index) => {
    const [heading, ...lines] = chunk.split(/\r?\n/);
    const blocks = lines.join("\n").split(/\n\s*\n/);
    const paragraphs = blocks
      .map((block) => block
        .split(/\r?\n/)
        .map((line) => line.replace(/^\s*(?:[-*]|\d+\.)\s+/, "").replace(/^\|?|\|?$/g, ""))
        .join(" "))
      .map(cleanInline)
      .filter((text) => text.length >= 20 && !text.startsWith("---"));

    return {
      id: `${index + 1}-${candidateSlug(heading)}`,
      title: cleanInline(heading),
      body: paragraphs,
    };
  });
}

function candidateSlug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "section";
}

function internalLabel(href) {
  if (href === "/nutrition-data") return "영양성분 데이터 찾기";
  if (href === "/compare") return "영양성분 비교 도구";
  if (href === "/editorial-policy") return "영양고고 편집 정책";
  return "영양성분표 비교 기준";
}

function accentTheme(colors = []) {
  if (colors.includes("green")) return "green";
  if (colors.includes("amber")) return "amber";
  return "slate";
}

function promote(id) {
  const candidateRoot = path.join(candidatesRoot, id);
  const contract = JSON.parse(readFileSync(path.join(candidateRoot, "contract.json"), "utf8"));
  const research = JSON.parse(readFileSync(path.join(candidateRoot, "research.json"), "utf8"));
  const qa = JSON.parse(readFileSync(path.join(candidateRoot, "qa.json"), "utf8"));
  const draft = readFileSync(path.join(candidateRoot, "draft.mdx"), "utf8");
  const body = bodyFromDraft(draft);
  const koreanCharacters = body.match(/[가-힣]/g)?.length ?? 0;
  const failedGates = Object.entries(qa.hard_gate_results).filter(([, result]) => result !== "pass");

  if (qa.status !== "approval_candidate_pending_human_review" || qa.score < 90 || failedGates.length > 0 || koreanCharacters < 3500) {
    throw new Error(`${id} is not eligible for promotion`);
  }

  const bulletItems = [...body.matchAll(/^\s*[-*]\s+(.+)$/gm)]
    .map((match) => cleanInline(match[1]))
    .filter((item) => item.length >= 12)
    .slice(0, 5);

  return {
    slug: id,
    title: contract.title,
    subtitle: contract.subtitle,
    description: frontmatterValue(draft, "description"),
    category: contract.cluster,
    mainKeyword: contract.main_keyword,
    expandedKeywords: contract.extended_keywords,
    publishedAt: "2026-09-13T12:50:00+09:00",
    updatedAt: "2026-09-13",
    readingMinutes: Math.max(8, Math.ceil(koreanCharacters / 450)),
    noindex: false,
    humanReview: "approved",
    accentTheme: accentTheme(contract.accent_colors),
    summaryCards: [
      { label: "독자 작업", value: "기록", description: contract.reader_job },
      { label: "판단 기준", value: "대조", description: contract.decision_criterion },
      { label: "결론 범위", value: "제한", description: contract.not_answered_here },
    ],
    comparisonRows: [
      { basis: "판단 기준", bestFor: contract.decision_criterion, caution: "확인하지 않은 값을 0이나 확정값으로 바꾸지 않습니다." },
      { basis: "근거 사용", bestFor: contract.evidence_plan, caution: "공공 DB와 일반 참고값은 현재 제품 포장을 자동으로 대체하지 않습니다." },
      { basis: "별도 문서", bestFor: contract.non_overlap_claim, caution: contract.not_answered_here },
    ],
    checklist: bulletItems.length >= 3 ? bulletItems : [
      contract.decision_criterion,
      contract.ending_cta_direction,
      `다루지 않는 범위: ${contract.not_answered_here}`,
    ],
    sections: sectionsFromBody(body),
    internalLinks: contract.internal_link_targets.map((href) => ({
      href,
      label: internalLabel(href),
      description: "본문의 계산 기준과 데이터 출처 경계를 이어서 확인합니다.",
    })),
    sourceLinks: research.sources.map((source) => ({
      href: source.url,
      label: source.title,
      description: `${source.publisher} · ${source.used_for}`,
    })),
  };
}

const approvedPosts = candidateIds.map(promote);
mkdirSync(path.dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(approvedPosts, null, 2)}\n`, "utf8");
console.log(`promoted ${approvedPosts.length} editorial candidates to ${path.relative(root, outputPath)}`);
