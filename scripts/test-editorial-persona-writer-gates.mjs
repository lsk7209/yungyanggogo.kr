import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const candidatesRoot = path.join(root, "content", "editorial-candidates");
const candidateIds = readdirSync(candidatesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
const assertions = [];

function check(condition, message) {
  assert.ok(condition, message);
  assertions.push(message);
}

check(candidateIds.length === 7, "persona-writer audit covers exactly seven candidate packets");

for (const id of candidateIds) {
  const candidateRoot = path.join(candidatesRoot, id);
  const research = JSON.parse(readFileSync(path.join(candidateRoot, "research.json"), "utf8"));
  const qa = JSON.parse(readFileSync(path.join(candidateRoot, "qa.json"), "utf8"));
  const contract = JSON.parse(readFileSync(path.join(candidateRoot, "contract.json"), "utf8"));
  const draft = readFileSync(path.join(candidateRoot, "draft.mdx"), "utf8");
  const body = draft.replace(/^---\s*[\s\S]*?\s*---\s*/, "");
  const koreanCharacters = body.match(/[가-힣]/g)?.length ?? 0;
  const bodyLengthPasses = koreanCharacters >= 3500;
  const headings = new Set([...body.matchAll(/^##\s+(.+)$/gm)].map((match) => match[1]));
  const allowedSourceRoles = new Set(["official", "primary_data", "expert_reference", "competitor", "context_only"]);
  const contextOnlyIds = new Set(research.sources.filter((source) => source.source_role === "context_only").map((source) => source.id));
  const researchPacketPasses = research.sources.every((source) => allowedSourceRoles.has(source.source_role))
    && research.data_points.every((point) => !contextOnlyIds.has(point.source_id))
    && Array.isArray(contract.internal_link_targets)
    && contract.internal_link_targets.length > 0
    && Boolean(contract.separate_reason);

  check(draft.includes('humanReview: "pending"') && draft.includes("noindex: true"), `${id} remains pending and noindex`);
  check(research.research_runs.length >= 3 && research.research_runs.length <= 5, `${id} has three to five research runs`);
  check(research.sources.length >= 5 && research.sources.length <= 8, `${id} has five to eight sources`);
  check(research.sources.every((source) => source.date && source.accessed && source.source_role && source.used_for), `${id} sources retain date, access, role, and use fields`);
  check(researchPacketPasses || qa.status.startsWith("review_needed"), `${id} cannot remain an approval candidate with an invalid research or contract packet`);
  check(research.data_points.every((point) => point.claim_type && point.source_id && point.supports_section), `${id} data points retain type, source, and section traceability`);
  check(research.data_points.every((point) => headings.has(point.supports_section)), `${id} data points map to exact rendered H2 headings`);
  check(Boolean(research.article_research_question && research.reader_outcome && research.source_interpretation), `${id} retains research question, reader outcome, and source interpretation`);
  check(Array.isArray(research.original_contribution?.source_ids) && research.original_contribution.source_ids.length > 0, `${id} original contribution cites source ids`);
  check(research.article_specific_details.length >= 2, `${id} has at least two article-specific details`);
  check(research.ymyl_review === "pass" && research.sources.filter((source) => source.is_official).length >= 2, `${id} passes the recorded YMYL official-source gate`);
  check(Array.isArray(research.unresolved_claims) && research.unresolved_claims.length === 0, `${id} has no unresolved claims`);
  check(qa.body_characters === body.length, `${id} total body character count matches the draft`);
  check(qa.body_korean_characters === koreanCharacters, `${id} Korean character count matches the draft`);
  check((qa.hard_gate_results.body_length === "pass") === bodyLengthPasses, `${id} body-length gate matches the 3500-Korean-character rule`);
  check(bodyLengthPasses || qa.status.startsWith("review_needed"), `${id} cannot remain an approval candidate when the Korean body is short`);
}

console.log(`editorial persona-writer gates: ${assertions.length} assertions passed`);
