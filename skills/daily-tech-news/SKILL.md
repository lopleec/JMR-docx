---
name: daily-tech-news
description: Gather same-day AI and technology news from MIT News, TLDR, and search engines; generate a concise daily briefing with links. Use when the user asks for today's AI/tech news, daily briefing, or latest AI+tech updates.
---

# Daily Tech News Skill

Use this skill to collect and summarize **same-day AI + tech news**.

Data sources in this version:
- MIT News (`news.mit.edu`)
- TLDR (`tldr.tech`)
- Search engine results (via local Bing search script)

## How to run

```bash
python3 skills/daily-tech-news/scripts/run_briefing.py
```

Optional params:

```bash
python3 skills/daily-tech-news/scripts/run_briefing.py --limit 5 --date 2026-02-28
```

## Output

The script prints markdown with:
- AI news section
- Tech news section
- Source links

## Extending sources

Edit:

`skills/daily-tech-news/references/sources.json`

You can add new domains and query templates without changing Python logic.

## Notes

- This skill depends on local bing search script:
  - `skills/bing_search/scripts/search.py`
- If missing, run/install `bing_search` skill first.
