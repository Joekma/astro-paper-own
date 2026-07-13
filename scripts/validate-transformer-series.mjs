import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { allFigures } from "./transformer-academic-image-storyboard.mjs";

const root = path.resolve("src/data/blog/AI/Transform");
const imageDir = path.join(root, "images");
const files = fs
  .readdirSync(root)
  .filter((name) => name.endsWith(".md") && Number.isInteger(Number.parseInt(name.slice(0, 2), 10)))
  .sort((a, b) => a.localeCompare(b, "zh-CN", { numeric: true }));

const readField = (frontmatter, key) => {
  const prefix = `${key}:`;
  const line = frontmatter.split(/\r?\n/u).find((item) => item.startsWith(prefix));
  return line?.slice(prefix.length).trim().replace(/^['"]|['"]$/gu, "");
};

const refs = [];
const metadata = [];
for (const [index, file] of files.entries()) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const frontmatter = source.split("---")[1] ?? "";
  const row = {
    file,
    title: readField(frontmatter, "title"),
    slug: readField(frontmatter, "slug"),
    seriesOrder: Number(readField(frontmatter, "seriesOrder")),
  };
  if (!row.title || !row.slug || row.seriesOrder !== index + 1) {
    throw new Error(`Invalid frontmatter: ${JSON.stringify(row)}`);
  }
  metadata.push(row);

  for (const line of source.split(/\r?\n/u)) {
    const marker = "](./images/";
    const start = line.indexOf(marker);
    if (start < 0) continue;
    const end = line.indexOf(")", start);
    refs.push(line.slice(start + marker.length, end));
  }
}

if (files.length !== 12 || new Set(metadata.map((row) => row.slug)).size !== 12) {
  throw new Error("Expected 12 articles with unique slugs.");
}

const expected = new Set(allFigures.map((figure) => figure.file));
const actual = new Set(refs);
if (refs.length !== 113 || actual.size !== 113) throw new Error("Expected 113 unique image references.");
if ([...expected].some((file) => !actual.has(file))) throw new Error("Storyboard reference is missing.");
if (refs.some((file) => file.endsWith(".svg"))) throw new Error("SVG reference remains.");

const imageFiles = fs.readdirSync(imageDir);
if (imageFiles.length !== 113 || imageFiles.some((file) => !file.endsWith(".png"))) {
  throw new Error("Image directory must contain exactly 113 PNG files.");
}

let bytes = 0;
for (const file of imageFiles) {
  const fullPath = path.join(imageDir, file);
  const info = await sharp(fullPath).metadata();
  if (info.format !== "png" || info.width !== 1600 || info.height !== 900) {
    throw new Error(`Invalid image metadata: ${file}`);
  }
  bytes += fs.statSync(fullPath).size;
}

console.log(
  JSON.stringify(
    {
      articles: files.length,
      uniqueSlugs: new Set(metadata.map((row) => row.slug)).size,
      seriesOrders: metadata.map((row) => row.seriesOrder),
      figures: refs.length,
      dimensions: "1600x900",
      imageSizeMiB: Number((bytes / 1024 / 1024).toFixed(2)),
    },
    null,
    2,
  ),
);
