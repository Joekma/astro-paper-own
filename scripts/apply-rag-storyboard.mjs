import fs from "node:fs/promises";
import path from "node:path";
import { articles } from "./rag-academic-image-storyboard.mjs";

const root = path.resolve("src/data/blog/AI/RAG");

for (const article of articles) {
  const markdownPath = path.join(root, article.file);
  const original = await fs.readFile(markdownPath, "utf8");
  let lines = original
    .split(/\r?\n/)
    .filter((line) => !/^!\[[^\]]*\]\(\.\/images\/[^)]+\.(?:png|svg)\)\s*$/.test(line.trim()));

  const grouped = new Map();
  for (const figure of article.figures) {
    const figures = grouped.get(figure.anchor) ?? [];
    figures.push(figure);
    grouped.set(figure.anchor, figures);
  }

  const insertions = [];
  for (const [anchor, figures] of grouped) {
    const headingIndex = lines.findIndex(
      (line) => /^#{1,6}\s+/.test(line) && line.includes(anchor),
    );
    if (headingIndex < 0) {
      throw new Error(`${article.file}: missing heading anchor ${anchor}`);
    }
    const imageLines = figures.flatMap((figure) => [
      "",
      `![${figure.learningObjective.replace(/[\[\]]/g, "") }](./images/${figure.file})`,
    ]);
    insertions.push({ headingIndex, imageLines });
  }

  insertions
    .sort((a, b) => b.headingIndex - a.headingIndex)
    .forEach(({ headingIndex, imageLines }) => {
      lines.splice(headingIndex + 1, 0, ...imageLines);
    });

  const output = `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
  await fs.writeFile(markdownPath, output, "utf8");
  console.log(`${article.article}: ${article.figures.length} images -> ${article.file}`);
}
