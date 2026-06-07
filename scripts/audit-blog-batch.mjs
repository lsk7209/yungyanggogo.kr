import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const blogDir = path.join(process.cwd(), "content", "blog");
const failures = [];
const files = readdirSync(blogDir).filter((file) => file.endsWith(".json")).sort();
const posts = files.flatMap((file) => {
  const parsed = JSON.parse(readFileSync(path.join(blogDir, file), "utf8"));
  return (Array.isArray(parsed) ? parsed : [parsed]).map((post) => ({ ...post, __file: file }));
});

function fail(message) {
  failures.push(message);
}

function hoursBetween(a, b) {
  return (new Date(b).getTime() - new Date(a).getTime()) / 36e5;
}

function signature(title) {
  return title
    .replace(/영양성분표|식품영양성분|기준|읽기|실수|방지|비교|판단|확인|순서|질문답변|먼저|보기|구분|까지|부터/g, "")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "")
    .trim();
}

if (files.length < 2) {
  fail(`expected at least 2 scheduled content files, got ${files.length}`);
}

if (posts.length !== 200) {
  fail(`expected 200 generated posts, got ${posts.length}`);
}

const byPublished = [...posts].sort((a, b) => a.publishedAt.localeCompare(b.publishedAt));
const titles = new Set();
const slugs = new Set();
const mainKeywords = new Set();
const titleSignatures = new Set();
const weakTitlePatterns = [
  /기준 기준/,
  /실수 실수/,
  /비교 비교/,
  /FAQ FAQ/
];
const badJosaPatterns = [
  /기준와/,
  /제공량와/,
  /동일중량와/,
  /식품군와/,
  /나트륨와/,
  /단백질와/
];
const themes = new Set(["green", "amber", "slate", "terra", "gray"]);

posts.forEach((post) => {
  if (titles.has(post.title)) fail(`duplicate title: ${post.title}`);
  if (slugs.has(post.slug)) fail(`duplicate slug: ${post.slug}`);
  if (mainKeywords.has(post.mainKeyword)) fail(`duplicate main keyword: ${post.mainKeyword}`);
  titles.add(post.title);
  slugs.add(post.slug);
  mainKeywords.add(post.mainKeyword);

  const titleSignature = signature(post.title);
  if (titleSignatures.has(titleSignature)) fail(`duplicate title signature: ${post.slug} | ${post.title}`);
  titleSignatures.add(titleSignature);

  if (!post.title.includes(post.mainKeyword)) fail(`title missing main keyword: ${post.slug}`);
  if (!post.subtitle.includes(post.mainKeyword)) fail(`subtitle missing main keyword: ${post.slug}`);
  if (weakTitlePatterns.some((pattern) => pattern.test(post.title))) {
    fail(`weak title/subtitle pattern: ${post.slug} | ${post.title}`);
  }
  if (badJosaPatterns.some((pattern) => pattern.test(post.title) || pattern.test(post.subtitle))) {
    fail(`bad josa pattern: ${post.slug} | ${post.title}`);
  }
  if (!post.expandedKeywords?.some((keyword) => post.subtitle.includes(keyword))) {
    fail(`subtitle missing expanded keyword: ${post.slug}`);
  }
  if ((post.qualityScore || 0) < 90) fail(`quality score below 90: ${post.slug}`);
  if (JSON.stringify(post.sections || []).length < 3500) fail(`short body: ${post.slug}`);
  if ((post.internalLinks || []).length < 3) fail(`internal links below 3: ${post.slug}`);
  if ((post.sourceLinks || []).filter((source) => source.href?.startsWith("https://")).length < 1) {
    fail(`missing external official source: ${post.slug}`);
  }
  if (!themes.has(post.accentTheme)) fail(`missing or invalid accent theme: ${post.slug}`);
  if ((post.visualElements || []).length < 3) fail(`not enough visual elements: ${post.slug}`);
  if (!post.doDont && !post.metricBars && !post.sourceNote && !post.dataPoints && !post.warningBox && !post.steps) {
    fail(`missing readability block beyond base sections: ${post.slug}`);
  }
});

byPublished.forEach((post, index) => {
  if (index > 0 && hoursBetween(byPublished[index - 1].publishedAt, post.publishedAt) !== 5) {
    fail(`schedule gap is not 5h at index ${index}: ${byPublished[index - 1].slug} -> ${post.slug}`);
  }
});

if (byPublished[0]?.publishedAt !== "2026-06-07T00:00:00+09:00") {
  fail(`unexpected schedule start: ${byPublished[0]?.publishedAt}`);
}

if (byPublished.at(-1)?.publishedAt !== "2026-07-18T11:00:00+09:00") {
  fail(`unexpected schedule end: ${byPublished.at(-1)?.publishedAt}`);
}

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(
  `audit_pass=true files=${files.length} posts=${posts.length} unique_titles=${titles.size} unique_main_keywords=${mainKeywords.size}`
);
console.log(`schedule_start=${byPublished[0].publishedAt}`);
console.log(`schedule_end=${byPublished.at(-1).publishedAt}`);
