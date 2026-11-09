// Fraction Feast: fractions for grades 1–3. Cut shapes into fair shares, shade them, name them,
// put them on a number line and compare them. Plain ES modules, no build step.

import * as S from "./kit/store.js";
import { jingleOnce } from "./kit/jingle.js";
S.init("fractions:v1", {});

import { createRouter } from "./kit/router.js";
import { speak, stop } from "./kit/tts.js";
import { sfx } from "./kit/sound.js";
import * as FX from "./kit/fx.js";
import { keepDockVisible } from "./kit/dock.js";
import { showLesson } from "./kit/lesson.js";
import { leadIn, praise, tryAgain, vary } from "./kit/vary.js";
import { esc, starsHtml, nextButton, markDot, showFinish, stickerBook, viewGrownups, installClickSounds, wireVoiceToggle } from "./kit/ui.js";
import { GRADES, STAGES, stageById, PER_STAGE, makeStage, fractionWords, parseFrac, starsFor } from "./fractions.js";
import { LESSONS } from "./lessons.js";
import { shapeSvg, barSvg, fracHtml } from "./draw.js";

const app = document.getElementById("app");

const route = createRouter([
  [/^$/, viewHome],
  [/^play\/([\w-]+)$/, viewPlay],
  [/^grownups$/, () => viewGrownups(app, { about: ABOUT })],
], {
  before() { stop(); FX.clearFx(); document.body.classList.remove("in-game"); },
});

const ABOUT = `
  <p><b>Fraction Feast</b> follows the usual school path for fractions:</p>
  <ul>
    <li><b>Grade 1:</b> fair shares (equal parts), halves and fourths of a shape.</li>
    <li><b>Grade 2:</b> halves, thirds and fourths; naming the parts and shading a fraction.</li>
    <li><b>Grade 3:</b> fractions as numbers: naming them, placing them on a number line from 0 to 1, equal fractions, and comparing.</li>
  </ul>
  <p>The top number (how many parts we have) is always <b style="color:var(--frac-top)">orange</b>, the bottom number (how many equal parts in all) is always <b style="color:var(--frac-bottom)">blue</b>.</p>
  <p>A mistake gets a hint and a second try; after that the answer is shown and explained, and the game moves on.</p>`;

// ───────── words on screen and out loud ─────────

/** "3/4" → stacked fraction (screen); "<" etc. kept as text. */
const fmt = (text) => esc(text).replace(/(\d+)\/(\d+)/g, (_, a, b) => fracHtml(+a, +b));
/** "3/4" → "three fourths", " < " → " is less than " (voice). */
const voiceOf = (text) => String(text)
  .replace(/(\d+)\/(\d+)/g, (_, a, b) => fractionWords(+a, +b))
  .replace(/ < /g, " is less than ").replace(/ > /g, " is more than ").replace(/ = /g, " equals ");

function tell(bubble, text) {
  bubble.querySelector(".say").innerHTML = fmt(text);
  bubble.lastSaid = voiceOf(text);
  bubble.animate?.([{ transform: "scale(1)" }, { transform: "scale(1.03)" }, { transform: "scale(1)" }], { duration: 300 });
  speak(bubble.lastSaid);
}

// ───────── home ─────────

function viewHome() {
  const next = STAGES.find((s) => !S.progress(s.id).done) ?? STAGES[0];
  app.innerHTML = `
    <section class="hero">
      <h1 class="title">Fraction Feast</h1>
      <p class="lede">Cut it, share it, shade it, name it!</p>
      <a class="btn big primary play-btn" href="#/play/${next.id}">▶ Play</a>
      <nav class="grade-jump" aria-label="Jump to a grade">
        ${GRADES.map((g) => `<button type="button" class="grade-chip" data-grade="${g.n}">${g.emoji} Grade ${g.n}</button>`).join("")}
      </nav>
    </section>
    ${GRADES.map((g) => `
      <section class="grade" id="grade-${g.n}">
        <h2 class="grade-title"><span aria-hidden="true">${g.emoji}</span> Grade ${g.n}: ${esc(g.title)}</h2>
        <p class="muted grade-blurb">${esc(g.blurb)}</p>
        <div class="level-grid">
          ${STAGES.filter((s) => s.grade === g.n).map((s) => `
            <a class="level-card${s.id === next.id ? " next" : ""}" href="#/play/${s.id}">
              <span class="emoji">${s.emoji}</span>${esc(s.title)}${starsHtml(S.progress(s.id).stars)}
            </a>`).join("")}
        </div>
      </section>`).join("")}
    ${stickerBook()}`;
  app.querySelectorAll("[data-grade]").forEach((btn) => {
    btn.onclick = () => document.getElementById(`grade-${btn.dataset.grade}`)?.scrollIntoView({ behavior: "smooth" });
  });
}

