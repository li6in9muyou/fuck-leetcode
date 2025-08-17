/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @param {number} k
 * @return {ListNode}
 */
var reverseKGroup = function (head, k) {
  const arr = [];
  let cursor = head;
  while (cursor !== null) {
    arr.push(cursor.val);
    cursor = cursor.next;
  }

  if (arr.length === 0) {
    return null;
  }
  if (arr.length < k) {
    return head;
  }

  for (let i = 0, j = k - 1; j < arr.length; i += k, j += k) {
    reverseRange(arr, i, j);
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

  function reverseRange(array, start, endInclusive) {
    const subject = array.slice(start, endInclusive + 1);
    subject.reverse();
    for (let i = 0; i < subject.length; i++) {
      array[start + i] = subject[i];
    }
  }
};
