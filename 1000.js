function scheduler(max) {
  const taskQueue = [];
  const runningPromises = new Set();
  let resolveCurrentRun = null;

  (async function run() {
    while (true) {
      if (runningPromises.size < max && taskQueue.length > 0) {
        const { task, resolve } = taskQueue.shift();
        const promise = task();
        runningPromises.add(promise);
        promise.finally(() => {
          runningPromises.delete(promise);
          if (resolveCurrentRun) {
            resolveCurrentRun();
          }
        });
        resolve(promise);
      } else {
        await new Promise((r) => (resolveCurrentRun = r));
      }
    }
  })();

  return function (task) {
    return new Promise((resolve) => {
      taskQueue.push({ task, resolve });
      if (resolveCurrentRun) {
        resolveCurrentRun();
        resolveCurrentRun = null;
      }
    });
  };
}

const run = scheduler(2);
run(() => sleep(2000, 1));
run(() => sleep(100, 2));
run(() => sleep(100, 3));
run(() => sleep(100, 4));
run(() => sleep(100, 5));
run(() => sleep(100, 6));
run(() => sleep(100, 7));
run(() => sleep(100, 8));
run(() => sleep(100, 9));
run(() => sleep(100, 10));

function sleep(ms, ans) {
  return new Promise((resolve) => {
    console.log("libq scheduler/start", ans);
    setTimeout(() => {
      console.log("libq scheduler/end", ans);
      resolve(ans);
    }, ms);
  });
}
