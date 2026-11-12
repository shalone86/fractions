import { test } from "node:test";
import assert from "node:assert/strict";
import { SENSE_LEVELS, makeFractionSenseRound, SENSE_QUESTIONS_PER_ROUND } from "../public/js/sense.js";

test("Fraction Sense: every answer is a choice, no repeats, a hint for each", () => {
  for (const lv of SENSE_LEVELS) for (let seed = 1; seed < 200; seed++) {
    const qs = makeFractionSenseRound(lv.grade, seed);
    assert.equal(qs.length, SENSE_QUESTIONS_PER_ROUND);
    assert.equal(new Set(qs.map((q) => q.q)).size, qs.length, `${lv.id} seed ${seed}: repeated question`);
    for (const q of qs) {
      assert.ok(q.choices.includes(q.answer), `${q.q}: answer among choices`);
      assert.equal(new Set(q.choices).size, q.choices.length, `${q.q}: duplicate choices`);
      assert.ok(q.hint, `${q.q}: hint`);
    }
  }
});
