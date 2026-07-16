import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import os from "node:os";

const root = path.resolve("src/data/blog/RPA/网页自动化/Selenium");
const seriesDir = path.join(root, "series-assets");
const finalMode = process.argv.includes("--final");
const writeReport = process.argv.includes("--write-report");
const requiredFrontmatter = [
  "title",
  "series",
  "seriesOrder",
  "author",
  "pubDatetime",
  "modDatetime",
  "slug",
  "description",
  "draft",
  "language",
];
const requiredHeadings = [
  "前置知识与学习目标",
  "真实场景与核心问题",
  "常见误区与适用边界",
  "本篇自检",
  "本篇总结",
  "下一篇衔接",
  "资料来源与版本基线",
];

function parseFrontmatter(markdown) {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) return { data: {}, body: markdown, error: "missing frontmatter" };
  const data = {};
  for (const line of match[1].split("\n")) {
    const pair = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
    if (!pair) continue;
    data[pair[1]] = pair[2].replace(/^['"]|['"]$/g, "");
  }
  return { data, body: markdown.slice(match[0].length), error: null };
}

function outsideFences(markdown) {
  let inFence = false;
  return markdown
    .split("\n")
    .map((line) => {
      if (/^```/.test(line)) {
        inFence = !inFence;
        return "";
      }
      return inFence ? "" : line;
    })
    .join("\n");
}

function countLearningUnits(text) {
  return (text.match(/[\p{Script=Han}]|\b[A-Za-z0-9_]+\b/gu) ?? []).length;
}

function inspectMarkdown(file, markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const parsed = parseFrontmatter(normalized);
  const visible = outsideFences(parsed.body);
  const headings = [...visible.matchAll(/^(#{1,6})\s+(.+)$/gm)].map((m) => ({
    level: m[1].length,
    text: m[2].trim(),
  }));
  const images = [...visible.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)].map((m) => m[1]);
  const anchors = [...visible.matchAll(/<!--\s*figure-anchor:([a-z0-9-]+)\s*-->/g)].map(
    (m) => m[1],
  );
  const fenceLines = normalized.match(/^```/gm) ?? [];
  const codeBlocks = [...normalized.matchAll(/^```([^\n]*)$/gm)]
    .map((m) => m[1].trim())
    .filter(Boolean).length;
  const errors = [];
  if (parsed.error) errors.push(parsed.error);
  for (const key of requiredFrontmatter) {
    if (parsed.data[key] === undefined || parsed.data[key] === "") {
      errors.push(`missing frontmatter field: ${key}`);
    }
  }
  if (fenceLines.length % 2 !== 0) errors.push("unbalanced code fences");
  for (const heading of requiredHeadings) {
    if (!headings.some((item) => item.text === heading)) errors.push(`missing heading: ${heading}`);
  }
  if ((visible.match(/<details>/g) ?? []).length !== 3) {
    errors.push("self-check must contain exactly 3 details blocks");
  }
  if (anchors.length !== 2) errors.push(`expected 2 figure anchors, found ${anchors.length}`);
  return {
    file,
    title: parsed.data.title,
    slug: parsed.data.slug,
    seriesOrder: Number(parsed.data.seriesOrder),
    characters: normalized.length,
    learningUnits: countLearningUnits(visible),
    headings: headings.length,
    codeBlocks,
    imageReferences: images,
    anchors,
    errors,
  };
}

const files = fs
  .readdirSync(root)
  .filter((name) => /^\d{2}-.*\.md$/u.test(name))
  .sort((a, b) => a.localeCompare(b, "zh-CN"));
const articles = files.map((file) =>
  inspectMarkdown(file, fs.readFileSync(path.join(root, file), "utf8")),
);
const errors = articles.flatMap((article) => article.errors.map((error) => `${article.file}: ${error}`));
const orders = articles.map((article) => article.seriesOrder);
const slugs = articles.map((article) => article.slug);

if (files.length !== 13) errors.push(`expected 13 articles, found ${files.length}`);
if (new Set(slugs).size !== slugs.length) errors.push("duplicate slug detected");
if (orders.join(",") !== Array.from({ length: 13 }, (_, i) => i + 1).join(",")) {
  errors.push(`seriesOrder must be continuous 1..13, got ${orders.join(",")}`);
}

const pythonBlocks = files.flatMap((file) => {
  const markdown = fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
  return [...markdown.matchAll(/^```python\n([\s\S]*?)^```$/gm)].map((match, index) => ({
    file,
    block: index + 1,
    code: match[1],
  }));
});
const pythonInputPath = path.join(os.tmpdir(), `selenium-python-blocks-${process.pid}.json`);
fs.writeFileSync(pythonInputPath, JSON.stringify(pythonBlocks), "utf8");
const pythonCheck = spawnSync(
  "python",
  [
    "-c",
    "import json,sys\nitems=json.load(open(sys.argv[1],encoding='utf-8'))\nout=[]\nfor item in items:\n  try: compile(item['code'], f\"{item['file']}#block-{item['block']}\", 'exec')\n  except SyntaxError as e: out.append({'file':item['file'],'block':item['block'],'line':e.lineno,'message':e.msg})\njson.dump(out,sys.stdout,ensure_ascii=False)",
    pythonInputPath,
  ],
  { encoding: "utf8" },
);
fs.rmSync(pythonInputPath, { force: true });
const pythonSyntaxErrors = pythonCheck.status === 0 ? JSON.parse(pythonCheck.stdout || "[]") : [];
if (pythonCheck.status !== 0) errors.push(`python syntax checker failed: ${pythonCheck.stderr}`);
for (const issue of pythonSyntaxErrors) {
  errors.push(
    `${issue.file}: python block ${issue.block}, line ${issue.line}: ${issue.message}`,
  );
}

const allAnchors = new Set(articles.flatMap((article) => article.anchors));
let storyboard = [];
const storyboardPath = path.join(seriesDir, "image-storyboard.json");
if (fs.existsSync(storyboardPath)) {
  const parsed = JSON.parse(fs.readFileSync(storyboardPath, "utf8"));
  storyboard = parsed.figures ?? [];
  const ids = storyboard.map((item) => item.id);
  const names = storyboard.map((item) => item.filename);
  if (new Set(ids).size !== ids.length) errors.push("storyboard figure IDs are not unique");
  if (new Set(names).size !== names.length) errors.push("storyboard filenames are not unique");
  for (const figure of storyboard) {
    if (!allAnchors.has(figure.anchor)) errors.push(`storyboard anchor missing: ${figure.anchor}`);
  }
  if (storyboard.length !== allAnchors.size) {
    errors.push(`storyboard count ${storyboard.length} != anchor count ${allAnchors.size}`);
  }
}

const imageDir = path.join(root, "images");
const imageFiles = fs.existsSync(imageDir)
  ? fs.readdirSync(imageDir).filter((name) => /\.(png|webp|jpe?g|gif|svg)$/i.test(name))
  : [];
const referencedFiles = articles
  .flatMap((article) => article.imageReferences)
  .filter((ref) => ref.startsWith("./images/"))
  .map((ref) => path.basename(ref));

if (finalMode) {
  const storyboardNames = new Set(storyboard.map((item) => item.filename));
  const references = new Set(referencedFiles);
  if (referencedFiles.length !== storyboard.length) {
    errors.push(`final reference count ${referencedFiles.length} != storyboard count ${storyboard.length}`);
  }
  for (const name of storyboardNames) {
    if (!references.has(name)) errors.push(`final figure not referenced: ${name}`);
    if (!imageFiles.includes(name)) errors.push(`final figure file missing: ${name}`);
  }
  for (const name of imageFiles) {
    if (!storyboardNames.has(name)) errors.push(`orphan or legacy image: ${name}`);
  }
  if (imageFiles.some((name) => !name.endsWith(".png"))) errors.push("non-PNG final image found");
}

const report = {
  generatedAt: new Date().toISOString(),
  mode: finalMode ? "final" : "content-freeze",
  summary: {
    articles: articles.length,
    anchors: allAnchors.size,
    storyboardFigures: storyboard.length,
    imageFiles: imageFiles.length,
    imageReferences: referencedFiles.length,
    pythonBlocks: pythonBlocks.length,
    pythonSyntaxErrors: pythonSyntaxErrors.length,
    errors: errors.length,
  },
  articles,
  pythonSyntaxErrors,
  errors,
};

if (writeReport) {
  fs.mkdirSync(seriesDir, { recursive: true });
  fs.writeFileSync(
    path.join(seriesDir, finalMode ? "final-validation.json" : "content-validation.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );
}

console.log(JSON.stringify(report, null, 2));
process.exitCode = errors.length === 0 ? 0 : 1;
