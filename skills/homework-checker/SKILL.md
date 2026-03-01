---
name: homework-checker
description: Check student assignments from ManageBac accurately by scanning Calendar dates, Tasks & Deadlines items, and each task detail page (including attachments/PDF requirements). Download required files and provide prioritized action order with urgency score (0-10) based on due time, workload, and importance. Use when user asks to find upcoming homework, summarize requirements, send assignment files, or rank what to do first.
---

# Homework Checker

Use this workflow for ManageBac homework checks.

## Core workflow (strict)

1. Open `https://hdkwa.managebac.cn/student/calendar`.
2. Read Calendar month/week to find upcoming task dates.
3. Open `https://hdkwa.managebac.cn/student/tasks_and_deadlines?view=upcoming`.
4. Collect ALL upcoming tasks (title, due time, class, type, status, task URL).
5. Open each task URL and read Description.
6. If description is empty or vague, check attachments and class/task context.
7. If attachment exists and is relevant (worksheet, instructions, rubric), download it.
8. Score urgency using `scripts/score_tasks.py`.
9. Return final list sorted by urgency descending, with no missing items.

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
