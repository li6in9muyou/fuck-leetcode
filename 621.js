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

const shuffleDeck = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const isFlush = (hand) => {
  const suitCounts = hand.reduce((acc, card) => {
    const count = acc[card.suit] || 0;
    return { ...acc, [card.suit]: count + 1 };
  }, {});

  return Object.values(suitCounts).some((count) => count >= 5);
};

const getFlushDiscardStrategy = (hand, maxDiscard) => {
  if (isFlush(hand)) {
    return { keep: hand, discard: [] };
  }

  const suitGroups = hand.reduce((acc, card) => {
    const group = acc[card.suit] || [];
    return { ...acc, [card.suit]: [...group, card] };
  }, {});

  const presentSuits = Object.keys(suitGroups);

  if (presentSuits.length === 0) {
    return { keep: [], discard: [] };
  }

  const bestSuit = presentSuits.reduce((best, currentSuit) => {
    const bestCount = suitGroups[best] ? suitGroups[best].length : 0;
    const currentCount = suitGroups[currentSuit].length;

    return currentCount > bestCount ? currentSuit : best;
  }, presentSuits[0]);

  const keepCards = suitGroups[bestSuit] || [];

  const allDiscardable = hand.filter((card) => card.suit !== bestSuit);

  const discardCount = Math.min(allDiscardable.length, maxDiscard);

  const discardCards = allDiscardable.slice(0, discardCount);

  const remainingNonTarget = allDiscardable.slice(discardCount);

  return {
    keep: [...keepCards, ...remainingNonTarget],
    discard: discardCards,
  };
};

const simulateGame = ({
  handSize,
  maxDraws,
  maxDiscard,
  isGoalAchieved,
  getDiscardStrategy,
}) => {
  const initialDeck = createStandardDeck();
  let currentDeck = shuffleDeck(initialDeck);
  let hand = [];
  let draws = 0;

  const initialDrawCount = handSize;
  hand = currentDeck.slice(0, initialDrawCount);
  currentDeck = currentDeck.slice(initialDrawCount);
  draws++;

  if (isGoalAchieved(hand)) {
    return { success: true, draws };
  }

  while (draws < maxDraws) {
    const { keep, discard } = getDiscardStrategy(hand, maxDiscard);

    const drawCount = handSize - keep.length;

    currentDeck = currentDeck.filter((card) => !discard.includes(card));

    const redrawCards = currentDeck.slice(0, drawCount);
    currentDeck = currentDeck.slice(drawCount);

    hand = [...keep, ...redrawCards];
    draws++;

    if (isGoalAchieved(hand)) {
      return { success: true, draws };
    }
  }

  return { success: false, draws };
};

const runSimulation = (simulations, handSize, maxDiscard, maxMaxDraws) => {
  const CONFIG = {
    handSize,
    maxDiscard,
    isGoalAchieved: isFlush,
    getDiscardStrategy: getFlushDiscardStrategy,
    maxDraws: maxMaxDraws + 1,
  };

  const initialStats = Array.from({ length: maxMaxDraws + 1 }, (_, i) => ({
    draws: i + 1,
    successes: 0,
    totalAttempts: 0,
    probability: 0,
  }));

  const results = Array.from({ length: simulations }, () =>
    simulateGame(CONFIG),
  );

  const finalStats = results.reduce(
    (stats, result) => {
      for (let d = 1; d <= maxMaxDraws + 1; d++) {
        if (result.draws <= d) {
          stats[d - 1].successes += result.success ? 1 : 0;
          stats[d - 1].totalAttempts++;
        }
      }
      return stats;
    },
    initialStats.map((s) => ({ ...s, successes: 0, totalAttempts: 0 })),
  );

  const finalProbabilities = finalStats.map((stat) => {
    const probability =
      stat.totalAttempts > 0 ? stat.successes / stat.totalAttempts : 0;
    return {
      "弃牌次数 (D)": stat.draws - 1,
      成功次数: stat.successes,
      模拟次数: simulations,
      成功概率: (probability * 100).toFixed(2) + "%",
    };
  });

  return finalProbabilities;
};

const SIMULATIONS = 10000;
const HAND_SIZE = 8;
const MAX_DISCARD = 5;
const MAX_DRAW_CYCLES = 6;

console.log(`--- 🃏 同花手型找牌模拟 ---`);
console.log(
  `参数: 模拟次数=${SIMULATIONS}, 手牌上限=${HAND_SIZE}, 最大弃牌=${MAX_DISCARD}`,
);

const flushResults = runSimulation(
  SIMULATIONS,
  HAND_SIZE,
  MAX_DISCARD,
  MAX_DRAW_CYCLES,
);

console.log(`\n结果 (目标: 8张手牌中至少有5张同花牌)`);
console.table(flushResults);

console.log(`\n--- 🚀 额外案例 (H=9, D=4) ---`);
const HAND_SIZE_EX = 9;
const MAX_DRAW_CYCLES_EX = 4;
const extraResults = runSimulation(
  SIMULATIONS,
  HAND_SIZE_EX,
  MAX_DISCARD,
  MAX_DRAW_CYCLES_EX,
);
console.table(extraResults);
