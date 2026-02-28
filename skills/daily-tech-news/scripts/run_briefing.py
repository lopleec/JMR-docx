#!/usr/bin/env python3
"""
Daily Tech News briefing generator.

设计目标：
1) 固定抓 MIT + TLDR + 搜索引擎
2) 结构可扩展（新增来源只改 sources.json）
3) 输出简洁 Markdown，便于直接发消息
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import subprocess
from pathlib import Path
from typing import Dict, List

ROOT = Path(__file__).resolve().parents[3]  # ~/.openclaw/workspace
CONFIG_PATH = ROOT / "skills" / "daily-tech-news" / "references" / "sources.json"
BING_SCRIPT = ROOT / "skills" / "bing_search" / "scripts" / "search.py"


def run_bing(query: str, limit: int) -> List[Dict]:
    """调用本地 bing_search skill 并返回结果列表。"""
    if not BING_SCRIPT.exists():
        raise FileNotFoundError(f"Missing bing script: {BING_SCRIPT}")

    cmd = ["python3", str(BING_SCRIPT), query]
    p = subprocess.run(cmd, capture_output=True, text=True, check=False)
    if p.returncode != 0:
        return []

    try:
        payload = json.loads(p.stdout)
    except json.JSONDecodeError:
        return []

    results = payload.get("results", [])
    # 兼容旧版（只返回 URL 字符串）与新版（title/url/snippet）
    normalized = []
    for item in results[:limit]:
        if isinstance(item, str):
            normalized.append({"title": item, "url": item, "snippet": ""})
        elif isinstance(item, dict):
            normalized.append(
                {
                    "title": item.get("title", "").strip(),
                    "url": item.get("url", "").strip(),
                    "snippet": item.get("snippet", "").strip(),
                }
            )
    return normalized


def dedupe(items: List[Dict]) -> List[Dict]:
    """按 URL 去重。"""
    seen = set()
    out = []
    for x in items:
        u = x.get("url", "")
        if not u or u in seen:
            continue
        seen.add(u)
        out.append(x)
    return out


def pick_relevant(items: List[Dict], site: str, limit: int) -> List[Dict]:
    """来源查询时强约束目标站点，避免脏结果。"""
    if site:
        only_site = [x for x in items if site in x.get("url", "")]
        return only_site[:limit]
    return items[:limit]


def keyword_filter(items: List[Dict], category: str) -> List[Dict]:
    """通用搜索做关键词过滤，减少离题内容。"""
    kw = {
        "AI": ["ai", "artificial intelligence", "llm", "machine learning", "openai", "anthropic", "gemini"],
        "Tech": ["tech", "technology", "software", "startup", "chip", "apple", "google", "microsoft"],
    }.get(category, ["tech"])

    out = []
    for x in items:
        txt = (x.get("title", "") + " " + x.get("snippet", "")).lower()
        if any(k in txt for k in kw):
            out.append(x)
    return out


def collect(date_str: str, per_query_limit: int, final_limit: int) -> Dict[str, List[Dict]]:
    cfg = json.loads(CONFIG_PATH.read_text())
    buckets = {"AI": [], "Tech": []}

    # 1) 逐来源抓取
    for src in cfg.get("sources", []):
        cat = src.get("category", "Tech")
        site = src.get("site", "")
        for qtpl in src.get("queries", []):
            q = qtpl.format(date=date_str)
            res = run_bing(q, per_query_limit)
            res = pick_relevant(res, site, per_query_limit)
            for r in res:
                r["source"] = src.get("name", "custom")
                buckets.setdefault(cat, []).append(r)

    # 2) 通用搜索补充
    for eq in cfg.get("engine_queries", []):
        cat = eq.get("category", "Tech")
        q = eq.get("query", "").format(date=date_str)
        res = run_bing(q, per_query_limit)
        res = keyword_filter(res, cat)
        for r in res:
            r.setdefault("source", "Search")
            buckets.setdefault(cat, []).append(r)

    # 3) 去重 + 截断
    for cat in list(buckets.keys()):
        buckets[cat] = dedupe(buckets[cat])[:final_limit]

    return buckets


def to_markdown(date_str: str, buckets: Dict[str, List[Dict]]) -> str:
    """格式化为简洁日报。"""
    lines = []
    lines.append(f"# Daily AI & Tech Briefing ({date_str})")
    lines.append("")

    for cat in ["AI", "Tech"]:
        lines.append(f"## {cat}")
        items = buckets.get(cat, [])
        if not items:
            lines.append("- No strong results today.")
            lines.append("")
            continue

        for i, item in enumerate(items, 1):
            title = item.get("title") or item.get("url")
            url = item.get("url", "")
            src = item.get("source", "Search")
            snippet = item.get("snippet", "")
            lines.append(f"{i}. {title}")
            lines.append(f"   - source: {src}")
            lines.append(f"   - link: {url}")
            if snippet:
                lines.append(f"   - note: {snippet[:160]}")
        lines.append("")

    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--date", default=dt.date.today().isoformat(), help="YYYY-MM-DD")
    parser.add_argument("--limit", type=int, default=8, help="final items per category")
    parser.add_argument("--per-query-limit", type=int, default=5)
    args = parser.parse_args()

    buckets = collect(args.date, args.per_query_limit, args.limit)
    print(to_markdown(args.date, buckets))


if __name__ == "__main__":
    main()
