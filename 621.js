const S = {
  Heart: "Heart",
  Club: "Club",
  Diamond: "Diamond",
  Spade: "Spade",
};
const R = {
  q: "Q",
  j: "J",
  k: "K",
  x: "10",
  ix: "9",
  vii: "7",
  i: "A",
  ii: "2",
  iii: "3",
  iv: "4",
  v: "5",
};
const SUITS = ["Club", "Diamond", "Heart", "Spade"];
const RANKS = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

const createStandardDeck = () =>
  SUITS.flatMap((suit) => RANKS.map((rank) => ({ suit, rank })));
const STANDARD_DECK = createStandardDeck();

const shuffleDeck = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const isFlush = (hand, flushRequirement = 5) => {
  const suitCounts = hand.reduce((acc, card) => {
    const count = acc[card.suit] || 0;
    return { ...acc, [card.suit]: count + 1 };
  }, {});

  return Object.values(suitCounts).some((count) => count >= flushRequirement);
};

const discardToFindFlush = (hand, maxCardsPerDiscard = 5) => {
  if (isFlush(hand)) {
    return { keep: hand, discard: [] };
  }

  const groupBySuit = hand.reduce((acc, card) => {
    const group = acc[card.suit] ?? [];
    return { ...acc, [card.suit]: [...group, card] };
  }, {});

  const presentSuits = Object.keys(groupBySuit);

  const bestSuit = presentSuits.reduce((best, currentSuit) => {
    const bestCount = groupBySuit[best] ? groupBySuit[best].length : 0;
    const currentCount = groupBySuit[currentSuit].length;

    return currentCount > bestCount ? currentSuit : best;
  }, presentSuits[0]);

  const keepCards = groupBySuit[bestSuit];
  const allDiscardable = hand.filter((card) => card.suit !== bestSuit);
  const discardCount = Math.min(allDiscardable.length, maxCardsPerDiscard);
  const discardCards = allDiscardable.slice(0, discardCount);
  const remainingNonTarget = allDiscardable.slice(discardCount);

  return {
    keep: [...keepCards, ...remainingNonTarget],
    discard: discardCards,
  };
};

const repeat = (n, what) => Array.from({ length: n }).fill(what);

function simulateOne(deck, isOk, howToDiscard, gameConfig) {
  let hand = deck.slice(0, gameConfig.handSize);
  let d = deck.slice(gameConfig.handSize);
  let numDiscardUsed = 0;
  const handHistory = [hand];

  while (true) {
    if (isOk(hand)) {
      break;
    }
    if (numDiscardUsed >= gameConfig.maxNumDiscards) {
      break;
    }
    if (d.length === 0) {
      break;
    }

    const { keep, discard } = howToDiscard(
      hand,
      gameConfig.maxCardsPerDiscard,
      d,
    );

    const drawCount = discard.length;
    const redrawCards = d.slice(0, drawCount);
    d = d.slice(drawCount);
    numDiscardUsed++;

    hand = [...keep, ...redrawCards];
    handHistory.push(hand);
  }

  return { success: isOk(hand), numDiscardUsed, handHistory };
}

function simMany(
  prepareDeckBeforeShuffle,
  isOk,
  howToDiscard,
  _gameConfig = {},
  simConfig = {
    totalSim: 3e4,
  },
) {
  const gameConfig = Object.assign(
    {
      maxNumDiscards: 4,
      handSize: 8,
      maxCardsPerDiscard: 5,
    },
    _gameConfig,
  );
  console.groupCollapsed("simmany");
  console.log("libq simmany/gameconfig", gameConfig);
  console.groupEnd();

  const deck = prepareDeckBeforeShuffle([...STANDARD_DECK]);
  const results = Array.from({ length: simConfig.totalSim }).map(() => {
    const shuffled = shuffleDeck(deck);
    return simulateOne(shuffled, isOk, howToDiscard, gameConfig);
  });
  console.groupCollapsed("libq simmany/results");
  console.log(results);
  console.groupEnd();

  const stats = results.reduce((groupby, row) => {
    const du = row.numDiscardUsed;
    if (groupby[du] === undefined) {
      groupby[du] = {
        discard: du,
        success: 0,
        successRate: 0,
      };
    }

    const g = groupby[du];
    row.success && (g.success += 1);
    g.successRate = (g.success / simConfig.totalSim) * 100;
    return groupby;
  }, {});
  for (let i = 0; i < Object.keys(stats).length; i++) {
    if (i === 0) {
      stats[i].cumulativeSuccessRate = stats[i].successRate;
    } else {
      stats[i].cumulativeSuccessRate =
        stats[i - 1].cumulativeSuccessRate + stats[i].successRate;
    }
    stats[i].failRate = +(100 - stats[i].cumulativeSuccessRate).toFixed(2);
    stats[i].cumulativeSuccessRate = +stats[i].cumulativeSuccessRate.toFixed(2);
  }

  console.table(stats, ["cumulativeSuccessRate", "failRate"]);
}

function deepCopy(d) {
  return JSON.parse(JSON.stringify(d));
}

function randomlyDiscard(hand, maxCardsPerDiscard = 5) {
  const h = shuffleDeck(hand);
  return {
    keep: h.slice(maxCardsPerDiscard),
    discard: h.slice(0, maxCardsPerDiscard),
  };
}

function getRankDistribution(cards) {
  return cards.reduce((dist, card) => {
    if (dist[card.rank] === undefined) {
      dist[card.rank] = 0;
    }
    dist[card.rank] += 1;
    return dist;
  }, {});
}

function containsPair(cards) {
  return Object.values(getRankDistribution(cards)).some((c) => c >= 2);
}
function findPair(hand, maxCardsPerDiscard = 5) {
  if (containsPair(hand)) {
    return { keep: hand, discard: [] };
  }
  return {
    keep: [...hand.slice(maxCardsPerDiscard)],
    discard: hand.slice(0, maxCardsPerDiscard),
  };
}

