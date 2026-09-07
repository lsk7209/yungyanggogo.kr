import { createClient } from "@libsql/client";

const databaseUrl = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

export const isTursoConfigured = Boolean(databaseUrl && authToken);

// 요청마다 새 클라이언트를 생성하지 않도록 모듈 수준 싱글턴으로 관리
let _client: ReturnType<typeof createClient> | null = null;

export function getDb() {
  if (!databaseUrl || !authToken) {
    throw new Error(
      "Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.",
    );
  }

  if (!_client) {
    _client = createClient({ url: databaseUrl, authToken });
  }

  return _client;
}
