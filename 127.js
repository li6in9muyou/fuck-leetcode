/**
 * @param {string} beginWord
 * @param {string} endWord
 * @param {string[]} wordList
 * @return {number}
 */
var ladderLength = function (beginWord, endWord, wordList) {
  if (wordList.indexOf(endWord) === -1) {
    return 0;
  }

  const adjList = new Map();

  addWord(beginWord);
  for (const voca of wordList) {
    addWord(voca);
  }

  let dist = 1;
  const seen = new Set([beginWord]);
  let q = [beginWord];
  while (q.length > 0) {
    const nextQ = [];

    for (const me of q) {
      if (me === endWord) {
        return Math.floor(dist / 2) + 1;
      }

      const ngbs = adjList.get(me) ?? [];
      for (const ngb of ngbs) {
        if (!seen.has(ngb)) {
          seen.add(ngb);
          nextQ.push(ngb);
        }
      }
    }

    q = nextQ;
    dist++;
  }

  return 0;

  function addWord(word) {
    const vNodes = [];
    for (let i = 0; i < word.length; i++) {
      vNodes.push(`${word.slice(0, i)}*${word.slice(i + 1)}`);
    }
    adjList.set(word, [...(adjList.get(word) ?? []), ...vNodes]);
    for (const vNode of vNodes) {
      adjList.set(vNode, [...(adjList.get(vNode) ?? []), word]);
    }
  }
};
