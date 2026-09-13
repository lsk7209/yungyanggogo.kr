import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../app/blog/page.tsx", import.meta.url), "utf8");

assert.match(source, /const PAGE_SIZE = 24/);
assert.match(source, /posts\.slice\(\(page - 1\) \* PAGE_SIZE, page \* PAGE_SIZE\)/);
assert.match(source, /if \(page > totalPages\) notFound\(\)/);
assert.match(source, /page > 1 \? `\/blog\?page=\$\{page\}` : "\/blog"/);
assert.match(source, /aria-label="블로그 페이지 이동"/);
assert.doesNotMatch(source, /\{posts\.map\(/);

console.log("blog pagination boundary: 6 assertions passed");
