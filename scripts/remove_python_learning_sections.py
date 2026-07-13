"""Remove the previously generated learning-summary sections from all articles."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).parents[1] / "src/data/blog/Python"
HEADINGS = (
    "核心模型",
    "核心 API/语法速查",
    "深入原理与完整实践",
    "复习题",
)


def main() -> None:
    changed = 0
    removed = 0
    for path in sorted(ROOT.rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        original = text
        for heading in HEADINGS:
            pattern = rf"(?ms)^## {re.escape(heading)}\s*$.*?(?=^##\s|\Z)"
            text, count = re.subn(pattern, "", text)
            removed += count
        text = re.sub(r"\n{3,}", "\n\n", text).rstrip() + "\n"
        if text != original:
            path.write_text(text, encoding="utf-8", newline="\n")
            changed += 1
    print(f"removed {removed} sections from {changed} articles")


if __name__ == "__main__":
    main()
