import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const [, , input, output] = process.argv;

if (!input || !output) {
  process.stderr.write(
    "Usage: node scripts/process-llamaindex-generated-image.mjs <input> <output>\n"
  );
  process.exit(2);
}

await sharp(path.resolve(input))
  .flatten({ background: "#ffffff" })
  .resize(1600, 900, {
    fit: "contain",
    background: "#ffffff",
    withoutEnlargement: false,
  })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.resolve(output));

const metadata = await sharp(path.resolve(output)).metadata();
if (metadata.width !== 1600 || metadata.height !== 900 || metadata.format !== "png") {
  throw new Error(`Unexpected output metadata: ${JSON.stringify(metadata)}`);
}

process.stdout.write(
  `${path.resolve(output)} ${metadata.width}x${metadata.height}\n`
);
