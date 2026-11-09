// "How it works" cards, one per level, shown before the first question.

import { shapeSvg, barSvg, fracHtml } from "./draw.js";

const eq = (n) => Array(n).fill(1 / n);
const on = (...i) => new Set(i);

export const LESSONS = {
  "g1-fair": {
    emoji: "🍕", title: "Fair shares",
    rule: "Fair shares are <b>equal parts</b>: every part is the <b>same size</b>. Sharing fairly is a way to love our neighbor!",
    exampleHtml: `<div class="lesson-pair">
      <span class="lesson-focus">${shapeSvg({ shape: "circle", cuts: eq(4) })}<b class="ok">✓ fair</b></span>
      <span class="lesson-focus">${shapeSvg({ shape: "circle", cuts: [0.45, 0.15, 0.3, 0.1] })}<b class="no">✗ not fair</b></span>
    </div>`,
    voice: "Fair shares are equal parts. Every part is the same size. This pizza is cut into four fair shares. This one isn't fair: some pieces are big and some are small. Sharing fairly is a way to love our neighbor!",
  },
  "g1-halves-fourths": {
    emoji: "🥧", title: "Halves and fourths",
    rule: "Cut into <b>2</b> equal parts: each is <b>one half</b>. Cut into <b>4</b> equal parts: each is <b>one fourth</b>. Tap a part to shade it.",
    exampleHtml: `<div class="lesson-pair">
      <span class="lesson-focus">${shapeSvg({ shape: "circle", cuts: eq(2) }, on(0))}<b>one half</b></span>
      <span class="lesson-focus">${shapeSvg({ shape: "circle", cuts: eq(4) }, on(0))}<b>one fourth</b></span>
    </div>`,
    voice: "When we cut something into two equal parts, each part is one half. When we cut it into four equal parts, each part is one fourth. Like the four candles of the Advent wreath: light one, and one fourth are lit! Tap a part to shade it.",
  },
  "g2-parts": {
    emoji: "🍞", title: "Halves, thirds, fourths",
    rule: "Count the equal parts. <b>2</b> parts are <b>halves</b>, <b>3</b> are <b>thirds</b>, <b>4</b> are <b>fourths</b>.",
    exampleHtml: `<div class="lesson-trio">
      <span class="lesson-focus">${shapeSvg({ shape: "bar", cuts: eq(2) })}<b>halves</b></span>
      <span class="lesson-focus">${shapeSvg({ shape: "bar", cuts: eq(3) })}<b>thirds</b></span>
      <span class="lesson-focus">${shapeSvg({ shape: "bar", cuts: eq(4) })}<b>fourths</b></span>
    </div>`,
    voice: "Count the equal parts. Two parts are called halves. Three parts are called thirds. Four parts are called fourths.",
  },
  "g2-shade": {
    emoji: "🎨", title: "Shade the fraction",
    rule: "<b>Two thirds</b> means 2 of the 3 equal parts. Tap parts to shade them, then press <b>Check</b>.",
    exampleHtml: `<div class="lesson-pair">
      <span class="lesson-focus">${shapeSvg({ shape: "rect", cuts: eq(3) }, on(0, 1))}<b>two thirds</b></span>
    </div>`,
    voice: "Two thirds means two of the three equal parts. Tap the parts to shade them, then press check.",
  },
  "g3-name": {
    emoji: "🔢", title: "Writing a fraction",
    rule: `The <b class="top">top number</b> counts the shaded parts. The <b class="bottom">bottom number</b> counts all the equal parts.`,
    exampleHtml: `<div class="lesson-pair">
      <span class="lesson-focus">${shapeSvg({ shape: "rect", cuts: eq(4) }, on(0, 1, 2))}</span>
      <span class="lesson-focus big-frac">${fracHtml(3, 4)}<b>three fourths</b></span>
    </div>`,
    voice: "The top number counts the shaded parts. The bottom number counts all the equal parts. Three parts are shaded, out of four equal parts. That's three fourths.",
  },
  "g3-line": {
    emoji: "📏", title: "Fractions on a number line",
    rule: "The space from <b>0</b> to <b>1</b> is cut into equal jumps. For <b>2/4</b>, the bottom number says 4 jumps in all; take <b>2</b> jumps from 0.",
    exampleHtml: `<div class="lesson-line">
      <div class="nline mini" style="--n:4"><div class="nl-track"><div class="nl-segs"><i></i><i></i><i></i><i></i></div><div class="nl-fill lesson-focus" style="width:50%"></div></div>
        <span class="nl-end" style="left:0%">0</span><span class="nl-end" style="left:100%">1</span>
        <span class="nl-mark lesson-focus" style="left:50%">${fracHtml(2, 4)}</span></div>
    </div>`,
    voice: "The space from zero to one is cut into equal jumps. For two fourths, the bottom number says four jumps in all. Take two jumps from zero. That's two fourths.",
  },
  "g3-equal": {
    emoji: "🟰", title: "Equal fractions",
    rule: "Different fractions can be the <b>same amount</b>. 1/2 and 2/4 cover the same part of the bar.",
    exampleHtml: `<div class="bars">
      <div class="bar-row lesson-focus"><span class="bar-label">${fracHtml(1, 2)}</span>${barSvg(1, 2)}</div>
      <div class="bar-row lesson-focus"><span class="bar-label">${fracHtml(2, 4)}</span>${barSvg(2, 4)}</div>
    </div>`,
    voice: "Different fractions can be the same amount. One half and two fourths cover the same part of the bar, so they are equal. Like sharing loaves of bread: more, smaller pieces can be the same amount of bread.",
  },
  "g3-compare": {
    emoji: "⚖️", title: "Bigger or smaller?",
    rule: "Same bottom number: <b>more parts</b> is bigger. Same top number: <b>more cuts</b> make <b>smaller</b> pieces, so 1/8 &lt; 1/2.",
    exampleHtml: `<div class="bars">
      <div class="bar-row lesson-focus"><span class="bar-label">${fracHtml(1, 2)}</span>${barSvg(1, 2)}</div>
      <div class="bar-row lesson-focus"><span class="bar-label">${fracHtml(1, 8)}</span>${barSvg(1, 8, "b")}</div>
    </div>`,
    voice: "When the bottom numbers are the same, more parts is bigger. When the top numbers are the same, more cuts make smaller pieces. So one eighth is less than one half. Look at the bars!",
  },
};
