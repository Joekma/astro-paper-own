#!/usr/bin/env python3
"""Validate fenced examples in the Python article collection.

The checker intentionally uses only the standard library so structural and
syntax checks can run before third-party documentation dependencies are
installed. Every fenced block is described by a metadata comment immediately
before it, for example:

    <!-- snippet: id=python-asyncio-01 mode=run python=3.12-3.14 deps=stdlib -->

Use --write-metadata once after adding an article to create deterministic
metadata for unclassified fences. Authors must then review the inferred mode.
"""

from __future__ import annotations

import argparse
import ast
import hashlib
import os
from pathlib import Path
import re
# The runner invokes only the current interpreter and never enables a shell.
import subprocess  # nosec B404
import sys
import tempfile
from dataclasses import dataclass


ROOT = Path(__file__).resolve().parents[1]
ARTICLES = ROOT / "src" / "data" / "blog" / "Python"
META_RE = re.compile(r"^<!-- snippet:\s*(?P<body>.*?)\s*-->$")
FENCE_RE = re.compile(r"^(?P<indent>\s*)(?P<fence>`{3,}|~{3,})(?P<info>.*)$")
VALID_MODES = {
    "run",
    "expected-error",
    "compile",
    "project",
    "service",
    "sandbox",
    "display",
}
PYTHON_LANGS = {"python", "py", "python3"}
SECRET_PATTERNS = {
    "private key": re.compile(
        r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s*\n"
        r"[A-Za-z0-9+/=]{32,}"
    ),
    "OpenAI-style key": re.compile(r"\bsk-[A-Za-z0-9_-]{20,}\b"),
    "AWS access key": re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b"),
    "GitHub token": re.compile(r"\bgh[oprsu]_[A-Za-z0-9]{20,}\b"),
    "QQ mail authorization code": re.compile(
        r"(?i)passwd\s*=\s*['\"][a-z]{16}['\"]\s*#.*授权码"
    ),
}


@dataclass(frozen=True)
class Snippet:
    path: Path
    line: int
    language: str
    code: str
    metadata: dict[str, str] | None


def parse_metadata(line: str) -> dict[str, str] | None:
    match = META_RE.match(line.strip())
    if not match:
        return None
    result: dict[str, str] = {}
    for item in match.group("body").split():
        if "=" not in item:
            continue
        key, value = item.split("=", 1)
        result[key] = value.strip('"\'')
    return result


def iter_snippets(path: Path) -> tuple[list[Snippet], list[str]]:
    lines = path.read_text(encoding="utf-8-sig").splitlines()
    snippets: list[Snippet] = []
    errors: list[str] = []
    opening: tuple[int, str, str, dict[str, str] | None] | None = None
    buffer: list[str] = []

    for index, line in enumerate(lines, 1):
        match = FENCE_RE.match(line)
        if opening is None:
            if not match:
                continue
            fence = match.group("fence")
            info = match.group("info").strip()
            language = info.split(maxsplit=1)[0].lower() if info else ""
            metadata = parse_metadata(lines[index - 2]) if index >= 2 else None
            opening = (index, fence, language, metadata)
            buffer = []
            continue

        start, fence, language, metadata = opening
        if match:
            candidate = match.group("fence")
            trailing = match.group("info").strip()
            if candidate[0] == fence[0] and len(candidate) >= len(fence) and not trailing:
                snippets.append(
                    Snippet(path, start, language, "\n".join(buffer), metadata)
                )
                opening = None
                buffer = []
                continue
        buffer.append(line)

    if opening is not None:
        errors.append(f"{path}:{opening[0]}: unclosed code fence")
    return snippets, errors


def frontmatter_value(text: str, key: str) -> str | None:
    if not text.startswith("---"):
        return None
    frontmatter = text.split("---", 2)[1]
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.+?)\s*$", frontmatter)
    return match.group(1).strip("'\"") if match else None


