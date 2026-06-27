#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignored = new Set(["node_modules", ".next", ".git", ".vercel", "dist", "build", "out"]);

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    return { __error: error.message };
  }
}

function listProjects(dir) {
  const currentProject = existsSync(path.join(dir, "package.json")) || existsSync(path.join(dir, "vercel.json")) ? [dir] : [];
  const childProjects = readdirSync(dir)
    .filter((name) => !ignored.has(name))
    .map((name) => path.join(dir, name))
    .filter((entry) => {
      try {
        return statSync(entry).isDirectory();
      } catch {
        return false;
      }
    })
    .filter((entry) => existsSync(path.join(entry, "package.json")) || existsSync(path.join(entry, "vercel.json")));
  return [...currentProject, ...childProjects];
}

function cronRunsPerDay(schedule) {
  const parts = String(schedule || "").trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  if (dayOfMonth !== "*" || month !== "*") return null;
  if (/^\*\/(\d+)$/.test(minute) && hour === "*" && dayOfWeek === "*") {
    return Math.ceil((24 * 60) / Number(minute.slice(2)));
  }
  if (minute === "*" && hour === "*" && dayOfWeek === "*") return 24 * 60;
  if (/^\*\/(\d+)$/.test(hour) && dayOfWeek === "*") return Math.ceil(24 / Number(hour.slice(2)));
  if (hour === "*" && dayOfWeek === "*") return 24;
  if (dayOfWeek === "*") return 1;
  return 1 / 7;
}

function severityRank(value) {
  return { info: 0, warn: 1, high: 2, critical: 3 }[value] ?? 0;
}

function routeFileCandidates(projectDir, cronPath) {
  const cleanPath = String(cronPath || "").replace(/^\/+/, "").replace(/\/+$/, "");
  if (!cleanPath) return [];
  const routePath = cleanPath.split("/").join(path.sep);
  return [
    path.join(projectDir, "app", routePath, "route.ts"),
    path.join(projectDir, "app", routePath, "route.js"),
    path.join(projectDir, "src", "app", routePath, "route.ts"),
    path.join(projectDir, "src", "app", routePath, "route.js"),
    path.join(projectDir, "pages", `${routePath}.ts`),
    path.join(projectDir, "pages", `${routePath}.js`),
    path.join(projectDir, "src", "pages", `${routePath}.ts`),
    path.join(projectDir, "src", "pages", `${routePath}.js`),
  ];
}

