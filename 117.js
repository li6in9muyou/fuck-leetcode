/**
 * // Definition for a _Node.
 * function _Node(val, left, right, next) {
 *    this.val = val === undefined ? null : val;
 *    this.left = left === undefined ? null : left;
 *    this.right = right === undefined ? null : right;
 *    this.next = next === undefined ? null : next;
 * };
 */

/**
 * @param {_Node} root
 * @return {_Node}
 */
var connect = function (root) {
  if (root === null) {
    return root;
  }

  const q = [root];
  while (q.length > 0) {
    const thisLevel = q.slice();

    for (let i = 0, j = 1; j < thisLevel.length; i++, j++) {
      thisLevel[i].next = thisLevel[j];
    }

    for (let i = 0; i < thisLevel.length; i++) {
      const node = q.shift();
      node.left && q.push(node.left);
      node.right && q.push(node.right);
    }
  }

  return root;
};
