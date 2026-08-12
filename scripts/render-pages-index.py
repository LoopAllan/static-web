#!/usr/bin/env python3
"""Render a root index for every site currently present in a Pages tree."""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
SLUG_RE = re.compile(r"[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?")


def page_title(index_file: Path) -> str:
    match = TITLE_RE.search(index_file.read_text(encoding="utf-8"))
    if not match:
        return index_file.parent.name
    return html.unescape(re.sub(r"\s+", " ", match.group(1)).strip())


def render(root: Path) -> None:
    sites = []
    for child in sorted(root.iterdir(), key=lambda path: path.name):
        index_file = child / "index.html"
        if child.is_dir() and not child.name.startswith(".") and index_file.is_file():
            if not SLUG_RE.fullmatch(child.name):
                raise SystemExit(f"Unsafe published site slug: {child.name!r}")
            sites.append((child.name, page_title(index_file)))

    cards = "\n".join(
        f'<li><a href="{html.escape(slug)}/"><span>{html.escape(title)}</span>'
        f'<small>/{html.escape(slug)}/</small></a></li>'
        for slug, title in sites
    )
    empty = "<p>目前尚無已發布的頁面。</p>" if not sites else ""
    document = f"""<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>Static Web 專案</title>
  <style>
    :root {{ font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #222; background: #f7f5f2; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; min-height: 100vh; padding: clamp(2rem, 8vw, 7rem) 1.25rem; }}
    main {{ width: min(62rem, 100%); margin: auto; }}
    p.eyebrow {{ color: #c42447; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; }}
    h1 {{ margin: .35rem 0 1rem; font-size: clamp(2.25rem, 7vw, 5rem); line-height: .98; letter-spacing: -.055em; }}
    .lede {{ color: #67615b; font-size: 1.12rem; max-width: 42rem; line-height: 1.7; }}
    ul {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr)); gap: 1rem; list-style: none; padding: 0; margin: 3rem 0 0; }}
    a {{ display: grid; gap: .45rem; min-height: 9rem; padding: 1.4rem; color: inherit; background: #fff; border: 1px solid #e5dfd8; border-radius: 1.25rem; box-shadow: 0 8px 30px rgba(46, 37, 30, .07); text-decoration: none; transition: transform .2s ease, box-shadow .2s ease; }}
    a:hover {{ transform: translateY(-3px); box-shadow: 0 14px 35px rgba(46, 37, 30, .12); }}
    a:focus-visible {{ outline: 3px solid #c42447; outline-offset: 4px; }}
    span {{ align-self: end; font-size: 1.35rem; font-weight: 760; }}
    small {{ color: #766f69; font-family: ui-monospace, monospace; }}
  </style>
</head>
<body>
  <main>
    <p class="eyebrow">GitHub Pages</p>
    <h1>每個分支，<br>一段獨立旅程。</h1>
    <p class="lede">此儲存庫將指定分支建置到同一個 Pages 網站的不同子目錄，既有頁面不會因另一個分支更新而消失。</p>
    {empty}
    <ul>{cards}</ul>
  </main>
</body>
</html>
"""
    (root / "index.html").write_text(document, encoding="utf-8")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: render-pages-index.py PAGES_ROOT")
    target = Path(sys.argv[1]).resolve()
    target.mkdir(parents=True, exist_ok=True)
    render(target)
