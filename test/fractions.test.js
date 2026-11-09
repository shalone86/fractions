import { test } from "node:test";
import assert from "node:assert/strict";
import { STAGES, makeStage, makeQuestion, fractionWords, parseFrac, sameValue, seeded, unequalCuts, PER_STAGE } from "../public/js/fractions.js";
import { LESSONS } from "../public/js/lessons.js";
import { shapeSvg, barSvg } from "../public/js/draw.js";

test("fraction words", () => {
  assert.equal(fractionWords(1, 2), "one half");
  assert.equal(fractionWords(3, 4), "three fourths");
  assert.equal(fractionWords(2, 3), "two thirds");
  assert.equal(fractionWords(5, 8), "five eighths");
});

test("every level has a lesson card", () => {
  for (const s of STAGES) assert.ok(LESSONS[s.id]?.voice, s.id);
});

test("thousands of questions: answers make sense", () => {
  for (const stage of STAGES) {
    for (let seed = 1; seed <= 400; seed++) {
      const qs = makeStage(stage, seed);
      assert.equal(qs.length, PER_STAGE);
      for (const q of qs) {
        const where = `${stage.id} seed ${seed}: ${q.prompt}`;
        assert.ok(q.prompt && q.explain, where);
        assert.doesNotMatch(q.prompt + q.explain, /undefined|NaN|null/, where);
        if (q.choices) {
          assert.ok(q.choices.map(String).includes(String(q.answer)), `${where} answer among choices`);
          assert.equal(new Set(q.choices).size, q.choices.length, `${where} no duplicate choices`);
          assert.ok(q.choices.length >= 2, where);
        }
        if (q.cuts) {
          assert.equal(q.cuts.length, q.n, where);
          assert.ok(Math.abs(q.cuts.reduce((a, b) => a + b, 0) - 1) < 1e-9, where);
          const fair = q.cuts.every((c) => Math.abs(c - 1 / q.n) < 1e-9);
          if (q.type === "fair") assert.equal(fair, q.answer === "yes", where);
          else assert.ok(fair, where);
        }
        if (q.type === "name") {
          for (const c of q.choices) { const [a, b] = parseFrac(c); assert.ok(a >= 1 && a <= b, where); }
          assert.equal(q.answer, `${q.k}/${q.n}`);
          // only one choice is the same amount as the answer
          assert.equal(q.choices.filter((c) => sameValue(parseFrac(c), [q.k, q.n])).length, 1, where);
        }
        if (q.type === "equal") {
          assert.equal(q.choices.filter((c) => sameValue(parseFrac(c), [q.k, q.n])).length, 1, where);
          const [a, b] = parseFrac(q.answer); assert.ok(b <= 12 && b !== q.n, where);
        }
        if (q.type === "compare") {
          const [x, y] = [q.a[0] / q.a[1], q.b[0] / q.b[1]];
          assert.equal(q.answer, Math.abs(x - y) < 1e-9 ? "=" : x > y ? ">" : "<", where);
          assert.ok(q.a[0] === q.b[0] || q.a[1] === q.b[1], `${where} grade 3 compares same top or same bottom`);
        }
        if (q.type === "shade" || q.type === "line") assert.ok(q.k >= 1 && q.k < q.n || (stage.id === "g1-halves-fourths" && q.k === 1), where);
        if (q.cuts) assert.match(shapeSvg(q), /<path data-part="0"/);
      }
    }
  }
});

test("fair-share levels mix fair and unfair", () => {
  const s = STAGES.find((x) => x.type === "fair");
  let yes = 0, no = 0;
  for (let seed = 1; seed <= 200; seed++) for (const q of makeStage(s, seed)) q.answer === "yes" ? yes++ : no++;
  assert.ok(yes > 300 && no > 300, `${yes} yes / ${no} no`);
});

test("unequal cuts are clearly unequal", () => {
  const r = seeded(7);
  for (let i = 0; i < 500; i++) { const c = unequalCuts(2 + (i % 3), r); assert.ok(Math.max(...c) / Math.min(...c) >= 1.6); }
});

test("bars draw the right number of parts", () => {
  assert.equal((barSvg(2, 6).match(/<path/g) ?? []).length, 6);
  assert.equal((barSvg(2, 6).match(/part on/g) ?? []).length, 2);
});
