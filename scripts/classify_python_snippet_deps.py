"""Infer declared third-party dependencies from imports in Python snippets."""

from __future__ import annotations

import ast
import re

from verify_python_articles import ARTICLES, PYTHON_LANGS, iter_snippets


PACKAGES = {
    "django": "Django==6.0.7",
    "flask": "Flask==3.1.3",
    "flask_login": "Flask-Login==0.6.3",
    "flask_session": "Flask-Session==0.8.0",
    "flask_sqlalchemy": "Flask-SQLAlchemy==3.1.1",
    "sqlalchemy": "SQLAlchemy==2.0.51",
    "numpy": "numpy==2.5.1",
    "pandas": "pandas==3.0.3",
    "pydantic": "pydantic==2.12.5",
    "PIL": "Pillow==12.3.0",
    "bs4": "beautifulsoup4==4.15.0",
    "celery": "celery==5.6.3",
    "pika": "pika==1.4.1",
    "pymysql": "PyMySQL==1.1.2",
    "wtforms": "WTForms==3.2.2",
}


def imports(code: str) -> set[str]:
    tree = ast.parse(code)
    result: set[str] = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            result.update(alias.name.split(".", 1)[0] for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            result.add(node.module.split(".", 1)[0])
    return result


def main() -> None:
    changed = 0
    for path in sorted(ARTICLES.rglob("*.md")):
        text = path.read_text(encoding="utf-8")
        lines = text.splitlines(keepends=True)
        snippets, _ = iter_snippets(path)
        replacements: dict[int, str] = {}
        for snippet in snippets:
            if snippet.language not in PYTHON_LANGS or not snippet.metadata:
                continue
            try:
                required = sorted({PACKAGES[name] for name in imports(snippet.code) if name in PACKAGES})
            except SyntaxError:
                continue
            if not required:
                continue
            metadata_line = snippet.line - 1  # one-based fence; metadata is previous line
            old = lines[metadata_line - 1]
            new = re.sub(r"\bdeps=\S+", "deps=" + ",".join(required), old)
            if new != old:
                replacements[metadata_line - 1] = new
        for index, value in replacements.items():
            lines[index] = value
        if replacements:
            path.write_text("".join(lines), encoding="utf-8", newline="")
            changed += len(replacements)
    print(f"classified dependencies for {changed} snippets")


if __name__ == "__main__":
    main()
