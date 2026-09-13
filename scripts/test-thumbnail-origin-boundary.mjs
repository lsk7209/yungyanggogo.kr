import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const card = await readFile(new URL("../components/PostCard.tsx", import.meta.url), "utf8");
const helper = await readFile(new URL("../lib/post-thumbnail.ts", import.meta.url), "utf8");

assert.match(card, /getPostThumbnailPath/);
assert.doesNotMatch(card, /getPostThumbnailUrl/);
assert.match(helper, /return `\/blog\/\$\{post\.slug\}\/thumbnail\.svg`/);
assert.match(helper, /absoluteUrl\(getPostThumbnailPath\(post\)\)/);

console.log("thumbnail origin boundary: 4 assertions passed");
