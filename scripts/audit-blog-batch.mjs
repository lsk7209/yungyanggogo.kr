import { readFileSync } from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "content", "blog", "scheduled-2026-06-07.json");
const posts = JSON.parse(readFileSync(file, "utf8"));
const failures = [];

function fail(message) {
  failures.push(message);
}

function hoursBetween(a, b) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 36e5;
}

if (posts.length !== 100) {
  fail(`expected 100 posts, got ${posts.length}`);
}

const titles = new Set();
const slugs = new Set();
const mainKeywords = new Set();
const weakTitlePatterns = [
  /기준 기준/,
  /실수 실수/,
  /비교 비교/,
  /FAQ FAQ/,
  /기준와/,
  /제공량와/,
  /표시단위와/,
  /동일중량와/,
  /식품군와/,
  /나트륨와/,
  /단백질와/
];

posts.forEach((post, index) => {
  if (titles.has(post.title)) fail(`duplicate title: ${post.title}`);
  if (slugs.has(post.slug)) fail(`duplicate slug: ${post.slug}`);
  if (mainKeywords.has(post.mainKeyword)) fail(`duplicate main keyword: ${post.mainKeyword}`);
  titles.add(post.title);
  slugs.add(post.slug);
  mainKeywords.add(post.mainKeyword);

  if (!post.title.includes(post.mainKeyword)) fail(`title missing main keyword: ${post.slug}`);
  if (!post.subtitle.includes(post.mainKeyword)) fail(`subtitle missing main keyword: ${post.slug}`);
  if (weakTitlePatterns.some((pattern) => pattern.test(post.title))) {
    fail(`weak title pattern: ${post.slug} | ${post.title}`);
  }
  if (!post.expandedKeywords.some((keyword) => post.subtitle.includes(keyword))) {
    fail(`subtitle missing expanded keyword: ${post.slug}`);
  }
  if ((post.qualityScore || 0) < 90) fail(`quality score below 90: ${post.slug}`);
  if (JSON.stringify(post.sections).length < 3500) fail(`short body: ${post.slug}`);
  if ((post.internalLinks || []).length < 3) fail(`internal links below 3: ${post.slug}`);
  if ((post.sourceLinks || []).filter((source) => source.href.startsWith("https://")).length < 1) {
    fail(`missing external official source: ${post.slug}`);
  }
  if (index > 0 && hoursBetween(posts[index - 1].publishedAt, post.publishedAt) !== 5) {
    fail(`schedule gap is not 5h at index ${index}`);
  }
});

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`audit_pass=true posts=${posts.length} unique_titles=${titles.size} unique_main_keywords=${mainKeywords.size}`);
console.log(`schedule_start=${posts[0].publishedAt}`);
console.log(`schedule_end=${posts.at(-1).publishedAt}`);
