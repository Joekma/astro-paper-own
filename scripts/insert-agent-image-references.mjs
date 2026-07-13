import fs from "node:fs";
import path from "node:path";
import { storyboard } from "./agent-academic-image-storyboard.mjs";

const root = path.resolve("src/data/blog/AI/Agent");

for (const article of storyboard) {
  const articlePath = path.join(root, article.file);
  let content = fs.readFileSync(articlePath, "utf8");
  const byAnchor = new Map();

  for (const figure of article.figures) {
    const figures = byAnchor.get(figure.insertionAnchor) ?? [];
    figures.push(figure);
    byAnchor.set(figure.insertionAnchor, figures);
  }

  for (const [anchor, figures] of byAnchor) {
    const references = figures
      .map(figure => `![${figure.cognitiveQuestion.replace(/？$/, "")}](./images/${figure.filename})`)
      .join("\n\n");
    if (figures.every(figure => content.includes(`./images/${figure.filename}`))) continue;
    const occurrences = content.split(anchor).length - 1;
    if (occurrences !== 1) throw new Error(`${article.file}: anchor must occur exactly once: ${anchor}`);
    content = content.replace(anchor, `${anchor}\n\n${references}`);
  }

  fs.writeFileSync(articlePath, content);
}

console.log(`Inserted ${storyboard.reduce((sum, article) => sum + article.figures.length, 0)} Agent image references.`);
