import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = path.resolve("src/data/blog/RPA/网页自动化/Selenium");
const seriesDir = path.join(root, "series-assets");
const checkOnly = process.argv.includes("--check");
const cleanupLegacy = process.argv.includes("--cleanup-legacy");
const storyboard = JSON.parse(
  fs.readFileSync(path.join(seriesDir, "image-storyboard.json"), "utf8"),
);
const byArticle = Map.groupBy(storyboard.figures, (figure) => figure.article);

for (const figure of storyboard.figures) {
  const imagePath = path.join(root, "images", figure.filename);
  if (!fs.existsSync(imagePath)) throw new Error(`Refusing migration; missing ${imagePath}`);
}

for (const [article, figures] of byArticle) {
  const articlePath = path.join(root, article);
  let markdown = fs.readFileSync(articlePath, "utf8").replace(/\r\n/g, "\n");
  for (const figure of figures) {
    const anchor = `<!-- figure-anchor:${figure.anchor} -->`;
    if (!markdown.includes(anchor)) throw new Error(`${article}: missing ${anchor}`);
    const managed = [
      anchor,
      "",
      `<!-- figure-managed:${figure.id}:start -->`,
      "",
      `![${figure.goal}](./images/${figure.filename})`,
      "",
      `<!-- figure-managed:${figure.id}:end -->`,
    ].join("\n");
    const existingManaged = new RegExp(
      `${anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\n+(?:<!-- figure-managed:${figure.id}:start -->[\\s\\S]*?<!-- figure-managed:${figure.id}:end -->|!\\[[^\\]]*\\]\\(\\.\\/images\\/[^)]+\\))?`,
    );
    markdown = markdown.replace(existingManaged, managed);
  }
  if (!checkOnly) fs.writeFileSync(articlePath, markdown, "utf8");
}

let removedLegacy = [];
if (cleanupLegacy && !checkOnly) {
  const imageDir = path.join(root, "images");
  const expected = new Set(storyboard.figures.map((figure) => figure.filename));
  removedLegacy = fs
    .readdirSync(imageDir)
    .filter((name) => /\.(png|webp|jpe?g|gif|svg)$/i.test(name) && !expected.has(name));
  for (const name of removedLegacy) {
    const target = path.resolve(imageDir, name);
    if (path.dirname(target) !== path.resolve(imageDir)) {
      throw new Error(`Refusing legacy cleanup outside image directory: ${target}`);
    }
    fs.rmSync(target);
  }
}

console.log(
  checkOnly
    ? `Migration preflight passed for ${storyboard.figures.length} figures.`
    : `Migrated ${storyboard.figures.length} figure references idempotently; removed ${removedLegacy.length} legacy images.`,
);
