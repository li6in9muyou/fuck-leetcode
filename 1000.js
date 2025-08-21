function YIELD() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function scheduler(max) {
  const taskQueue = [];
  const working = new Set();

  (async function run() {
    while (true) {
      if (taskQueue.length === 0 && working.size === 0) {
        await YIELD();
        continue;
      }

      while (working.size < max && taskQueue.length > 0) {
        const { getPromise, onComplete } = taskQueue.shift();

        const w = {};
        w.promise = getPromise().then((ans) => {
          w.ans = ans;
          return w.self;
        });
        w.self = w;
        w.onComplete = onComplete;

        working.add(w.promise);
      }
      if (working.size > 0) {
        const { ans, onComplete, promise } = await Promise.race(working);
        working.delete(promise);
        onComplete(ans);
      }
    }
  })();

  return function (getPromise) {
    return new Promise((resolve) => {
      taskQueue.push({ getPromise, onComplete: resolve });
      console.log("libq scheduler/enqueue", taskQueue);
    });
  };
}

const run = scheduler(3);
run(() => sleep(5000, 1)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 2)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 3)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 4)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 5)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 6)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 7)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 8)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 9)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 10)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 11)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 12)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 13)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 14)).then((x) => console.log("libq run/done", x));

function sleep(ms, ans) {
  return new Promise((resolve) => {
    console.log("libq scheduler/start", ans);
    setTimeout(() => {
      console.log("libq scheduler/end", ans);
      resolve(ans);
    }, ms);
  });
}
