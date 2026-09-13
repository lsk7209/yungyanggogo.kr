import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const report = JSON.parse(readFileSync(path.join(root, "docs", "quality", "editorial-five-candidate-checkpoint-2026-09-12.json"), "utf8"));
const rollingReport = JSON.parse(readFileSync(path.join(root, "docs", "quality", "editorial-rolling-five-checkpoint-2026-09-13-pickle.json"), "utf8"));
const bakeryRollingReport = JSON.parse(readFileSync(path.join(root, "docs", "quality", "editorial-rolling-five-checkpoint-2026-09-13-bakery.json"), "utf8"));
const assertions = [];

function check(condition, message) {
  assert.ok(condition, message);
  assertions.push(message);
}

check(report.decision === "CONTINUE", "five-candidate checkpoint permits bounded continuation");
check(report.candidateCount === 5 && report.candidates.length === 5, "checkpoint covers exactly the first five candidates");
check(new Set(report.candidates.map((row) => row.structureType)).size >= 3, "five-candidate batch uses at least three structure types");
check(new Set(report.candidates.map((row) => row.openingFrame)).size === 5, "opening frames are distinct across the first five candidates");
check(new Set(report.candidates.map((row) => row.sectionLogic)).size === 5, "section logic is distinct across the first five candidates");
check(new Set(report.candidates.map((row) => row.endingAction)).size === 5, "ending actions are distinct across the first five candidates");
check(new Set(report.candidates.map((row) => row.sourceInterpretation)).size === 5, "source interpretations are distinct across the first five candidates");
check(report.blockingSignals.length === 0, "checkpoint records no unresolved blocking template signal");
check(report.humanReviewPendingCount === 5 && report.noindexCount === 5, "all five candidates remain pending and noindex");

for (const candidate of report.candidates) {
  const candidateRoot = path.join(root, "content", "editorial-candidates", candidate.id);
  const draft = readFileSync(path.join(candidateRoot, "draft.mdx"), "utf8");
  const qa = JSON.parse(readFileSync(path.join(candidateRoot, "qa.json"), "utf8"));
  check(draft.includes('humanReview: "pending"') && draft.includes("noindex: true"), `${candidate.id} remains non-public`);
  check(qa.body_characters >= 3500 && qa.score >= 90, `${candidate.id} retains minimum body and QA score`);
}

check(rollingReport.decision === "CONTINUE", "pickle rolling-five checkpoint permits bounded continuation");
check(rollingReport.candidateCount === 5 && rollingReport.candidates.length === 5, "pickle rolling checkpoint covers exactly five recent candidates");
check(rollingReport.candidateIds.includes("phase6t-pickle-basis"), "pickle candidate is included in the current rolling window");
check(new Set(rollingReport.candidates.map((row) => row.structureType)).size === 5, "rolling window retains five distinct structure types");
check(new Set(rollingReport.candidates.map((row) => row.openingFrame)).size === 5, "rolling window retains five distinct opening frames");
check(new Set(rollingReport.candidates.map((row) => row.sectionLogic)).size === 5, "rolling window retains five distinct section logics");
check(new Set(rollingReport.candidates.map((row) => row.endingAction)).size === 5, "rolling window retains five distinct ending actions");
check(new Set(rollingReport.candidates.map((row) => row.sourceInterpretation)).size === 5, "rolling window retains five distinct source interpretations");
check(rollingReport.blockingSignals.length === 0, "rolling checkpoint records no unresolved blocking template signal");

for (const candidate of rollingReport.candidates) {
  const candidateRoot = path.join(root, "content", "editorial-candidates", candidate.id);
  const draft = readFileSync(path.join(candidateRoot, "draft.mdx"), "utf8");
  check(draft.includes('humanReview: "pending"') && draft.includes("noindex: true"), `${candidate.id} remains non-public in rolling window`);
}
const rollingActualStates = rollingReport.candidates.map((candidate) => {
  const draft = readFileSync(path.join(root, "content", "editorial-candidates", candidate.id, "draft.mdx"), "utf8");
  return {
    pending: draft.includes('humanReview: "pending"'),
    noindex: draft.includes("noindex: true"),
  };
});
check(rollingReport.humanReviewPendingCount === rollingActualStates.filter((state) => state.pending).length, "rolling pending count matches actual candidate metadata");
check(rollingReport.noindexCount === rollingActualStates.filter((state) => state.noindex).length, "rolling noindex count matches actual candidate metadata");

check(bakeryRollingReport.decision === "CONTINUE", "bakery rolling-five checkpoint permits bounded continuation");
check(bakeryRollingReport.candidateCount === 5 && bakeryRollingReport.candidates.length === 5, "bakery rolling checkpoint covers exactly five recent candidates");
check(bakeryRollingReport.candidateIds.includes("bakery-snack-serving-basis"), "bakery candidate is included in the current rolling window");
check(!bakeryRollingReport.candidateIds.includes("phase6t-dried-fruit-basis"), "bakery rolling window advances beyond the oldest candidate");
check(new Set(bakeryRollingReport.candidates.map((row) => row.structureType)).size === 5, "bakery rolling window retains five distinct structure types");
check(new Set(bakeryRollingReport.candidates.map((row) => row.openingFrame)).size === 5, "bakery rolling window retains five distinct opening frames");
check(new Set(bakeryRollingReport.candidates.map((row) => row.sectionLogic)).size === 5, "bakery rolling window retains five distinct section logics");
check(new Set(bakeryRollingReport.candidates.map((row) => row.endingAction)).size === 5, "bakery rolling window retains five distinct ending actions");
check(new Set(bakeryRollingReport.candidates.map((row) => row.sourceInterpretation)).size === 5, "bakery rolling window retains five distinct source interpretations");
check(bakeryRollingReport.blockingSignals.length === 0, "bakery checkpoint records no unresolved blocking template signal");

const bakeryRollingActualStates = bakeryRollingReport.candidates.map((candidate) => {
  const draft = readFileSync(path.join(root, "content", "editorial-candidates", candidate.id, "draft.mdx"), "utf8");
  return {
    pending: draft.includes('humanReview: "pending"'),
    noindex: draft.includes("noindex: true"),
  };
});
check(bakeryRollingReport.humanReviewPendingCount === bakeryRollingActualStates.filter((state) => state.pending).length, "bakery rolling pending count matches actual candidate metadata");
check(bakeryRollingReport.noindexCount === bakeryRollingActualStates.filter((state) => state.noindex).length, "bakery rolling noindex count matches actual candidate metadata");

console.log(`editorial five-candidate checkpoint: ${assertions.length} assertions passed`);
