import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createEmptyNutritionFailure } from "../lib/nutrition-failure.ts";

const failure = createEmptyNutritionFailure({ slug: "food" }, 500, "upstream failed");
assert.equal(failure.ok, false);
assert.equal(failure.status, 500);
assert.equal(failure.totalCount, 0);
assert.equal(failure.count, 0);
assert.deepEqual(failure.foods, []);
assert.equal(failure.fallback, undefined);

const cacheSource = await readFile(new URL("../lib/national-nutrition-db.ts", import.meta.url), "utf8");
assert.match(cacheSource, /!query\s*&&\s*result\.ok\s*&&\s*!result\.fallback\s*&&\s*result\.foods\.length > 0/);

const nationalSource = await readFile(new URL("../lib/national-nutrition-api.ts", import.meta.url), "utf8");
assert.match(nationalSource, /createEmptyNutritionFailure<NationalNutritionDataset, NationalNutritionItem>/);
assert.match(nationalSource, /selectedDataset,\s*502,/);

const healthSource = await readFile(new URL("../lib/health-functional-food-nutrition-api.ts", import.meta.url), "utf8");
const catchBlock = healthSource.slice(healthSource.indexOf("} catch (error)"));
assert.match(catchBlock, /ok: false/);
assert.match(catchBlock, /foods: \[\]/);
assert.doesNotMatch(catchBlock, /resultCode: "SNAPSHOT"/);

const routeSource = await readFile(new URL("../app/api/nutrition-data/route.ts", import.meta.url), "utf8");
assert.match(routeSource, /status: result\.ok \? 200 : toPublicFailureStatus\(result\.status\)/);
assert.match(routeSource, /status: anySuccessful \? 200 : 502/);
assert.doesNotMatch(routeSource, /message: result\.message/);

console.log("nutrition failure integrity: 15 assertions passed");
