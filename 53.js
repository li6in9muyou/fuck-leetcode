const maxSubArray = (arr) => {
  // 在这⾥写代码
  if (arr.length === 0) {
    return 0;
  }
  if (arr.every((x) => x > 0)) {
    return arr.reduce((a, b) => a + b, 0);
  }
  if (arr.every((x) => x <= 0)) {
    return Math.max(...arr);
  }

  const maxIfEndHere = [arr[0]];
  for (let i = 1; i < arr.length; i++) {
    const extend = maxIfEndHere[i - 1] + arr[i];
    const reset = arr[i];

    if (extend > reset) {
      maxIfEndHere.push(extend);
    } else {
      maxIfEndHere.push(reset);
    }
  }

  return Math.max(...maxIfEndHere);
};
