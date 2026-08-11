import { setTimeout } from "node:timers/promises";

const urls = {
  page: "https://yungyanggogo.kr/foods/protein-ready-meal-sample",
  sitemap: "https://yungyanggogo.kr/sitemap.xml"
};

function expect(condition, message) {
  if (!condition) throw new Error(`ASSERTION_FAILED: ${message}`);
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow" });
  return { response, text: await response.text() };
}

const page = await fetchText(urls.page);
expect(page.response.status === 200, "demo page must remain public");
expect(page.response.url === urls.page, "demo page must keep its canonical route");
expect(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex,?\s*follow/i.test(page.text), "demo page must be noindex,follow");
expect(new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["']${urls.page.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(page.text), "demo page must keep a self canonical");

const sitemap = await fetchText(urls.sitemap);
expect(sitemap.response.status === 200, "sitemap must remain public");
expect(!sitemap.text.includes("/foods/protein-ready-meal-sample"), "demo page must not be sitemap-listed");

console.log("VERIFY_OK");
await setTimeout(0);