def default_id(path: Path, block_index: int) -> str:
    text = path.read_text(encoding="utf-8-sig")
    slug = frontmatter_value(text, "slug")
    if not slug:
        digest = hashlib.sha256(str(path.relative_to(ARTICLES)).encode()).hexdigest()[:10]
        slug = f"python-article-{digest}"
    return f"{slug}-{block_index:02d}"


def write_missing_metadata(path: Path) -> bool:
    lines = path.read_text(encoding="utf-8-sig").splitlines(keepends=True)
    output: list[str] = []
    inside = False
    fence = ""
    block_index = 0
    changed = False

    for line in lines:
        match = FENCE_RE.match(line.rstrip("\r\n"))
        if not inside and match:
            block_index += 1
            info = match.group("info").strip()
            language = info.split(maxsplit=1)[0].lower() if info else ""
            previous = output[-1].strip() if output else ""
            if not META_RE.match(previous):
                mode = "compile" if language in PYTHON_LANGS else "display"
                metadata = (
                    f"<!-- snippet: id={default_id(path, block_index)} "
                    f"mode={mode} python=3.12-3.14 deps=stdlib -->\n"
                )
                output.append(metadata)
                changed = True
            inside = True
            fence = match.group("fence")
        elif inside and match:
            candidate = match.group("fence")
            trailing = match.group("info").strip()
            if candidate[0] == fence[0] and len(candidate) >= len(fence) and not trailing:
                inside = False
                fence = ""
        output.append(line)

    if changed:
        path.write_text("".join(output), encoding="utf-8", newline="")
    return changed


def compile_snippet(snippet: Snippet) -> str | None:
    try:
        ast.parse(snippet.code, filename=f"{snippet.path}:{snippet.line}")
    except (SyntaxError, ValueError) as error:
        relative_line = error.lineno or 1
        return (
            f"{snippet.path}:{snippet.line + relative_line}: "
            f"{type(error).__name__}: {error.msg}"
        )
    return None


def run_snippet(snippet: Snippet, expected_error: str | None) -> str | None:
    environment = {
        "PATH": os.environ.get("PATH", ""),
        "PYTHONIOENCODING": "utf-8",
        "PYTHONDONTWRITEBYTECODE": "1",
    }
    with tempfile.TemporaryDirectory(prefix="python-article-") as directory:
        try:
            # The executable and flags are fixed; only isolated article code varies.
            completed = subprocess.run(  # nosec B603
                [sys.executable, "-I", "-c", snippet.code],
                cwd=directory,
                env=environment,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=8,
                check=False,
            )
        except subprocess.TimeoutExpired:
            return f"{snippet.path}:{snippet.line}: example exceeded 8 seconds"

    if expected_error:
        if completed.returncode == 0:
            return f"{snippet.path}:{snippet.line}: expected {expected_error}, exited 0"
        if expected_error not in completed.stderr:
            return (
                f"{snippet.path}:{snippet.line}: expected {expected_error}, got:\n"
                f"{completed.stderr[-800:]}"
            )
        return None

    if completed.returncode != 0:
        return (
            f"{snippet.path}:{snippet.line}: runnable example exited "
            f"{completed.returncode}:\n{completed.stderr[-800:]}"
        )
    return None


def validate_series_orders(paths: list[Path]) -> list[str]:
    seen: dict[tuple[str, str], Path] = {}
    errors: list[str] = []
    for path in paths:
        text = path.read_text(encoding="utf-8-sig")
        series = frontmatter_value(text, "series")
        order = frontmatter_value(text, "seriesOrder")
        if not series or not order:
            errors.append(f"{path}: missing series or seriesOrder")
            continue
        key = (series, order)
        if key in seen:
            errors.append(
                f"{path}: duplicate seriesOrder {series}/{order}; first used by {seen[key]}"
            )
        else:
            seen[key] = path
    return errors


