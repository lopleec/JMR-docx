---
name: homework-checker
description: Check student assignments from ManageBac accurately by scanning Calendar dates, Tasks & Deadlines items, and each task detail page (including attachments/PDF requirements). Download required files and provide prioritized action order with urgency score (0-10) based on due time, workload, and importance. Use when user asks to find upcoming homework, summarize requirements, send assignment files, or rank what to do first.
---

# Homework Checker

Use this workflow for ManageBac homework checks.

## Fixed URLs (must use)

- Calendar: `https://hdkwa.managebac.cn/student/calendar`
- Tasks & Deadlines: `https://hdkwa.managebac.cn/student/tasks_and_deadlines`

## Core workflow (strict)

1. Open Calendar URL and read month/week for upcoming task dates.
2. Open Tasks & Deadlines URL (Upcoming view) and collect ALL upcoming tasks (title, due time, class, type, status, task URL).
3. Open each task URL and read Description.
4. If description is empty or vague, check attachments and class/task context.
5. If attachment exists and is relevant (worksheet, instructions, rubric), download it.
6. Score urgency using `scripts/score_tasks.py`.
7. Return final list sorted by urgency descending, with no missing items.

## Repeat reminder rule

- If a task was already mentioned in the previous report and deadline has NOT passed, mention it again in the next report.
- If deadline has passed, stop repeating it.

## Login/session rule

- If page shows logged-out state, SSO page, or missing session, STOP.
- Do not try password/auto-login by yourself.
- Ask user to log in first, then continue.

## Required output fields per task

- title
- due_time (local time)
- class
- assessment_type (Formative/Summative/etc.)
- submission_status
- requirement_summary (what exactly must be submitted)
- source_of_requirement (`description` / `attachment` / `both`)
- task_link
- attachment_links (if any)
- urgency_score (0-10)
- why_this_score (short factual reason)

## Accuracy rules

- Never assume requirement details not shown on page/attachment.
- If unclear, say `unclear` and point to exact source page.
- Do not skip tasks because they look old; rely on Upcoming list first.
- Avoid duplicate tasks by task URL.
- Keep language concise and factual.

## Attachment handling

When user asks for files, send/download only assignment-relevant files:
- worksheet PDFs
- requirement documents
- rubrics

Ignore decorative/unrelated files.

## Urgency scoring

Use `scripts/score_tasks.py` with task JSON input.

Example:

```bash
python3 skills/homework-checker/scripts/score_tasks.py skills/homework-checker/references/sample_tasks.json
```

## Extendability

To add another platform later, keep output schema unchanged and only replace collection steps.
