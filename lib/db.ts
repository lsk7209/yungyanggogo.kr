import { createClient } from "@libsql/client";
import type { Client } from "@libsql/client";

const databaseUrl = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

export const isTursoConfigured = Boolean(databaseUrl && authToken);
export const isNutritionDbReadOnly = process.env.NUTRITION_DB_READ_ONLY === "true";

function assertReadOnlySql(sql: string) {
  const trimmed = sql.trim();
  if (!/^(?:SELECT|WITH)\b/i.test(trimmed) || /;|--|\/\*|\*\//.test(trimmed) ||
      /\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|PRAGMA|ATTACH|DETACH|VACUUM|ANALYZE|REINDEX|BEGIN|COMMIT|ROLLBACK|LOAD_EXTENSION|WRITEFILE)\b/i.test(trimmed)) {
    throw new Error("Nutrition DB is read-only: only SELECT statements are allowed.");
  }
}

function readOnlyClient(client: Client): Client {
  const forbidden = new Set(["batch", "transaction", "executeMultiple", "migrate", "sync"]);
  return new Proxy(client, {
    get(target, property) {
      if (forbidden.has(String(property))) {
        return () => { throw new Error(`Nutrition DB is read-only: ${String(property)} is disabled.`); };
      }
      if (property === "execute") {
        return (statement: string | { sql: string }, args?: unknown) => {
          assertReadOnlySql(typeof statement === "string" ? statement : statement.sql);
          return typeof statement === "string"
            ? target.execute(statement, args as Parameters<Client["execute"]>[1])
            : target.execute(statement);
        };
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

export async function verifyExistingTableColumns(table: string, columns: readonly string[]) {
  if (!/^[a-z_]+$/.test(table) || columns.some((column) => !/^[a-z_]+$/.test(column))) {
    throw new Error("Invalid nutrition DB schema identifier.");
  }
  await getDb().execute(`SELECT ${columns.join(", ")} FROM ${table} LIMIT 0`);
}

// 요청마다 새 클라이언트를 생성하지 않도록 모듈 수준 싱글턴으로 관리
let _client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (!databaseUrl || !authToken) {
    throw new Error(
      "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.",
    );
  }

  if (!_client) {
    const client = createClient({ url: databaseUrl, authToken });
    _client = isNutritionDbReadOnly ? readOnlyClient(client) : client;
  }

  return _client;
}
