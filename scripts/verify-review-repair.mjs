// Isolated local verification: never read .env files or connect to production DB.
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, symlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { spawnSync, spawn } from "node:child_process";

const root = process.cwd();
const task = process.argv.find((arg) => arg.startsWith("--task="))?.slice(7) ?? "review-repair-20260920";
if (!/^[a-z0-9-]+$/.test(task)) throw new Error("Invalid verification task name");
const port = Number(process.argv.find((arg) => arg.startsWith("--port="))?.slice(7) ?? 3048);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid local port");
const evidence = path.join(root, "output/playwright", task);
mkdirSync(evidence, { recursive: true });
const env = { ...process.env };
for (const key of Object.keys(env)) {
  if (/TURSO|DATA_GO_KR|PUBLIC_DATA|FOOD.*(?:KEY|TOKEN)|MFDS|NEXT_PUBLIC_(?:GA|ANALYTICS|ADSENSE)/i.test(key)) delete env[key];
}
Object.assign(env, { NEXT_TELEMETRY_DISABLED: "1", NEXT_PUBLIC_ANALYTICS_ENABLED: "false", NEXT_PUBLIC_ADSENSE_ENABLED: "false", NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${port}` });
const results = [];
function run(label, args, cwd = root) {
  const result = spawnSync(process.execPath, args, { cwd, env, encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  writeFileSync(path.join(evidence, `${label}.log`), `${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  results.push({ label, args, exit: result.status });
  writeFileSync(path.join(evidence, process.argv.includes("--checks") ? "checks.json" : "build-checks.json"), JSON.stringify(results, null, 2));
  console.log(`${label}: ${result.status === 0 ? "PASS" : "FAIL"}`);
  return result.status === 0;
}

if (process.argv.includes("--checks")) {
  let ok = true;
  // These two tests regenerate unrelated dated corpus reports. Preserve them.
  const excluded = new Set(["test-editorial-corpus-map.mjs", "test-editorial-contract-risk-priority.mjs"]);
  for (const test of readdirSync(path.join(root, "scripts")).filter((file) => /^test-.*\.mjs$/.test(file) && !excluded.has(file)).sort()) ok = run(test.replace(/\.mjs$/, ""), [`scripts/${test}`]) && ok;
  ok = run("typecheck", ["node_modules/typescript/bin/tsc", "--noEmit", "--incremental", "false"]) && ok;
  ok = run("lint", ["node_modules/eslint/bin/eslint.js", "."]) && ok;
  process.exitCode = ok ? 0 : 1;
} else {
  // Keep webpack's module paths on the same Windows drive as node_modules.
  const runtimeParent = path.join(path.dirname(root), "_verification");
  mkdirSync(runtimeParent, { recursive: true });
  const runtime = mkdtempSync(path.join(runtimeParent, `ygg-${task}-`));
  for (const entry of ["app", "components", "content", "lib", "public", "next.config.ts", "next-env.d.ts", "tsconfig.json", "package.json", "package-lock.json"]) cpSync(path.join(root, entry), path.join(runtime, entry), { recursive: true });
  symlinkSync(path.join(root, "node_modules"), path.join(runtime, "node_modules"), "junction");
  const state = { runtime, root, port, productionCredentials: false };
  writeFileSync(path.join(evidence, "runtime.json"), JSON.stringify(state, null, 2));
  if (!run("build", [path.join(root, "node_modules/next/dist/bin/next"), "build", "--webpack"], runtime)) process.exit(1);
  const fixture = path.join(evidence, "nutrition-fixture.db");
  if (!existsSync(fixture)) throw new Error("Create the task-local SQLite fixture before starting the server");
  env.TURSO_DATABASE_URL = `file:${fixture.replaceAll("\\", "/")}`;
  env.TURSO_AUTH_TOKEN = "local-fixture-only";
  const server = spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", String(port)], { cwd: runtime, env, stdio: "inherit", windowsHide: true });
  writeFileSync(path.join(evidence, "runtime.json"), JSON.stringify({ ...state, pid: server.pid, fixture }, null, 2));
  server.on("exit", (code) => { process.exitCode = code ?? 1; });
}
