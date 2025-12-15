const S = {
  Heart: "Heart",
};
const R = { vii: "7", i: "A", ii: "2", iii: "3", iv: "4", v: "5" };
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

function simFlush(prepareDeck) {
  return simMany(prepareDeck, isFlush, discardToFindFlush);
}

simFlush((d) => {
  console.log("libq 5 flush, standard", d);
  return d;
});

simFlush((d) => {
  const ans = [...d];
  ans.find((c) => c.suit === "Heart").suit = "Spade";
  ans.find((c) => c.suit === "Heart").suit = "Spade";
  ans.find((c) => c.suit === "Heart").suit = "Spade";
  ans.find((c) => c.suit === "Heart").suit = "Spade";
  ans.find((c) => c.suit === "Heart").suit = "Spade";
  console.log("libq 5 flush, 5 heart becomes spade", ans);
  return ans;
});

simFlush((d) => {
  const ans = d.slice(10);
  console.log("libq 5 flush, 10 cards of same suit removed", ans);
  return ans;
});

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
  return simMany(prepareDeck, containsPair, findPair);
}
simPair((d) => {
  console.log("libq pair, standard deck");
  return d;
});
simPair((d) => {
  const ans = [...d];
  ans.push(...repeat(5, { rank: R.vii, suit: S.Heart }));
  console.log("libq pair, 5 additional 7 of hearts are added", ans);
  return ans;
});
simPair((d) => {
  const ans = [...d];
  ans.push(...repeat(10, { rank: R.vii, suit: S.Heart }));
  console.log("libq pair, 10 additional 7 of hearts are added", ans);
  return ans;
});
simPair((d) => {
  const ans = [...d];
  ans.push({ rank: R.i, suit: S.Heart });
  ans.push({ rank: R.ii, suit: S.Heart });
  ans.push({ rank: R.iii, suit: S.Heart });
  ans.push({ rank: R.iv, suit: S.Heart });
  ans.push({ rank: R.v, suit: S.Heart });
  console.log("libq pair, each of A2345 is added", ans);
  return ans;
});
simPair((d) => {
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
  console.log("libq pair, each of A2345 is added twice", ans);
  return ans;
});