// ───────── play ─────────

function viewPlay(id) {
  const stage = stageById(id);
  if (!stage) { location.hash = "#/"; return; }
  document.body.classList.add("in-game");
  app.innerHTML = `
    <section class="play">
      <div class="play-top">
        <a class="icon-btn" href="#/" aria-label="Exit">✕</a>
        <div class="dots">${Array.from({ length: PER_STAGE }, (_, k) => `<i data-dot="${k}"></i>`).join("")}</div>
        <button class="icon-btn" data-repeat aria-label="Say it again" title="Say it again">💬</button>
        <button class="icon-btn toggle" data-voice title="Read aloud">🔊</button>
      </div>
      <div class="bubble" aria-live="polite"><span class="mascot" aria-hidden="true">${stage.emoji}</span><p class="say"></p></div>
      <div class="card board"></div>
    </section>
    <div class="dock"></div>`;
  wireVoiceToggle(app.querySelector("[data-voice]"));
  const bubble = app.querySelector(".bubble"), dock = app.querySelector(".dock"), board = app.querySelector(".board");
  app.querySelector("[data-repeat]").onclick = () => bubble.lastSaid && speak(bubble.lastSaid, { force: true });
  let alive = true, mistakes = 0;
  const ctx = { bubble, dock, board, alive: () => alive, miss: () => mistakes++ };

  (async () => {
    await showLesson(board, LESSONS[stage.id]);
    if (!alive) return;
    const qs = makeStage(stage);
    for (let k = 0; k < qs.length && alive; k++) {
      app.querySelectorAll("[data-dot]").forEach((d) => d.classList.toggle("now", +d.dataset.dot === k));
      const q = qs[k], before = mistakes;
      await ASK[q.type](q, ctx, k === 0 ? "" : `${leadIn()} `);
      if (!alive) return;
      markDot(app, k, mistakes > before); // yellow if it took a mistake
      S.solvedOne();
      await nextButton(dock, k < qs.length - 1 ? "Next ▶" : "Finish 🏁");
    }
    if (!alive) return;
    const i = STAGES.indexOf(stage), nx = STAGES[i + 1];
    showFinish(app, {
      id: stage.id, stars: starsFor(mistakes), mistakes, title: vary("finish", ["You did it!", "What a feast!", "Fraction champion!", "Wonderful work!"]),
      done: `${PER_STAGE} done.`,
      again: `#/play/${stage.id}`, onAgain: route,
      next: nx ? { href: `#/play/${nx.id}`, label: `Next: ${nx.emoji} ${nx.title} ▶` } : null,
    });
  })();
  return () => { alive = false; };
}

/** Right answer: sound, sparkle, and what it means. */
function right(ctx, el, line) {
  sfx.right();
  if (el) FX.pop(el, 1.08);
  FX.confetti(18);
  tell(ctx.bubble, `${praise()} ${line}`);
}
/** Wrong answer: the first time a hint, the second time the answer. Returns true when it's time to show it. */
function wrong(ctx, el, tries, hint) {
  ctx.miss();
  sfx.oops();
  if (el) FX.shake(el);
  if (tries < 2) { tell(ctx.bubble, `${tryAgain()} ${hint}`); return false; }
  return true;
}

/** Buttons in the dock; resolves when the right one is pressed (or after two misses, with the answer shown). */
function choose(ctx, q, labelHtml, { onPick, hint, explainWrong } = {}) {
  const { dock } = ctx;
  dock.innerHTML = `<div class="choices ${q.type}-choices">${q.choices.map((c) => `<button class="choice-card" data-v="${esc(c)}">${labelHtml(c)}</button>`).join("")}</div>`;
  let tries = 0;
  return new Promise((resolve) => {
    dock.querySelectorAll("[data-v]").forEach((b) => b.onclick = () => {
      if (!ctx.alive()) return;
      sfx.select();
      const v = b.dataset.v;
      onPick?.(v);
      if (v === String(q.answer)) { b.classList.add("right"); dock.querySelectorAll("[data-v]").forEach((x) => x.disabled = true); right(ctx, b, q.explain); resolve(); return; }
      b.classList.add("wrong"); b.disabled = true;
      if (wrong(ctx, b, ++tries, explainWrong?.(v) ?? hint)) {
        const ok = dock.querySelector(`[data-v="${CSS.escape(String(q.answer))}"]`);
        ok?.classList.add("right");
        dock.querySelectorAll("[data-v]").forEach((x) => x.disabled = true);
        tell(ctx.bubble, `The answer is ${String(q.answer)}. ${q.explain}`);
        resolve();
      }
    });
  });
}

