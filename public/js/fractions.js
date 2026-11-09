// Fraction Feast: levels, question generator and fraction words. Pure (no DOM), tested in Node.
//
// Grade 1: fair shares, halves and fourths of a shape (CCSS 1.G.3)
// Grade 2: halves, thirds, fourths; shade a fraction (2.G.3)
// Grade 3: name a fraction, the number line, equal fractions, comparing (3.NF.1–3)

export const GRADES = [
  { n: 1, title: "Fair Shares", emoji: "🐣", blurb: "Equal parts, halves and fourths." },
  { n: 2, title: "Halves, Thirds & Fourths", emoji: "🦊", blurb: "Name the parts and shade them." },
  { n: 3, title: "Fractions as Numbers", emoji: "🦉", blurb: "Name them, place them on a line, compare them." },
];

export const STAGES = [
  { id: "g1-fair", grade: 1, type: "fair", title: "Fair Shares?", emoji: "🍕", dens: [2, 3, 4] },
  { id: "g1-halves-fourths", grade: 1, type: "shade", title: "Halves & Fourths", emoji: "🥧", dens: [2, 4], unit: true },
  { id: "g2-parts", grade: 2, type: "parts", title: "How Many Parts?", emoji: "🍞", dens: [2, 3, 4] },
  { id: "g2-shade", grade: 2, type: "shade", title: "Shade It!", emoji: "🎨", dens: [2, 3, 4] },
  { id: "g3-name", grade: 3, type: "name", title: "Name the Fraction", emoji: "🔢", dens: [2, 3, 4, 6, 8] },
  { id: "g3-line", grade: 3, type: "line", title: "Number Line", emoji: "📏", dens: [2, 3, 4, 6, 8] },
  { id: "g3-equal", grade: 3, type: "equal", title: "Equal Fractions", emoji: "🟰" },
  { id: "g3-compare", grade: 3, type: "compare", title: "Bigger or Smaller?", emoji: "⚖️" },
];
export const stageById = (id) => STAGES.find((s) => s.id === id);
export const PER_STAGE = 5;

// ───────── words ─────────

const NUM = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve"];
const ONE = { 2: "half", 3: "third", 4: "fourth", 5: "fifth", 6: "sixth", 7: "seventh", 8: "eighth", 9: "ninth", 10: "tenth", 12: "twelfth" };
const MANY = { 2: "halves", 3: "thirds", 4: "fourths", 5: "fifths", 6: "sixths", 7: "sevenths", 8: "eighths", 9: "ninths", 10: "tenths", 12: "twelfths" };
export const partName = (n, plural = true) => (plural ? MANY[n] : ONE[n]);

/** 3, 4 → "three fourths"; 1, 2 → "one half"; 4, 4 → "four fourths". */
export function fractionWords(k, n) {
  return `${NUM[k] ?? k} ${k === 1 ? ONE[n] : MANY[n]}`;
}
export const fracKey = (k, n) => `${k}/${n}`;
export const parseFrac = (s) => s.split("/").map(Number);
export const sameValue = (a, b) => a[0] * b[1] === b[0] * a[1];

// ───────── things we cut up (now and then something from parish life) ─────────

export const THINGS = {
  circle: [
    { name: "pizza", emoji: "🍕" }, { name: "pie", emoji: "🥧" }, { name: "pancake", emoji: "🥞" },
    { name: "cake", emoji: "🎂" }, { name: "pie from the parish picnic", emoji: "🥧" },
  ],
  rect: [
    { name: "chocolate bar", emoji: "🍫" }, { name: "garden", emoji: "🌻" }, { name: "sandwich", emoji: "🥪" },
    { name: "tray of brownies", emoji: "🍫" }, { name: "sheet cake for the church supper", emoji: "🍰" },
  ],
  bar: [
    { name: "loaf of bread", emoji: "🍞" }, { name: "ribbon", emoji: "🎀" }, { name: "granola bar", emoji: "🥨" },
    { name: "loaf of bread for the bake sale", emoji: "🍞" },
  ],
};

// ───────── random ─────────

export function seeded(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rand, a) => a[Math.floor(rand() * a.length)];
const int = (rand, lo, hi) => lo + Math.floor(rand() * (hi - lo + 1));
function shuffle(a, rand) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
const equalCuts = (n) => Array(n).fill(1 / n);

/** n clearly unequal parts that add up to 1 (biggest at least 1.6 × the smallest). */
export function unequalCuts(n, rand) {
  for (;;) {
    const w = Array.from({ length: n }, () => 0.5 + rand() * 2.5);
    const sum = w.reduce((a, b) => a + b, 0);
    const c = w.map((x) => x / sum);
    if (Math.max(...c) / Math.min(...c) >= 1.6) return c;
  }
}

const shapeFor = (rand) => pick(rand, ["circle", "rect", "bar"]);
const thingFor = (shape, rand) => pick(rand, THINGS[shape]);

// ───────── questions ─────────
// Every question: { type, shape?, thing?, n?, cuts?, prompt, answer, choices?, explain }

