let DEBUG_LIMIT = 7;

function scheduler(max) {
  let workQ = [];
  const taskQ = [];

  const loop = async function () {
    --DEBUG_LIMIT > 0 && setTimeout(loop, 0);

    while (workQ.length < max) {
      workQ.push(taskQ.unshift());
    }

    console.log("libq scheduler/racebegin", workQ, taskQ);
    const [ans, onComplete, getTask] = await Promise.race(
      workQ.map((fn) => fn()),
    );
    console.log("libq scheduler/racedone", ans, onComplete, promise);

    onComplete(ans);

    const remaining = taskQ.filter((q) => q.getTask !== getTask);
    workQ = remaining.concat(workQ);
  };

  loop();

  return function (getTask) {
    taskQ.push(getTask);

    let _r;
    const p = new Promise((r) => (_r = r));
    p.then((ans) => [ans, _r, getTask]);

    return p;
  };
}

const run = scheduler(2);
run(() => sleep(3000, 1));
run(() => sleep(2000, 2));
run(() => sleep(2000, 3));
run(() => sleep(2000, 4));
run(() => sleep(2000, 5));
run(() => sleep(2000, 6));
run(() => sleep(2000, 7));
run(() => sleep(2000, 8));
run(() => sleep(2000, 9));
run(() => sleep(2000, 10));

function sleep(ms, ans) {
  return new Promise((resolve) => {
    console.log("libq scheduler/start", ans);
    setTimeout(() => {
      console.log("libq scheduler/end", ans);
      resolve(ans);
    }, ms);
  });
}
