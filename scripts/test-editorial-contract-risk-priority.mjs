import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const generation = spawnSync(process.execPath, [path.join(root, "scripts", "rank-editorial-contract-risk.mjs")], { cwd: root, encoding: "utf8" });
assert.equal(generation.status, 0, generation.stderr || generation.stdout);
const report = JSON.parse(readFileSync(path.join(root, "docs", "quality", "editorial-contract-risk-priority-2026-09-13.json"), "utf8"));
const corpus = JSON.parse(readFileSync(path.join(root, "docs", "quality", "editorial-corpus-map-2026-09-12.json"), "utf8"));
const assertions = [];

function check(condition, message) {
  assert.ok(condition, message);
  assertions.push(message);
}

const anchors = corpus.queue.filter((row) => row.editorialDecision === "contract_review_required");
check(report.summary.rankedAnchors === 0 && report.ranked.length === 0, "priority report confirms no unresolved contract-review anchor remains");
check(new Set(report.ranked.map((row) => row.slug)).size === 0, "priority report contains no duplicate or stale anchor slug");
check(report.ranked.every((row, index) => index === 0 || report.ranked[index - 1].score >= row.score), "priority report is sorted by descending deterministic score");
check(report.ranked.every((row) => anchors.some((anchor) => anchor.slug === row.slug)), "priority report contains only current contract-review anchors");
check(report.ranked.every((row) => typeof row.signals.ymylReviewSignal === "boolean"), "YMYL signal is explicitly a review flag rather than a diagnosis");
check(report.policy.includes("not a traffic, ranking, medical-risk, or AdSense-approval prediction"), "report does not overstate repository signals");
check(report.nextAnchor === null, "next anchor is null after all legacy owners are explicitly decided");
check(report.ranked.every((row) => row.score === row.signals.languageDefects * report.scoring.languageDefectEach
  + row.signals.repeatedHeadings * report.scoring.repeatedHeadingEach
  + (row.signals.duplicateHeadingGroup ? report.scoring.duplicateHeadingGroup : 0)
  + (row.signals.thinLegacyBody ? report.scoring.bodyUnder3500Characters : 0)
  + (row.signals.fewerThanFiveSources ? report.scoring.fewerThanFiveSources : 0)
  + (row.signals.ymylReviewSignal ? report.scoring.ymylKeywordReviewSignal : 0)), "every priority score is reproducible from its recorded repository signals and weights");
check(Object.values(report.scoring).every((weight) => Number.isInteger(weight) && weight > 0), "all scoring weights are explicit positive integers");

console.log(`editorial contract risk priority: ${assertions.length} assertions passed`);
