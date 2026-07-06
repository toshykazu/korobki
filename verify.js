#!/usr/bin/env node
// Повершинная сверка box-geometry.js с эталоном korobka.svg (раскладка 3 мм).
// Запуск: node verify.js
// Допустимые расхождения задокументированы в CLAUDE.md (задняя стенка: +0.4 аномалия эталона).

const fs = require("fs");
const path = require("path");
const BG = require("./box-geometry.js");

const PT = 25.4 / 72;
const svg = fs.readFileSync(path.join(__dirname, "korobka.svg"), "utf8");

// D — глубина под крышкой (Dfull = D + gap). В CDR-исходнике та же полость 46.6
// задавалась как 44.2 + оргстекло 2.1 + техзазор 0.3 (параметр tech удалён 2026-07).
const ETALON = { W: 99.4, H: 99.4, D: 44.4, t: 3.0, acr: 2.1, gap: 2.2, ov: 0.4, frame: 4.2, lip: 0.6 };

const REF_IDS = {
  path291: "top", path292: "sideR", path293: "sideL",
  path294: "back", path295: "bottom", path296: "front",
  path286: "acr_panel", path288: "acr_strip",
};

function parseVertices(d) {
  const tok = d.match(/[a-zA-Z]|-?[\d.]+(?:[eE]-?\d+)?/g);
  let x = 0, y = 0, i = 0, cmd = null;
  const pts = [];
  const num = () => parseFloat(tok[i++]);
  while (i < tok.length) {
    if (/[a-zA-Z]/.test(tok[i])) { cmd = tok[i++]; continue; }
    switch (cmd) {
      case "m": x += num(); y += num(); cmd = "l"; break;
      case "M": x = num(); y = num(); cmd = "L"; break;
      case "l": x += num(); y += num(); break;
      case "L": x = num(); y = num(); break;
      case "h": x += num(); break;
      case "H": x = num(); break;
      case "v": y += num(); break;
      case "V": y = num(); break;
      case "q": i += 2; x += num(); y += num(); break;
      case "c": i += 4; x += num(); y += num(); break;
      default: i++;
    }
    pts.push([x * PT, y * PT]);
  }
  return pts;
}

function normSet(pts) {
  const x0 = Math.min(...pts.map((p) => p[0]));
  const y0 = Math.min(...pts.map((p) => p[1]));
  const seen = new Set();
  const out = [];
  for (const p of pts) {
    const q = [+(p[0] - x0).toFixed(3), +(p[1] - y0).toFixed(3)];
    const k = q.join(",");
    if (!seen.has(k)) { seen.add(k); out.push(q); }
  }
  return out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
}

function maxDiff(a, b) {
  if (a.length !== b.length) return `кол-во вершин ${a.length} vs ${b.length}`;
  let mx = 0;
  for (let i = 0; i < a.length; i++)
    mx = Math.max(mx, Math.abs(a[i][0] - b[i][0]), Math.abs(a[i][1] - b[i][1]));
  return +mx.toFixed(4);
}

const refs = {};
for (const m of svg.matchAll(/<path\s+d="([^"]+)"[\s\S]*?id="(path\d+)"/g)) {
  const name = REF_IDS[m[2]];
  if (name) refs[name] = normSet(parseVertices(m[1]));
}

// Эталон резался БЕЗ компенсации торцов шипов (первая коробка: шипы утоплены),
// поэтому вершины сверяем в режиме tipComp:false; сама компенсация проверяется ниже.
const model = BG.model(Object.assign({}, ETALON, { tipComp: false }));
const get = (id) => model.pieces.find((p) => p.id === id);

const CHECKS = [
  ["bottom", "bottom", 0],
  ["top", "top", 0],
  ["sideL", "sideL", 0],
  ["sideR", "sideR", 0],
  ["front", "front", 0],
  ["back", "back", 0.4],
];

let fail = 0;
for (const [id, ref, allow] of CHECKS) {
  const d = maxDiff(normSet(get(id).pts), refs[ref]);
  const ok = typeof d === "number" && d <= allow + 1e-9;
  if (!ok) fail++;
  console.log(`${ok ? "OK  " : "FAIL"} ${id.padEnd(8)} maxdiff=${d}${allow ? ` (допуск ${allow} — норм. аномалии эталона)` : ""}`);
}

const win = get("top").holes[0];
const winOk = Math.abs(win.w - 91) < 1e-9 && Math.abs(win.x - 7.2) < 1e-9;
console.log(`${winOk ? "OK  " : "FAIL"} окно     ${win.w}x${win.h} at ${win.x},${win.y} (ожид. 91x91 at 7.2,7.2)`);
if (!winOk) fail++;

const acr = get("acrylic");
const acrOk = Math.abs(acr.w - 98.8) < 1e-9 && Math.abs(acr.h - 103) < 1e-9 &&
  Math.abs(acr.strip.y - 74.4768) < 0.001 && Math.abs(acr.strip.h - 22.0232) < 1e-9;
console.log(`${acrOk ? "OK  " : "FAIL"} оргстекло ${acr.w}x${acr.h}, полоса y=${acr.strip.y.toFixed(4)} h=${acr.strip.h}`);
if (!acrOk) fail++;

const ins = get("ins1");
const insOk = Math.abs(ins.w - 99.4) < 1e-9 && Math.abs(ins.h - 44.4) < 1e-9;
console.log(`${insOk ? "OK  " : "FAIL"} вкладка  ${ins.w}x${ins.h} (ожид. 99.4x44.4)`);
if (!insOk) fail++;

// Компенсация резаных торцов (tipComp по умолчанию): на ov/2 удлинена всякая
// кромка, чей торец выходит на наружную поверхность коробки, — торцы сквозных
// шипов, нижние кромки стенок, передние/задние торцы боковых, все 4 кромки верха.
const mc = BG.model(ETALON);
const gc = (id) => mc.pieces.find((p) => p.id === id);
const e = ETALON.ov / 2;
const TIP_CHECKS = [
  ["bottom", 99.4 + 6 + 2 * e, 99.4 + 6 + 2 * e],
  ["sideL", 46.6 + 6 + 2 * e, 99.4 + 6 + 2 * e],
  ["sideR", 46.6 + 6 + 2 * e, 99.4 + 6 + 2 * e],
  ["back", 46.6 + 6 + 2 * e, 99.4 + 6 + 2 * e],
  ["front", 44.4 + 3 + e, 99.4 + 6 + 2 * e],
  ["top", 99.4 + 6 + 2 * e, 99.4 + 6 + 2 * e],
];
for (const [id, ew, eh] of TIP_CHECKS) {
  const pc = gc(id);
  const ok = Math.abs(pc.w - ew) < 1e-6 && Math.abs(pc.h - eh) < 1e-6;
  if (!ok) fail++;
  console.log(`${ok ? "OK  " : "FAIL"} tipComp ${id.padEnd(7)} ${pc.w.toFixed(1)}x${pc.h.toFixed(1)} (ожид. ${ew.toFixed(1)}x${eh.toFixed(1)})`);
}

console.log(fail ? `\n${fail} FAIL` : "\nВсё сходится с эталоном.");
process.exit(fail ? 1 : 0);
