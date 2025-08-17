/**
 * @param {string[]} strs
 * @return {string[][]}
 */
var groupAnagrams = function (strs) {
  const counter = new Map();
  for (const str of strs) {
    const key = sortString(str);
    if (!counter.has(key)) {
      counter.set(key, []);
    }
    counter.get(key).push(str);
  }
  return Array.from(counter.values());

  function sortString(str) {
    return Array.from(str)
      .toSorted((a, b) => a.charCodeAt(0) - b.charCodeAt(0))
      .join("");
  }
};
