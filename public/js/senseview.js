// Fraction Sense interactive quiz view (#/sense and #/sense/:id).

import { SENSE_LEVELS, SENSE_QUESTIONS_PER_ROUND, makeFractionSenseRound } from "./sense.js";
import { sfx } from "./kit/sound.js";
import * as FX from "./kit/fx.js";
import { esc, nextButton, starsFor, showFinish, wireVoiceToggle, pick } from "./kit/ui.js";
import { speak } from "./kit/tts.js";
import * as S from "./kit/store.js";

function saySense(bubble, text, speakOverride = null) {
  if (bubble) {
    const p = bubble.querySelector(".say");
    if (p) p.textContent = text;
    bubble.animate?.([{ transform: "scale(1)" }, { transform: "scale(1.03)" }, { transform: "scale(1)" }], { duration: 280 });
  }
  speak(speakOverride || text);
}

export function viewSenseList(app) {
  app.innerHTML = `
    <div class="play-top">
      <a class="icon-btn" href="#/" aria-label="Home">←</a>
      <h2 style="margin:0;flex:1;text-align:center;">⚡ Fraction Sense</h2>
      <span style="width:40px"></span>
    </div>
    <p class="muted" style="text-align:center;margin:8px 0 16px;">Quick fraction questions with read-aloud & hints!</p>
    <div class="level-grid">
      ${SENSE_LEVELS.map((lv) => `
        <a class="level-card" href="#/sense/${lv.id}">
          <span class="emoji">${lv.emoji}</span>${esc(lv.title)}
        </a>`).join("")}
    </div>`;
}

export function viewSense(app, levelId) {
  const level = SENSE_LEVELS.find((l) => l.id === levelId) || SENSE_LEVELS[0];
  document.body.classList.add("in-game");

  app.innerHTML = `
    <section class="play">
      <div class="play-top">
        <a class="icon-btn" href="#/sense" aria-label="Back">✕</a>
        <div class="dots">${Array.from({ length: SENSE_QUESTIONS_PER_ROUND }, (_, k) => `<i data-dot="${k}"></i>`).join("")}</div>
        <button class="icon-btn toggle" data-voice title="Read aloud">🔊</button>
      </div>
      <div class="bubble" aria-live="polite">
        <span class="mascot" aria-hidden="true">${level.emoji}</span>
        <p class="say"></p>
      </div>
      <div class="card game-stage"></div>
    </section>
    <div class="dock"></div>`;

  wireVoiceToggle(app.querySelector("[data-voice]"));

  const bubble = app.querySelector(".bubble");
  const stage = app.querySelector(".game-stage");
  const dock = app.querySelector(".dock");
  const dots = [...app.querySelectorAll("[data-dot]")];

  const questions = makeFractionSenseRound(level.grade, Date.now() & 0xffff);
  let mistakes = 0;
  let alive = true;

  (async () => {
    for (let k = 0; k < questions.length; k++) {
      if (!alive) return;
      dots.forEach((d, idx) => d.classList.toggle("cur", idx === k));
      const q = questions[k];

      stage.innerHTML = `
        <div class="sense-q-card" style="text-align:center;padding:10px 8px;">
          <p class="sense-q-text" style="font-size:1.18rem;font-weight:800;margin:4px 0 10px;">${esc(q.q)}</p>
          <div style="display:flex;gap:8px;justify-content:center;">
            <button class="btn ghost small" type="button" id="sense-read-btn">🔊 Read</button>
            <button class="btn ghost small" type="button" id="sense-hint-btn">💡 Hint</button>
          </div>
        </div>`;

      saySense(bubble, q.q);
      stage.querySelector("#sense-read-btn").onclick = () => speak(q.q, { force: true });
      stage.querySelector("#sense-hint-btn").onclick = () => saySense(bubble, q.hint || "Think about equal parts!");

      dock.innerHTML = `
        <div class="choices" style="display:grid;gap:8px;">
          ${q.choices.map((c) => `
            <div style="display:flex;gap:8px;align-items:stretch;">
              <button class="btn big choice-card" style="flex:1;" data-val="${esc(c)}">${esc(c)}</button>
              <button class="btn ghost small" type="button" data-speak-choice="${esc(c)}" aria-label="Read choice aloud" style="padding:0 12px;min-width:44px;">🔊</button>
            </div>`).join("")}
        </div>`;

      let missed = false;
      await new Promise((resolve) => {
        let qMistakes = 0;
        let finished = false;
        dock.querySelectorAll("[data-speak-choice]").forEach((sbtn) => {
          sbtn.onclick = (e) => {
            e.stopPropagation();
            speak(sbtn.dataset.speakChoice, { force: true });
          };
        });
        dock.querySelectorAll("[data-val]").forEach((btn) => {
          btn.onclick = () => {
            if (finished) return;
            const val = btn.dataset.val;
            sfx.select();
            if (val === q.answer) {
              finished = true;
              btn.classList.add("right");
              sfx.right();
              FX.confetti(20);
              dots[k]?.classList.add(missed ? "assisted" : "done");
              S.solvedOne();
              resolve();
            } else {
              mistakes++;
              qMistakes++;
              missed = true;
              btn.classList.add("wrong");
              btn.disabled = true;
              sfx.oops();
              FX.shake(btn);
              if (qMistakes >= 2) {
                finished = true;
                dock.querySelectorAll("[data-val]").forEach((b) => {
                  b.disabled = true;
                  if (b.dataset.val === q.answer) b.classList.add("right");
                });
                dots[k]?.classList.add("assisted");
                saySense(bubble, `I'll give you the answer! It's ${q.answer}.`);
                const nextWrap = document.createElement("div");
                nextWrap.style.cssText = "margin-top:10px;display:flex;justify-content:center;";
                nextWrap.innerHTML = `<button class="btn big primary" type="button" id="sense-next-btn">Next Question ▶</button>`;
                dock.appendChild(nextWrap);
                nextWrap.querySelector("#sense-next-btn").onclick = () => resolve();
              } else {
                saySense(bubble, q.hint || "Try another choice!");
              }
            }
          };
        });
      });

      if (!alive) return;
      saySense(bubble, pick(["Yes!", "Super!", "Correct!", "Spot on!"]));
      await nextButton(dock, k < SENSE_QUESTIONS_PER_ROUND - 1 ? "Next ▶" : "Finish 🏁");
    }

    if (!alive) return;
    showFinish(app, {
      id: `sense-${level.id}`,
      stars: starsFor(mistakes),
      mistakes,
      title: "Fraction Sense Complete!",
      done: `${SENSE_QUESTIONS_PER_ROUND} questions solved!`,
      again: `#/sense/${level.id}`,
      onAgain: () => viewSense(app, level.id),
      next: { href: "#/sense", label: "Other Grades ▶" },
    });
  })();

  return () => { alive = false; };
}
