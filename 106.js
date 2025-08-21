/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {number[]} inorder
 * @param {number[]} postorder
 * @return {TreeNode}
 */
var buildTree = function (inorder, postorder) {
  return descend(inorder, postorder);

  function descend(mid, post) {
    if (mid.length === 0 || post.length === 0) {
      return null;
    }

    const I = post.length - 1;
    const me = post[I];
    const meIdx = mid.indexOf(me);

    const leftCnt = meIdx;
    const rightCnt = I - leftCnt;

    const left = descend(mid.slice(0, leftCnt), post.slice(0, leftCnt));
    const right = descend(
      mid.slice(meIdx + 1),
      post.slice(leftCnt, leftCnt + rightCnt),
    );

    const meNode = new TreeNode(me);
    meNode.left = left;
    meNode.right = right;

    return meNode;
  }
};
