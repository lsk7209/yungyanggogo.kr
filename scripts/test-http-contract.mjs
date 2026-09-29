// HTTP contract test against a real `next start` of the current build.
// Uses only a local file: SQLite database under output/playwright/ and no
// provider keys, so nothing reaches production systems. Requires `npm run build`.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createClient } from "@libsql/client";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(path.join(root, ".next", "BUILD_ID"))) {
  console.error("http contract: NOT RUN — no production build (.next/BUILD_ID). Run `npm run build` first.");
  process.exit(1);
}

const workDir = path.join(root, "output", "playwright", "http-contract");
rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });
const dbPath = path.join(workDir, "fixture.db");
const dbUrl = pathToFileURL(dbPath).href.replace("file:///", "file:/");
// R49: never seed anything except a local file: DB under output/playwright/.
function assertLocalFixture(url) {
  if (!url.startsWith("file:") || !url.replaceAll("\\", "/").includes("/output/playwright/")) {
    throw new Error(`Refusing non-local fixture database: ${url}`);
  }
}
assert.throws(() => assertLocalFixture("libsql://prod.example.turso.io"), /Refusing/);
assertLocalFixture(dbUrl);

// Create tables with the application's own DDL (single source of truth).
const dbSource = readFileSync(path.join(root, "lib", "national-nutrition-db.ts"), "utf8");
const ddl = [...dbSource.matchAll(/`(CREATE TABLE IF NOT EXISTS[\s\S]*?)`/g)].map((m) => m[1]);
assert.equal(ddl.length, 2, "found both CREATE TABLE statements");
const db = createClient({ url: dbUrl });
await db.batch(ddl);
const insert = (dataset, code, name, extra = {}) => ({
  sql: `INSERT INTO national_nutrition_items (dataset_slug, query_key, food_code, food_name, serving_unit, energy, protein, sodium, source_name, updated_at, representative_food, synced_at)
    VALUES (?, '__default__', ?, ?, ?, ?, '5', '50', '로컬 테스트 전용', '2025-01-01', ?, CURRENT_TIMESTAMP)`,
  args: [dataset, code, name, extra.serving ?? "100g", extra.energy ?? "100", extra.rep ?? "테스트대표"],
});
await db.batch([
  ...Array.from({ length: 60 }, (_, i) => insert("food", `HTTP-${String(i + 1).padStart(3, "0")}`, `HTTP 테스트식품 ${String(i + 1).padStart(2, "0")}`)),
  insert("food", "HTTP-XSS", "</script><img src=x onerror=alert(1)>"),
  insert("process", "HTTP-P1", "HTTP 가공식품"),
  // 5 records but only 3 share a basis (3 g + 2 ml): page exists, not indexable/listed.
  ...["MIX-1", "MIX-2", "MIX-3"].map((c) => insert("food", c, `혼합군 ${c}`, { rep: "혼합군", serving: "100g" })),
  ...["MIX-4", "MIX-5"].map((c) => insert("food", c, `혼합군 ${c}`, { rep: "혼합군", serving: "200ml" })),
]);
db.close();

