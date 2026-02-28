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

The script first prints candidate links.

Then do a second pass:
- Open top links with `web_fetch`
- Summarize same-day news in Chinese (2-4 句，不要太短)
- Keep only concrete items (title + summary + source link)
- Prioritize important stories only (model releases, major research, funding/layoffs, policy, infra)
- Drop low-value items (dictionary pages, SEO pages, unrelated listicles)

## Extending sources

Edit:

`skills/daily-tech-news/references/sources.json`

You can add new domains and query templates without changing Python logic.

## Notes

- This skill depends on local bing search script:
  - `skills/bing_search/scripts/search.py`
- If missing, run/install `bing_search` skill first.
