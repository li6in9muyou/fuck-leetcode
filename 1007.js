const input = {
    a: {
        b: {
            c: 1,
            d: true,
            e: null,
        },
    },
    f: {
        g: '3',
        h: '4',
        i: '5',
    },
    j: [
        4,
        5,
        {
            x: 7,
            y: 8,
        },
    ],
}

function flatten(obj) {
    const ans = {};
    dfs(obj, [], ans)

    const replaced = {}
    for (let [k, v] of Object.entries(ans)) {
        k = k.replace(/.(\d+)/, (_, idx) => {
            return `[${idx}]`
        })
        replaced[k] = v
    }
    return replaced;

    function dfs(root, currPath, ans) {
        if (root === null) {
            ans[currPath.join('.')] = root;
        }

        switch (Object.prototype.toString.call(root)) {
            case '[object Array]':
            case '[object Object]': {
                if (Object.keys(root).length === 0) {
                    // do nothing
                } else {
                    for (const k in root) {
                        currPath.push(k);
                        dfs(root[k], currPath, ans);
                        currPath.pop();
                    }
                }
                break;
            }
            case '[object Boolean]':
            case '[object Number]':
                ans[currPath.join('.')] = root;
                return;
            default:
                throw `unknown type ${typeof root} ${root}`;
        }
    }
}

// console.log(flatten({}))
// console.log(flatten({ a: 99 }))
// console.log(flatten({ a: { b: 99 }, c: {} }))

// 输出:
// {
// "a.b.c": 1,
// "a.b.d": true,
// "f.g": '3',
// "f.h": '4',
// "f.i": '5',
// "j[0]": 4,
// "j[1]": 5,
// "j[2].x": 7,
// "j[2].y": 8,
// }