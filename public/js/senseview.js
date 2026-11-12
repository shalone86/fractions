// Fraction Sense: quick questions about what fractions mean (#/sense and #/sense/:id).
// Fractions show stacked (top orange, bottom blue) and are read as words ("three fourths").
// 💬 in the top bar reads the question and every choice; 💡 gives a hint.

import { SENSE_LEVELS, SENSE_QUESTIONS_PER_ROUND, makeFractionSenseRound } from "./sense.js";
import { sfx } from "./kit/sound.js";
import * as FX from "./kit/fx.js";
import { esc, nextButton, starsFor, showFinish, wireVoiceToggle, markDot } from "./kit/ui.js";
import { speak } from "./kit/tts.js";
import { praise, tryAgain, leadIn } from "./kit/vary.js";
import * as S from "./kit/store.js";
import { fracHtml } from "./draw.js";
import { fractionWords } from "./fractions.js";

/** "Which is 1/2?" → stacked fractions on screen. */
const fmt = (text) => esc(text).replace(/(\d+)\/(\d+)/g, (_, a, b) => fracHtml(+a, +b));
/** "1/2" → "one half" for the voice. */
const voiceOf = (text) => String(text).replace(/(\d+)\/(\d+)/g, (_, a, b) => fractionWords(+a, +b));
const isFrac = (c) => /^\d+\/\d+$/.test(c);

export function viewSenseList(app) {
  app.innerHTML = `
    <section class="hero">
      <h1 class="title">⚡ Fraction Sense</h1>
      <p class="lede">Quick questions about what fractions mean. Everything is read aloud.</p>
    </section>
    <div class="level-grid">
      ${SENSE_LEVELS.map((lv) => `
        <a class="level-card" href="#/sense/${lv.id}"><span class="emoji">${lv.emoji}</span>${esc(lv.title)}</a>`).join("")}
    </div>
    <p class="center"><a class="btn" href="#/">← Back to Fraction Feast</a></p>`;
}

export function viewSense(app, levelId) {
  const level = SENSE_LEVELS.find((l) => l.id === levelId) || SENSE_LEVELS[0];
  document.body.classList.add("in-game");
  app.innerHTML = `
    <section class="play">
      <div class="play-top">
        <a class="icon-btn" href="#/sense" aria-label="Exit">✕</a>
        <div class="dots">${Array.from({ length: SENSE_QUESTIONS_PER_ROUND }, (_, k) => `<i data-dot="${k}"></i>`).join("")}</div>
        <button class="icon-btn" data-read title="Read it to me" aria-label="Read it to me">💬</button>
        <button class="icon-btn" data-hint title="Hint" aria-label="Hint">💡</button>
        <button class="icon-btn toggle" data-voice title="Read aloud">🔊</button>
      </div>
      <div class="bubble" aria-live="polite"><span class="mascot" aria-hidden="true">${level.emoji}</span><p class="say"></p></div>
      <div class="card board sense-board"></div>
    </section>
    <div class="dock"></div>`;
  wireVoiceToggle(app.querySelector("[data-voice]"));

  const bubble = app.querySelector(".bubble"), board = app.querySelector(".sense-board"), dock = app.querySelector(".dock");
  const tell = (text, voice = voiceOf(text)) => {
    bubble.querySelector(".say").innerHTML = fmt(text);
    bubble.animate?.([{ transform: "scale(1)" }, { transform: "scale(1.03)" }, { transform: "scale(1)" }], { duration: 280 });
    speak(voice);
  };
  const readText = (q) => voiceOf(`${q.q} Is it ${q.choices.join(", ").replace(/, ([^,]*)$/, ", or $1")}?`);
  let current = null;
  app.querySelector("[data-read]").onclick = () => current && speak(readText(current), { force: true });
  app.querySelector("[data-hint]").onclick = () => current && tell(`💡 ${current.hint || "Think about the equal parts."}`);

  const questions = makeFractionSenseRound(level.grade, Date.now() & 0xffff);
  let mistakes = 0, alive = true;

  (async () => {
    for (let k = 0; k < questions.length && alive; k++) {
      app.querySelectorAll("[data-dot]").forEach((d) => d.classList.toggle("now", +d.dataset.dot === k));
      const q = (current = questions[k]);
      board.innerHTML = `<p class="sense-q">${fmt(q.q)}</p>`;
      tell(`${k ? `${leadIn()} ` : ""}${q.q}`, `${k ? `${leadIn()} ` : ""}${readText(q)}`);
      const allFrac = q.choices.every(isFrac);
      dock.innerHTML = `<div class="choices ${allFrac ? "name-choices" : "sense-words"}">${q.choices.map((c) => `
        <button class="choice-card" data-val="${esc(c)}">${isFrac(c) ? fracHtml(...c.split("/").map(Number)) : esc(c)}</button>`).join("")}</div>`;

      const before = mistakes;
      let revealed = false;
      await new Promise((resolve) => {
        let tries = 0;
        dock.querySelectorAll("[data-val]").forEach((btn) => btn.onclick = () => {
          if (!alive || btn.disabled) return;
          sfx.select();
          if (btn.dataset.val === q.answer) {
            dock.querySelectorAll("[data-val]").forEach((b) => { b.disabled = true; });
            btn.classList.add("right"); sfx.right(); FX.confetti(18);
            resolve();
            return;
          }
          mistakes++; tries++;
          btn.classList.add("wrong"); btn.disabled = true; sfx.oops(); FX.shake(btn);
          if (tries < 2) { tell(`${tryAgain()} ${q.hint || ""}`); return; }
          // Second miss: show the answer, then the usual Next button in its usual place.
          revealed = true;
          dock.querySelectorAll("[data-val]").forEach((b) => { b.disabled = true; if (b.dataset.val === q.answer) b.classList.add("right"); });
          tell(`The answer is ${q.answer}. ${q.hint || ""}`);
          setTimeout(resolve, 1400);
        });
      });
      if (!alive) return;
      if (!revealed) tell(`${praise()} ${isFrac(q.answer) ? q.answer : ""}`.trim());
      markDot(app, k, mistakes > before); // yellow if it took a mistake
      S.solvedOne();
      await nextButton(dock, k < questions.length - 1 ? "Next ▶" : "Finish 🏁");
    }
    if (!alive) return;
    const i = SENSE_LEVELS.indexOf(level), nx = SENSE_LEVELS[i + 1];
    showFinish(app, {
      id: `sense-${level.id}`, stars: starsFor(mistakes), mistakes, title: "Fraction Sense!",
      done: `${questions.length} questions done.`, again: `#/sense/${level.id}`, onAgain: () => viewSense(app, level.id),
      next: nx ? { href: `#/sense/${nx.id}`, label: `Next: ${nx.emoji} ${nx.title} ▶` } : { href: "#/", label: "🏠 Fraction Feast" },
    });
  })();
  return () => { alive = false; };
}
