/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {TreeNode} root
 * @return {void} Do not return anything, modify root in-place instead.
 */
var recoverTree = function (root) {
  const valToNode = new Map();
  const arr = bstToArr(root);

  const swapped = findSwapped(arr);
  const badNodes = swapped.map((x) => valToNode.get(x));

  const tmp = badNodes[0].val;
  badNodes[0].val = badNodes[1].val;
  badNodes[1].val = tmp;

  function findSwapped(arr) {
    const good = arr.toSorted((a, b) => a - b);
    return arr.filter((x, i) => good[i] !== x);
  }

  function bstToArr(r) {
    if (r === null) {
      return [];
    }

    valToNode.set(r.val, r);
    return [...bstToArr(r.left), r.val, ...bstToArr(r.right)];
  }
};
