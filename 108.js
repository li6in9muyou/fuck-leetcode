/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {number[]} nums
 * @return {TreeNode}
 */
var sortedArrayToBST = function (nums) {
  return bst(nums);

  function bst(arr) {
    if (arr === null || arr.length === 0) {
      return null;
    }
    if (arr.length === 1) {
      return new TreeNode(arr[0]);
    }

    const len = arr.length;
    const mid = Math.floor((len - 1) / 2);

    const v = arr[mid];
    const left = bst(arr.slice(0, mid));
    const right = bst(arr.slice(mid + 1));
    return new TreeNode(v, left, right);
  }
};
