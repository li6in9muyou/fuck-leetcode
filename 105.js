/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {number[]} preorder
 * @param {number[]} inorder
 * @return {TreeNode}
 */
var buildTree = function (preorder, inorder) {
  return descend(preorder, inorder);

  function descend(pre, mid) {
    if (mid.length === 0 || pre.length === 0) {
      return null;
    }

    const me = pre[0];
    const meIdxInMid = mid.indexOf(me);

    const leftCnt = meIdxInMid;

    const left = descend(pre.slice(1, 1 + leftCnt), mid.slice(0, leftCnt));
    const right = descend(pre.slice(leftCnt + 1), mid.slice(leftCnt + 1));

    const meNode = new TreeNode(me);
    meNode.left = left;
    meNode.right = right;

    return meNode;
  }
};