const thingLine = (q) => `<div class="thing-name"><span aria-hidden="true">${q.thing.emoji}</span> ${esc(q.thing.name)}</div>`;

const ASK = {
  // Grade 1: is it cut into fair shares?
  async fair(q, ctx, lead) {
    ctx.board.innerHTML = `${thingLine(q)}<div class="shape-wrap">${shapeSvg(q)}</div>`;
    tell(ctx.bubble, `${lead}${q.prompt}`);
    await choose(ctx, q, (c) => (c === "yes" ? "👍 Yes, fair" : "👎 No, not fair"), {
      hint: "Look at the parts. Are they all the same size?",
      onPick: () => ctx.board.querySelector("svg")?.classList.add("outlined"),
    });
  },

  // Grade 2: what are the parts called?
  async parts(q, ctx, lead) {
    ctx.board.innerHTML = `${thingLine(q)}<div class="shape-wrap">${shapeSvg(q)}</div>`;
    tell(ctx.bubble, `${lead}${q.prompt}`);
    countParts(ctx.board);
    await choose(ctx, q, (c) => esc(c), { hint: "Count the equal parts. Two parts are halves, three are thirds, four are fourths." });
  },

  // Grade 3: what fraction is shaded?
  async name(q, ctx, lead) {
    const shaded = shadedSet(q);
    ctx.board.innerHTML = `${thingLine(q)}<div class="shape-wrap">${shapeSvg(q, shaded)}</div>`;
    tell(ctx.bubble, `${lead}${q.prompt}`);
    await choose(ctx, q, (c) => fracHtml(...parseFrac(c)), {
      explainWrong: (v) => {
        const [a, b] = parseFrac(v);
        return b !== q.n ? `That's ${fractionWords(a, b)}. Count all the equal parts for the bottom number.` : `That's ${fractionWords(a, b)}. Count the shaded parts for the top number.`;
      },
    });
  },

  // Grades 1–2: tap parts to shade the fraction.
  async shade(q, ctx, lead) {
    ctx.board.innerHTML = `${thingLine(q)}<div class="shape-wrap tappable">${shapeSvg(q)}</div><p class="shade-count" aria-live="polite"></p>`;
    tell(ctx.bubble, `${lead}${q.prompt}`);
    const parts = [...ctx.board.querySelectorAll("[data-part]")];
    const count = ctx.board.querySelector(".shade-count");
    const on = () => parts.filter((p) => p.classList.contains("on")).length;
    const show = () => { const k = on(); count.innerHTML = k ? `Shaded: ${fracHtml(k, q.n)}` : "Tap the parts to shade them."; };
    show();
    let done = false;
    parts.forEach((p, i) => p.addEventListener("click", () => {
      if (done || !ctx.alive()) return;
      p.classList.toggle("on");
      p.classList.contains("on") ? sfx.key(i + 1) : sfx.back();
      show();
    }));
    ctx.dock.innerHTML = `<div class="row center"><button class="btn big" data-clear>↺ Clear</button><button class="btn big primary" data-check>✓ Check</button></div>`;
    ctx.dock.querySelector("[data-clear]").onclick = () => { parts.forEach((p) => p.classList.remove("on")); show(); };
    let tries = 0;
    await new Promise((resolve) => {
      ctx.dock.querySelector("[data-check]").onclick = () => {
        if (done || !ctx.alive()) return;
        const k = on(), wrap = ctx.board.querySelector(".shape-wrap");
        if (k === q.k) { done = true; right(ctx, wrap, q.explain); resolve(); return; }
        const hint = k === 0 ? "Tap a part to shade it." : k > q.k ? `That's ${fractionWords(k, q.n)}. Too many! Tap one to unshade it.` : `That's ${fractionWords(k, q.n)}. Shade some more.`;
        if (wrong(ctx, wrap, ++tries, hint)) {
          done = true;
          parts.forEach((p, i) => p.classList.toggle("on", i < q.k));
          show();
          tell(ctx.bubble, `Here's ${fractionWords(q.k, q.n)}. ${q.explain}`);
          resolve();
        }
      };
    });
  },

  // Grade 3: tap where the fraction goes on a number line.
  async line(q, ctx, lead) {
    ctx.board.innerHTML = numberLine(q.n);
    tell(ctx.bubble, `${lead}${q.prompt}`);
    ctx.dock.innerHTML = `<p class="dock-note">${fracHtml(q.k, q.n)} <span class="muted">Tap a mark on the line.</span></p>`;
    const ticks = [...ctx.board.querySelectorAll("[data-tick]")];
    const fill = ctx.board.querySelector(".nl-fill");
    let tries = 0, done = false;
    await new Promise((resolve) => {
      ticks.forEach((t) => t.onclick = () => {
        if (done || !ctx.alive()) return;
        const i = +t.dataset.tick;
        sfx.select();
        fill.style.width = `${(100 * i) / q.n}%`;
        if (i === q.k) { done = true; t.classList.add("right"); t.innerHTML = fracHtml(i, q.n); right(ctx, t, q.explain); resolve(); return; }
        t.classList.add("wrong");
        const hint = `That's ${fractionWords(i, q.n)}. Count the jumps from 0. You need ${q.k}.`;
        if (wrong(ctx, t, ++tries, hint)) {
          done = true;
          const ok = ticks[q.k - 1];
          ok.classList.add("right"); ok.innerHTML = fracHtml(q.k, q.n);
          fill.style.width = `${(100 * q.k) / q.n}%`;
          tell(ctx.bubble, `It goes here. ${q.explain}`);
          resolve();
        }
      });
    });
  },

  // Grade 3: which fraction is the same amount?
  async equal(q, ctx, lead) {
    ctx.board.innerHTML = `
      <div class="bars">
        <div class="bar-row"><span class="bar-label">${fracHtml(q.k, q.n)}</span>${barSvg(q.k, q.n)}</div>
        <div class="bar-row try" hidden><span class="bar-label"></span><div class="bar-slot"></div></div>
      </div>`;
    tell(ctx.bubble, `${lead}${q.prompt}`);
    const tryRow = ctx.board.querySelector(".try");
    const showBar = (v) => {
      const [a, b] = parseFrac(v);
      tryRow.hidden = false;
      tryRow.querySelector(".bar-label").innerHTML = fracHtml(a, b);
      tryRow.querySelector(".bar-slot").innerHTML = barSvg(a, b);
    };
    await choose(ctx, q, (c) => fracHtml(...parseFrac(c)), {
      onPick: showBar,
      explainWrong: (v) => `Look at the bars: ${v} isn't the same length as ${q.k}/${q.n}.`,
    });
    showBar(q.answer);
  },

  // Grade 3: <, = or >.
  async compare(q, ctx, lead) {
    ctx.board.innerHTML = `
      <div class="bars">
        <div class="bar-row"><span class="bar-label">${fracHtml(...q.a)}</span>${barSvg(...q.a)}</div>
        <div class="bar-row"><span class="bar-label">${fracHtml(...q.b)}</span>${barSvg(...q.b, "b")}</div>
      </div>
      <p class="compare-line">${fracHtml(...q.a)} <span class="sign">?</span> ${fracHtml(...q.b)}</p>`;
    tell(ctx.bubble, `${lead}${q.prompt}`);
    const WORD = { "<": "is less than", "=": "equals", ">": "is more than" };
    await choose(ctx, q, (c) => `<span class="sym">${esc(c)}</span><small>${WORD[c]}</small>`, {
      hint: "Look at the shaded bars. Which one is longer?",
      onPick: (v) => { ctx.board.querySelector(".sign").textContent = v; },
    });
    ctx.board.querySelector(".sign").textContent = q.answer;
  },
};

