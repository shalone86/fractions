// SVG shapes cut into parts: circles (pie slices), rectangles (a grid of equal parts, or strips)
// and bars. Each part is a <path data-part="i"> so it can be tapped and shaded.

const R = 92, C = 100;
const pt = (a) => `${(C + R * Math.cos(a)).toFixed(2)} ${(C + R * Math.sin(a)).toFixed(2)}`;

function circleParts(cuts) {
  if (cuts.length === 1) return [`M ${C - R} ${C} A ${R} ${R} 0 1 1 ${C + R} ${C} A ${R} ${R} 0 1 1 ${C - R} ${C} Z`];
  let a = -Math.PI / 2;
  return cuts.map((f) => {
    const a1 = a + f * 2 * Math.PI;
    const d = `M ${C} ${C} L ${pt(a)} A ${R} ${R} 0 ${f > 0.5 ? 1 : 0} 1 ${pt(a1)} Z`;
    a = a1;
    return d;
  });
}

/** Equal parts in a grid: 2 → 2×1, 3 → 3×1, 4 → 2×2, 6 → 3×2, 8 → 4×2. */
const GRID = { 1: [1, 1], 2: [2, 1], 3: [3, 1], 4: [2, 2], 6: [3, 2], 8: [4, 2], 12: [4, 3] };
function rectParts(cuts, w, h, x0 = 0, y0 = 0) {
  const n = cuts.length, equal = cuts.every((c) => Math.abs(c - 1 / n) < 1e-9);
  if (equal && GRID[n]) {
    const [cols, rows] = GRID[n], cw = w / cols, rh = h / rows, out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push(box(x0 + c * cw, y0 + r * rh, cw, rh));
    return out;
  }
  return strips(cuts, w, h, x0, y0);
}
function strips(cuts, w, h, x0 = 0, y0 = 0) {
  let x = x0;
  return cuts.map((f) => { const d = box(x, y0, f * w, h); x += f * w; return d; });
}
const box = (x, y, w, h) => `M ${x.toFixed(2)} ${y.toFixed(2)} h ${w.toFixed(2)} v ${h.toFixed(2)} h ${(-w).toFixed(2)} Z`;

/** A shape for a question: { shape, cuts }. `shaded` is a Set of part indexes. */
export function shapeSvg({ shape, cuts }, shaded = new Set()) {
  let view, paths;
  if (shape === "circle") { view = "0 0 200 200"; paths = circleParts(cuts); }
  else if (shape === "rect") { view = "0 0 240 160"; paths = rectParts(cuts, 232, 152, 4, 4); }
  else { view = "0 0 300 80"; paths = strips(cuts, 292, 72, 4, 4); }
  return `<svg class="shape ${shape}" viewBox="${view}" role="img" aria-label="${shape} cut into ${cuts.length} parts">
    ${paths.map((d, i) => `<path data-part="${i}" class="part${shaded.has(i) ? " on" : ""}" d="${d}"/>`).join("")}
  </svg>`;
}

/** A fraction bar: n equal parts, the first k shaded. Same width for every bar so they compare. */
export function barSvg(k, n, tone = "") {
  return `<svg class="fbar ${tone}" viewBox="0 0 300 44" role="img" aria-label="${k} of ${n} parts shaded">
    ${strips(Array(n).fill(1 / n), 292, 36, 4, 4).map((d, i) => `<path class="part${i < k ? " on" : ""}" d="${d}"/>`).join("")}
  </svg>`;
}

/** A stacked fraction: top orange (parts we have), bottom blue (equal parts in all). */
export const fracHtml = (k, n) => `<span class="frac" aria-label="${k} over ${n}"><b>${k}</b><i>${n}</i></span>`;
