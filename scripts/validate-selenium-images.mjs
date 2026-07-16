import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const root = path.resolve("src/data/blog/RPA/网页自动化/Selenium");
const seriesDir = path.join(root, "series-assets");
const noContact = process.argv.includes("--no-contact");
const sourceDir = path.resolve(process.argv[2] ?? path.join(root, "images"));
const sheetDir = path.resolve(
  process.argv[3] ?? path.join(seriesDir, "contact-sheets"),
);
const storyboard = JSON.parse(
  fs.readFileSync(path.join(seriesDir, "image-storyboard.json"), "utf8"),
);
const expected = storyboard.figures.map((figure) => figure.filename).sort();
const actual = fs
  .readdirSync(sourceDir)
  .filter((file) => file.toLowerCase().endsWith(".png"))
  .sort();
const errors = [];

for (const name of expected.filter((name) => !actual.includes(name))) {
  errors.push(`missing: ${name}`);
}
for (const name of actual.filter((name) => !expected.includes(name))) {
  errors.push(`unexpected: ${name}`);
}

const files = [];
for (const name of actual.filter((name) => expected.includes(name))) {
  const fullPath = path.join(sourceDir, name);
  const metadata = await sharp(fullPath).metadata();
  const bytes = fs.statSync(fullPath).size;
  const record = {
    filename: name,
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    bytes,
  };
  files.push(record);
  if (metadata.format !== storyboard.target.format) errors.push(`${name}: format=${metadata.format}`);
  if (metadata.width !== storyboard.target.width || metadata.height !== storyboard.target.height) {
    errors.push(`${name}: size=${metadata.width}x${metadata.height}`);
  }
  if (bytes > storyboard.target.maxBytes) errors.push(`${name}: bytes=${bytes}`);
}

const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
if (totalBytes > storyboard.target.budgetBytes) errors.push(`totalBytes=${totalBytes}`);

if (!noContact) fs.mkdirSync(sheetDir, { recursive: true });
for (let offset = 0; !noContact && offset < files.length; offset += 4) {
  const page = files.slice(offset, offset + 4);
  const composites = [];
  for (let index = 0; index < page.length; index += 1) {
    const x = (index % 2) * 800 + 30;
    const y = Math.floor(index / 2) * 475 + 48;
    const image = await sharp(path.join(sourceDir, page[index].filename))
      .resize(740, 416, { fit: "contain", background: "#F7F9FC" })
      .png()
      .toBuffer();
    composites.push({ input: image, left: x, top: y });
    const label = Buffer.from(
      `<svg width="740" height="38"><rect width="740" height="38" fill="#0F172A"/><text x="16" y="26" font-size="21" font-family="Arial, sans-serif" fill="white">${page[index].filename}</text></svg>`,
    );
    composites.push({ input: label, left: x, top: y - 38 });
  }
  await sharp({
    create: { width: 1600, height: 950, channels: 3, background: "#E2E8F0" },
  })
    .composite(composites)
    .png()
    .toFile(path.join(sheetDir, `contact-${String(offset / 4 + 1).padStart(2, "0")}.png`));
}

const report = {
  generatedAt: new Date().toISOString(),
  sourceDir,
  expectedCount: expected.length,
  actualCount: actual.length,
  totalBytes,
  budgetBytes: storyboard.target.budgetBytes,
  files,
  errors,
  status: errors.length === 0 ? "pass" : "fail",
};
fs.writeFileSync(
  path.join(seriesDir, "image-validation.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(report, null, 2));
if (errors.length) process.exitCode = 1;
