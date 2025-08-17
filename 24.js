/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
var swapPairs = function (head) {
  const arr = [];
  let cursor = head;
  while (cursor !== null) {
    arr.push(cursor.val);
    cursor = cursor.next;
  }

  if (arr.length === 0) {
    return null;
  }
  if (arr.length === 1) {
    return new ListNode(arr[0]);
  }

  for (let i = 0, j = 1; j < arr.length; i += 2, j += 2) {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }

  const ans = new ListNode(arr[0]);
  cursor = ans;
  let idx = 1;
  while (arr[idx] !== undefined) {
    cursor.next = new ListNode(arr[idx]);
    idx++;
    cursor = cursor.next;
  }
  return ans;
};
