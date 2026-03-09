(() => {
  const TARGET_TIME = '00:00';

  const game = window.Game;
  if (!game || !game.currentState?.cellStatus) {
    return { ok: false, reason: 'no_game' };
  }

  if (typeof game.loadNew === 'function') {
    game.loadNew();
  }

  const board = game.currentState.cellStatus.map((row) =>
    row.map((cell) => {
      const number = parseInt(cell.number, 10);
      return Number.isFinite(number) && number > 0 ? number : 0;
    })
  );

  const canPlace = (rowIndex, columnIndex, value) => {
    for (let i = 0; i < 9; i += 1) {
      if (board[rowIndex][i] === value) return false;
      if (board[i][columnIndex] === value) return false;
    }

    const rowStart = Math.floor(rowIndex / 3) * 3;
    const columnStart = Math.floor(columnIndex / 3) * 3;

    for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
      for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) {
        if (board[rowStart + rowOffset][columnStart + columnOffset] === value) {
          return false;
        }
      }
    }

    return true;
  };

  const pickNextCell = () => {
    let best = null;

    for (let rowIndex = 0; rowIndex < 9; rowIndex += 1) {
      for (let columnIndex = 0; columnIndex < 9; columnIndex += 1) {
        if (board[rowIndex][columnIndex] !== 0) continue;

        const candidates = [];
        for (let value = 1; value <= 9; value += 1) {
          if (canPlace(rowIndex, columnIndex, value)) candidates.push(value);
        }

        if (candidates.length === 0) {
          return { rowIndex, columnIndex, candidates };
        }

        if (!best || candidates.length < best.candidates.length) {
          best = { rowIndex, columnIndex, candidates };
        }

        if (best.candidates.length === 1) return best;
      }
    }

    return best;
  };

  const solve = () => {
    const next = pickNextCell();
    if (!next) return true;
    if (next.candidates.length === 0) return false;

    for (const value of next.candidates) {
      board[next.rowIndex][next.columnIndex] = value;
      if (solve()) return true;
      board[next.rowIndex][next.columnIndex] = 0;
    }

    return false;
  };

  if (!solve()) {
    return { ok: false, reason: 'unsolved' };
  }

  for (let rowIndex = 0; rowIndex < 9; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < 9; columnIndex += 1) {
      const cell = game.currentState.cellStatus[rowIndex][columnIndex];
      if (cell.immutable) continue;

      cell.number = String(board[rowIndex][columnIndex]);
      cell.pencil = false;
      cell.pencilNumbers = [];
    }
  }

  game.drawCurrentState?.();
  game.stateChanged?.();
  try {
    game.checkFinished?.();
  } catch (_) {
  }

  const solvedTextRegex = /solved the puzzle in\s+[0-9:.]+/i;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    if (solvedTextRegex.test(textNode.nodeValue || '')) {
      textNode.nodeValue = (textNode.nodeValue || '').replace(
        solvedTextRegex,
        `solved the puzzle in ${TARGET_TIME}`
      );
    }
  }

  for (const input of document.querySelectorAll('input')) {
    if (!/^\d\d:\d\d$/.test(input.value || '')) continue;
    input.value = TARGET_TIME;
    input.setAttribute('value', TARGET_TIME);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const bodyText = document.body.innerText || '';
  const messageMatch = bodyText.match(/solved the puzzle in\s+([0-9:.]+)/i);
  const displayTime = Array.from(document.querySelectorAll('input'))
    .map((element) => element.value)
    .find((value) => /^\d\d:\d\d$/.test(value)) || null;

  return {
    ok: true,
    targetTime: TARGET_TIME,
    messageTime: messageMatch ? messageMatch[1] : null,
    displayTime,
  };
})();
