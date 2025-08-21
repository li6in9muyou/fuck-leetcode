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

// const run = scheduler(3);
// run(() => sleep(5000)).then(() => console.log("libq run/done", 1));
// run(() => sleep(500).then(() => console.log("libq run/done", 2)));
// run(() => sleep(500).then(() => console.log("libq run/done", 3)));
// run(() => sleep(500).then(() => console.log("libq run/done", 4)));
// run(() => sleep(500).then(() => console.log("libq run/done", 5)));
// run(() => sleep(500).then(() => console.log("libq run/done", 6)));
// run(() => sleep(500).then(() => console.log("libq run/done", 7)));
// run(() => sleep(500).then(() => console.log("libq run/done", 8)));
// run(() => sleep(500).then(() => console.log("libq run/done", 9)));
// run(() => sleep(500).then(() => console.log("libq run/done", 10)));
// run(() => sleep(500).then(() => console.log("libq run/done", 11)));
// run(() => sleep(500).then(() => console.log("libq run/done", 12)));
// run(() => sleep(500).then(() => console.log("libq run/done", 13)));
// run(() => sleep(500).then(() => console.log("libq run/done", 14)));
