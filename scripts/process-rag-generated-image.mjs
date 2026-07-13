import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("usage: node scripts/process-rag-generated-image.mjs <input> <output>");
  process.exit(1);
}

const destination = resolve(output);
await mkdir(dirname(destination), { recursive: true });

await sharp(resolve(input))
  .flatten({ background: "#ffffff" })
  .resize(1600, 900, {
    fit: "contain",
    background: "#ffffff",
    withoutEnlargement: false,
  })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(destination);

const metadata = await sharp(destination).metadata();
console.log(
  JSON.stringify(
    {
      output: destination,
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    },
    null,
    2,
  ),
);
