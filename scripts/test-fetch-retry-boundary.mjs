import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fetchTextWithRetry } from "../lib/fetch-with-retry.ts";

function sequenceFetch(steps) {
  let calls = 0;
  const fetchImpl = async () => {
    const step = steps[calls++];
    if (step instanceof Error) throw step;
    return new Response(step.body, { status: step.status });
  };
  return { fetchImpl, calls: () => calls };
}

const delays = [];
const retry429 = sequenceFetch([{ status: 429, body: "limited" }, { status: 200, body: "ok" }]);
const recovered = await fetchTextWithRetry("https://example.test", {}, {
  fetchImpl: retry429.fetchImpl,
  sleep: async (milliseconds) => delays.push(milliseconds),
  baseDelayMs: 10,
});
assert.equal(recovered.response.status, 200);
assert.equal(recovered.text, "ok");
assert.equal(recovered.attempts, 2);
assert.equal(retry429.calls(), 2);
assert.deepEqual(delays, [10]);

const noRetry404 = sequenceFetch([{ status: 404, body: "missing" }]);
const missing = await fetchTextWithRetry("https://example.test", {}, {
  fetchImpl: noRetry404.fetchImpl,
  sleep: async () => assert.fail("404 must not be retried"),
});
assert.equal(missing.response.status, 404);
assert.equal(noRetry404.calls(), 1);

const exhausted = sequenceFetch([{ status: 503, body: "first" }, { status: 503, body: "second" }, { status: 200, body: "third" }]);
const unavailable = await fetchTextWithRetry("https://example.test", {}, {
  fetchImpl: exhausted.fetchImpl,
  sleep: async () => undefined,
  maxAttempts: 9,
});
assert.equal(unavailable.response.status, 503);
assert.equal(exhausted.calls(), 2);

const adapterPaths = [
  "lib/national-nutrition-api.ts",
  "lib/health-functional-food-nutrition-api.ts",
  "lib/health-functional-food-api.ts",
  "lib/public-food-api.ts",
];
for (const path of adapterPaths) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8");
  assert.match(source, /fetchTextWithRetry\(/, `${path} must use bounded retries`);
  assert.doesNotMatch(source, /replace\("https:\/\/api\.data\.go\.kr\/", "http:\/\/api\.data\.go\.kr\/"\)/, `${path} must not downgrade a keyed request to HTTP`);
}

console.log("fetch retry boundary: 17 assertions passed");
