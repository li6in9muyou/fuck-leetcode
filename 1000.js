let DEBUG_LIMIT = 7;

function scheduler(max) {
  let workQ = [];
  const taskQ = [];

  const loop = async function () {
    --DEBUG_LIMIT > 0 && setTimeout(loop, 0);

    if (workQ.length === max) {
      return;
    }

    while (workQ.length < max && taskQ.length > 0) {
      workQ.push(taskQ.shift());
    }

    console.log("libq scheduler/racebegin", workQ, taskQ);
    const done = await Promise.race(
      workQ.map(([fn, onComplete]) =>
        fn().then((ans) => [ans, onComplete, fn]),
      ),
    );
    console.log("libq scheduler/racedone", done);

    const [ans, onComplete, getTask] = done;

    onComplete(ans);

    const remaining = taskQ.filter((q) => q !== getTask);
    workQ = remaining.concat(workQ);
  };

  loop();

  return function (getTask) {
    let _r;
    const p = new Promise((r) => (_r = r));
    taskQ.push([getTask, _r]);
    return p;
  };
}

const run = scheduler(2);
run(() => sleep(3000, 1));
run(() => sleep(500, 2));
run(() => sleep(500, 3));
run(() => sleep(500, 4));
run(() => sleep(500, 5));
run(() => sleep(500, 6));
run(() => sleep(500, 7));
run(() => sleep(500, 8));
run(() => sleep(500, 9));
run(() => sleep(500, 10));

function sleep(ms, ans) {
  return new Promise((resolve) => {
    console.log("libq scheduler/start", ans);
    setTimeout(() => {
      console.log("libq scheduler/end", ans);
      resolve(ans);
    }, ms);
  });
}