function partition(array, predict) {
  const yes = [];
  const no = [];
  for (let i = 0; i < array.length; i++) {
    if (predict(array[i], array)) {
      yes.push(array[i]);
    } else {
      no.push(array[i]);
    }
  }
  return [yes, no];
}
function containsThreeOak(cards) {
  return Object.values(getRankDistribution(cards)).some((c) => c >= 3);
}
// 新增工具函数：统计牌堆中指定rank的牌数量（遍历实现，不使用getRankDistribution）
function countRankInDeck(deck, targetRank) {
  let count = 0;
  // 遍历牌堆，统计目标rank的牌数
  for (let i = 0; i < deck.length; i++) {
    if (deck[i].rank === targetRank) {
      count++;
    }
  }
  return count;
}

// 新增工具函数：获取rank的数值（用于大小比较）
function getRankValue(rank) {
  const rankMap = {
    A: 14,
    K: 13,
    Q: 12,
    J: 11,
    10: 10,
    9: 9,
    8: 8,
    7: 7,
    6: 6,
    5: 5,
    4: 4,
    3: 3,
    2: 2,
  };
  return rankMap[rank] || 0;
}

// 优化后的findThreeOak函数（新增第三个参数deck：剩余牌堆）
function findThreeOak(hand, maxCardsPerDiscard, deck) {
  if (containsThreeOak(hand)) {
    return { keep: hand, discard: [] };
  }

  const dist = getRankDistribution(hand);

  if (containsPair(hand)) {
    // 步骤1：找出所有对子（rank出现次数≥2）
    const pairEntries = Object.entries(dist).filter(
      ([rank, count]) => count >= 2,
    );
    // 步骤2：按rank大小降序排序（大rank在前）
    const sortedPairEntries = pairEntries.sort((a, b) => {
      const rankA = a[0];
      const rankB = b[0];
      return getRankValue(rankB) - getRankValue(rankA);
    });

    // 步骤3：遍历排序后的对子，选择“牌堆剩余数量充足”的最优对子
    let selectedRank = sortedPairEntries[0][0]; // 默认选最大的对子
    let currentPairCount = dist[selectedRank]; // 当前选中对子的数量
    let selectedDeckCount = countRankInDeck(deck, selectedRank); // 牌堆中该rank的剩余数量

    // 检查是否有更优的对子（大rank但牌堆数量不足时，降级选择）
    for (let i = 1; i < sortedPairEntries.length; i++) {
      const candidateRank = sortedPairEntries[i][0];
      const candidatePairCount = dist[candidateRank];
      const candidateDeckCount = countRankInDeck(deck, candidateRank);

      // 核心规则：如果候选对子的牌堆剩余数量 ≥ 当前对子数量，且比原选中的更优（或原选中的不足）
      if (
        selectedDeckCount < currentPairCount &&
        candidateDeckCount >= candidatePairCount
      ) {
        selectedRank = candidateRank;
        currentPairCount = candidatePairCount;
        selectedDeckCount = candidateDeckCount;
        break; // 找到第一个符合条件的即可，因为是按rank降序排的
      }
    }

    // 步骤4：按选中的最优对子执行保留/丢弃逻辑
    const [y, n] = partition(hand, (c) => c.rank === selectedRank);
    const nMinKeep = Math.max(2, hand.length - maxCardsPerDiscard);
    const partitioned = [...y, ...n];
    return {
      keep: partitioned.slice(0, nMinKeep),
      discard: partitioned.slice(nMinKeep),
    };
  } else {
    return {
      discard: hand.slice(0, maxCardsPerDiscard),
      keep: hand.slice(maxCardsPerDiscard),
    };
  }
}

function runSimulationWrapper(prepareDeckCallback, discardStrategy) {
  return simMany(
    prepareDeckCallback,
    discardStrategy.goal,
    discardStrategy.discard,
  );
}

function printDeckBreakdownTable(deck) {
  const b = {
    [S.Heart]: {},
    [S.Club]: {},
    [S.Diamond]: {},
    [S.Spade]: {},
  };
  for (const suit in b) {
    for (const rank of RANKS) {
      b[suit][rank] = deck.filter(
        (c) => c.suit === suit && c.rank === rank,
      ).length;
    }
  }

  const rendered = {};

  const rankSums = {};
  for (const rank of RANKS) {
    let sumRank = 0;
    for (const suit in b) {
      sumRank += b[suit][rank];
    }
    rankSums[rank] = sumRank;
  }

  const columnTitles = [];
  for (const suit in b) {
    const sumSuit = Object.values(b[suit]).reduce((a, b) => a + b, 0);
    rendered[`(${sumSuit}) ${suit}`] = b[suit];
    for (const rank of RANKS.toReversed()) {
      columnTitles.push(`(${rankSums[rank]}) '${rank}'`);
      rendered[`(${sumSuit}) ${suit}`][columnTitles[columnTitles.length - 1]] =
        b[suit][rank];
    }
  }
  console.groupCollapsed("deck breakdown table");
  console.table(rendered, columnTitles);
  console.groupEnd();
}