/** Which parts are shaded for "name" questions: in a row for circles and bars, scattered in rectangles now and then. */
function shadedSet(q) {
  const idx = [...Array(q.n).keys()];
  if (q.shape === "rect" && Math.random() < 0.5) {
    for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  }
  return new Set(idx.slice(0, q.k));
}

/** Little numbers pop onto each part, one by one, to help count. */
function countParts(board) {
  const parts = [...board.querySelectorAll("[data-part]")];
  parts.forEach((p, i) => setTimeout(() => { if (p.isConnected) { p.classList.add("blink"); sfx.key(i + 1); } }, 600 + i * 350));
}

function numberLine(n) {
  const ticks = Array.from({ length: n - 1 }, (_, j) => j + 1)
    .map((i) => `<button class="nl-tick" data-tick="${i}" data-own-sound style="left:${(100 * i) / n}%" aria-label="mark ${i}"><span class="nl-dot"></span></button>`).join("");
  const segs = Array.from({ length: n }, () => `<i></i>`).join("");
  return `
    <div class="nline" style="--n:${n}">
      <div class="nl-track"><div class="nl-segs">${segs}</div><div class="nl-fill"></div></div>
      <span class="nl-end" style="left:0%">0</span><span class="nl-end" style="left:100%">1</span>
      ${ticks}
    </div>`;
}

installClickSounds();
jingleOnce("fractions", () => S.settings().sounds); // the app's little logo sound, on the first tap
route();
keepDockVisible();
if ("serviceWorker" in navigator && location.protocol === "https:") {
  // Update quietly: never reload on the first visit or in the middle of a game.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register("sw.js").catch(() => {});
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController && !document.body.classList.contains("in-game") && !/^#\/play/.test(location.hash)) location.reload();
  });
}
