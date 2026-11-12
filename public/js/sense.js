// Fraction Sense question banks and round generator for Grades 1, 2, and 3.

export const SENSE_QUESTIONS_PER_ROUND = 6;

export const SENSE_LEVELS = [
  { id: "g1", grade: 1, title: "Grade 1: Halves, Thirds & Fourths", emoji: "🍕" },
  { id: "g2", grade: 2, title: "Grade 2: Naming & Parts of a Fraction", emoji: "🥧" },
  { id: "g3", grade: 3, title: "Grade 3: Number Line & Comparing", emoji: "📏" },
];

const BANK_G1 = [
  {
    q: "Which fraction means 1 out of 2 equal parts?",
    answer: "1/2",
    choices: ["1/2", "1/3", "1/4", "2/2"],
    hint: "2 equal parts in all, and we have 1 of them!",
  },
  {
    q: "If you share 1 pizza fairly between 2 friends, how much does each friend get?",
    answer: "1/2",
    choices: ["1/2", "1/4", "1/3", "2/1"],
    hint: "2 friends sharing fairly means 2 equal halves.",
  },
  {
    q: "Which fraction means 1 out of 4 equal parts?",
    answer: "1/4",
    choices: ["1/4", "1/2", "1/3", "4/1"],
    hint: "4 equal parts goes on the bottom, and 1 goes on top!",
  },
  {
    q: "How many equal parts are in 1 whole if each piece is 1/3?",
    answer: "3",
    choices: ["3", "1", "2", "4"],
    hint: "Look at the bottom number of 1/3.",
  },
  {
    q: "Which slice is BIGGER: 1/2 of a pie or 1/4 of the same pie?",
    answer: "1/2",
    choices: ["1/2", "1/4"],
    hint: "Fewer equal slices means each slice is bigger!",
  },
  {
    q: "Which fraction means 1 out of 3 equal parts?",
    answer: "1/3",
    choices: ["1/3", "1/2", "1/4", "3/1"],
    hint: "3 equal parts in all goes on the bottom.",
  },
  {
    q: "4 friends share 1 brownie bar fairly. What fraction does each friend get?",
    answer: "1/4",
    choices: ["1/4", "1/2", "1/3", "4/4"],
    hint: "4 equal pieces means each piece is one fourth.",
  },
];

const BANK_G2 = [
  {
    q: "In the fraction 3/4, what does the bottom number (4) tell us?",
    answer: "How many equal parts in all",
    choices: ["How many equal parts in all", "How many parts are shaded", "How many wholes we have", "How many parts are left over"],
    hint: "The bottom number (denominator) counts ALL equal parts in the whole.",
  },
  {
    q: "In the fraction 2/3, what does the top number (2) tell us?",
    answer: "How many parts we have",
    choices: ["How many parts we have", "How many equal parts in all", "How big the pie is", "How many friends are sharing"],
    hint: "The top number (numerator) counts the shaded parts we have!",
  },
  {
    q: "3 shaded slices out of 4 equal slices is which fraction?",
    answer: "3/4",
    choices: ["3/4", "4/3", "1/4", "3/3"],
    hint: "Shaded parts (3) on top, total equal parts (4) on bottom.",
  },
  {
    q: "Which fraction is equal to 1 whole?",
    answer: "4/4",
    choices: ["4/4", "3/4", "2/4", "1/4"],
    hint: "When you have ALL the equal parts, the top and bottom numbers match!",
  },
  {
    q: "2/4 of a chocolate bar is the exact same amount as...",
    answer: "1/2",
    choices: ["1/2", "1/4", "3/4", "1/3"],
    hint: "2 is half of 4!",
  },
  {
    q: "Which is GREATER: 3/6 or 5/6?",
    answer: "5/6",
    choices: ["5/6", "3/6"],
    hint: "Both wholes have 6 equal parts — 5 parts is more than 3 parts!",
  },
  {
    q: "5 shaded parts out of 8 equal parts is...",
    answer: "5/8",
    choices: ["5/8", "8/5", "3/8", "5/5"],
    hint: "5 on top, 8 on the bottom.",
  },
];

const BANK_G3 = [
  {
    q: "Which fraction is equivalent (equal) to 1/2?",
    answer: "3/6",
    choices: ["3/6", "2/3", "3/4", "1/3"],
    hint: "3 is half of 6!",
  },
  {
    q: "Which fraction is equivalent to 2/3?",
    answer: "4/6",
    choices: ["4/6", "3/6", "2/4", "5/6"],
    hint: "Double both the top and bottom of 2/3!",
  },
  {
    q: "Which fraction is closest to 1 whole?",
    answer: "5/6",
    choices: ["5/6", "1/6", "1/2", "1/3"],
    hint: "5/6 is only 1/6 away from 6/6 (1 whole)!",
  },
  {
    q: "Which fraction is GREATER: 1/3 or 1/6?",
    answer: "1/3",
    choices: ["1/3", "1/6"],
    hint: "Splitting a cake into 3 pieces makes bigger slices than splitting it into 6!",
  },
  {
    q: "On a number line from 0 to 1, where does 2/4 sit?",
    answer: "Right in the middle (at 1/2)",
    choices: ["Right in the middle (at 1/2)", "At 0", "At 1", "Closer to 0 than 1/4"],
    hint: "2 is half of 4, so 2/4 = 1/2!",
  },
  {
    q: "Which is SMALLER: 2/8 or 5/8?",
    answer: "2/8",
    choices: ["2/8", "5/8"],
    hint: "With the same bottom number (8), fewer parts on top is smaller.",
  },
  {
    q: "Which fraction is equal to 3/3?",
    answer: "1 whole",
    choices: ["1 whole", "1/3", "3/6", "0"],
    hint: "3 out of 3 equal parts is the entire whole!",
  },
];

function shuffle(arr, seed) {
  const copy = [...arr];
  let s = seed | 0;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function makeFractionSenseRound(grade = 1, seed = 1) {
  const bank = grade === 1 ? BANK_G1 : grade === 2 ? BANK_G2 : BANK_G3;
  return shuffle(bank, seed)
    .slice(0, SENSE_QUESTIONS_PER_ROUND)
    .map((item, idx) => ({
      ...item,
      choices: shuffle(item.choices, seed + idx * 17),
    }));
}