def validate_secrets(paths: list[Path]) -> list[str]:
    errors: list[str] = []
    for path in paths:
        text = path.read_text(encoding="utf-8-sig")
        for label, pattern in SECRET_PATTERNS.items():
            for match in pattern.finditer(text):
                line = text.count("\n", 0, match.start()) + 1
                errors.append(f"{path}:{line}: possible {label}")
    return errors


def validate_images(paths: list[Path]) -> list[str]:
    errors: list[str] = []
    image_re = re.compile(r"!\[(?P<alt>[^]]*)\]\((?P<target>[^)]+)\)")
    for path in paths:
        text = path.read_text(encoding="utf-8-sig")
        for match in image_re.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            alt = match.group("alt").strip()
            target = match.group("target").split(maxsplit=1)[0].strip("<>")
            if not alt or alt.lower() in {"image", "img", "图片", "截图"}:
                errors.append(f"{path}:{line}: image needs meaningful alt text")
            if target.startswith(("http://", "https://")):
                errors.append(f"{path}:{line}: external image hotlink is not allowed")
            elif not target.startswith(("/", "data:")):
                resolved = (path.parent / target).resolve()
                if not resolved.exists():
                    errors.append(f"{path}:{line}: missing local image {target}")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--write-metadata",
        action="store_true",
        help="insert deterministic metadata before unclassified fences",
    )
    parser.add_argument(
        "--run",
        action="store_true",
        help="execute snippets marked run or expected-error",
    )
    args = parser.parse_args()

    paths = sorted(ARTICLES.rglob("*.md"))
    if args.write_metadata:
        changed = sum(write_missing_metadata(path) for path in paths)
        print(f"metadata added to {changed} article(s)")

    errors: list[str] = []
    ids: dict[str, Snippet] = {}
    counts = {mode: 0 for mode in VALID_MODES}

    for path in paths:
        snippets, fence_errors = iter_snippets(path)
        errors.extend(fence_errors)
        for snippet in snippets:
            if snippet.metadata is None:
                errors.append(f"{path}:{snippet.line}: missing snippet metadata")
                continue
            snippet_id = snippet.metadata.get("id")
            mode = snippet.metadata.get("mode")
            if not snippet_id:
                errors.append(f"{path}:{snippet.line}: metadata is missing id")
            elif snippet_id in ids:
                errors.append(
                    f"{path}:{snippet.line}: duplicate snippet id {snippet_id}; "
                    f"first used at {ids[snippet_id].path}:{ids[snippet_id].line}"
                )
            else:
                ids[snippet_id] = snippet
            if mode not in VALID_MODES:
                errors.append(f"{path}:{snippet.line}: invalid snippet mode {mode!r}")
                continue
            counts[mode] += 1
            if not snippet.metadata.get("python"):
                errors.append(f"{path}:{snippet.line}: metadata is missing python range")
            if not snippet.metadata.get("deps"):
                errors.append(f"{path}:{snippet.line}: metadata is missing deps")
            if not snippet.language:
                errors.append(f"{path}:{snippet.line}: fenced block needs a language tag")

            if snippet.language in PYTHON_LANGS and mode != "display":
                error = compile_snippet(snippet)
                if error:
                    errors.append(error)
                    continue
                if args.run and mode in {"run", "expected-error"}:
                    expected = (
                        snippet.metadata.get("error") if mode == "expected-error" else None
                    )
                    if mode == "expected-error" and not expected:
                        errors.append(
                            f"{path}:{snippet.line}: expected-error requires error=<type>"
                        )
                        continue
                    runtime_error = run_snippet(snippet, expected)
                    if runtime_error:
                        errors.append(runtime_error)

    errors.extend(validate_series_orders(paths))
    errors.extend(validate_secrets(paths))
    errors.extend(validate_images(paths))

    print(f"checked {len(paths)} articles and {sum(counts.values())} snippets")
    print("modes: " + ", ".join(f"{key}={value}" for key, value in counts.items()))
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
