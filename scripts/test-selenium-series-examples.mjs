import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("src/data/blog/RPA/网页自动化/Selenium");

function shouldStop(newKeys, idleRounds, limit) {
  if (newKeys.size > 0) return false;
  return idleRounds + 1 >= limit;
}

function idealWallTime(testCount, averageSeconds, slots) {
  if (![testCount, averageSeconds, slots].every(Number.isFinite) || slots <= 0) {
    throw new RangeError("testCount, averageSeconds and positive slots are required");
  }
  return (testCount * averageSeconds) / slots;
}

assert.equal(shouldStop(new Set(["PO-1"]), 2, 3), false);
assert.equal(shouldStop(new Set(), 1, 3), false);
assert.equal(shouldStop(new Set(), 2, 3), true);
assert.equal(idealWallTime(120, 30, 6), 600);
assert.throws(() => idealWallTime(120, 30, 0), RangeError);

const kpi = JSON.parse(
  fs.readFileSync(path.join(root, "series-assets", "kpi-review.json"), "utf8"),
);
for (const article of kpi.articles) {
  for (const [metric, score] of Object.entries(article.final)) {
    assert.ok(score >= kpi.framework.target, `article ${article.order} ${metric} below target`);
  }
}

const forbidden = [
  "AutomationControlled",
  "excludeSwitches",
  "useAutomationExtension",
];
for (const file of fs.readdirSync(root).filter((name) => /^\d{2}-.*\.md$/u.test(name))) {
  const markdown = fs.readFileSync(path.join(root, file), "utf8");
  for (const token of forbidden) {
    assert.ok(!markdown.includes(token), `${file} contains forbidden evasion guidance: ${token}`);
  }
}

console.log("Selenium deterministic examples and KPI guardrails passed.");
