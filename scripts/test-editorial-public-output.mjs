import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const posts = JSON.parse(readFileSync("content/blog/approved-editorial-2026-09-13.json", "utf8"));
assert.equal(posts.length, 7);
for (const post of posts) {
  const contract = JSON.parse(readFileSync(`content/editorial-candidates/${post.slug}/contract.json`, "utf8"));
  const draft = readFileSync(`content/editorial-candidates/${post.slug}/draft.mdx`, "utf8").replace(/^---\s*[\s\S]*?\s*---\s*/, "");
  const output = JSON.stringify(post);
  assert.ok(!output.includes(contract.non_overlap_claim), `${post.slug}: internal merge directions must not be published`);
  assert.ok(!output.includes(contract.evidence_plan), `${post.slug}: internal evidence planning must not be published`);
  assert.equal(post.sections[0].id, "introduction", `${post.slug}: retain the original introduction`);
  const blocks = post.sections.flatMap((section) => section.blocks ?? []);
  const tables = blocks.filter((block) => block.type === "table");
  const tableCount = (draft.match(/^\|\s*:?-{3,}/gm) ?? []).length;
  assert.equal(tables.length, tableCount, `${post.slug}: preserve every source table`);
  for (const table of tables) {
    assert.ok(table.headers.length > 1);
    assert.ok(table.rows.length > 0);
    assert.ok(table.rows.every((row) => row.length === table.headers.length));
  }
  assert.equal(blocks.filter((block) => block.type === "heading").length, (draft.match(/^#{3,6}\s/gm) ?? []).length, `${post.slug}: retain FAQ/subheadings`);
  assert.ok(!/---\s*\||###\s/.test(output), `${post.slug}: no raw table or heading syntax`);
  assert.ok(post.sourceLinks.length >= 5, `${post.slug}: sources preserved`);
  for (const match of draft.matchAll(/\[[^\]]+]\(((?:https?:\/\/|\/)[^)]+)\)/g)) {
    assert.ok(JSON.stringify(blocks).includes(match[1]), `${post.slug}: draft destination preserved: ${match[1]}`);
  }
  assert.equal(blocks.filter((block) => block.type === "code").length, (draft.match(/^```/gm) ?? []).length / 2, `${post.slug}: preserve record line boundaries`);
}
console.log("editorial public output: seven posts preserve structure without internal contracts");
