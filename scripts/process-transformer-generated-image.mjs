import path from "node:path";
import sharp from "sharp";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, value, index, values) => {
    if (value.startsWith("--")) pairs.push([value.slice(2), values[index + 1]]);
    return pairs;
  }, []),
);

if (!args.input || !args.output) {
  throw new Error("Usage: node process-transformer-generated-image.mjs --input <source> --output <destination>");
}

await sharp(path.resolve(args.input))
  .resize(1600, 900, { fit: "fill" })
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile(path.resolve(args.output));
