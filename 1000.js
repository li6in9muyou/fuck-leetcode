function scheduler(max) {
  const workQ = [];
  const taskQ = [];
  let nextBatch;

  (async function () {
    while (true) {
      if (workQ.length === 0) {
        nextBatch = taskQ.slice(0, max);
      } else {
        console.log("libq scheduler/racebegin", workQ);
        const [ans, onComplete, getTask] = await Promise.race(
          workQ.map((fn) => fn()),
        );
        console.log("libq scheduler/racedone", ans, onComplete, promise);

        const remaining = taskQ.filter((q) => q !== getTask);
        nextBatch = workQ.slice(0, max - remaining.length);

        onComplete(ans);
      }

      workQ.push(...nextBatch);
      for (let i = 0; i < nextBatch.length; i++) {
        taskQ.shift();
      }
    }
  })();

  return function (getTask) {
    taskQ.push(getTask);

    let _r;
    const p = new Promise((r) => (_r = r));
    p.then((ans) => [ans, _r, getTask]);

    taskQ.push(p);

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
