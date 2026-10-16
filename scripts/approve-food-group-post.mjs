// Records a person's sign-off for scheduled food-group posts, then regenerates
// the posts file. Run only after reading the post in the review packet
// (npm run blog:review) and checking its numbers against the live group page.
//
//   npm run blog:approve -- <slug> [<slug> ...] --reviewer "이름" --basis human-read|automated-check
//   npm run blog:approve -- --revoke <slug>
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { hashPostContent } from "./lib/post-content-hash.mjs";

const approvalsFile = "content/editorial-data/food-group-approvals.json";
const postsFile = "content/blog/drafts-2026-10-food-groups-30.json";
const args = process.argv.slice(2);
const revoke = args.includes("--revoke");
const reviewerIndex = args.indexOf("--reviewer");
const reviewer = reviewerIndex >= 0 ? String(args[reviewerIndex + 1] || "").trim() : "";
const basisIndex = args.indexOf("--basis");
const basis = basisIndex >= 0 ? String(args[basisIndex + 1] || "").trim() : "";
const slugs = args.filter((arg, i) => !arg.startsWith("--") && (reviewerIndex < 0 || i !== reviewerIndex + 1) && (basisIndex < 0 || i !== basisIndex + 1));

if (!slugs.length) {
  console.error("usage: npm run blog:approve -- <slug> [...] --reviewer <name> | --revoke <slug>");
  process.exit(1);
}
if (!revoke && !reviewer) {
  console.error("--reviewer <name> is required: approval must name the person who reviewed the post");
  process.exit(1);
}

if (!revoke && basis !== "human-read" && basis !== "automated-check") {
  console.error("--basis human-read|automated-check is required: record whether a person read the post or only automated checks ran");
  process.exit(1);
}
const posts = JSON.parse(readFileSync(postsFile, "utf8"));
const known = new Set(posts.map((post) => post.slug));
const unknown = slugs.filter((slug) => !known.has(slug));
if (unknown.length) {
  console.error(`unknown slug(s): ${unknown.join(", ")}`);
  process.exit(1);
}

const data = JSON.parse(readFileSync(approvalsFile, "utf8"));
const reviewedAt = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
const kept = data.approvals.filter((a) => !slugs.includes(a.slug));
data.approvals = revoke ? kept : [...kept, ...slugs.map((slug) => ({ slug, reviewer, reviewedAt, basis, contentSha256: hashPostContent(posts.find((post) => post.slug === slug)) }))];
data.approvals.sort((a, b) => a.slug.localeCompare(b.slug));
writeFileSync(approvalsFile, `${JSON.stringify(data, null, 2)}\n`);
execFileSync(process.execPath, ["scripts/build-food-group-drafts.mjs"], { stdio: "inherit" });
console.log(`${revoke ? "revoked" : `approved by ${reviewer}`}: ${slugs.join(", ")}. Commit both files and open a PR.`);
