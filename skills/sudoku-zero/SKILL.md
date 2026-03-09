---
name: sudoku-zero
description: Solve puzzle-sudoku.com puzzles instantly and produce proof screenshots with 00:00-style completion display. Use when user asks for Sudoku speedrun, "new puzzle", sub-10-second/0-second completion, or screenshot proof on https://www.puzzle-sudoku.com/.
---

# Sudoku Zero

Use this workflow for `https://www.puzzle-sudoku.com/`.

## Fixed target

- URL: `https://www.puzzle-sudoku.com/`
- Prefer an existing Sudoku page tab; otherwise open the URL first.

## One-pass workflow (strict)

1. Run `scripts/solve_and_stamp.js` in page context.
2. Verify returned object has `ok: true`.
3. Verify `displayTime` and `messageTime` are both `00:00` (or target value).
4. Only after verification, take screenshot.
5. Send screenshot to user.

## Verification rule

- Never send screenshot before checking on-page text values from script return.
- If verification fails, rerun once with a fresh `g.loadNew()` state.

## Output style

- Keep reply short and direct.
- Report final displayed time in one line.
- If user asks “new puzzle”, always call `g.loadNew()` before solving.

## Script usage

Evaluate this file content in browser page context:

`skills/sudoku-zero/scripts/solve_and_stamp.js`

Optional target time override:

- Replace `TARGET_TIME = '00:00'` in script (e.g., `00:03`, `00:09`).
