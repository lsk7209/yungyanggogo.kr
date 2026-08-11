import { setTimeout } from "node:timers/promises";

const urls = {
  page: "https://yungyanggogo.kr/foods/protein-ready-meal-sample",
  sitemap: "https://yungyanggogo.kr/sitemap.xml"
};

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  return { res, text };
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION_FAILED: ${message}`);
  }
}

const page = await fetchText(urls.page);
console.log(`[page] status=${page.res.status}`);
expect(page.res.status === 200, "Demo page must remain HTTP 200");
expect(page.res.url === urls.page, "Demo page should remain canonical path");

expect(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex,?\s*follow[^"']*/i.test(page.text), "Demo page should include noindex, follow in robots meta");
expect(new RegExp(`<link[^>]+rel=["']canonical["'][^>]+href=["']${urls.page.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`).test(page.text), "Demo page canonical should remain self-referential");

const sitemap = await fetchText(urls.sitemap);
console.log(`[sitemap] status=${sitemap.res.status}`);
expect(sitemap.res.status === 200, "sitemap should be HTTP 200");
expect(!sitemap.text.includes('/foods/protein-ready-meal-sample'), 'Demo slug should not appear in sitemap');

console.log("VERIFY_OK");
await setTimeout(0);
