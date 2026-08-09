import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const basePath = path.join(currentDirectory, "src", "data", "blog");

const seriesMapping = {
  "AI\\Prompt": "Prompt",
  "Python\\Python 基础": "Python 基础",
  "Python\\Python 中级": "Python 中级",
  "Python\\Python 高级": "Python 高级",
  "Python\\Flask": "Flask",
  "Python\\Django": "Django",
  "Python\\设计模式": "设计模式",
  "Python\\Python 常用外部库": "Python 常用外部库",
  "前端\\HTML": "HTML",
  "前端\\CSS": "CSS",
  "前端\\JS": "JavaScript",
  "前端\\Vue": "Vue",
  "前端\\TypeScript": "TypeScript",
  "前端\\Tailwind CSS": "Tailwind CSS",
  "前端\\Astro": "Astro",
  "数据库\\Redis": "Redis",
  "数据库\\关系型数据库\\MySQL": "MySQL",
  "数据库\\向量数据库\\Milvus": "Milvus",
  "数据库\\向量数据库\\Qdrant": "Qdrant",
  消息队列: "消息队列",
  网络: "网络",
  爬虫: "爬虫",
  "DevOps\\Docker": "Docker",
  Linux: "Linux",
  Go: "Go",
  Git: "Git",
  Avalonia: "Avalonia",
  "C Sharp\\C Sharp": "C#",
  "RPA\\网页自动化\\Selenium": "Selenium",
  "RPA\\网页自动化\\Playwright": "Playwright",
  "RPA\\桌面端自动化\\UI Automation": "UI Automation",
  "RPA\\桌面端自动化\\win32com": "win32com",
  打包: "桌面应用打包",
};

let totalCount = 0;

for (const [relativePath, seriesName] of Object.entries(seriesMapping)) {
  const fullPath = path.join(basePath, relativePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`Path not found: ${fullPath}`);
    continue;
  }

  const files = fs.readdirSync(fullPath).filter(file => file.endsWith(".md"));
  let count = 0;

  for (const file of files) {
    const filePath = path.join(fullPath, file);
    let content = fs.readFileSync(filePath, "utf8");

    if (/^series:/m.test(content)) {
      continue;
    }

    if (/^language:/m.test(content)) {
      content = content.replace(
        /^language:/m,
        `series: ${seriesName}\nlanguage:`
      );
      fs.writeFileSync(filePath, content, "utf8");
      count++;
      totalCount++;
    }
  }

  if (count > 0) {
    console.log(`Updated ${count} files in ${relativePath}`);
  }
}

console.log(`\nTotal updated: ${totalCount} files`);
