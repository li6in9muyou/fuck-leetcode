var letterTable = {
  2: "abc",
  3: "def",
  4: "ghi",
  5: "jkl",
  6: "mno",
  7: "pqrs",
  8: "tuv",
  9: "wxyz",
};

/**
 * @param {string} digits
 * @return {string[]}
 */
var letterCombinations = function (digits) {
  if (digits.length === 0) {
    return [];
  }

  var ans = [];
  dfs(0, digits, "");
  return ans;

  function dfs(idx, figures, word) {
    if (idx >= digits.length) {
      ans.push(word);
      return;
    }

    var figure = figures[idx];
    var letters = letterTable[figure];
    for (let i = 0; i < letters.length; i++) {
      var ch = letters[i];
      dfs(idx + 1, figures, word + ch);
    }
  }
};
