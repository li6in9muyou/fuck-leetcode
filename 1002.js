let debug = false;
try {
  const rl = require("readline").createInterface({ input: process.stdin });
  var iter = rl[Symbol.asyncIterator]();
  const readline = async () => (await iter.next()).value;

  void (async function () {
    let line;
    line = await readline();
    const minAvgLost = parseInt(line);
    line = await readline();
    const arr = line.split(" ").map(Number);
    solve(minAvgLost, arr);
  })();
} catch (err) {
  debug = true;
  console.error("libq catch/readline", err);
}

function solve(minAvgLost, arr) {
  const I = arr.length;

  let left = 0;
  let right = 0;
  let sum = 0;
  let currentRun = [];
  let validRuns = [];
  while (true) {
    if (right > I || left > I) {
      break;
    }

    const nextNum = arr[right];
    const numCnt = right - left + 1;
    const nextAvg = (sum + nextNum) / numCnt;
    if (nextAvg <= minAvgLost) {
      currentRun.push(right);

      right += 1;
      sum += nextNum;
    } else {
      currentRun.length && validRuns.push([...currentRun]);

      left = right + 1;
      right = left;
      sum = 0;
      currentRun = [];
    }
  }

  if (validRuns.length === 0) {
    console.log("NULL");
    return null;
  }

  const ans = [];
  const longestLen = Math.max(...validRuns.map((a) => a.length));
  for (const run of validRuns) {
    if (run.length < longestLen) {
      continue;
    }

    ans.push(`${run[0]}-${run[run.length - 1]}`);
  }
  console.log(ans.join(" "));
}
