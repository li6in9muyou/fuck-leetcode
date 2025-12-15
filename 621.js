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

const simulateOne = ({
  deck,
  isOk,
  howToDiscard,
  handSize = 8,
  maxNumDiscards = 3,
  maxCardsPerDiscard = 5,
}) => {
  let hand = deck.slice(0, handSize);
  let d = deck.slice(handSize);
  let numDiscardUsed = 0;
  const handHistory = [hand];

  while (true) {
    if (isOk(hand)) {
      break;
    }
    if (numDiscardUsed >= maxNumDiscards) {
      break;
    }
    if (d.length === 0) {
      break;
    }

    const { keep, discard } = howToDiscard(hand, maxCardsPerDiscard);

    const drawCount = discard.length;
    const redrawCards = d.slice(0, drawCount);
    d = d.slice(drawCount);
    numDiscardUsed++;

    hand = [...keep, ...redrawCards];
    handHistory.push(hand);
  }

  return { success: isOk(hand), numDiscardUsed, handHistory };
};

const simFlush = (prepareDeck) => {
  const TOTAL_SIM = 3e4;
  const d = prepareDeck([...STANDARD_DECK]);
  const results = Array.from({ length: TOTAL_SIM })
    .map(() => {
      return simulateOne({
        deck: shuffleDeck(d),
        isOk: isFlush,
        howToDiscard: discardToFindFlush,
        maxNumDiscards: 3,
      });
    })
    .reduce((groupby, row) => {
      const du = row.numDiscardUsed;
      if (groupby[du] === undefined) {
        groupby[du] = {
          discard: du,
          success: 0,
        };
      }

      const g = groupby[du];
      row.success && (g.success += 1);
      g.successRate = (g.success / TOTAL_SIM) * 100;
      return groupby;
    }, {});

  for (let i = 0; i < Object.keys(results).length; i++) {
    if (i === 0) {
      results[i].cumulativeSuccessRate = results[i].successRate;
    } else {
      results[i].cumulativeSuccessRate =
        results[i - 1].cumulativeSuccessRate + results[i].successRate;
    }
    results[i].failRate = +(100 - results[i].cumulativeSuccessRate).toFixed(2);
    results[i].cumulativeSuccessRate =
      +results[i].cumulativeSuccessRate.toFixed(2);
  }
  console.table(results, ["cumulativeSuccessRate", "failRate"]);
};

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
