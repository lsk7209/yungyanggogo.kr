import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const syncSource = await readFile(new URL("./sync-national-nutrition.mjs", import.meta.url), "utf8");
const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));

assert.match(syncSource, /import \{ extractStandardDataGoKrItems \} from "\.\.\/lib\/data-go-kr-response\.ts"/);
assert.match(syncSource, /const \{ rows, reportedTotalCount \} = extractStandardDataGoKrItems\(payload\)/);
assert.match(syncSource, /totalCount: parseNutritionTotalCount\(reportedTotalCount\)/);
assert.match(syncSource, /totalCount === null \? \[\] : \[\{/);
assert.doesNotMatch(syncSource, /const items = body\.items/);
assert.equal(packageJson.scripts["nutrition:sync"], "node --experimental-strip-types scripts/sync-national-nutrition.mjs");

console.log("nutrition sync parser boundary: 6 assertions passed");
