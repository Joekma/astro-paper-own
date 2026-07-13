import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("src/data/blog/AI/RAG/images");
const outDir = path.resolve("scripts/rag-contact-sheets");
await fs.mkdir(outDir, { recursive: true });

for (let article = 1; article <= 8; article += 1) {
  const prefix = `r${String(article).padStart(2, "0")}-`;
  const files = (await fs.readdir(root))
    .filter((file) => file.startsWith(prefix) && file.endsWith(".png"))
    .sort();

  const columns = 2;
  const cellWidth = 800;
  const imageHeight = 450;
  const labelHeight = 44;
  const cellHeight = imageHeight + labelHeight;
  const rows = Math.ceil(files.length / columns);
  const composites = [];

  for (const [index, file] of files.entries()) {
    const left = (index % columns) * cellWidth;
    const top = Math.floor(index / columns) * cellHeight;
    const image = await sharp(path.join(root, file))
      .resize(cellWidth, imageHeight, { fit: "contain", background: "#ffffff" })
      .png()
      .toBuffer();
    const safeLabel = file.replace(/[&<>]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[character]);
    const label = Buffer.from(
      `<svg width="${cellWidth}" height="${labelHeight}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f4f6f8"/><text x="16" y="30" font-family="Arial, sans-serif" font-size="22" fill="#263238">${safeLabel}</text></svg>`,
    );
    composites.push({ input: image, left, top });
    composites.push({ input: label, left, top: top + imageHeight });
  }

  await sharp({
    create: {
      width: columns * cellWidth,
      height: rows * cellHeight,
      channels: 3,
      background: "#ffffff",
    },
  })
    .composite(composites)
    .png()
    .toFile(path.join(outDir, `${prefix.slice(0, -1)}-contact-sheet.png`));
}

console.log(`created 8 contact sheets in ${outDir}`);
