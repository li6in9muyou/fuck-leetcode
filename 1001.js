const matching = {
  "(": ")",
  "[": "]",
  "{": "}",
};
const opening = new Set("{[(");
const closing = new Set(")]}");

function countValidParen(text) {
  const stack = [];
  let ans = 0;
  for (const ch of text) {
    if (closing.has(ch)) {
      const top = stack.pop();
      if (matching[top] === ch) {
        ans += 1;
      }
    } else if (opening.has(ch)) {
      stack.push(ch);
    }
  }

  return ans;
}
