/**
 * @param {character[][]} board
 * @return {void} Do not return anything, modify board in-place instead.
 */
var solve = function (board) {
  const R = board.length;
  const C = board[0].length;

  function dfs(board, row, col) {
    if (row < 0 || col < 0 || row >= R || col >= C || board[row][col] !== "O") {
      return;
    }
    board[row][col] = "live";
    dfs(board, row - 1, col);
    dfs(board, row + 1, col);
    dfs(board, row, col - 1);
    dfs(board, row, col + 1);
  }

  for (let r = 1; r < R - 1; r++) {
    dfs(board, r, 0);
    dfs(board, r, C - 1);
  }

  for (let c = 0; c < C; c++) {
    dfs(board, 0, c);
    dfs(board, R - 1, c);
  }

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const cell = board[r][c];
      if (cell === "live") {
        board[r][c] = "O";
      } else {
        board[r][c] = "X";
      }
    }
  }
};
