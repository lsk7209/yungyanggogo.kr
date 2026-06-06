import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { sign } from "node:crypto";

const DEFAULT_SITE_URL = "https://yungyanggogo.kr/";
const DEFAULT_SITEMAP_URL = "https://yungyanggogo.kr/sitemap.xml";
const DEFAULT_CREDENTIALS = "D:/env/gsc_credentials.json";
const WEBMASTERS_SCOPE = "https://www.googleapis.com/auth/webmasters";
const SITE_VERIFICATION_SCOPE = "https://www.googleapis.com/auth/siteverification";

const args = parseArgs(process.argv.slice(2));
const siteUrl = ensureTrailingSlash(args.site || process.env.GSC_SITE_URL || DEFAULT_SITE_URL);
const sitemapUrl = args.sitemap || process.env.GSC_SITEMAP_URL || DEFAULT_SITEMAP_URL;
const credentialsPath = args.credentials || process.env.GSC_CREDENTIALS || DEFAULT_CREDENTIALS;
const command = args._[0] || "all";
const pollAttempts = Number(args.pollAttempts || process.env.GSC_POLL_ATTEMPTS || 12);
const pollIntervalMs = Number(args.pollIntervalMs || process.env.GSC_POLL_INTERVAL_MS || 300000);

async function main() {
  if (!existsSync(credentialsPath)) {
    throw new Error(`GSC credentials file not found: ${credentialsPath}`);
  }

  if (command === "check-live") {
    await checkLiveUrls();
    return;
  }

  if (command === "status") {
    const token = await getAccessToken([WEBMASTERS_SCOPE]);
    await printPropertyAndSitemapStatus(token);
    return;
  }

  if (command === "verification-file") {
    const token = await getAccessToken([SITE_VERIFICATION_SCOPE]);
    await ensureVerificationFile(token);
    return;
  }

  if (command === "verify-property") {
    const token = await getAccessToken([WEBMASTERS_SCOPE, SITE_VERIFICATION_SCOPE]);
    await verifyPropertyAccess(token);
    return;
  }

  if (command === "submit") {
    const token = await getAccessToken([WEBMASTERS_SCOPE]);
    await checkLiveUrls();
    await submitSitemap(token);
    await pollSitemapStatus(token, pollAttempts, pollIntervalMs);
    return;
  }

  if (command !== "all") {
    throw new Error(`Unknown command: ${command}`);
  }

  const token = await getAccessToken([WEBMASTERS_SCOPE, SITE_VERIFICATION_SCOPE]);
  await checkLiveUrls();
  const hasAccess = await hasSearchConsoleAccess(token);
  if (!hasAccess) {
    await ensureVerificationFile(token);
    console.log("verification_file_created=true");
    console.log("next_step=Deploy the generated public/google*.html file, then rerun: npm run gsc:sitemap");
    process.exitCode = 20;
    return;
  }
  await submitSitemap(token);
  await pollSitemapStatus(token, pollAttempts, pollIntervalMs);
}

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      parsed._.push(arg);
      continue;
    }
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function ensureTrailingSlash(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function base64url(input) {
  return Buffer.from(input).toString("base64").replaceAll("=", "").replaceAll("+", "-").replaceAll("/", "_");
}

async function getAccessToken(scopes) {
  const credentials = JSON.parse(readFileSync(credentialsPath, "utf8"));
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: credentials.client_email,
      scope: scopes.join(" "),
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now
    })
  );
  const unsigned = `${header}.${claim}`;
  const signature = sign("RSA-SHA256", Buffer.from(unsigned), credentials.private_key);
  const jwt = `${unsigned}.${base64url(signature)}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`OAuth token request failed: ${response.status} ${text}`);
  }
  return JSON.parse(text).access_token;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = json?.error?.message || text;
    const error = new Error(`${options.method || "GET"} ${url} failed: ${response.status} ${message}`);
    error.status = response.status;
    error.payload = json;
    throw error;
  }
  return json;
}

async function checkLiveUrls() {
  const sitemap = await fetch(sitemapUrl, { redirect: "follow" });
  const sitemapText = await sitemap.text();
  if (!sitemap.ok) {
    throw new Error(`Live sitemap is not fetchable: ${sitemap.status}`);
  }
  if (!sitemapText.includes(siteUrl)) {
    throw new Error(`Live sitemap does not include ${siteUrl}`);
  }

  const robotsUrl = new URL("/robots.txt", siteUrl).toString();
  const robots = await fetch(robotsUrl, { redirect: "follow" });
  const robotsText = await robots.text();
  if (!robots.ok) {
    throw new Error(`Live robots.txt is not fetchable: ${robots.status}`);
  }
  if (!robotsText.includes(sitemapUrl)) {
    throw new Error(`robots.txt does not reference ${sitemapUrl}`);
  }

  const verificationFiles = getVerificationFiles();
  for (const fileName of verificationFiles) {
    const verificationUrl = new URL(`/${fileName}`, siteUrl).toString();
    const verification = await fetch(verificationUrl, { redirect: "follow" });
    const verificationText = await verification.text();
    if (!verification.ok) {
      throw new Error(`Google verification file is not fetchable: ${verification.status} ${verificationUrl}`);
    }
    if (!verificationText.includes(`google-site-verification: ${fileName}`)) {
      throw new Error(`Google verification file body is invalid: ${verificationUrl}`);
    }
    console.log(`live_verification=ok ${verificationUrl}`);
  }

  console.log(`live_sitemap=ok ${sitemapUrl}`);
  console.log(`live_robots=ok ${robotsUrl}`);
}

function getVerificationFiles() {
  const publicDir = resolve("public");
  if (!existsSync(publicDir)) {
    return [];
  }
  return readdirSync(publicDir).filter((name) => /^google[a-z0-9]+\.html$/i.test(name));
}

async function hasSearchConsoleAccess(token) {
  try {
    const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`;
    const site = await requestJson(url, { headers: authHeaders(token) });
    console.log(`gsc_property=visible ${site.siteUrl || siteUrl} ${site.permissionLevel || "unknown"}`);
    return true;
  } catch (error) {
    if (error.status === 403 || error.status === 404) {
      console.log(`gsc_property=missing_or_no_permission ${siteUrl}`);
      return false;
    }
    throw error;
  }
}

