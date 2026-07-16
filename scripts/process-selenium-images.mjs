import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const root = path.resolve("src/data/blog/RPA/网页自动化/Selenium");
const seriesDir = path.join(root, "series-assets");
if (process.argv.includes("--cleanup-staging")) {
  const stagingTargets = [
    path.join(seriesDir, "generated"),
    path.join(seriesDir, "contact-sheets"),
  ];
  for (const target of stagingTargets) {
    const resolved = path.resolve(target);
    if (!resolved.startsWith(`${path.resolve(root)}${path.sep}`)) {
      throw new Error(`Refusing staging cleanup outside Selenium series: ${resolved}`);
    }
    fs.rmSync(resolved, { recursive: true, force: true });
  }
  console.log(`Removed ${stagingTargets.length} Selenium staging directories.`);
  process.exit(0);
}
const sourceDir = path.resolve(process.argv[2] ?? path.join(seriesDir, "samples", "raw"));
const outputDir = path.resolve(process.argv[3] ?? path.join(seriesDir, "samples", "processed"));
const storyboard = JSON.parse(
  fs.readFileSync(path.join(seriesDir, "image-storyboard.json"), "utf8"),
);
const allowed = new Set(storyboard.figures.map((figure) => figure.filename));

fs.mkdirSync(outputDir, { recursive: true });
const manifest = [];
for (const name of fs.readdirSync(sourceDir).filter((file) => /\.(png|webp|jpe?g)$/i.test(file))) {
  if (!allowed.has(name)) throw new Error(`File is not in storyboard: ${name}`);
  const input = path.join(sourceDir, name);
  const output = path.join(outputDir, name.replace(/\.(webp|jpe?g)$/i, ".png"));
  await sharp(input)
    .flatten({ background: "#F7F9FC" })
    .resize(1600, 900, {
      fit: "contain",
      background: "#F7F9FC",
      withoutEnlargement: false,
    })
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: true,
      colours: 128,
      quality: 100,
      effort: 10,
      dither: 0.35,
    })
    .toFile(output);
  const metadata = await sharp(output).metadata();
  const stat = fs.statSync(output);
  manifest.push({
    filename: path.basename(output),
    width: metadata.width,
    height: metadata.height,
    format: metadata.format,
    bytes: stat.size,
  });
}

fs.writeFileSync(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), files: manifest }, null, 2)}\n`,
  "utf8",
);
console.log(JSON.stringify(manifest, null, 2));