export function makeQuestion(stage, index, rand) {
  const shape = shapeFor(rand);
  const thing = thingFor(shape, rand);
  switch (stage.type) {
    case "fair": {
      const n = pick(rand, stage.dens);
      const fair = index % 2 === 0 ? rand() < 0.5 : rand() >= 0.5;
      return {
        type: "fair", shape, thing, n, cuts: fair ? equalCuts(n) : unequalCuts(n, rand),
        prompt: `Is this ${thing.name} cut into fair shares?`,
        answer: fair ? "yes" : "no",
        choices: ["yes", "no"],
        explain: fair ? `Yes! All ${NUM[n]} parts are the same size, so they're fair shares.` : `No. The parts are different sizes, so the shares aren't fair.`,
      };
    }
    case "shade": {
      const n = pick(rand, stage.dens);
      const k = stage.unit ? 1 : int(rand, 1, n - 1);
      return {
        type: "shade", shape, thing, n, cuts: equalCuts(n), k,
        prompt: `Shade ${fractionWords(k, n)} of the ${thing.name}.`,
        answer: k,
        explain: `${k} of the ${n} equal parts is ${fractionWords(k, n)}.`,
      };
    }
    case "parts": {
      const n = pick(rand, stage.dens);
      return {
        type: "parts", shape, thing, n, cuts: equalCuts(n),
        prompt: `The ${thing.name} is cut into equal parts. What are the parts called?`,
        answer: MANY[n],
        choices: ["halves", "thirds", "fourths"],
        explain: `${NUM[n][0].toUpperCase() + NUM[n].slice(1)} equal parts are called ${MANY[n]}.`,
      };
    }
    case "name": {
      const n = pick(rand, stage.dens);
      const k = int(rand, 1, n - 1);
      const right = fracKey(k, n);
      const wrongs = new Set([fracKey(n - k, n), fracKey(k, n + 1), fracKey(k, n - 1 || 2), fracKey(Math.min(k + 1, n), n)]);
      wrongs.delete(right);
      const pool = [...wrongs].filter((f) => { const [a, b] = parseFrac(f); return a >= 1 && b >= 2 && a <= b; });
      return {
        type: "name", shape, thing, n, cuts: equalCuts(n), k,
        prompt: `What fraction of the ${thing.name} is shaded?`,
        answer: right,
        choices: shuffle([right, ...shuffle(pool, rand).slice(0, 2)], rand),
        explain: `${k} of the ${n} equal parts are shaded: ${fractionWords(k, n)}, ${k}/${n}.`,
      };
    }
    case "line": {
      const n = pick(rand, stage.dens);
      const k = int(rand, 1, n - 1);
      return {
        type: "line", n, k,
        prompt: `Tap where ${fractionWords(k, n)} goes on the number line.`,
        answer: k,
        explain: `The line from 0 to 1 is cut into ${n} equal parts. ${fractionWords(k, n)[0].toUpperCase() + fractionWords(k, n).slice(1)} is ${k} parts from 0.`,
      };
    }
    case "equal": {
      const [k, n] = pick(rand, [[1, 2], [1, 3], [1, 4], [2, 3], [3, 4], [1, 2]]);
      const m = pick(rand, [2, 3, 4].filter((x) => [4, 6, 8].includes(n * x))); // grade 3 uses halves to eighths
      const right = fracKey(k * m, n * m);
      const wrongs = shuffle([fracKey(k * m + 1, n * m), fracKey(k, n * m), fracKey(Math.max(1, k * m - 1), n * m), fracKey(k + 1, n)]
        .filter((f) => { const [a, b] = parseFrac(f); return a >= 1 && a <= b && !sameValue([a, b], [k, n]); }), rand);
      return {
        type: "equal", shape: "bar", thing: thingFor("bar", rand), k, n,
        prompt: `Which fraction is the same amount as ${fractionWords(k, n)}?`,
        answer: right,
        choices: shuffle([right, ...[...new Set(wrongs)].slice(0, 2)], rand),
        explain: `${fractionWords(k, n)[0].toUpperCase() + fractionWords(k, n).slice(1)} and ${fractionWords(k * m, n * m)} cover the same amount: they're equal.`,
      };
    }
    case "compare": {
      // Grade 3: same denominator, or same numerator (unit fractions), sometimes equal.
      let a, b;
      const kind = index % 3;
      if (kind === 0) { const n = pick(rand, [3, 4, 6, 8]); const x = int(rand, 1, n - 1); let y; do y = int(rand, 1, n - 1); while (y === x); a = [x, n]; b = [y, n]; }
      else if (kind === 1) { const k = pick(rand, [1, 1, 2]); const [p, q] = shuffle([2, 3, 4, 6, 8].filter((d) => d > k), rand); a = [k, p]; b = [k, q]; }
      else { const n = pick(rand, [2, 3, 4, 6, 8]); const k = int(rand, 1, n - 1); a = [k, n]; b = [k, n]; }
      const answer = sameValue(a, b) ? "=" : a[0] / a[1] > b[0] / b[1] ? ">" : "<";
      const sameDen = a[1] === b[1];
      return {
        type: "compare", shape: "bar", thing: thingFor("bar", rand), a, b,
        prompt: `Compare ${fractionWords(...a)} and ${fractionWords(...b)}.`,
        answer, choices: ["<", "=", ">"],
        explain: answer === "=" ? `They're the same amount, so they're equal.`
          : sameDen ? `Same size parts, so more parts is bigger: ${fracKey(...a)} ${answer} ${fracKey(...b)}.`
          : `Same number of parts, but more cuts make smaller pieces: ${fracKey(...a)} ${answer} ${fracKey(...b)}.`,
      };
    }
  }
  throw new Error(`unknown stage type ${stage.type}`);
}

export function makeStage(stage, seed = Date.now()) {
  const rand = seeded(seed);
  const out = [];
  for (let i = 0; i < PER_STAGE; i++) {
    let q, tries = 0;
    do q = makeQuestion(stage, i, rand);
    while (tries++ < 40 && out.some((p) => p.prompt === q.prompt && JSON.stringify(p.answer) === JSON.stringify(q.answer)));
    out.push(q);
  }
  return out;
}

export const starsFor = (mistakes) => (mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1);