async function ensureVerificationFile(token) {
  const tokenResponse = await requestJson("https://www.googleapis.com/siteVerification/v1/token", {
    method: "POST",
    headers: { ...authHeaders(token), "content-type": "application/json" },
    body: JSON.stringify({
      site: {
        type: "SITE",
        identifier: siteUrl
      },
      verificationMethod: "FILE"
    })
  });

  if (!tokenResponse?.token) {
    throw new Error("Site Verification API did not return a FILE token.");
  }

  const filePath = resolve("public", tokenResponse.token);
  const body = `google-site-verification: ${tokenResponse.token}`;
  writeFileSync(filePath, `${body}\n`, "utf8");
  console.log(`verification_file=${filePath}`);
  console.log(`verification_url=${new URL(`/${tokenResponse.token}`, siteUrl).toString()}`);
}

async function verifyPropertyAccess(token) {
  if (!(await hasSearchConsoleAccess(token))) {
    await insertVerification(token);
    await addSearchConsoleSite(token);
  }
  if (!(await hasSearchConsoleAccess(token))) {
    throw new Error(`Search Console property is still not accessible after verification: ${siteUrl}`);
  }
}

async function insertVerification(token) {
  const url = "https://www.googleapis.com/siteVerification/v1/webResource?verificationMethod=FILE";
  const payload = {
    site: {
      type: "SITE",
      identifier: siteUrl
    }
  };
  const result = await requestJson(url, {
    method: "POST",
    headers: { ...authHeaders(token), "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  console.log(`site_verification=ok ${result?.id || siteUrl}`);
}

async function addSearchConsoleSite(token) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}`;
  await requestJson(url, {
    method: "PUT",
    headers: authHeaders(token)
  });
  console.log(`gsc_sites_add=ok ${siteUrl}`);
}

async function submitSitemap(token) {
  if (!(await hasSearchConsoleAccess(token))) {
    throw new Error(`Search Console property is not accessible: ${siteUrl}`);
  }
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  await requestJson(url, {
    method: "PUT",
    headers: authHeaders(token)
  });
  console.log(`sitemap_submit=ok ${sitemapUrl}`);
}

async function printPropertyAndSitemapStatus(token) {
  if (!(await hasSearchConsoleAccess(token))) {
    console.log("gsc_status=blocked_missing_permission");
    console.log("next_step=npm run gsc:sitemap:verify");
    process.exitCode = 20;
    return;
  }
  const status = await getSitemapStatus(token);
  console.log(JSON.stringify(status, null, 2));
}

async function getSitemapStatus(token) {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
  try {
    return await requestJson(url, { headers: authHeaders(token) });
  } catch (error) {
    if (error.status === 404) {
      return { path: sitemapUrl, submitted: false, isPending: true, errors: null };
    }
    throw error;
  }
}

async function pollSitemapStatus(token, attempts, intervalMs) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const status = await getSitemapStatus(token);
    const errors = Number(status.errors || 0);
    const warnings = Number(status.warnings || 0);
    const isGreen = status.isPending === false && errors === 0 && Boolean(status.lastDownloaded);
    console.log(
      `sitemap_status attempt=${attempt}/${attempts} pending=${status.isPending} errors=${errors} warnings=${warnings} lastDownloaded=${status.lastDownloaded || "none"}`
    );
    if (isGreen) {
      console.log("gsc_sitemap_green=true");
      return;
    }
    if (attempt < attempts) {
      await sleep(intervalMs);
    }
  }
  throw new Error("Sitemap was submitted, but GSC did not report green status within the polling window.");
}

function authHeaders(token) {
  return { authorization: `Bearer ${token}` };
}

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = process.exitCode || 1;
});
