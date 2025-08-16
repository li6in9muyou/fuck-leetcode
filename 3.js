/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function (s) {
  if (s.length === 0) {
    return 0;
  }
  if (s.length === 1) {
    return 1;
  }

  const L = s.length - 1;

  let ans = 0;
  let left = 0;
  let right = 0;
  const seen = new Set();
  while (true) {
    if (!seen.has(s[right])) {
      seen.add(s[right]);
      right += 1;
    } else {
      ans = Math.max(ans, seen.size);
      left = left + 1;
      right = left;
      seen.clear();
    }

    if (left > L || right > L) {
      ans = Math.max(ans, seen.size);
      break;
    }
  }

  return ans;
};