function localImportCandidates(projectDir, importerFile, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) {
    return [];
  }

  const basePath = specifier.startsWith("@/")
    ? path.join(projectDir, specifier.slice(2))
    : path.resolve(path.dirname(importerFile), specifier);

  return [
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    `${basePath}.jsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
    path.join(basePath, "index.js"),
    path.join(basePath, "index.jsx"),
  ].filter((candidate) => path.resolve(candidate).startsWith(path.resolve(projectDir)));
}

function hasCronAuthSource(projectDir, sourceFile, seen = new Set(), depth = 0) {
  const resolvedFile = path.resolve(sourceFile);
  if (seen.has(resolvedFile) || depth > 4 || !existsSync(resolvedFile)) {
    return false;
  }

  seen.add(resolvedFile);
  const source = readFileSync(resolvedFile, "utf8");
  if (/CRON_SECRET|Authorization|Bearer|x-cron-secret|cronSecret/i.test(source)) {
    return true;
  }

  const imports = source.matchAll(/(?:import|export)\s+(?:[^'"]+\s+from\s+)?["']([^"']+)["']/g);
  for (const match of imports) {
    for (const candidate of localImportCandidates(projectDir, resolvedFile, match[1])) {
      if (hasCronAuthSource(projectDir, candidate, seen, depth + 1)) {
        return true;
      }
    }
  }

  return false;
}

function hasCronAuthGuard(projectDir, cronPath) {
  const routeFile = routeFileCandidates(projectDir, cronPath).find((candidate) => existsSync(candidate));
  if (!routeFile) return { found: false, guarded: false };
  const guarded = hasCronAuthSource(projectDir, routeFile);
  return { found: true, guarded, routeFile };
}

const projects = listProjects(root);
const findings = [];
const summaries = [];

for (const projectDir of projects) {
  const project = path.basename(projectDir);
  const packagePath = path.join(projectDir, "package.json");
  const vercelPath = path.join(projectDir, "vercel.json");
  const pkg = existsSync(packagePath) ? readJson(packagePath) : null;
  const vercel = existsSync(vercelPath) ? readJson(vercelPath) : null;
  const scripts = pkg?.scripts || {};
  const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) };
  const crons = Array.isArray(vercel?.crons) ? vercel.crons : [];
  const functionRules = vercel?.functions && typeof vercel.functions === "object" ? vercel.functions : {};
  const hasTurso = Boolean(deps["@libsql/client"] || deps["drizzle-orm"]);

  summaries.push({
    project,
    crons: crons.length,
    hasFunctionCaps: Object.keys(functionRules).length > 0,
    hasTurso,
    build: Boolean(scripts.build),
    test: Boolean(scripts.test),
  });

  if (vercel?.__error) {
    findings.push({ project, severity: "critical", message: `vercel.json is not valid JSON: ${vercel.__error}` });
    continue;
  }

  if (pkg?.__error) {
    findings.push({ project, severity: "critical", message: `package.json is not valid JSON: ${pkg.__error}` });
    continue;
  }

  if (crons.length > 4) {
    findings.push({
      project,
      severity: crons.length > 8 ? "critical" : "high",
      message: `${crons.length} Vercel cron jobs configured; consolidate or stagger to reduce function invocations.`,
    });
  }

  for (const cron of crons) {
    const runs = cronRunsPerDay(cron.schedule);
    if (runs !== null && runs >= 8) {
      findings.push({
        project,
        severity: runs >= 24 ? "high" : "warn",
        message: `cron ${cron.path || "(unknown path)"} runs about ${runs} times/day (${cron.schedule}).`,
      });
    }

    const authGuard = hasCronAuthGuard(projectDir, cron.path);
    if (authGuard.found && !authGuard.guarded) {
      findings.push({
        project,
        severity: "warn",
        message: `cron ${cron.path || "(unknown path)"} route exists but no obvious CRON_SECRET/Authorization guard was detected.`,
      });
    } else if (!authGuard.found) {
      findings.push({
        project,
        severity: "warn",
        message: `cron ${cron.path || "(unknown path)"} route file was not found by the audit script; verify it is not publicly abusable.`,
      });
    }
  }

  const maxDurations = Object.entries(functionRules)
    .map(([pattern, rule]) => ({ pattern, maxDuration: Number(rule?.maxDuration) }))
    .filter((rule) => Number.isFinite(rule.maxDuration));

  for (const rule of maxDurations) {
    if (rule.maxDuration > 60) {
      findings.push({
        project,
        severity: "critical",
        message: `function rule ${rule.pattern} has maxDuration ${rule.maxDuration}s; cap expensive routes lower unless required.`,
      });
    }
  }

  if (crons.length > 0 && maxDurations.length === 0) {
    findings.push({
      project,
      severity: "warn",
      message: "cron-backed API routes have no explicit function maxDuration cap in vercel.json.",
    });
  }

  for (const [name, command] of Object.entries(scripts)) {
    if (/deploy|publish:vercel|git-push-auto/.test(name) || /\bvercel\s+--prod\b|\bwrangler\s+pages\s+deploy\b/.test(command)) {
      findings.push({
        project,
        severity: "warn",
        message: `script "${name}" can deploy externally; keep it out of automatic CI unless manually gated.`,
      });
    }

    if (/db:(push|migrate)|migrate/.test(name) && !/dry|local|generate|studio/.test(name)) {
      findings.push({
        project,
        severity: "warn",
        message: `script "${name}" can change a database; require manual approval and backups for production.`,
      });
    }
  }

  if (hasTurso) {
    const envExample = path.join(projectDir, ".env.example");
    if (!existsSync(envExample)) {
      findings.push({
        project,
        severity: "warn",
        message: "Turso/libsql dependency detected but .env.example is missing.",
      });
    }
  }
}

console.log("# Hosting Cost Audit");
console.log("");
console.log(`Projects scanned: ${summaries.length}`);
console.log("");
console.table(summaries);

if (findings.length === 0) {
  console.log("No hosting cost guardrail findings.");
} else {
  console.log("");
  console.log("Findings:");
  for (const finding of findings.sort((a, b) => severityRank(b.severity) - severityRank(a.severity))) {
    console.log(`- [${finding.severity.toUpperCase()}] ${finding.project}: ${finding.message}`);
  }
}

const failOn = process.argv.find((arg) => arg.startsWith("--fail-on="))?.split("=")[1] || "critical";
if (findings.some((finding) => severityRank(finding.severity) >= severityRank(failOn))) {
  process.exitCode = 1;
}
