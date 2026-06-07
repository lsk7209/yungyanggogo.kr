import { createClient } from "@libsql/client";

const databaseUrl = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

export const isTursoConfigured = Boolean(databaseUrl && authToken);

export function getDb() {
  if (!databaseUrl || !authToken) {
    throw new Error("Turso is not configured. Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.");
  }

  return createClient({
    url: databaseUrl,
    authToken
  });
}
