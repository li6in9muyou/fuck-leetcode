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

  wordList.forEach(addWord);
  addWord(beginWord);

  const q = [];
  q.push(beginWord);

  const dis = new Map();
  for (const node of adjList.keys()) {
    dis.set(node, Number.MAX_SAFE_INTEGER);
  }
  dis.set(beginWord, 0);

  while (q.length > 0) {
    const me = q.shift();

    if (me === endWord) {
      return Math.floor(dis.get(me) / 2) + 1;
    }

    for (const ngb of adjList.get(me)) {
      if (dis.get(ngb) === Number.MAX_SAFE_INTEGER) {
        dis.set(ngb, dis.get(me) + 1);
        q.push(ngb);
      }
    }
  }

  return 0;

  function addWord(word) {
    if (!adjList.has(word)) {
      adjList.set(word, []);
    }

    const me = adjList.get(word);
    for (let i = 0; i < word.length; i++) {
      const ngb = `${word.slice(0, i)}*${word.slice(i + 1)}`;
      if (!adjList.has(ngb)) {
        adjList.set(ngb, []);
      }

      me.push(ngb);
      adjList.get(ngb).push(word);
    }
  }
};