const children = [];
async function startServer(port, env) {
  // unstable_cache persists on disk between `next start` runs; clear it so each
  // server answers from its own fixture DB and not from an earlier run.
  for (const dir of ["fetch-cache", "images"]) rmSync(path.join(root, ".next", "cache", dir), { recursive: true, force: true });
  const child = spawn(process.execPath, [path.join(root, "node_modules", "next", "dist", "bin", "next"), "start", "-p", String(port)], {
    cwd: root,
    env: {
      ...process.env,
      TURSO_DATABASE_URL: "", TURSO_AUTH_TOKEN: "",
      DATA_GO_KR_NUTRITION_KEY: "", DATA_GO_KR_HEALTH_FUNCTIONAL_FOOD_NUTRITION_KEY: "",
      PUBLIC_DATA_SERVICE_KEY: "", DATA_GO_KR_SERVICE_KEY: "", FOOD_NUTRITION_API_KEY: "", FOOD_SAFETY_KOREA_API_KEY: "",
      FOODSAFETY_API_KEY: "", FOODSAFETYKOREA_API_KEY: "", HEALTH_FUNCTIONAL_FOOD_NUTRITION_API_KEY: "", MFDS_FOOD_API_KEY: "",
      ...env,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  let log = "";
  child.stdout.on("data", (d) => { log += d; });
  child.stderr.on("data", (d) => { log += d; });
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 120; i += 1) {
    try {
      await fetch(`${base}/robots.txt`);
      return base;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  throw new Error(`server on ${port} did not start:\n${log}`);
}

let assertions = 0;
function check(id, condition, message) {
  assert.ok(condition, `${id}: ${message}`);
  assertions += 1;
}
const get = (base, p) => fetch(`${base}${p}`, { redirect: "manual" });
const robotsMeta = (html) => html.match(/<meta name="robots" content="([^"]+)"/)?.[1] ?? "";
const canonical = (html) => html.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? "";
// "https://host" and "https://host/" are the same URL.
const sameUrl = (a, b) => { try { return new URL(a).href === new URL(b).href; } catch { return false; } };

try {
  const base = await startServer(3197, { TURSO_DATABASE_URL: dbUrl, TURSO_AUTH_TOKEN: "local-e2e" });
  const siteUrl = "https://yungyanggogo.kr";

  // R33 + R51: sitemap URLs must actually be indexable 200 pages with a self canonical.
  const core = await get(base, "/sitemaps/core.xml");
  const coreXml = await core.text();
  const locs = [...coreXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check("R33", core.status === 200 && locs.length > 10, "core sitemap served");
  check("R33", !locs.some((loc) => new URL(loc).pathname === "/compare"), "noindex /compare is not in the sitemap");
  const compare = await get(base, "/compare");
  check("R33", compare.status === 200 && /noindex/.test(robotsMeta(await compare.text())), "/compare stays noindex");
  for (const loc of locs) {
    const pathname = new URL(loc).pathname + new URL(loc).search;
    const response = await get(base, pathname);
    const html = await response.text();
    check("R51", response.status === 200, `${pathname} returns 200 (got ${response.status})`);
    check("R51", !/noindex/.test(robotsMeta(html)), `${pathname} is not noindex`);
    check("R51", sameUrl(canonical(html), loc), `${pathname} canonical is itself (got ${canonical(html)})`);
  }
  // R39: static lastmod values are not stamped with the build/request date.
  const staticLastmods = [...coreXml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod>/g)].filter((m) => !m[1].includes("/blog/"));
  // Each non-post lastmod must be a fixed content date written in the route source,
  // not a value generated at build/request time.
  const coreRouteSource = readFileSync(path.join(root, "app", "sitemaps", "core.xml", "route.ts"), "utf8");
  check("R39", staticLastmods.length > 0 && staticLastmods.every((m) => coreRouteSource.includes(`lastModified: "${m[2].slice(0, 10)}"`)), "non-post lastmod values are fixed content dates");
  check("R39", !/new Date\(\)/.test(coreRouteSource), "core sitemap never stamps the current date");

  // R35: pending / scheduled posts are not reachable and not in the sitemap.
  const blogDir = path.join(root, "content", "blog");
  const allPosts = readdirSync(blogDir).filter((f) => f.endsWith(".json")).flatMap((f) => JSON.parse(readFileSync(path.join(blogDir, f), "utf8")));
  const pending = allPosts.filter((p) => p && p.slug && p.humanReview !== "approved");
  check("R35", pending.length > 0, "fixture has pending posts to test");
  // Every pending draft file is covered at least once (plus the first few overall).
  const draftSample = readdirSync(blogDir).filter((f) => f.startsWith("drafts-")).flatMap((f) => JSON.parse(readFileSync(path.join(blogDir, f), "utf8")));
  for (const post of [...pending.slice(0, 5), ...draftSample]) {
    check("R35", (await get(base, `/blog/${post.slug}`)).status === 404, `pending post ${post.slug} is 404`);
    check("R35", !locs.some((loc) => loc.endsWith(`/blog/${post.slug}`)), `pending post ${post.slug} not in sitemap`);
  }

  // R36: removed article stays a real 404 (no home redirect), with a search path.
  const removed = await get(base, "/blog/triangle-kimbap-calorie-compare");
  const removedHtml = await removed.text();
  check("R36", removed.status === 404 && !removed.headers.get("location"), "removed post is 404 without redirect");
  // Check the server-rendered body, not only the client (RSC) payload.
  const removedBody = removedHtml.replace(/<script[\s\S]*?<\/script>/g, "");
  check("R36", removedBody.includes("요청한 페이지를 찾을 수 없습니다") && removedBody.includes('action="/nutrition-data"') && /noindex/.test(robotsMeta(removedHtml)), "useful Korean 404 with search in the HTML body");

  // R34: page 2 has its own content and self canonical; out-of-range is 404.
  const page1 = await (await get(base, "/nutrition-data/food")).text();
  const page2Response = await get(base, "/nutrition-data/food?page=2");
  const page2 = await page2Response.text();
  check("R34", page2Response.status === 200 && canonical(page2) === `${siteUrl}/nutrition-data/food?page=2` && canonical(page1) === `${siteUrl}/nutrition-data/food`, "page 1 and page 2 have self canonicals");
  check("R34", page1.includes("HTTP 테스트식품 01") && !page1.includes("HTTP 테스트식품 51") && page2.includes("HTTP 테스트식품 51"), "page 2 shows different rows");
  check("R34", (await get(base, "/nutrition-data/food?page=9")).status === 404, "known out-of-range page is 404");

  // Query and selection URLs stay noindex; hub "more" link keeps q.
  const hub = await (await get(base, "/nutrition-data?q=HTTP")).text();
  check("T07", /noindex/.test(robotsMeta(hub)), "search URL is noindex");
  check("R25", hub.includes('href="/nutrition-data/food?q=HTTP"'), "hub more-link keeps q");
  check("T07", /noindex/.test(robotsMeta(await (await get(base, "/nutrition-data/food?item=food%7CHTTP-001")).text())), "selection URL is noindex");
  const zero = await (await get(base, "/nutrition-data/food?q=%EC%97%86%EB%8A%94%EC%8B%9D%ED%92%88")).text();
  check("R01", zero.includes("현재 영양고고 저장 자료에서 일치하는 식품을 찾지 못했습니다") && !zero.includes("불러오지 못했습니다"), "HTTP: stored-scope zero is not a failure");

  // Detail: found 200 with escaped JSON-LD; stored-scope miss (no source key) is 404.
  const detailResponse = await get(base, "/nutrition-data/food/HTTP-XSS");
  const detail = await detailResponse.text();
  const ld = detail.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g) ?? [];
  check("T09", detailResponse.status === 200 && ld.length >= 2 && ld.every((block) => (block.match(/<\/script>/g) || []).length === 1), "JSON-LD blocks cannot be closed by source strings");
  check("T09", !detail.includes("<img src=x onerror"), "source name is escaped in HTML");
  // ISR pages must be cacheable and keep real links in the server HTML.
  const detailCache = detailResponse.headers.get("cache-control") || "";
  check("ISR", !/no-store|private/.test(detailCache), `detail page is cacheable (cache-control: ${detailCache})`);
  const detailBody = detail.replace(/<script[\s\S]*?<\/script>/g, "");
  check("ISR", /<a[^>]+href="\/nutrition-data\/food\/HTTP-0\d\d"/.test(detailBody) && /<a[^>]+href="\/compare\?item=food%7CHTTP-XSS"/.test(detailBody), "related and add-to-compare links are real anchors in server HTML");
  check("R42/R44", !detail.includes("adsbygoogle") && !detail.includes("googletagmanager"), "ads/analytics disabled → no network script tags");
  const missingDetail = await get(base, "/nutrition-data/food/NO-SUCH-CODE");
  const missingDetailHtml = await missingDetail.text();
  check("R05", missingDetail.status === 404, "stored-scope miss without a source key is 404");
  // Known Next 16 limit: an on-demand ISR route that calls notFound() ships the
  // 404 tree in the RSC payload (client-rendered body). Status stays 404.
  check("R05", missingDetailHtml.includes("not-found-search"), "detail 404 carries the search-enabled not-found tree");
  const compareHttp = await (await get(base, "/compare?item=food%7CHTTP-001&item=process%7CHTTP-P1&amount=250ml")).text();
  check("R29", compareHttp.includes('value="250"') && /<option value="ml" selected="">/.test(compareHttp), "legacy amount URL fills number + unit");
  const compareSplit = await (await get(base, "/compare?item=food%7CHTTP-001&item=process%7CHTTP-P1&basis=perIntake&amountValue=50&amountUnit=g")).text();
  check("R28", compareSplit.includes("50g당"), "no-JS form fields (amountValue/amountUnit) are honoured by the server");

  // Tool page: indexable, in sitemap, calculator present in server HTML.
  const toolHtml = await (await get(base, "/tools/label-converter")).text();
  check("TOOL", locs.includes(`${siteUrl}/tools/label-converter`) && toolHtml.includes("basis-calculator") && !/noindex/.test(robotsMeta(toolHtml)), "label converter is indexable and in the sitemap");
  check("TOOL", detail.includes("먹는 양에 맞춰 계산하기"), "detail page includes the intake calculator");

  // Food-group pages: sitemap index -> groups sitemap -> indexable 200 pages.
  const indexXml = await (await get(base, "/sitemap.xml")).text();
  check("GROUP", indexXml.includes("/sitemaps/groups.xml"), "sitemap index lists the groups sitemap");
  const groupsXml = await (await get(base, "/sitemaps/groups.xml")).text();
  const groupLocs = [...groupsXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  check("GROUP", groupLocs.some((loc) => loc.endsWith("/nutrition-data/food/group")) && groupLocs.some((loc) => loc.includes("/nutrition-data/food/group/%ED%85%8C%EC%8A%A4%ED%8A%B8")), `groups sitemap has index + group pages (${groupLocs.length})`);
  for (const loc of groupLocs) {
    const u = new URL(loc);
    const response = await get(base, u.pathname);
    const html = await response.text();
    check("GROUP", response.status === 200 && !/noindex/.test(robotsMeta(html)) && sameUrl(canonical(html), loc), `${u.pathname} is 200, indexable, self-canonical`);
  }
  const groupResponse = await get(base, "/nutrition-data/food/group/%ED%85%8C%EC%8A%A4%ED%8A%B8%EB%8C%80%ED%91%9C");
  check("ISR", !/no-store|private/.test(groupResponse.headers.get("cache-control") || ""), `group page is cacheable (${groupResponse.headers.get("cache-control")})`);
  const groupPage = await groupResponse.text();
  check("GROUP", groupPage.includes("61종") && groupPage.includes("중앙값") && groupPage.includes("제품 순위가 아닙니다"), "group page shows count, stats and the no-ranking notice");
  check("GROUP", (await get(base, "/nutrition-data/food/group/%EC%97%86%EB%8A%94%EA%B5%B0")).status === 404, "unknown group is 404");
  const mixed = await get(base, "/nutrition-data/food/group/%ED%98%BC%ED%95%A9%EA%B5%B0");
  check("GROUP", mixed.status === 200 && /noindex/.test(robotsMeta(await mixed.text())) && !groupLocs.some((loc) => loc.includes("%ED%98%BC%ED%95%A9%EA%B5%B0")), "group with <5 same-basis records is noindex and not in the sitemap");
  check("GROUP", !(await (await get(base, "/nutrition-data/food/group")).text()).includes("혼합군"), "non-publishable group is not listed in the index");
  check("GROUP", (await get(base, "/nutrition-data/health/group")).status === 404, "health (mg/capsule basis) has no group pages");
  check("GROUP", detail.includes("영양성분 비교표 보기"), "detail page links to its group");

  const llms = await (await get(base, "/llms.txt")).text();
  check("LLMS", /^# /.test(llms) && /^> /m.test(llms) && (llms.match(/\]\(https:\/\/yungyanggogo\.kr\//g) || []).length >= 5, "llms.txt has a summary and links");
  const blogIndex = await (await get(base, "/blog")).text();
  check("A11Y", /post-card__media" aria-hidden="true" tabindex="-1"/i.test(blogIndex), "duplicate thumbnail link is hidden from assistive tech");

  // API bounds (T11).
  const apiJson = await (await get(base, "/api/nutrition-data?dataset=food&numOfRows=100000&pageNo=-4")).json();
  check("T11", apiJson.ok && apiJson.count === 50 && apiJson.searchScope === "stored", "API clamps numOfRows and reports scope");

  // T01 over HTTP: an unreadable DB yields 5xx, never an empty 200 or a 404.
  // A file that is not SQLite: every query fails with "file is not a database".
  const brokenDb = path.join(workDir, "corrupt.db");
  writeFileSync(brokenDb, "this is not a sqlite database ".repeat(200));
  const broken = await startServer(3198, { TURSO_DATABASE_URL: pathToFileURL(brokenDb).href.replace("file:///", "file:/"), TURSO_AUTH_TOKEN: "local-e2e" });
  const brokenHub = await get(broken, "/nutrition-data");
  const brokenHubHtml = await brokenHub.text();
  check("T01-HTTP", brokenHub.status >= 500, `hub with DB outage is 5xx (got ${brokenHub.status})`);
  check("T01-HTTP", !brokenHubHtml.includes("찾지 못했습니다"), "outage is never rendered as a zero-result message");
  const brokenList = await get(broken, "/nutrition-data/food");
  check("T01-HTTP", brokenList.status >= 500, `dataset list with DB outage is 5xx (got ${brokenList.status})`);
  const brokenDetail = await get(broken, "/nutrition-data/food/HTTP-001");
  check("T01-HTTP", brokenDetail.status >= 500, `detail with DB outage is 5xx, not 404 (got ${brokenDetail.status})`);

  console.log(`http contract: ${assertions} assertions passed against next start (${locs.length} sitemap URLs); local file DB only`);
} finally {
  for (const child of children) child.kill();
}
