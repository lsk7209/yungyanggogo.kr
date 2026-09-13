import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const layout = fs.readFileSync(path.join(root, "app", "layout.tsx"), "utf8");
const home = fs.readFileSync(path.join(root, "app", "page.tsx"), "utf8");

assert.doesNotMatch(
  layout,
  /alternates\s*:\s*\{\s*canonical\s*:\s*absoluteUrl\("\/"\)/s,
  "root layout must not assign the homepage canonical to unmatched and not-found routes"
);
assert.match(
  home,
  /export const metadata[^=]*=\s*\{[\s\S]*?alternates\s*:\s*\{\s*canonical\s*:\s*absoluteUrl\("\/"\)/,
  "homepage must retain an explicit self-referencing canonical"
);

console.log("canonical metadata boundary: 2 assertions passed");
