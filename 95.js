/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {number} n
 * @return {TreeNode[]}
 */
var generateTrees = function (n) {
  return bst(1, n);

  function bst(i, j) {
    if (i > j) {
      return [];
    }
    if (i === j) {
      return [new TreeNode(i)];
    }
    if (i + 1 === j) {
      return [
        new TreeNode(i, null, new TreeNode(j)),
        new TreeNode(j, new TreeNode(i), null),
      ];
    }

    const ans = [];
    for (let r = i; r <= j; r++) {
      const left = bst(i, r - 1);
      const right = bst(r + 1, j);
      if (left.length > 0 && right.length === 0) {
        for (const leftTree of left) {
          ans.push(new TreeNode(r, leftTree, null));
        }
      }
      if (left.length === 0 && right.length > 0) {
        for (const rightTree of right) {
          ans.push(new TreeNode(r, null, rightTree));
        }
      }
      if (left.length > 0 && right.length > 0) {
        for (const leftTree of left) {
          for (const rightTree of right) {
            ans.push(new TreeNode(r, leftTree, rightTree));
          }
        }
      }
    }
    return ans;
  }
};
