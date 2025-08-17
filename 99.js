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
  const arr = toArray(root);

  const swapped = findSwapped(arr);
  const badNodes = swapped.map((x) => valToNode.get(x));

  const tmp = badNodes[0].val;
  badNodes[0].val = badNodes[1].val;
  badNodes[1].val = tmp;

  function findSwapped(arr) {
    const good = arr.toSorted((a, b) => a - b);
    return arr.filter((x, i) => good[i] !== x);
  }

  function toArray(r) {
    if (r === null) {
      return [];
    }

    const left = toArray(r.left);
    const right = toArray(r.right);
    const ans = [...left, r.val, ...right];

    valToNode.set(r.val, r);
    return ans;
  }
};
