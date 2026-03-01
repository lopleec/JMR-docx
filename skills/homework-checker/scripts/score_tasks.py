#!/usr/bin/env python3
"""Score homework urgency (0-10) by due time, workload, and importance.

Input: JSON file with list[task] or {"tasks": list[task]}
Task fields (recommended):
- title
- due_time_iso (e.g. 2026-03-01T23:55:00+08:00)
- assessment_type (Formative/Summative/etc.)
- has_attachment (bool)
- estimated_workload (low|medium|high)
- submission_status (Pending/Submitted/...)

Output: JSON with urgency_score and reason, sorted desc.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone


def clamp(x: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, x))


def parse_dt(s: str) -> datetime | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s)
    except Exception:
        return None


def due_component(hours_left: float | None) -> float:
    if hours_left is None:
        return 2.0
    if hours_left <= 0:
        return 7.0
    if hours_left <= 6:
        return 6.5
    if hours_left <= 24:
        return 5.8
    if hours_left <= 48:
        return 4.8
    if hours_left <= 96:
        return 3.8
    if hours_left <= 168:
        return 2.8
    return 1.8


def workload_component(level: str) -> float:
    m = {
        "low": 1.0,
        "medium": 2.0,
        "high": 3.0,
    }
    return m.get((level or "").lower(), 1.5)


def importance_component(assessment_type: str) -> float:
    t = (assessment_type or "").lower()
    if "summative" in t:
        return 2.5
    if "formative" in t:
        return 1.5
    return 1.8


def status_component(status: str) -> float:
    s = (status or "").lower()
    if "submitted" in s:
        return -4.0
    if "pending" in s:
        return 1.2
    return 0.5


def attachment_component(has_attachment: bool) -> float:
    return 0.8 if has_attachment else 0.0


def score_task(task: dict, now: datetime) -> tuple[float, str]:
    due = parse_dt(task.get("due_time_iso", ""))
    hours_left = None
    if due is not None:
        if due.tzinfo is None:
            due = due.replace(tzinfo=timezone.utc)
        hours_left = (due - now).total_seconds() / 3600.0

    score = 0.0
    score += due_component(hours_left)
    score += workload_component(task.get("estimated_workload", ""))
    score += importance_component(task.get("assessment_type", ""))
    score += status_component(task.get("submission_status", ""))
    score += attachment_component(bool(task.get("has_attachment", False)))

    score = round(clamp(score, 0.0, 10.0), 1)

    reason = []
    if hours_left is not None:
        reason.append(f"due_in={hours_left:.1f}h")
    else:
        reason.append("due_in=unknown")
    reason.append(f"type={task.get('assessment_type','unknown')}")
    reason.append(f"workload={task.get('estimated_workload','unknown')}")
    reason.append(f"status={task.get('submission_status','unknown')}")

    return score, "; ".join(reason)


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: score_tasks.py <tasks.json>")
        return 1

    with open(sys.argv[1], "r", encoding="utf-8") as f:
        data = json.load(f)

    tasks = data["tasks"] if isinstance(data, dict) and "tasks" in data else data
    if not isinstance(tasks, list):
        raise ValueError("Input must be a list or {'tasks': list}")

    now = datetime.now(timezone.utc)

    out = []
    for t in tasks:
        score, reason = score_task(t, now)
        x = dict(t)
        x["urgency_score"] = score
        x["why_this_score"] = reason
        out.append(x)

    out.sort(key=lambda x: x.get("urgency_score", 0), reverse=True)
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
