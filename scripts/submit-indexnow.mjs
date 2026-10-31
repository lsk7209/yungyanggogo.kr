// Submits public URLs to IndexNow (Bing, Naver, Yandex, etc.)
// Usage:
//   node scripts/submit-indexnow.mjs [--dry-run] [https://yungyanggogo.kr/... ...]
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const KEY_FILE = resolve(process.cwd(), "public", "cf1bbae352df4a22a23cbf48bb08350d.txt");
const HOST = "yungyanggogo.kr";
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const explicitUrls = args.filter((arg) => !arg.startsWith("--"));

  if (!existsSync(KEY_FILE)) {
    throw new Error(`IndexNow key file not found at ${KEY_FILE}`);
  }

  const key = readFileSync(KEY_FILE, "utf8").trim();
  const keyLocation = `https://${HOST}/cf1bbae352df4a22a23cbf48bb08350d.txt`;

  let urlList = explicitUrls;
  if (!urlList.length) {
    // Collect public approved blog URLs and core pages
    const blogApproved = JSON.parse(readFileSync("content/blog/approved-editorial-2026-09-13.json", "utf8"));
    const foodApprovals = JSON.parse(readFileSync("content/editorial-data/food-group-approvals.json", "utf8"));

    const urls = new Set([
      `https://${HOST}/`,
      `https://${HOST}/blog`,
      `https://${HOST}/rankings`,
      `https://${HOST}/nutrition-data`,
      `https://${HOST}/tools/label-converter`,
      `https://${HOST}/feed.xml`,
    ]);

    for (const post of blogApproved) {
      if (post.slug && post.humanReview === "approved") {
        urls.add(`https://${HOST}/blog/${post.slug}`);
      }
    }

    for (const app of foodApprovals.approvals || []) {
      if (app.slug) {
        urls.add(`https://${HOST}/blog/${app.slug}`);
      }
    }

    urlList = Array.from(urls);
  }

  const payload = {
    host: HOST,
    key,
    keyLocation,
    urlList,
  };

  console.log(`[IndexNow] Preparing submission of ${urlList.length} URLs for ${HOST}`);
  if (dryRun) {
    console.log("[IndexNow] DRY-RUN: Payload prepared successfully:");
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
      body: JSON.stringify(payload),
    });

    console.log(`[IndexNow] Response status: ${response.status} ${response.statusText}`);
    if (response.status === 200 || response.status === 202) {
      console.log(`[IndexNow] Successfully submitted ${urlList.length} URLs!`);
    } else {
      const text = await response.text();
      console.warn(`[IndexNow] Submission returned status ${response.status}: ${text}`);
    }
  } catch (error) {
    console.error("[IndexNow] Submission request failed:", error instanceof Error ? error.message : error);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
