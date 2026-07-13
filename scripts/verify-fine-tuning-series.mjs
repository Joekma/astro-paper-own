import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const articleDir = path.join(root, "src/data/blog/AI/微调");
const articleFiles = readdirSync(articleDir)
  .filter(name => /^\d{2}-.*\.md$/.test(name))
  .sort((a, b) => a.localeCompare(b, "zh-CN"));

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

assert(articleFiles.length === 12, `应有 12 篇文章，实际 ${articleFiles.length}`);

const orders = [];
for (const [index, name] of articleFiles.entries()) {
  const text = readFileSync(path.join(articleDir, name), "utf8");
  const frontmatter = text.match(/^---\s*\n([\s\S]*?)\n---/u)?.[1] ?? "";
  const order = Number(frontmatter.match(/^seriesOrder:\s*(\d+)/mu)?.[1]);
  orders.push(order);

  assert(frontmatter.includes("series: 大模型微调"), `${name}: series 不正确`);
  assert(order === index + 1, `${name}: seriesOrder 应为 ${index + 1}，实际 ${order}`);
  assert(/^modDatetime: 2026-07-12T00:00:00\.000\+08:00$/mu.test(frontmatter), `${name}: modDatetime 未更新`);
  assert(text.includes("学习目标"), `${name}: 缺少学习目标`);
  assert((text.match(/<details>/g) ?? []).length === 3, `${name}: 自检题不是 3 道`);
  assert((text.match(/^```/gm) ?? []).length % 2 === 0, `${name}: code fence 未闭合`);
  assert((text.match(/!\[[^\]]+\]\([^\)]+\)/g) ?? []).length >= 1, `${name}: 缺少现有图片引用`);

  for (const match of text.matchAll(/```json\s*\n([\s\S]*?)\n```/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${name}: JSON 示例无效: ${error.message}`);
    }
  }

  for (const [blockIndex, match] of [...text.matchAll(/```python\s*\n([\s\S]*?)\n```/g)].entries()) {
    try {
      const encoded = Buffer.from(match[1], "utf8").toString("base64");
      execFileSync(
        "python",
        ["-c", "import ast,base64,sys; ast.parse(base64.b64decode(sys.argv[1]).decode('utf-8'))", encoded],
        { stdio: ["ignore", "pipe", "pipe"] }
      );
    } catch (error) {
      const detail = error.stderr?.toString().trim().split("\n").at(-1) ?? error.message;
      errors.push(`${name}: Python 代码块 ${blockIndex + 1} 语法无效（${detail}）`);
    }
  }
}

assert(new Set(orders).size === 12, "seriesOrder 存在重复");

const storyboard = JSON.parse(
  readFileSync(path.join(root, "scripts/fine-tuning-academic-image-storyboard.json"), "utf8")
);
const expectedCounts = [7, 8, 9, 9, 10, 7, 10, 9, 7, 8, 8, 8];
const figures = storyboard.articles.flatMap(article => article.figures);
assert(storyboard.articles.length === 12, "分镜应覆盖 12 篇文章");
assert(figures.length === 100, `分镜应有 100 张图，实际 ${figures.length}`);
assert(storyboard.figureCount === figures.length, "figureCount 与实际分镜不一致");

for (const [index, article] of storyboard.articles.entries()) {
  assert(article.article === index + 1, `分镜篇号 ${article.article} 顺序错误`);
  assert(article.figures.length === expectedCounts[index], `第 ${index + 1} 篇图片数应为 ${expectedCounts[index]}`);
  for (const figure of article.figures) {
    for (const field of storyboard.recordContract.required) {
      assert(figure[field] !== undefined, `${figure.id ?? "未知图"}: 缺少 ${field}`);
    }
    assert(figure.file.endsWith(".png"), `${figure.id}: 文件不是 PNG`);
    assert(Array.isArray(figure.requiredLabels) && figure.requiredLabels.length > 0, `${figure.id}: 缺少逐字标签`);
  }
}

assert(new Set(figures.map(figure => figure.id)).size === figures.length, "分镜 ID 存在重复");
assert(new Set(figures.map(figure => figure.file)).size === figures.length, "分镜文件名存在重复");
assert(figures.filter(figure => figure.status === "prototype-ready").length === 1, "必须且只能有一张 prototype-ready 图片");
assert(figures.find(figure => figure.status === "prototype-ready")?.id === "ft05-f01", "样图必须是 ft05-f01");

const kpi = JSON.parse(readFileSync(path.join(root, "scripts/fine-tuning-content-kpi-review.json"), "utf8"));
assert(kpi.review.length === 12, "KPI 应覆盖 12 篇文章");
for (const row of kpi.review) {
  for (const key of Object.keys(kpi.framework.dimensions)) {
    assert(row[key] >= 4, `第 ${row.article} 篇 KPI ${key} 未达到 4 分`);
  }
}

if (errors.length) {
  console.error(errors.map(error => `- ${error}`).join("\n"));
  process.exit(1);
}

console.log(`PASS: ${articleFiles.length} 篇文章、${figures.length} 张分镜、KPI 与代码块静态检查全部通过。`);
