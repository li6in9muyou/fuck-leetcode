let DEBUG_LIMIT = 22;

function YIELD() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function scheduler(max) {
  const taskQueue = [];
  const working = new Set();

  (async function run() {
    while (DEBUG_LIMIT-- > 0) {
      console.log("libq scheduler/loop");
      if (taskQueue.length === 0 && working.size === 0) {
        await YIELD();
        continue;
      }

      while (working.size < max && taskQueue.length > 0) {
        const { task, resolve } = taskQueue.shift();

        const w = { resolve };
        w.promise = task().then((ans) => {
          w.ans = ans;
          return w;
        });
        working.add(w.promise);
      }
      if (working.size > 0) {
        const done = await Promise.race(working);
        working.delete(done.promise);
        const { ans, resolve } = done;
        resolve(ans);
      }
    }
  })();

  return function (task) {
    return new Promise((resolve) => {
      taskQueue.push({ task, resolve });
      console.log("libq scheduler/enqueue", taskQueue);
    });
  };
}

const run = scheduler(3);
run(() => sleep(2000, 1)).then((x) => console.log("libq run/done", x));
run(() => sleep(500, 2)).then((x) => console.log("libq run/done", x));;
run(() => sleep(500, 3)).then((x) => console.log("libq run/done", x));;
run(() => sleep(500, 4)).then((x) => console.log("libq run/done", x));;
run(() => sleep(500, 5)).then((x) => console.log("libq run/done", x));;
run(() => sleep(500, 6)).then((x) => console.log("libq run/done", x));;
run(() => sleep(500, 7)).then((x) => console.log("libq run/done", x));;
run(() => sleep(500, 8)).then((x) => console.log("libq run/done", x));;
run(() => sleep(500, 9)).then((x) => console.log("libq run/done", x));;
run(() => sleep(500, 10)).then((x) => console.log("libq run/done", x));;

function sleep(ms, ans) {
  return new Promise((resolve) => {
    console.log("libq scheduler/start", ans);
    setTimeout(() => {
      console.log("libq scheduler/end", ans);
      resolve(ans);
    }, ms);
  });
}