function runSimulationsBasedOnUrl() {
  if (
    typeof window === "undefined" ||
    !window.location ||
    !window.location.search
  ) {
    console.log(
      "URL parameters not available (not in browser or missing search query). Running all simulations.",
    );
    const HAND_TYPES = ["flush", "pair", "3oak", "house"]; // 新增house
    HAND_TYPES.forEach((type) => runSimulationForType(type));
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const handtypesParam = params.get("handtypes");

  if (!handtypesParam) {
    console.log(
      "Missing '?handtypes=...' URL parameter. Skipping simulations.",
    );
    return;
  }

  const handtypesToRun = handtypesParam
    .split(",")
    .map((s) => s.trim().toLowerCase());

  const supportedHandTypes = [
    "flush",
    "pair",
    "3oak",
    "4oak",
    "5oak",
    "house", // 新增house
    "2pair",
  ];

  handtypesToRun.forEach((type) => {
    if (supportedHandTypes.includes(type)) {
      runSimulationForType(type);
    } else {
      console.log(`Skipping unsupported hand type: ${type}`);
    }
  });
}

function runSimulationForType(type) {
  switch (type) {
    case "flush":
      simFlush();
      break;
    case "pair":
      simPair();
      break;
    case "3oak":
      simThree();
      break;
    case "2pair":
      simTwoPair();
      break;
    case "house": // 新增house分支
      simHouse();
      break;
    case "4oak":
    case "5oak":
    default:
      console.log(`Simulation for hand type '${type}' is not yet implemented.`);
      break;
  }
}

function simFlush() {
  console.log("%cflush", "color:#f00;font-size:2rem");

  simMany(
    (d) => {
      console.log("standard");
      printDeckBreakdownTable(d);
      return d;
    },
    isFlush,
    discardToFindFlush,
  );

  simMany(
    (d) => {
      const ans = deepCopy(d);
      ans.find((c) => c.suit === "Heart").suit = "Spade";
      ans.find((c) => c.suit === "Heart").suit = "Spade";
      ans.find((c) => c.suit === "Heart").suit = "Spade";
      ans.find((c) => c.suit === "Heart").suit = "Spade";
      ans.find((c) => c.suit === "Heart").suit = "Spade";
      console.log("5 heart becomes spade");
      printDeckBreakdownTable(ans);
      return ans;
    },
    isFlush,
    discardToFindFlush,
  );

  simMany(
    (d) => {
      const ans = d.slice(10);
      console.log("10 cards of same suit removed");
      printDeckBreakdownTable(ans);
      return ans;
    },
    isFlush,
    discardToFindFlush,
  );

  simMany(
    (d) => {
      console.log("standard, discard randomly");
      printDeckBreakdownTable(d);
      return d;
    },
    isFlush,
    randomlyDiscard,
  );

  simMany(
    (d) => {
      const ans = deepCopy(d);
      ans.find((c) => c.suit === "Heart").suit = "Spade";
      ans.find((c) => c.suit === "Heart").suit = "Spade";
      ans.find((c) => c.suit === "Heart").suit = "Spade";
      ans.find((c) => c.suit === "Heart").suit = "Spade";
      ans.find((c) => c.suit === "Heart").suit = "Spade";
      console.log("5 heart becomes spade, discard randomly");
      printDeckBreakdownTable(ans);
      return ans;
    },
    isFlush,
    randomlyDiscard,
  );

  simMany(
    (d) => {
      const ans = d.slice(10);
      console.log("10 cards of same suit removed, discard randomly");
      printDeckBreakdownTable(ans);
      return ans;
    },
    isFlush,
    randomlyDiscard,
  );

  console.log("%cflush ends", "color:#0f0;font-size:2rem");
}

function simPair() {
  console.log("%cpair", "color:#f00;font-size:2rem");

  simMany(
    (d) => {
      console.log("standard deck");
      printDeckBreakdownTable(d);
      return d;
    },
    containsPair,
    findPair,
  );

  simMany(
    (d) => {
      const ans = [...d];
      ans.push(...repeat(5, { rank: R.vii, suit: S.Heart }));
      console.log("5 additional 7 of hearts are added");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsPair,
    findPair,
  );

  simMany(
    (d) => {
      const ans = [...d];
      ans.push(...repeat(10, { rank: R.vii, suit: S.Heart }));
      console.log("10 additional 7 of hearts are added");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsPair,
    findPair,
  );

  simMany(
    (d) => {
      const ans = [...d];
      ans.push({ rank: R.i, suit: S.Heart });
      ans.push({ rank: R.ii, suit: S.Heart });
      ans.push({ rank: R.iii, suit: S.Heart });
      ans.push({ rank: R.iv, suit: S.Heart });
      ans.push({ rank: R.v, suit: S.Heart });
      console.log("each of A2345 is added");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsPair,
    findPair,
  );

  simMany(
    (d) => {
      const ans = [...d];
      ans.push({ rank: R.i, suit: S.Heart });
      ans.push({ rank: R.ii, suit: S.Heart });
      ans.push({ rank: R.iii, suit: S.Heart });
      ans.push({ rank: R.iv, suit: S.Heart });
      ans.push({ rank: R.v, suit: S.Heart });
      ans.push({ rank: R.i, suit: S.Heart });
      ans.push({ rank: R.ii, suit: S.Heart });
      ans.push({ rank: R.iii, suit: S.Heart });
      ans.push({ rank: R.iv, suit: S.Heart });
      ans.push({ rank: R.v, suit: S.Heart });
      console.log("each of A2345 is added twice");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsPair,
    findPair,
  );

  console.log("%cpair ends", "color:#0f0;font-size:2rem");
}

function simThree() {
  console.log("%c3oak", "color:#f00;font-size:2rem");

  simMany(
    (d) => {
      console.log("standard deck");
      printDeckBreakdownTable(d);
      return d;
    },
    containsThreeOak,
    findThreeOak,
  );

  simMany(
    (d) => {
      console.log("standard deck, randomly discard");
      printDeckBreakdownTable(d);
      return d;
    },
    containsThreeOak,
    randomlyDiscard,
  );

  simMany(
    (d) => {
      const ans = [...d];
      ans.push(...repeat(5, { rank: R.vii, suit: S.Heart }));
      console.log("5 additional 7 of hearts are added");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsThreeOak,
    findThreeOak,
  );

  simMany(
    (d) => {
      const ans = [...d];
      ans.push(...repeat(10, { rank: R.vii, suit: S.Heart }));
      console.log("10 additional 7 of hearts are added");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsThreeOak,
    findThreeOak,
  );

  simMany(
    (d) => {
      let ans = [...d];
      ans.push({ rank: R.i, suit: S.Heart });
      ans.push({ rank: R.ii, suit: S.Heart });
      ans.push({ rank: R.iii, suit: S.Heart });
      ans.push({ rank: R.iv, suit: S.Heart });
      ans.push({ rank: R.v, suit: S.Heart });
      ans = ans.filter((c) => !(c.suit === S.Heart && c.rank === R.ix));
      ans = ans.filter((c) => !(c.suit === S.Heart && c.rank === R.x));
      ans = ans.filter((c) => !(c.suit === S.Heart && c.rank === R.j));
      ans = ans.filter((c) => !(c.suit === S.Heart && c.rank === R.q));
      ans = ans.filter((c) => !(c.suit === S.Heart && c.rank === R.k));
      console.log("each of A2345 is added and each of 910JQK is removed");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsThreeOak,
    findThreeOak,
  );

  simMany(
    (d) => {
      const ans = [...d];
      ans.push({ rank: R.j, suit: S.Heart });
      ans.push({ rank: R.q, suit: S.Heart });
      ans.push({ rank: R.k, suit: S.Heart });
      ans.push({ rank: R.j, suit: S.Heart });
      ans.push({ rank: R.q, suit: S.Heart });
      ans.push({ rank: R.k, suit: S.Heart });
      ans.push({ rank: R.j, suit: S.Heart });
      ans.push({ rank: R.q, suit: S.Heart });
      ans.push({ rank: R.k, suit: S.Heart });
      console.log("each of JQK is added 3 times");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsThreeOak,
    findThreeOak,
  );

  simMany(
    (d) => {
      const ans = [...d];
      ans.push({ rank: R.i, suit: S.Heart });
      ans.push({ rank: R.ii, suit: S.Heart });
      ans.push({ rank: R.iii, suit: S.Heart });
      ans.push({ rank: R.iv, suit: S.Heart });
      ans.push({ rank: R.v, suit: S.Heart });
      console.log("each of A2345 is added");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsThreeOak,
    findThreeOak,
  );

  simMany(
    (d) => {
      const ans = [...d];
      ans.push({ rank: R.i, suit: S.Heart });
      ans.push({ rank: R.ii, suit: S.Heart });
      ans.push({ rank: R.iii, suit: S.Heart });
      ans.push({ rank: R.iv, suit: S.Heart });
      ans.push({ rank: R.v, suit: S.Heart });
      ans.push({ rank: R.i, suit: S.Heart });
      ans.push({ rank: R.ii, suit: S.Heart });
      ans.push({ rank: R.iii, suit: S.Heart });
      ans.push({ rank: R.iv, suit: S.Heart });
      ans.push({ rank: R.v, suit: S.Heart });
      console.log("each of A2345 is added twice");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsThreeOak,
    findThreeOak,
  );

  simMany(
    (d) => {
      let ans = [...d];
      ans = ans.filter((c) => !(c.rank === R.vi && c.suit === S.Heart));
      ans.push({ rank: R.vii, suit: S.Heart });
      ans.push({ rank: R.vii, suit: S.Heart });
      console.log("one 6 removed, two 7s added");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsThreeOak,
    findThreeOak,
  );

  simMany(
    (d) => {
      let ans = [...d];
      ans = ans.filter((c) => !(c.rank === "6" && c.suit === S.Heart));
      ans = ans.filter((c) => !(c.rank === "6" && c.suit === S.Club));
      ans.push({ rank: R.vii, suit: S.Heart });
      console.log("two 6s removed, one 7 added");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsThreeOak,
    findThreeOak,
  );

  simMany(
    (d) => {
      let ans = [...d];
      ans.push({ rank: R.vii, suit: S.Heart });
      ans = ans.filter((c) => !(c.rank === "5" && c.suit === S.Heart));
      ans = ans.filter((c) => !(c.rank === "6" && c.suit === S.Heart));
      console.log("one 7 added, one 5 removed, one 6 removed");
      printDeckBreakdownTable(ans);
      return ans;
    },
    containsThreeOak,
    findThreeOak,
  );

  console.log("%c3oak ends", "color:#0f0;font-size:2rem");
}

function findHighCard(hand, maxCardsPerDiscard = 5) {
  const sorted = hand.toSorted((a, b) => b.rank - a.rank);
  const nKeep = Math.max(1, sorted.length - maxCardsPerDiscard);
  return {
    keep: sorted.slice(0, nKeep),
    discard: sorted.slice(nKeep),
  };
}
function countBy(array, property) {
  const ans = {};
  for (const i of array) {
    if (undefined === ans[i[property]]) {
      ans[i[property]] = 0;
    }
    ans[i[property]] += 1;
  }
  return ans;
}
function groupBy(array, property) {
  const ans = {};
  for (const i of array) {
    if (undefined === ans[i[property]]) {
      ans[i[property]] = [];
    }
    ans[i[property]].push(i);
  }
  return ans;
}
function containsTwoPair(hand) {
  const cnt = countBy(hand, "rank");
  return Object.values(cnt).filter((c) => c >= 2).length >= 2;
}
function findTwoPair(hand, maxCardsPerDiscard = 5) {
  if (containsTwoPair(hand)) {
    return { keep: hand, discard: [] };
  }
  if (containsPair(hand)) {
    const g = Object.values(groupBy(hand, "rank"));
    const pair = g.find((r) => r.length >= 2);
    const dontNeed = g
      .filter((r) => r !== pair)
      .flat()
      .sort((a, b) => a.rank - b.rank);
    const dontNeedButKeep = dontNeed.slice(maxCardsPerDiscard);
    const discard = dontNeed.slice(0, maxCardsPerDiscard);
    return {
      keep: [...pair, ...dontNeedButKeep],
      discard,
    };
  } else {
    return findHighCard(hand, maxCardsPerDiscard);
  }
}
function simTwoPair() {
  console.log("%c2pair", "color:#f00;font-size:2rem");

  simMany(
    (d) => {
      console.log("standard deck, randomly discard");
      printDeckBreakdownTable(d);
      return d;
    },
    containsTwoPair,
    randomlyDiscard,
  );
  simMany(
    (d) => {
      console.log("standard deck, naive greedy, handsize=7");
      printDeckBreakdownTable(d);
      return d;
    },
    containsTwoPair,
    findTwoPair,
    { handSize: 7 },
  );
  simMany(
    (d) => {
      console.log("standard deck, naive greedy, handsize=8");
      printDeckBreakdownTable(d);
      return d;
    },
    containsTwoPair,
    findTwoPair,
    { handSize: 8 },
  );
  simMany(
    (d) => {
      console.log("standard deck, naive greedy, handsize=8,4 per discard");
      printDeckBreakdownTable(d);
      return d;
    },
    containsTwoPair,
    findTwoPair,
    { maxCardsPerDiscard: 4 },
  );
  simMany(
    (d) => {
      console.log("standard deck, naive greedy, handsize=8,3 per discard");
      printDeckBreakdownTable(d);
      return d;
    },
    containsTwoPair,
    findTwoPair,
    { maxCardsPerDiscard: 3 },
  );
  simMany(
    (d) => {
      console.log("standard deck, naive greedy, handsize=8,1 per discard");
      printDeckBreakdownTable(d);
      return d;
    },
    containsTwoPair,
    findTwoPair,
    { maxCardsPerDiscard: 1 },
  );
  simMany(
    (d) => {
      console.log("standard deck, naive greedy, handsize=9");
      printDeckBreakdownTable(d);
      return d;
    },
    containsTwoPair,
    findTwoPair,
    { handSize: 9 },
  );
  simMany(
    (d) => {
      console.log("standard deck, naive greedy, handsize=10");
      printDeckBreakdownTable(d);
      return d;
    },
    containsTwoPair,
    findTwoPair,
    { handSize: 10 },
  );
  simMany(
    (d) => {
      console.log("standard deck, naive greedy, handsize=11");
      printDeckBreakdownTable(d);
      return d;
    },
    containsTwoPair,
    findTwoPair,
    { handSize: 11 },
  );

  console.log("%c2pair ends", "color:#0f0;font-size:2rem");
}

// 新增：判断葫芦牌型
function containsFullHouse(hand) {
  // 统计每个rank的出现次数
  const rankCount = countBy(hand, "rank");
  const rankEntries = Object.entries(rankCount); // [rank, count] 数组

  // 过滤掉5张同rank的情况（22222不算葫芦）
  const validRankEntries = rankEntries.filter(([_, count]) => count !== 5);
  if (validRankEntries.length < 2) return false; // 至少需要两个不同rank

  // 步骤1：找出所有出现次数≥3的rank（可能有多个，比如222333）
  const threePlusRanks = validRankEntries.filter(([_, count]) => count >= 3);
  if (threePlusRanks.length === 0) return false;

  // 步骤2：对每个≥3的rank，检查是否存在其他rank≥2
  for (const [threeRank, threeCount] of threePlusRanks) {
    // 找非当前rank、且次数≥2的rank
    const hasValidPair = validRankEntries.some(
      ([pairRank, pairCount]) => pairRank !== threeRank && pairCount >= 2,
    );
    if (hasValidPair) return true;
  }

  return false;
}

// 新增：葫芦牌型的丢牌策略
function findFullHouse(hand, maxCardsPerDiscard = 5) {
  // 已凑出葫芦，无需丢弃
  if (containsFullHouse(hand)) {
    return { keep: hand, discard: [] };
  }

  // 工具函数：获取rank的数值（用于大小排序）
  const getRankValue = (rank) => {
    const rankMap = {
      A: 14,
      K: 13,
      Q: 12,
      J: 11,
      10: 10,
      9: 9,
      8: 8,
      7: 7,
      6: 6,
      5: 5,
      4: 4,
      3: 3,
      2: 2,
    };
    return rankMap[rank] || 0;
  };

  // 步骤1：按rank分组并统计次数
  const rankGroups = groupBy(hand, "rank");
  const rankEntries = Object.entries(rankGroups).map(([rank, cards]) => ({
    rank,
    cards,
    count: cards.length,
    value: getRankValue(rank),
  }));

  // 步骤2：处理有三条/四条的情况（优先保留三条）
  const threePlusEntries = rankEntries.filter((item) => item.count >= 3);
  if (threePlusEntries.length > 0) {
    // 选点数最大的三条/四条（优先保留大点数）
    const targetThreeEntry = threePlusEntries.sort(
      (a, b) => b.value - a.value,
    )[0];
    let keepThreeCards = [];

    if (targetThreeEntry.count === 4) {
      // 四条：随机丢1张，保留3张（这里取前3张）
      keepThreeCards = targetThreeEntry.cards.slice(0, 3);
    } else if (targetThreeEntry.count >= 3) {
      // 三条：全部保留
      keepThreeCards = targetThreeEntry.cards;
    }

    // 剩余牌：排除当前三条的rank，按点数从大到小排序
    const remainingCards = hand
      .filter((card) => card.rank !== targetThreeEntry.rank)
      .sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));

    // 计算需要保留的剩余牌数量（总手牌数 - 最大可丢弃数 - 核心牌组数量）
    const maxKeepRemaining =
      hand.length - maxCardsPerDiscard - keepThreeCards.length;
    const keepRemaining =
      maxKeepRemaining > 0 ? remainingCards.slice(0, maxKeepRemaining) : [];

    const keep = [...keepThreeCards, ...keepRemaining];
    const discard = hand
      .filter((card) => !keep.includes(card))
      .slice(0, maxCardsPerDiscard);
    return { keep, discard };
  }

  // 步骤3：没有三条/四条，检查是否有两个及以上对牌
  const pairEntries = rankEntries.filter((item) => item.count >= 2);
  if (pairEntries.length >= 2) {
    // 取点数最大的两个对牌，4张全保留
    const sortedPairs = pairEntries
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);
    const keepPairCards = [...sortedPairs[0].cards, ...sortedPairs[1].cards];

    // 剩余牌按点数从大到小排序，补充保留
    const remainingCards = hand
      .filter(
        (card) =>
          !keepPairCards.some(
            (c) => c.rank === card.rank && c.suit === card.suit,
          ),
      )
      .sort((a, b) => getRankValue(b.rank) - getRankValue(a.rank));

    const maxKeepRemaining =
      hand.length - maxCardsPerDiscard - keepPairCards.length;
    const keepRemaining =
      maxKeepRemaining > 0 ? remainingCards.slice(0, maxKeepRemaining) : [];

    const keep = [...keepPairCards, ...keepRemaining];
    const discard = hand
      .filter((card) => !keep.includes(card))
      .slice(0, maxCardsPerDiscard);
    return { keep, discard };
  }

  // 步骤4：只有单张/单个对牌，丢数字小的
  // 按点数从大到小排序，保留前 N 张（N = 总手牌数 - 最大可丢弃数）
  const sortedByRank = hand.sort(
    (a, b) => getRankValue(b.rank) - getRankValue(a.rank),
  );
  const keepCount = Math.max(hand.length - maxCardsPerDiscard, 0);
  const keep = sortedByRank.slice(0, keepCount);
  const discard = sortedByRank.slice(keepCount).slice(0, maxCardsPerDiscard);

  return { keep, discard };
}

function simHouse() {
  console.log("%chouse", "color:#f00;font-size:2rem");

  simMany(
    (d) => {
      console.log("standard deck (full house simulation)");
      printDeckBreakdownTable(d);
      return d;
    },
    containsFullHouse,
    findFullHouse,
  );

  // 改法1：JQKA各加3张（总计12张）
  simMany(
    (d) => {
      const addCards = [
        // J新增3张
        { rank: "J", suit: "Heart" },
        { rank: "J", suit: "Club" },
        { rank: "J", suit: "Diamond" },
        // Q新增3张
        { rank: "Q", suit: "Heart" },
        { rank: "Q", suit: "Club" },
        { rank: "Q", suit: "Diamond" },
        // K新增3张
        { rank: "K", suit: "Heart" },
        { rank: "K", suit: "Club" },
        { rank: "K", suit: "Diamond" },
        // A新增3张
        { rank: "A", suit: "Heart" },
        { rank: "A", suit: "Club" },
        { rank: "A", suit: "Diamond" },
      ];
      const modifiedDeck = [...d, ...addCards];
      console.log("改法1：JQKA各加3张（总计12张）");
      printDeckBreakdownTable(modifiedDeck);
      return modifiedDeck;
    },
    containsFullHouse,
    findFullHouse,
  );

  // 改法2：2345各去掉3张（总计12张）
  simMany(
    (d) => {
      const removeCountMap = { 2: 0, 3: 0, 4: 0, 5: 0 };
      const modifiedDeck = d.filter((card) => {
        const rank = card.rank;
        if (["2", "3", "4", "5"].includes(rank) && removeCountMap[rank] < 3) {
          removeCountMap[rank] += 1;
          return false;
        }
        return true;
      });
      console.log("改法2：2345各去掉3张（总计12张）");
      printDeckBreakdownTable(modifiedDeck);
      return modifiedDeck;
    },
    containsFullHouse,
    findFullHouse,
  );

  // 改法3：9和8各加6张（总计12张）
  simMany(
    (d) => {
      const addCards = [
        // 8新增6张
        { rank: "8", suit: "Heart" },
        { rank: "8", suit: "Club" },
        { rank: "8", suit: "Diamond" },
        { rank: "8", suit: "Spade" },
        { rank: "8", suit: "Heart" },
        { rank: "8", suit: "Club" },
        // 9新增6张
        { rank: "9", suit: "Heart" },
        { rank: "9", suit: "Club" },
        { rank: "9", suit: "Diamond" },
        { rank: "9", suit: "Spade" },
        { rank: "9", suit: "Heart" },
        { rank: "9", suit: "Club" },
      ];
      const modifiedDeck = [...d, ...addCards];
      console.log("改法3：9和8各加6张（总计12张）");
      printDeckBreakdownTable(modifiedDeck);
      return modifiedDeck;
    },
    containsFullHouse,
    findFullHouse,
  );

  // 新增改法1：678910J各加1张（6张） + A23456各去掉1张（6张） 总计12张修改
  simMany(
    (d) => {
      // 步骤1：A23456各移除1张（共6张）
      const removeCountMap = { A: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      const filteredDeck = d.filter((card) => {
        const rank = card.rank;
        if (
          ["A", "2", "3", "4", "5", "6"].includes(rank) &&
          removeCountMap[rank] < 1
        ) {
          removeCountMap[rank] += 1;
          return false; // 移除该牌
        }
        return true;
      });

      // 步骤2：678910J各新增1张（共6张）
      const addCards = [
        { rank: "6", suit: "Heart" },
        { rank: "7", suit: "Club" },
        { rank: "8", suit: "Diamond" },
        { rank: "9", suit: "Spade" },
        { rank: "10", suit: "Heart" },
        { rank: "J", suit: "Club" },
      ];
      const modifiedDeck = [...filteredDeck, ...addCards];

      console.log("新增改法1：678910J各加1张 + A23456各去掉1张（总计12张）");
      printDeckBreakdownTable(modifiedDeck);
      return modifiedDeck;
    },
    containsFullHouse,
    findFullHouse,
  );

  // 新增改法2：456789各加两张（2×6=12张） 总计12张修改
  simMany(
    (d) => {
      // 456789各新增2张（共12张）
      const addCards = [
        // 4新增2张
        { rank: "4", suit: "Heart" },
        { rank: "4", suit: "Club" },
        // 5新增2张
        { rank: "5", suit: "Heart" },
        { rank: "5", suit: "Club" },
        // 6新增2张
        { rank: "6", suit: "Heart" },
        { rank: "6", suit: "Club" },
        // 7新增2张
        { rank: "7", suit: "Heart" },
        { rank: "7", suit: "Club" },
        // 8新增2张
        { rank: "8", suit: "Heart" },
        { rank: "8", suit: "Club" },
        // 9新增2张
        { rank: "9", suit: "Heart" },
        { rank: "9", suit: "Club" },
      ];
      const modifiedDeck = [...d, ...addCards];

      console.log("新增改法2：456789各加两张（总计12张）");
      printDeckBreakdownTable(modifiedDeck);
      return modifiedDeck;
    },
    containsFullHouse,
    findFullHouse,
  );

  // 新增改法2：456789各加两张（2×6=12张） 总计12张修改
  simMany(
    (d) => {
      // 456789各新增2张（共12张）
      const addCards = [
        // 4新增2张
        { rank: "4", suit: "Heart" },
        { rank: "4", suit: "Club" },
        // 5新增2张
        { rank: "5", suit: "Heart" },
        { rank: "5", suit: "Club" },
        // 6新增2张
        { rank: "6", suit: "Heart" },
        { rank: "6", suit: "Club" },
        // 7新增2张
        { rank: "7", suit: "Heart" },
        { rank: "7", suit: "Club" },
        // 8新增2张
        { rank: "8", suit: "Heart" },
        { rank: "8", suit: "Club" },
        // 9新增2张
        { rank: "9", suit: "Heart" },
        { rank: "9", suit: "Club" },
      ];
      const modifiedDeck = [...d, ...addCards];

      console.log("+456789 +456789, handsize=9");
      printDeckBreakdownTable(modifiedDeck);
      return modifiedDeck;
    },
    containsFullHouse,
    findFullHouse,
    { handSize: 9 },
  );

  simMany(
    (d) => {
      console.log("standard deck (full house simulation)");
      printDeckBreakdownTable(d);
      return d;
    },
    containsFullHouse,
    findFullHouse,
    { handSize: 9 },
  );

  console.log("%chouse ends", "color:#0f0;font-size:2rem");
}

runSimulationsBasedOnUrl();

// 1. 判断是否满足：至少有3张牌是10或4（花色不限）
function containsTenFour(hand) {
  // 筛选出rank为10或4的牌
  const targetCards = hand.filter(
    (card) => card.rank === "10" || card.rank === "4",
  );
  // 成功条件：目标牌数量 ≥3
  return targetCards.length >= 3;
}

// 2. 丢牌策略：留下10/4的牌，其他全部丢掉（遵守maxCardsPerDiscard限制）
function findTenFour(hand, maxCardsPerDiscard = 5) {
  // 筛选要保留的牌：10或4
  const keepCards = hand.filter(
    (card) => card.rank === "10" || card.rank === "4",
  );
  // 筛选要丢弃的牌：非10/4的牌
  const dontNeed = hand.filter((card) => !keepCards.includes(card));

  // 限制单次最大丢弃数
  const discard = dontNeed.slice(0, maxCardsPerDiscard);
  keepCards.push(...dontNeed.slice(maxCardsPerDiscard));

  return {
    keep: keepCards,
    discard,
  };
}

// 3. 模拟入口：计算摸到至少3张10/4的概率（仅标准牌库+默认参数）
function simTenFour() {
  console.log("%c10/4 (≥3张) simulation", "color:#f00;font-size:2rem");

  // 调用simMany执行模拟
  simMany(
    (d) => {
      console.log("standard deck (10/4 ≥3张 simulation)");
      printDeckBreakdownTable(d);
      return d;
    },
    containsTenFour,
    findTenFour,
    // 沿用默认配置：手牌8张、最多丢弃4次、每次丢5张、3万次模拟
  );

  console.log("%c10/4 simulation ends", "color:#0f0;font-size:2rem");
}

// 1. 判断是否满足条件：手牌中至少有1张7（花色不限）
function containsOneOfFour(hand) {
  // 筛选出手牌中rank为7的牌，只要有1张即成功
  return hand.some((card) => card.rank === "7");
}

// 2. 丢牌策略：保留7牌，丢弃所有非7牌（遵守maxCardsPerDiscard限制）
function findOneOfFour(hand, maxCardsPerDiscard = 5) {
  // 保留所有7牌
  const keepCards = hand.filter((card) => card.rank === "7");
  // 筛选要丢弃的非7牌
  const dontNeed = hand.filter((card) => !keepCards.includes(card));

  // 限制单次最大丢弃数
  const discardCards = dontNeed.slice(0, maxCardsPerDiscard);
  keepCards.push(...dontNeed.slice(maxCardsPerDiscard));

  return {
    keep: keepCards,
    discard: discardCards,
  };
}

// 3. 模拟入口：计算摸到至少1张7的概率（标准牌堆 + 新增1张7牌两个案例）
function simOneOfFour() {
  console.log("%cOne of Four (7) simulation", "color:#f00;font-size:2rem");

  // 案例1：标准牌库（默认52张，7有4张）
  simMany(
    (d) => {
      console.log("案例1：标准牌库（7有4张）");
      printDeckBreakdownTable(d);
      return d;
    },
    containsOneOfFour,
    findOneOfFour,
  );

  // 案例2：标准牌库 + 新增1张7牌（7的总数变为5张）
  simMany(
    (d) => {
      // 新增1张红桃7
      const modifiedDeck = [...d, { rank: "7", suit: "Heart" }];
      console.log("案例2：标准牌库 + 新增1张7牌（7有5张）");
      printDeckBreakdownTable(modifiedDeck);
      return modifiedDeck;
    },
    containsOneOfFour,
    findOneOfFour,
  );

  console.log("%cOne of Four simulation ends", "color:#0f0;font-size:2rem");
}

// 模拟入口：计算「有7且剔除1张7后仍有5张同花」的概率
function simSevenAndFlush() {
  console.log(
    "%cSeven + Flush (exclude 1 seven) simulation",
    "color:#f00;font-size:2rem",
  );

  // 案例1：标准牌库（52张，7有4张）
  simMany(
    (d) => {
      console.log("案例1：标准牌库（7有4张）");
      printDeckBreakdownTable(d);
      return d;
    },
    containsSevenAndFlush,
    findSevenAndFlush,
    // 沿用默认配置：手牌8张、最多丢弃4次、每次丢5张、3万次模拟
  );

  // 案例2：标准牌库 + 新增1张7牌（7的总数变为5张，提升7的出现概率）
  simMany(
    (d) => {
      // 新增1张红桃7（花色不影响，仅提升7的数量）
      const modifiedDeck = [...d, { rank: "7", suit: "Heart" }];
      console.log("案例2：标准牌库 + 新增1张7牌（7有5张）");
      printDeckBreakdownTable(modifiedDeck);
      return modifiedDeck;
    },
    containsSevenAndFlush,
    findSevenAndFlush,
  );

  console.log("%cSeven + Flush simulation ends", "color:#0f0;font-size:2rem");
}

// 工具函数：判断手牌剔除指定牌后是否有至少N张同花色牌
function hasFlushAfterExcludeCards(hand, excludeCards, n = 5) {
  // 剔除指定牌后统计花色
  const filteredHand = hand.filter((card) => !excludeCards.includes(card));
  if (filteredHand.length < n) return false;

  const suitCount = {};
  for (const card of filteredHand) {
    suitCount[card.suit] = (suitCount[card.suit] || 0) + 1;
  }
  return Object.values(suitCount).some((count) => count >= n);
}

// 1. 核心判断函数：containsSevenAndFlush（修正版）
// 规则：
// - 手牌至少有1张7；
// - 剔除任意1张7后，剩余手牌仍能凑出5张同花（即使这张7是同花核心也必须剔除）；
// - 同花可含其他7，但必须保证「拿走1张7后仍有5张同花」（打出同花后手牌剩7）
function containsSevenAndFlush(hand) {
  // 条件1：至少有1张7
  const sevenCards = hand.filter((card) => card.rank === "7");
  if (sevenCards.length === 0) return false;

  // 条件2：剔除任意1张7后，剩余手牌仍能凑5张同花（遍历所有7，只要有1种剔除方式满足即可）
  for (const sevenToExclude of sevenCards) {
    const hasFlush = hasFlushAfterExcludeCards(hand, [sevenToExclude], 5);
    if (hasFlush) return true;
  }

  // 所有7剔除后都凑不出5张同花 → 不满足
  return false;
}

// 2. 丢牌策略函数：findSevenAndFlush（修正版）
// 核心目标：
// - 优先保留「剔除1张7后仍能凑5张同花」的牌组；
// - 保证keep中至少有1张7；
// - 严格遵守：keep.length + discard.length = 手牌总数；
// - discard.length ≤ maxCardsPerDiscard
function findSevenAndFlush(hand, maxCardsPerDiscard = 5) {
  // 步骤1：分离所有7牌和非7牌
  const sevenCards = hand.filter((card) => card.rank === "7");
  const nonSevenCards = hand.filter((card) => card.rank !== "7");

  // 步骤2：找到「剔除后能凑同花」的最优7（优先保留这张7，其余7可参与同花）
  let targetSevenToKeep = sevenCards[0]; // 默认保留第一张7
  for (const seven of sevenCards) {
    if (hasFlushAfterExcludeCards(hand, [seven], 5)) {
      targetSevenToKeep = seven;
      break; // 找到第一个满足条件的7即可
    }
  }

  // 步骤3：筛选「剔除targetSevenToKeep后，能凑5张同花的最优花色」
  const handWithoutTargetSeven = hand.filter(
    (card) => card !== targetSevenToKeep,
  );
  let bestFlushSuit = "";
  let maxSuitCount = 0;
  const suitCount = {};
  for (const card of handWithoutTargetSeven) {
    suitCount[card.suit] = (suitCount[card.suit] || 0) + 1;
    if (suitCount[card.suit] > maxSuitCount) {
      maxSuitCount = suitCount[card.suit];
      bestFlushSuit = card.suit;
    }
  }

  // 步骤4：构建保留/丢弃列表（核心：保留targetSevenToKeep + 最优同花牌 + 丢不完的牌）
  // 必须保留的牌：目标7 + 最优同花的所有牌（剔除目标7后的同花牌）
  const mustKeep = [
    targetSevenToKeep,
    ...handWithoutTargetSeven
      .filter((card) => card.suit === bestFlushSuit)
      .slice(0, 5),
  ].filter(Boolean);

  // 待丢弃的牌：非最优同花的牌（优先丢这些）
  const discardCandidates = hand.filter(
    (card) => !mustKeep.includes(card) && card !== targetSevenToKeep,
  );

  // 步骤5：控制丢弃上限，保证总数守恒
  const actualDiscard = discardCandidates.slice(0, maxCardsPerDiscard);
  const keepUnDiscardable = discardCandidates.slice(maxCardsPerDiscard); // 丢不完的补回

  // 最终保留列表：必须保留的牌 + 丢不完的牌（去重）
  const keep = [...new Set([...mustKeep, ...keepUnDiscardable])];
  // 最终丢弃列表：确保总数守恒（反向过滤）
  const discard = hand.filter((card) => !keep.includes(card));

  return {
    keep: keep,
    discard: discard,
  };
}
