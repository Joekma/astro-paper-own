import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import sharp from "sharp";
import { articles, validateStoryboard } from "./rag-academic-image-storyboard.mjs";

const root = resolve("src/data/blog/AI/RAG");
const markdownFiles = readdirSync(root)
  .filter((file) => file.endsWith(".md"))
  .map((file) => join(root, file));

const errors = [];
const slugs = new Set();
const orders = [];
let pythonBlocks = 0;
let markdownImageRefs = 0;

if (markdownFiles.length !== 8) errors.push(`expected 8 Markdown files, got ${markdownFiles.length}`);

for (const file of markdownFiles) {
  const text = readFileSync(file, "utf8");
  const frontmatter = text.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) {
    errors.push(`${basename(file)}: invalid frontmatter`);
    continue;
  }

  const slug = frontmatter[1].match(/^slug:\s*(.+)$/m)?.[1]?.trim();
  const order = Number(frontmatter[1].match(/^seriesOrder:\s*(\d+)$/m)?.[1]);
  if (!slug) errors.push(`${basename(file)}: missing slug`);
  if (slugs.has(slug)) errors.push(`${basename(file)}: duplicate slug ${slug}`);
  slugs.add(slug);
  orders.push(order);

  if ((text.match(/<summary>/g) ?? []).length !== 3) {
    errors.push(`${basename(file)}: expected exactly 3 self-check questions`);
  }
  if (!text.includes("## 对应资料来源")) errors.push(`${basename(file)}: missing sources section`);
  if (!text.includes("## 常见误区")) errors.push(`${basename(file)}: missing misconceptions section`);

  const fenceCount = (text.match(/^```/gm) ?? []).length;
  if (fenceCount % 2 !== 0) errors.push(`${basename(file)}: unbalanced code fences`);

  for (const match of text.matchAll(/```python\n([\s\S]*?)\n```/g)) {
    pythonBlocks += 1;
    const result = spawnSync("python", ["-c", "import sys; compile(sys.stdin.read(), '<markdown>', 'exec')"], {
      input: Buffer.from(match[1], "utf8"),
      encoding: "utf8",
      env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
    });
    if (result.status !== 0) {
      errors.push(`${basename(file)}: invalid Python block: ${result.stderr.trim()}`);
    }
  }

  for (const match of text.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) {
    markdownImageRefs += 1;
    const imagePath = resolve(dirname(file), match[1]);
    if (!existsSync(imagePath)) errors.push(`${basename(file)}: missing image ${match[1]}`);
    if (!match[1].endsWith(".png")) errors.push(`${basename(file)}: non-PNG image ${match[1]}`);
  }

  if (/OPENAI_API_KEY\s*=\s*["']?sk-[A-Za-z0-9_-]{20,}/.test(text)) {
    errors.push(`${basename(file)}: possible hard-coded API key`);
  }
}

if (orders.sort((a, b) => a - b).join(",") !== "1,2,3,4,5,6,7,8") {
  errors.push(`seriesOrder must be 1..8, got ${orders.join(",")}`);
}

const storyboard = validateStoryboard();
for (const article of articles) {
  const file = join(root, article.file);
  const text = readFileSync(file, "utf8");
  const refs = [...text.matchAll(/!\[[^\]]*\]\(\.\/images\/([^)]+)\)/g)].map((match) => match[1]);
  const expected = article.figures.map((figure) => figure.file);
  if (refs.length !== expected.length) {
    errors.push(`${article.file}: expected ${expected.length} image refs, got ${refs.length}`);
  }
  for (const filename of expected) {
    if (!refs.includes(filename)) errors.push(`${article.file}: missing final image ref ${filename}`);
  }
  for (const figure of article.figures) {
    if (!text.includes(figure.anchor)) {
      errors.push(`${article.file}: missing storyboard anchor ${figure.anchor} for ${figure.id}`);
    }
  }
}

const imagesDir = join(root, "images");
const finalImages = readdirSync(imagesDir).filter((file) => file.endsWith(".png"));
const expectedImages = articles.flatMap((article) => article.figures.map((figure) => figure.file));
if (finalImages.length !== expectedImages.length) {
  errors.push(`expected ${expectedImages.length} final PNG files, got ${finalImages.length}`);
}
for (const filename of expectedImages) {
  const imagePath = join(imagesDir, filename);
  if (!existsSync(imagePath)) {
    errors.push(`missing final PNG ${filename}`);
    continue;
  }
  const metadata = await sharp(imagePath).metadata();
  if (metadata.width !== 1600 || metadata.height !== 900) {
    errors.push(`${filename}: expected 1600x900, got ${metadata.width}x${metadata.height}`);
  }
}
const nonPngFiles = readdirSync(imagesDir).filter((file) => !file.endsWith(".png"));
if (nonPngFiles.length) errors.push(`images directory contains non-PNG files: ${nonPngFiles.join(", ")}`);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      markdownFiles: markdownFiles.length,
      seriesOrder: orders,
      uniqueSlugs: slugs.size,
      pythonBlocks,
      figures: storyboard.figures,
      markdownImageRefs,
      finalPngFiles: finalImages.length,
      selfChecks: 24,
    },
    null,
    2,
  ),
);
