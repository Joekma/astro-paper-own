import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { figureCount, sampleFigureId, storyboard } from "./agent-academic-image-storyboard.mjs";

const root = path.resolve("src/data/blog/AI/Agent");
const files = fs.readdirSync(root).filter(file => file.endsWith(".md")).sort();
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };

assert(files.length === 13, `expected 13 articles, found ${files.length}`);
const slugs = new Set();
const expectedSlugs = new Set([
  "ai-agent-introduction", "agent-loop-runtime", "agent-tool-calling", "agent-mcp-protocol",
  "agent-memory-system", "agent-skills-system", "agent-security-sandbox-approval",
  "build-agent-from-scratch-react-planner-executor-reflexion", "multi-agent-collaboration",
  "automated-agent-cron-background", "openclaw-architecture-learning",
  "hermes-agent-architecture-learning", "openclaw-hermes-agent-design-patterns",
]);

for (const [index, file] of files.entries()) {
  const order = index + 1;
  const content = fs.readFileSync(path.join(root, file), "utf8");
  const fm = content.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  const slug = fm.match(/^slug:\s*(.+)$/m)?.[1]?.trim();
  assert(file.startsWith(`${String(order).padStart(2, "0")}-`), `${file}: filename order mismatch`);
  assert(fm.includes("series: Agent"), `${file}: missing series Agent`);
  assert(fm.includes(`seriesOrder: ${order}`), `${file}: seriesOrder mismatch`);
  assert(fm.includes("language: zh-CN"), `${file}: language mismatch`);
  assert(fm.includes("modDatetime: 2026-07-12T00:00:00.000+08:00"), `${file}: modDatetime mismatch`);
  assert(Boolean(slug), `${file}: missing slug`);
  assert(!slugs.has(slug), `${file}: duplicate slug ${slug}`);
  slugs.add(slug);
  assert(content.includes("## 学习导航"), `${file}: missing learning navigation`);
  assert(content.includes("失败路径"), `${file}: missing failure path`);
  assert(content.includes("可观测性与验收"), `${file}: missing observability`);
  assert(content.includes("## 常见误区"), `${file}: missing misconceptions`);
  assert(content.includes("## 自检题"), `${file}: missing self-check`);
  assert(content.includes("<details>"), `${file}: missing folded answers`);
  assert(content.includes("## 下一篇"), `${file}: missing next article`);
  assert(content.includes("## 资料来源与版本基线"), `${file}: missing source baseline`);
  assert(!content.includes("openclawlab.com"), `${file}: legacy OpenClaw source remains`);
  assert(!content.includes("specification/2025-06-18"), `${file}: pinned legacy MCP spec remains`);
  assert((content.match(/^```/gm) ?? []).length % 2 === 0, `${file}: unbalanced code fences`);

  for (const [blockIndex, match] of [...content.matchAll(/```python\n([\s\S]*?)```/g)].entries()) {
    const check = spawnSync("python", ["-c", `compile(${JSON.stringify(match[1])}, ${JSON.stringify(`${file}:${blockIndex + 1}`)}, 'exec')`], { encoding: "utf8" });
    assert(check.status === 0, `${file}: Python block ${blockIndex + 1} syntax error: ${check.stderr.trim()}`);
  }
}

assert(slugs.size === expectedSlugs.size && [...expectedSlugs].every(slug => slugs.has(slug)), "slug set changed during reorder; URL compatibility is not preserved");
assert(figureCount >= 99 && figureCount <= 113, `storyboard count ${figureCount} outside 99-113`);
assert(sampleFigureId === "agent-08-01", "sample figure must be agent-08-01");

const storyboardFiles = new Set();
const figureIds = new Set();
const figureNames = new Set();
for (const article of storyboard) {
  storyboardFiles.add(article.file);
  const content = fs.readFileSync(path.join(root, article.file), "utf8");
  for (const figure of article.figures) {
    assert(!figureIds.has(figure.id), `duplicate figure id ${figure.id}`);
    assert(!figureNames.has(figure.filename), `duplicate figure filename ${figure.filename}`);
    figureIds.add(figure.id);
    figureNames.add(figure.filename);
    assert(content.includes(figure.insertionAnchor), `${figure.id}: missing insertion anchor ${figure.insertionAnchor}`);
    assert(figure.exactLabels.length >= 3, `${figure.id}: insufficient exact labels`);
    assert(figure.cognitiveQuestion.endsWith("？"), `${figure.id}: cognitive question must be explicit`);
  }
}
assert(storyboardFiles.size === 13 && files.every(file => storyboardFiles.has(file)), "storyboard does not cover all articles");

const imageDir = path.join(root, "images");
const currentImages = fs.existsSync(imageDir) ? fs.readdirSync(imageDir) : [];
const expectedImages = [...figureNames].sort();
const actualImages = currentImages.filter(file => /\.(png|svg|jpe?g|webp)$/i.test(file)).sort();
assert(actualImages.length === figureCount, `expected ${figureCount} article images, found ${actualImages.length}`);
assert(actualImages.every(file => file.endsWith(".png")), "final images directory contains a non-PNG image");
assert(JSON.stringify(actualImages) === JSON.stringify(expectedImages), "image files do not exactly match storyboard filenames");

let totalImageBytes = 0;
for (const image of actualImages) {
  const imagePath = path.join(imageDir, image);
  totalImageBytes += fs.statSync(imagePath).size;
  const metadata = await sharp(imagePath).metadata();
  assert(metadata.width === 1600 && metadata.height === 900, `${image}: expected 1600x900, found ${metadata.width}x${metadata.height}`);
}
assert(totalImageBytes <= 120 * 1024 * 1024, `final image set exceeds 120 MiB: ${(totalImageBytes / 1024 / 1024).toFixed(2)} MiB`);

for (const article of storyboard) {
  const content = fs.readFileSync(path.join(root, article.file), "utf8");
  const refs = [...content.matchAll(/!\[[^\]]*\]\(\.\/images\/([^\)]+)\)/g)].map(match => match[1]);
  const expectedRefs = article.figures.map(figure => figure.filename);
  assert(refs.length === expectedRefs.length, `${article.file}: expected ${expectedRefs.length} image references, found ${refs.length}`);
  assert(new Set(refs).size === refs.length, `${article.file}: duplicate image reference`);
  assert(expectedRefs.every(filename => refs.includes(filename)), `${article.file}: image references do not match storyboard`);
}

const kpi = JSON.parse(fs.readFileSync(path.resolve("scripts/agent-content-kpi-review.json"), "utf8"));
assert(kpi.articles.length === 13, "KPI review must cover 13 articles");
for (const article of kpi.articles) {
  assert(article.scores.length === 4, `KPI article ${article.order}: expected four scores`);
  assert(article.scores.every(score => score >= 4 && score <= 5), `KPI article ${article.order}: score outside pass range`);
}

const capstone = fs.readFileSync(path.join(root, files.find(file => file.startsWith("08-"))), "utf8");
const capstonePython = [...capstone.matchAll(/```python\n([\s\S]*?)```/g)].map(match => match[1]).join("\n\n");
const capstoneTest = `${capstonePython}\n\ntest_cycle_is_rejected()\ntest_runtime_stops_at_max_steps()\ntest_write_requires_approval()\nprint('capstone-tests-ok')\n`;
const temp = path.join(os.tmpdir(), `agent-capstone-${process.pid}.py`);
fs.writeFileSync(temp, capstoneTest);
const test = spawnSync("python", [temp], { encoding: "utf8" });
fs.rmSync(temp, { force: true });
assert(test.status === 0 && test.stdout.includes("capstone-tests-ok"), `capstone runtime tests failed: ${test.stderr.trim()}`);

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Agent validation passed: ${files.length} articles, ${figureCount} storyboard figures and 1600x900 PNGs (${(totalImageBytes / 1024 / 1024).toFixed(2)} MiB), stable ${slugs.size}-slug URL set, capstone tests OK.`);
