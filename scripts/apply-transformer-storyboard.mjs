import fs from "node:fs";
import path from "node:path";
import { articles, allFigures } from "./transformer-academic-image-storyboard.mjs";

const root = path.resolve("src/data/blog/AI/Transform");
const markdownFiles = fs
  .readdirSync(root)
  .filter((name) => /^\d{2}-.*\.md$/u.test(name))
  .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));

if (markdownFiles.length !== articles.length) {
  throw new Error(`Expected ${articles.length} articles, found ${markdownFiles.length}`);
}

const imageLine = /^!\[[^\]]*\]\(\.\/images\/[^)]+\)\s*$/u;
let inserted = 0;

for (const article of articles) {
  const file = markdownFiles[article.article - 1];
  const fullPath = path.join(root, file);
  const source = fs.readFileSync(fullPath, "utf8");
  const lines = source.split(/\r?\n/u).filter((line) => !imageLine.test(line.trim()));
  const grouped = new Map();

  for (const figure of article.figures) {
    const list = grouped.get(figure.anchor) ?? [];
    list.push(figure);
    grouped.set(figure.anchor, list);
  }

  const seen = new Set();
  const output = [];
  for (const line of lines) {
    output.push(line);
    const match = line.match(/^#{2,3}\s+(.+?)\s*$/u);
    if (!match) continue;
    const heading = match[1].replace(/\s+#+$/u, "").trim();
    const matchingAnchors = [...grouped.keys()].filter(
      (candidate) =>
        heading === candidate ||
        heading.startsWith(`${candidate}：`) ||
        heading.startsWith(`${candidate}:`) ||
        heading.includes(candidate),
    );
    if (!matchingAnchors.length) continue;

    output.push("");
    for (const anchor of matchingAnchors) {
      for (const figure of grouped.get(anchor)) {
        output.push(`![${figure.learningObjective}](./images/${figure.file})`, "");
        inserted += 1;
      }
      seen.add(anchor);
    }
  }

  const missingAnchors = [...grouped.keys()].filter((anchor) => !seen.has(anchor));
  if (missingAnchors.length) {
    throw new Error(`${file}: missing anchors: ${missingAnchors.join(" | ")}`);
  }

  fs.writeFileSync(fullPath, `${output.join("\n").replace(/\n{3,}/gu, "\n\n").trimEnd()}\n`, "utf8");
}

if (inserted !== allFigures.length) {
  throw new Error(`Expected ${allFigures.length} inserted figures, got ${inserted}`);
}

console.log(`Updated ${markdownFiles.length} articles with ${inserted} PNG references.`);
