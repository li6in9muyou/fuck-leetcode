const maxSubArray = (arr) => {
  // 在这⾥写代码
  if (arr.length === 0) {
    return 0;
  }
  if (arr.every((x) => x > 0)) {
    return arr.reduce((a, b) => a + b, 0);
  }
  if (arr.every((x) => x <= 0)) {
    return 0;
  }

  const maxIfEndHere = [0];
  const currMaxLastNumIdx = [0];
  for (let i = 0; i < arr.length; i++) {
    maxIfEndHere.push(0);
    currMaxLastNumIdx.push(0);
  }

  for (let i = 0; i < arr.length; i++) {
    const currNum = arr[i];
    if (currNum >= 0) {
      const extend =
        currMaxLastNumIdx[i] === i - 1 ? maxIfEndHere[i] + currNum : -Infinity;
      const reset = currNum;
      let takeAll = maxIfEndHere[currMaxLastNumIdx[i]];
      for (let j = currMaxLastNumIdx[i]; j <= i; j++) {
        takeAll += arr[j];
      }

      currMaxLastNumIdx[i + 1] = i;
      maxIfEndHere[i + 1] = Math.max(extend, reset, takeAll);
    } else {
      const keep = maxIfEndHere[i];
      const reset = currNum;

      if (keep > reset) {
        currMaxLastNumIdx[i + 1] = currMaxLastNumIdx[i];
      } else {
        currMaxLastNumIdx[i + 1] = i;
      }
      maxIfEndHere[i + 1] = Math.max(keep, reset);
    }
  }

  return maxIfEndHere[arr.length];
};
