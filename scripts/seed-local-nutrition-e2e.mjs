import { createClient } from "@libsql/client";

const databaseUrl = process.env.TURSO_DATABASE_URL?.trim() || "";
if (!databaseUrl.startsWith("file:") || !databaseUrl.replaceAll("\\", "/").includes("/output/playwright/")) {
  throw new Error("Refusing to seed anything except a file: database under output/playwright/.");
}

const db = createClient({ url: databaseUrl, authToken: process.env.TURSO_AUTH_TOKEN || "local-e2e" });
const rows = [
  ["fixture-drink-250ml", "E2E 단백질 음료", "250ml", "200", "20", "120"],
  ["fixture-snack-80g", "E2E 나트륨 스낵", "80g", "100", "4", "400"],
  ["fixture-zero-energy", "E2E 무열량 표본", "100g", "0", "20", "0"],
];

await db.batch([
  {
    sql: `INSERT INTO national_nutrition_syncs (dataset_slug, query_key, total_count, fetched_at)
      VALUES ('food', '__default__', ?, CURRENT_TIMESTAMP)
      ON CONFLICT(dataset_slug, query_key) DO UPDATE SET total_count = excluded.total_count, fetched_at = CURRENT_TIMESTAMP`,
    args: [rows.length],
  },
  ...rows.map(([foodCode, name, servingUnit, energy, protein, sodium]) => ({
    sql: `INSERT INTO national_nutrition_items (
        dataset_slug, query_key, food_code, food_name, type_name, serving_unit,
        energy, protein, sodium, source_name, updated_at, synced_at
      ) VALUES ('food', '__default__', ?, ?, '테스트 전용 fixture', ?, ?, ?, ?, '로컬 테스트 전용', '2026-09-12', CURRENT_TIMESTAMP)
      ON CONFLICT(dataset_slug, query_key, food_code) DO UPDATE SET
        food_name = excluded.food_name, serving_unit = excluded.serving_unit,
        energy = excluded.energy, protein = excluded.protein, sodium = excluded.sodium,
        source_name = excluded.source_name, updated_at = excluded.updated_at,
        synced_at = CURRENT_TIMESTAMP`,
    args: [foodCode, name, servingUnit, energy, protein, sodium],
  })),
]);

await db.close();
console.log(`seeded ${rows.length} local nutrition E2E fixtures`);
