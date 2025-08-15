/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * Definition for a binary tree node.
 * function TreeNode(val, left, right) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.left = (left===undefined ? null : left)
 *     this.right = (right===undefined ? null : right)
 * }
 */
/**
 * @param {ListNode} head
 * @return {TreeNode}
 */
var sortedListToBST = function (head) {
  const a = toArray(head);
  return bst(a);
};

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

function toArray(head) {
  const ans = [];

  let cursor = head;
  while (cursor !== null) {
    ans.push(cursor.val);
    cursor = cursor.next;
  }
  return ans;
}
