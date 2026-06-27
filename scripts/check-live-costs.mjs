#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const requireLiveSecrets = process.env.REQUIRE_LIVE_COST_SECRETS === "1";
const failures = [];
const warnings = [];
const reports = [];

function money(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function threshold(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw.trim() === "") return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function emitNotice(kind, message) {
  const escaped = String(message).replace(/\r?\n/g, "%0A");
  if (process.env.GITHUB_ACTIONS) {
    console.log(`::${kind}::${escaped}`);
  }
  console.log(`[${kind.toUpperCase()}] ${message}`);
}

function checkThreshold(label, value, warnAt, failAt, unit = "") {
  if (Number.isFinite(failAt) && value >= failAt) {
    failures.push(`${label} is ${value}${unit}, at or above fail threshold ${failAt}${unit}.`);
  } else if (Number.isFinite(warnAt) && value >= warnAt) {
    warnings.push(`${label} is ${value}${unit}, at or above warn threshold ${warnAt}${unit}.`);
  }
}

function checkVercelUsage() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    const message = "VERCEL_TOKEN is not configured; live Vercel usage check was skipped.";
    if (requireLiveSecrets) failures.push(message);
    else warnings.push(message);
    return;
  }

  const args = ["vercel@latest", "usage", "--format", "json", "--token", token, "--no-color", "--non-interactive"];
  if (process.env.VERCEL_SCOPE) args.push("--scope", process.env.VERCEL_SCOPE);
  if (process.env.VERCEL_TEAM_ID) args.push("--team", process.env.VERCEL_TEAM_ID);

  let parsed;
  try {
    const stdout = execFileSync("npx", ["--yes", ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 120000,
    });
    parsed = JSON.parse(stdout);
  } catch (error) {
    const message = `Vercel usage check failed: ${error.message}`;
    if (requireLiveSecrets) failures.push(message);
    else warnings.push(message);
    return;
  }

  const totals = parsed.totals || parsed.grandTotal || {};
  const billedCost = money(totals.billedCost ?? totals.billed_cost ?? totals.cost ?? totals.effectiveCost);
  const effectiveCost = money(totals.effectiveCost ?? totals.effective_cost ?? billedCost);
  reports.push(`Vercel usage: billed cost ${billedCost} USD, effective cost ${effectiveCost} USD.`);
  checkThreshold(
    "Vercel billed cost",
    billedCost,
    threshold("VERCEL_BILLED_COST_WARN_USD", Number.POSITIVE_INFINITY),
    threshold("VERCEL_BILLED_COST_FAIL_USD", Number.POSITIVE_INFINITY),
    " USD",
  );
}

function currentRepoUsesTurso() {
  const packagePath = path.join(process.cwd(), "package.json");
  if (!existsSync(packagePath)) return false;
  try {
    const pkg = JSON.parse(readFileSync(packagePath, "utf8"));
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    return Boolean(deps["@libsql/client"] || deps["drizzle-orm"]);
  } catch {
    return false;
  }
}

async function checkTursoUsage() {
  const tursoExpected = process.env.TURSO_EXPECTED === "1" || currentRepoUsesTurso();
  const token = process.env.TURSO_API_TOKEN;
  const organization = process.env.TURSO_ORG_SLUG;
  const databases = (process.env.TURSO_DATABASES || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (!token || !organization || databases.length === 0) {
    const missing = [
      !token && "TURSO_API_TOKEN",
      !organization && "TURSO_ORG_SLUG",
      databases.length === 0 && "TURSO_DATABASES",
    ].filter(Boolean);
    const message = `${missing.join(", ")} not configured; live Turso usage check was skipped.`;
    if (requireLiveSecrets && tursoExpected) failures.push(message);
    else warnings.push(message);
    return;
  }

  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);

  for (const database of databases) {
    const url = new URL(
      `https://api.turso.tech/v1/organizations/${encodeURIComponent(organization)}/databases/${encodeURIComponent(database)}/usage`,
    );
    url.searchParams.set("from", from.toISOString());
    url.searchParams.set("to", to.toISOString());

    let body;
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      body = await response.json();
    } catch (error) {
      const message = `Turso usage check failed for ${database}: ${error.message}`;
      if (requireLiveSecrets) failures.push(message);
      else warnings.push(message);
      continue;
    }

    const total = body?.database?.total || {};
    const rowsRead = Number(total.rows_read || 0);
    const rowsWritten = Number(total.rows_written || 0);
    const storageBytes = Number(total.storage_bytes || 0);
    const bytesSynced = Number(total.bytes_synced || 0);
    reports.push(
      `Turso ${database}: rows_read ${rowsRead}, rows_written ${rowsWritten}, storage_bytes ${storageBytes}, bytes_synced ${bytesSynced}.`,
    );

    checkThreshold(
      `Turso ${database} rows_read`,
      rowsRead,
      threshold("TURSO_ROWS_READ_WARN", Number.POSITIVE_INFINITY),
      threshold("TURSO_ROWS_READ_FAIL", Number.POSITIVE_INFINITY),
    );
    checkThreshold(
      `Turso ${database} rows_written`,
      rowsWritten,
      threshold("TURSO_ROWS_WRITTEN_WARN", Number.POSITIVE_INFINITY),
      threshold("TURSO_ROWS_WRITTEN_FAIL", Number.POSITIVE_INFINITY),
    );
  }
}

console.log("# Live Cost Watch");
checkVercelUsage();
await checkTursoUsage();

for (const report of reports) console.log(`- ${report}`);
for (const warning of warnings) emitNotice("warning", warning);
for (const failure of failures) emitNotice("error", failure);

if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    "# Live Cost Watch",
    "",
    ...reports.map((line) => `- ${line}`),
    ...warnings.map((line) => `- Warning: ${line}`),
    ...failures.map((line) => `- Error: ${line}`),
    "",
  ];
  await import("node:fs").then(({ appendFileSync }) => appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join("\n")));
}

if (failures.length > 0) {
  process.exitCode = 1;
}
