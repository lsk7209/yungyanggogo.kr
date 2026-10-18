import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import ts from "typescript";

const stub = (source) => ({ url: `data:text/javascript,${encodeURIComponent(source)}`, shortCircuit: true });
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@libsql/client" && context.parentURL?.includes("/lib/db.ts")) {
      return stub("export const createClient=()=>globalThis.__readonlyFixtureClient;");
    }
    if (specifier === "next/cache") return stub("export const unstable_cache=(fn)=>fn;");
    if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
      const url = new URL(specifier, context.parentURL);
      if (existsSync(fileURLToPath(url) + ".ts")) return nextResolve(url.href + ".ts", context);
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && /\.ts$/.test(url)) {
      return { format: "module", source: ts.transpileModule(readFileSync(fileURLToPath(url), "utf8"), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const setup = createClient({ url: "file::memory:" });
globalThis.__readonlyFixtureClient = setup;
const itemColumns = [
  "dataset_slug", "query_key", "food_code", "food_name", "type_name", "origin_name",
  "large_category", "representative_food", "middle_category", "serving_unit", "energy",
  "water", "protein", "fat", "carbs", "sugars", "fiber", "calcium", "iron",
  "potassium", "sodium", "vitamin_a", "vitamin_c", "vitamin_d", "saturated_fat",
  "trans_fat", "maker", "importer", "distributor", "restaurant", "origin_country",
  "source_name", "created_at", "updated_at", "synced_at",
];
const oldEnv = Object.fromEntries([
  "TURSO_DATABASE_URL", "TURSO_AUTH_TOKEN", "NUTRITION_DB_READ_ONLY",
  "DATA_GO_KR_NUTRITION_KEY", "DATA_GO_KR_HEALTH_FUNCTIONAL_FOOD_NUTRITION_KEY",
  "PUBLIC_DATA_SERVICE_KEY", "DATA_GO_KR_SERVICE_KEY",
].map((key) => [key, process.env[key]]));
const oldFetch = globalThis.fetch;
let readonlyDb;
let writableDb;
try {
  await setup.batch([
    "CREATE TABLE national_nutrition_syncs (dataset_slug TEXT, query_key TEXT, total_count INTEGER, fetched_at TEXT)",
    `CREATE TABLE national_nutrition_items (${itemColumns.map((name) => `${name} TEXT`).join(", ")})`,
    "INSERT INTO national_nutrition_items (dataset_slug, query_key, food_code, food_name, synced_at) VALUES ('food', '__default__', 'FIXTURE-1', '합성 식품', '2026-01-01')",
  ]);
  process.env.TURSO_DATABASE_URL = "file::memory:";
  process.env.TURSO_AUTH_TOKEN = "local-fixture-only";
  process.env.NUTRITION_DB_READ_ONLY = "true";
  for (const key of Object.keys(oldEnv).filter((key) => key.endsWith("_KEY"))) delete process.env[key];
  globalThis.fetch = () => { throw new Error("Network requests are forbidden in the read-only fixture"); };

  const database = await import("../lib/db.ts");
  const nutrition = await import("../lib/national-nutrition-db.ts");
  assert.equal(database.isNutritionDbReadOnly, true);
  readonlyDb = database.getDb();
  await nutrition.ensureNationalNutritionSchema();
  const stored = await nutrition.fetchNationalNutritionItemsWithDbCache({ dataset: "food" });
  assert.equal(stored.ok, true);
  assert.equal(stored.cacheSource, "db");
  assert.equal(stored.foods[0].foodCode, "FIXTURE-1");

  await assert.rejects(
    nutrition.saveNationalNutritionItemsToDb({ dataset: "food", totalCount: 123, foods: [] }),
    /read-only/,
  );
  assert.equal(Number((await readonlyDb.execute("SELECT COUNT(*) AS count FROM national_nutrition_syncs")).rows[0].count), 0);

  const before = Number((await readonlyDb.execute("SELECT COUNT(*) AS count FROM national_nutrition_items")).rows[0].count);
  for (const operation of [
    () => readonlyDb.execute("INSERT INTO national_nutrition_items (food_code) VALUES ('WRONG')"),
    () => readonlyDb.execute("CREATE TABLE forbidden (id INTEGER)"),
    () => readonlyDb.execute("WITH changed AS (DELETE FROM national_nutrition_items) SELECT * FROM changed"),
    () => readonlyDb.execute("SELECT 1; DELETE FROM national_nutrition_items"),
    () => readonlyDb.batch(["DELETE FROM national_nutrition_items"]),
    () => readonlyDb.transaction("write"),
    () => readonlyDb.executeMultiple("DELETE FROM national_nutrition_items"),
    () => readonlyDb.migrate(["DROP TABLE national_nutrition_items"]),
  ]) await assert.rejects(async () => operation(), /read-only/);
  assert.equal(Number((await readonlyDb.execute("SELECT COUNT(*) AS count FROM national_nutrition_items")).rows[0].count), before);
  await assert.rejects(database.verifyExistingTableColumns("national_nutrition_items", ["missing_column"]));
  await assert.rejects(database.verifyExistingTableColumns("missing_table", ["id"]));

  process.env.NUTRITION_DB_READ_ONLY = "false";
  const defaultDatabase = await import("../lib/db.ts?default-writable");
  assert.equal(defaultDatabase.isNutritionDbReadOnly, false);
  writableDb = defaultDatabase.getDb();
  await writableDb.execute("INSERT INTO national_nutrition_items (dataset_slug, food_code, food_name) VALUES ('food', 'FIXTURE-2', 'default writable')");
  assert.equal(Number((await writableDb.execute("SELECT COUNT(*) AS count FROM national_nutrition_items")).rows[0].count), before + 1);
  await writableDb.execute("DROP TABLE national_nutrition_items");
  const unavailable = await nutrition.fetchNationalNutritionItemsWithDbCache({ dataset: "food" });
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.failureReason, "stored_unavailable");
  console.log("PASS: read-only fixture reads; schema verification is SELECT-only; all write paths reject; default writes remain enabled; missing schema yields 503.");
} finally {
  setup.close();
  delete globalThis.__readonlyFixtureClient;
  globalThis.fetch = oldFetch;
  for (const [key, value] of Object.entries(oldEnv)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
}
