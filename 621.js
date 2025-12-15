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

    const { keep, discard } = howToDiscard(hand, gameConfig.maxCardsPerDiscard);

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
  gameConfig = {
    maxNumDiscards: 3,
    handSize: 8,
    maxCardsPerDiscard: 5,
  },
  simConfig = {
    totalSim: 3e4,
  },
) {
  const deck = prepareDeckBeforeShuffle([...STANDARD_DECK]);
  const results = Array.from({ length: simConfig.totalSim }).map(() => {
    const shuffled = shuffleDeck(deck);
    return simulateOne(shuffled, isOk, howToDiscard, gameConfig);
  });

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

function simFlush(prepareDeck, discard = discardToFindFlush, goal = isFlush) {
  console.log("%cflush", "color:#f00;font-size:2rem");

  prepareDeck((d) => {
    console.log("standard", d);
    return d;
  }, discard);

  prepareDeck((d) => {
    const ans = deepCopy(d);
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    console.log("5 heart becomes spade");
    printDeckBreakdownTable(ans);
    return ans;
  }, discard);

  prepareDeck((d) => {
    const ans = d.slice(10);
    console.log("10 cards of same suit removed");
    printDeckBreakdownTable(ans);
    return ans;
  }, discard);

  prepareDeck((d) => {
    console.log("standard, discard randomly", d);
    return d;
  }, randomlyDiscard);

  prepareDeck((d) => {
    const ans = deepCopy(d);
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    console.log("5 heart becomes spade, discard randomly");
    printDeckBreakdownTable(ans);
    return ans;
  }, randomlyDiscard);

  prepareDeck((d) => {
    const ans = d.slice(10);
    console.log("10 cards of same suit removed, discard randomly");
    printDeckBreakdownTable(ans);
    return ans;
  }, randomlyDiscard);

  console.log("%cflush ends", "color:#0f0;font-size:2rem");
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

function simPair(prepareDeck) {
  console.log("%cpair", "color:#f00;font-size:2rem");

  prepareDeck((d) => {
    console.log("standard deck");
    return d;
  }, findPair);

  prepareDeck((d) => {
    const ans = [...d];
    ans.push(...repeat(5, { rank: R.vii, suit: S.Heart }));
    console.log("5 additional 7 of hearts are added");
    printDeckBreakdownTable(ans);
    return ans;
  }, findPair);

  prepareDeck((d) => {
    const ans = [...d];
    ans.push(...repeat(10, { rank: R.vii, suit: S.Heart }));
    console.log("10 additional 7 of hearts are added");
    printDeckBreakdownTable(ans);
    return ans;
  }, findPair);

  prepareDeck((d) => {
    const ans = [...d];
    ans.push({ rank: R.i, suit: S.Heart });
    ans.push({ rank: R.ii, suit: S.Heart });
    ans.push({ rank: R.iii, suit: S.Heart });
    ans.push({ rank: R.iv, suit: S.Heart });
    ans.push({ rank: R.v, suit: S.Heart });
    console.log("each of A2345 is added");
    printDeckBreakdownTable(ans);
    return ans;
  }, findPair);

  prepareDeck((d) => {
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
  }, findPair);

  console.log("%cpair ends", "color:#0f0;font-size:2rem");
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
function findThreeOak(hand, maxCardsPerDiscard) {
  if (containsThreeOak(hand)) {
    return { keep: hand, discard: [] };
  }

  const dist = getRankDistribution(hand);

  if (containsPair(hand)) {
    let rankOfPair;
    for (const rank in dist) {
      if (dist[rank] === 2) {
        rankOfPair = rank;
        break;
      }
    }
    const [y, n] = partition(hand, (c) => c.rank === rankOfPair);
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
function simThree(prepareDeck, discard = findThreeOak) {
  console.log("%c3oak", "color:#f00;font-size:2rem");

  prepareDeck((d) => {
    console.log("standard deck", d);
    return d;
  }, discard);

  prepareDeck((d) => {
    console.log("standard deck, randomly discard", d);
    return d;
  }, randomlyDiscard);

  prepareDeck((d) => {
    const ans = [...d];
    ans.push(...repeat(5, { rank: R.vii, suit: S.Heart }));
    console.log("5 additional 7 of hearts are added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discard);

  prepareDeck((d) => {
    const ans = [...d];
    ans.push(...repeat(10, { rank: R.vii, suit: S.Heart }));
    console.log("10 additional 7 of hearts are added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discard);

  prepareDeck((d) => {
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
  }, discard);

  prepareDeck((d) => {
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
  }, discard);

  prepareDeck((d) => {
    const ans = [...d];
    ans.push({ rank: R.i, suit: S.Heart });
    ans.push({ rank: R.ii, suit: S.Heart });
    ans.push({ rank: R.iii, suit: S.Heart });
    ans.push({ rank: R.iv, suit: S.Heart });
    ans.push({ rank: R.v, suit: S.Heart });
    console.log("each of A2345 is added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discard);

  prepareDeck((d) => {
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
  }, discard);

  console.log("%c3oak ends", "color:#0f0;font-size:2rem");
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
  console.table(rendered, columnTitles);
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
    const HAND_TYPES = ["flush", "pair", "3oak"];
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
    "house",
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
  // 适配 simMany 的入参结构
  const prepareDeckCaller = (prepareDeckCallback, discardStrategy) =>
    runSimulationWrapper(prepareDeckCallback, {
      goal: discardStrategy.goal,
      discard: discardStrategy.discard,
    });

  switch (type) {
    case "flush":
      simFlush((prep, discard) => simMany(prep, isFlush, discard), {
        goal: isFlush,
        discard: discardToFindFlush,
      });
      break;
    case "pair":
      simPair((prep, discard) => simMany(prep, containsPair, discard), {
        goal: containsPair,
        discard: findPair,
      });
      break;
    case "3oak":
      simThree((prep, discard) => simMany(prep, containsThreeOak, discard), {
        goal: containsThreeOak,
        discard: findThreeOak,
      });
      break;
    case "4oak":
    case "5oak":
    case "house":
    case "2pair":
      console.log(`Simulation for hand type '${type}' is not yet implemented.`);
      break;
    default:
      // 已在调用处处理，此处可忽略
      break;
  }
}

// 修正 simFlush, simPair, simThree 的调用逻辑，以适应新的参数结构
function simFlush(runner, discardStrategy) {
  console.log("%cflush", "color:#f00;font-size:2rem");

  runner((d) => {
    console.log("standard", d);
    return d;
  }, discardStrategy.discard);

  runner((d) => {
    const ans = deepCopy(d);
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    console.log("5 heart becomes spade");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  runner((d) => {
    const ans = d.slice(10);
    console.log("10 cards of same suit removed");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  runner((d) => {
    console.log("standard, discard randomly", d);
    return d;
  }, randomlyDiscard);

  runner((d) => {
    const ans = deepCopy(d);
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    ans.find((c) => c.suit === "Heart").suit = "Spade";
    console.log("5 heart becomes spade, discard randomly");
    printDeckBreakdownTable(ans);
    return ans;
  }, randomlyDiscard);

  runner((d) => {
    const ans = d.slice(10);
    console.log("10 cards of same suit removed, discard randomly");
    printDeckBreakdownTable(ans);
    return ans;
  }, randomlyDiscard);

  console.log("%cflush ends", "color:#0f0;font-size:2rem");
}

function simPair(runner, discardStrategy) {
  console.log("%cpair", "color:#f00;font-size:2rem");

  runner((d) => {
    console.log("standard deck");
    return d;
  }, discardStrategy.discard);

  runner((d) => {
    const ans = [...d];
    ans.push(...repeat(5, { rank: R.vii, suit: S.Heart }));
    console.log("5 additional 7 of hearts are added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  runner((d) => {
    const ans = [...d];
    ans.push(...repeat(10, { rank: R.vii, suit: S.Heart }));
    console.log("10 additional 7 of hearts are added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  runner((d) => {
    const ans = [...d];
    ans.push({ rank: R.i, suit: S.Heart });
    ans.push({ rank: R.ii, suit: S.Heart });
    ans.push({ rank: R.iii, suit: S.Heart });
    ans.push({ rank: R.iv, suit: S.Heart });
    ans.push({ rank: R.v, suit: S.Heart });
    console.log("each of A2345 is added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  runner((d) => {
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
  }, discardStrategy.discard);

  console.log("%cpair ends", "color:#0f0;font-size:2rem");
}

function simThree(runner, discardStrategy) {
  console.log("%c3oak", "color:#f00;font-size:2rem");

  runner((d) => {
    console.log("standard deck", d);
    return d;
  }, discardStrategy.discard);

  runner((d) => {
    console.log("standard deck, randomly discard", d);
    return d;
  }, randomlyDiscard);

  runner((d) => {
    const ans = [...d];
    ans.push(...repeat(5, { rank: R.vii, suit: S.Heart }));
    console.log("5 additional 7 of hearts are added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  runner((d) => {
    const ans = [...d];
    ans.push(...repeat(10, { rank: R.vii, suit: S.Heart }));
    console.log("10 additional 7 of hearts are added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  runner((d) => {
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
  }, discardStrategy.discard);

  runner((d) => {
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
  }, discardStrategy.discard);

  runner((d) => {
    const ans = [...d];
    ans.push({ rank: R.i, suit: S.Heart });
    ans.push({ rank: R.ii, suit: S.Heart });
    ans.push({ rank: R.iii, suit: S.Heart });
    ans.push({ rank: R.iv, suit: S.Heart });
    ans.push({ rank: R.v, suit: S.Heart });
    console.log("each of A2345 is added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  runner((d) => {
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
  }, discardStrategy.discard);

  runner((d) => {
    let ans = [...d];
    ans = ans.filter((c) => !(c.rank === R.vi && c.suit === S.Heart));
    ans.push({ rank: R.vii, suit: S.Heart });
    ans.push({ rank: R.vii, suit: S.Heart });
    console.log("one 6 removed, two 7s added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  runner((d) => {
    let ans = [...d];
    ans = ans.filter((c) => !(c.rank === "6" && c.suit === S.Heart));
    ans = ans.filter((c) => !(c.rank === "6" && c.suit === S.Club));
    ans.push({ rank: R.vii, suit: S.Heart });
    console.log("two 6s removed, one 7 added");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  runner((d) => {
    let ans = [...d];
    ans.push({ rank: R.vii, suit: S.Heart });
    ans = ans.filter((c) => !(c.rank === "5" && c.suit === S.Heart));
    ans = ans.filter((c) => !(c.rank === "6" && c.suit === S.Heart));
    console.log("one 7 added, one 5 removed, one 6 removed");
    printDeckBreakdownTable(ans);
    return ans;
  }, discardStrategy.discard);

  console.log("%c3oak ends", "color:#0f0;font-size:2rem");
}

runSimulationsBasedOnUrl();
