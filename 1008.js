// input
// 3 * 4 行和列
// output
// 1   2   3   4
// 10  11  12  5
// 9   8   7   6

const DIR = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];

const EMPTY = "x";

function spiralMtx(R, C) {
  const mtx = [];
  for (let c = 0; c < R; c++) {
    mtx.push(new Array(C).fill("x"));
  }

  let content = 1;

  let cR = 0;
  let cC = -1;
  let turnCnt = 0;
  let fillCnt = 0;
  while (true) {
    const [dR, dC] = DIR[turnCnt % DIR.length];
    cR += dR;
    cC += dC;

    mtx[cR][cC] = content++;
    if (++fillCnt >= R * C) {
      break;
    }

    const nextC = cC + dC;
    const nextR = cR + dR;
    const isValid =
      nextC >= 0 &&
      nextC < C &&
      nextR >= 0 &&
      nextR < R &&
      mtx[nextR][nextC] === EMPTY;
    if (!isValid) {
      turnCnt += 1;
    }
  }

  return mtx;
}

// console.log("libq mtx\n" + print2d(spiralMtx(3, 4)));
// console.log("libq mtx\n" + print2d(spiralMtx(2, 2)));
// console.log("libq mtx\n" + print2d(spiralMtx(1, 1)));
// console.log("libq mtx\n" + print2d(spiralMtx(1, 7)));
// console.log("libq mtx\n" + print2d(spiralMtx(7, 1)));
// console.log("libq mtx\n" + print2d(spiralMtx(10, 10)));
