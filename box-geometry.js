(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BoxGeometry = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const BIG_R = 52.0 / 99.4;
  const SMALL_R = 14.0 / 46.6;
  const SMALL_C = 21.5 / 46.6;
  const WIN_R = 1.6;
  const ACR_SIDE = 0.3;
  const ACR_R = 1.3891;
  const STRIP_H = 22.0232;
  const STRIP_FRONT = 6.5;
  const TORN_DX_FROM_CENTER = -8.9935;
  const TORN_DY_FROM_STRIP = 4.881;
  const PT = 25.4 / 72;

  const TORN_D = "m 0,0 v 6.9707 h -5.4699 v 28.381 h -9.1995 v -28.381 h -5.4699 v -6.9707 z m 23.1231,20.6633 c 0,3.5601 -0.081,5.988 -0.2487,7.4687 -0.1676,1.4805 -0.6105,3.0069 -1.4919,4.2322 -0.8814,1.2253 -2.2289,2.082 -3.7294,2.7385 -1.6525,0.6916 -3.4308,1.0308 -5.2214,0.9958 -1.7075,0.01 -3.3992,-0.3315 -4.9727,-0.9958 -1.5077,-0.6199 -2.8116,-1.4988 -3.7294,-2.7385 -0.9178,-1.2397 -1.5665,-2.5246 -1.7404,-3.9834 -0.1741,-1.4585 -0.2487,-4.0709 -0.2487,-7.7175 v -5.975 c 0,-3.56 0.081,-6.2371 0.2487,-7.7176 0.1676,-1.4806 0.859,-2.7579 1.7404,-3.9833 0.8811,-1.2214 2.0871,-2.1704 3.4808,-2.7385 1.6524,-0.6916 3.4307,-1.0308 5.2213,-0.9959 1.894,0 3.7137,0.127 5.2214,0.747 1.5077,0.6198 2.5632,1.7476 3.4808,2.9874 0.9177,1.2398 1.5664,2.5247 1.7405,3.9833 0.1739,1.4586 0.2487,4.0709 0.2487,7.7176 z m -9.1996,-11.7009 c 0,-1.6484 -0.066,-2.528 -0.2485,-2.9875 -0.109,-0.2347 -0.2857,-0.4313 -0.5073,-0.5644 -0.2217,-0.1331 -0.4779,-0.1967 -0.736,-0.1825 -0.196,-0.021 -0.3938,0.015 -0.5699,0.1034 -0.1762,0.088 -0.3236,0.2251 -0.4245,0.3945 -0.255,0.3719 -0.4973,1.4131 -0.4973,3.2365 v 16.6799 c 0,2.057 0.081,3.2531 0.2486,3.7344 0.1676,0.4815 0.6312,0.747 1.2431,0.747 0.6267,0 1.0692,-0.1925 1.2433,-0.747 0.1739,-0.5544 0.2485,-1.8973 0.2485,-3.9832 z m 12.6804,-8.9624 h 6.4644 c 4.3415,0 7.1651,0.1622 8.7023,0.4978 1.537,0.3356 3.0084,1.1111 3.9781,2.4896 0.9697,1.3785 1.2431,3.7022 1.2431,6.7218 0,2.7569 -0.3097,4.5288 -0.9945,5.4771 -0.6847,0.9482 -1.9677,1.5529 -3.9782,1.7426 1.8211,0.4521 3.103,0.9841 3.7296,1.7427 0.6265,0.7586 1.0902,1.357 1.2431,1.9917 0.153,0.6346 0,2.369 0,5.2281 v 9.4603 h -8.4535 v -11.7008 c 0,-1.8965 -0.199,-3.0334 -0.4973,-3.4856 -0.2983,-0.452 -0.9697,-0.7468 -2.2377,-0.7468 v 15.9332 h -9.1994 z m 9.1994,5.9749 v 7.9666 c 1.0343,0 1.8225,-0.2134 2.2377,-0.4979 0.4152,-0.2846 0.4973,-1.1776 0.4973,-2.7385 v -1.9917 c 0,-1.1233 -0.097,-1.8906 -0.4973,-2.2406 -0.4004,-0.35 -1.1743,-0.4979 -2.2377,-0.4979 z m 35.306,-5.9749 v 35.3517 h -7.9563 l -4.7241,-16.1822 v 16.1822 h -7.7075 v -35.3517 h 7.7075 l 4.9727,15.9331 v -15.9331 z";

  const DEFAULTS = {
    W: 99.4, H: 99.4, D: 44.2, t: 3.4,
    acr: 2.0, gap: 2.4,
    kerf: 0.2, fit: 0.1, frame: 4.2, lip: 0,
    tornOff: STRIP_FRONT,
  };

  function joints(p) {
    const Dfull = p.D + p.gap;
    const g = p.kerf + p.fit / 2;
    const big = (L) => L * BIG_R;
    const j = {
      Dfull,
      tabW: [p.W / 2 - (big(p.W) + g) / 2, p.W / 2 + (big(p.W) + g) / 2],
      slotW: [p.W / 2 - (big(p.W) - g) / 2, p.W / 2 + (big(p.W) - g) / 2],
      tabH: [p.H / 2 - (big(p.H) + g) / 2, p.H / 2 + (big(p.H) + g) / 2],
      slotH: [p.H / 2 - (big(p.H) - g) / 2, p.H / 2 + (big(p.H) - g) / 2],
      smallC: Dfull * SMALL_C,
      smallTab: Dfull * SMALL_R + g,
      smallSlot: Dfull * SMALL_R - g,
      tipE: p.tipComp === false ? 0 : p.kerf / 2,
    };
    return j;
  }

  function bottomPiece(p, j) {
    const t = p.t, W = p.W, H = p.H, e = j.tipE;
    const [aw, bw] = j.tabW, [ah, bh] = j.tabH;
    return [
      [-e, bh + t], [-e, ah + t], [t, ah + t], [t, t],
      [aw + t, t], [aw + t, -e], [bw + t, -e], [bw + t, t],
      [W + t, t], [W + t, ah + t], [W + 2 * t + e, ah + t], [W + 2 * t + e, bh + t],
      [W + t, bh + t], [W + t, H + t], [bw + t, H + t], [bw + t, H + 2 * t + e],
      [aw + t, H + 2 * t + e], [aw + t, H + t], [t, H + t], [t, bh + t],
    ];
  }

  function topPiece(p, j) {
    const t = p.t, W = p.W, H = p.H, e = j.tipE;
    const [aw, bw] = j.slotW, [ah, bh] = j.slotH;
    return [
      [W + 2 * t + e, ah + t], [W + t, ah + t], [W + t, bh + t], [W + 2 * t + e, bh + t],
      [W + 2 * t + e, H + 2 * t + e], [bw + t, H + 2 * t + e], [bw + t, H + t], [aw + t, H + t],
      [aw + t, H + 2 * t + e], [-e, H + 2 * t + e], [-e, bh + t], [t, bh + t],
      [t, ah + t], [-e, ah + t], [-e, -e], [W + 2 * t + e, -e],
    ];
  }

  function sidePiece(p, j) {
    const t = p.t, H = p.H, Df = j.Dfull, e = j.tipE;
    const [at, bt] = j.tabH, [as, bs] = j.slotH;
    const n0 = j.smallC + t - j.smallSlot / 2, n1 = j.smallC + t + j.smallSlot / 2;
    return [
      [-e, -e], [n0, -e], [n0, t], [n1, t], [n1, -e], [Df + t, -e],
      [Df + t, at + t], [Df + 2 * t + e, at + t], [Df + 2 * t + e, bt + t], [Df + t, bt + t],
      [Df + t, H + 2 * t + e], [n1, H + 2 * t + e], [n1, H + t], [n0, H + t],
      [n0, H + 2 * t + e], [-e, H + 2 * t + e],
      [-e, bs + t], [t, bs + t], [t, as + t], [-e, as + t],
    ];
  }

  function backPiece(p, j) {
    const t = p.t, W = p.W, Df = j.Dfull, e = j.tipE;
    const [at, bt] = j.tabW, [as, bs] = j.slotW;
    const c = Df - j.smallC;
    const s0 = c + t - j.smallTab / 2, s1 = c + t + j.smallTab / 2;
    return [
      [-e, bt + t], [-e, at + t], [t, at + t], [t, t],
      [s0, t], [s0, -e], [s1, -e], [s1, t],
      [Df + 2 * t + e, t], [Df + 2 * t + e, as + t], [Df + t, as + t], [Df + t, bs + t],
      [Df + 2 * t + e, bs + t], [Df + 2 * t + e, W + t], [s1, W + t], [s1, W + 2 * t + e],
      [s0, W + 2 * t + e], [s0, W + t], [t, W + t], [t, bt + t],
    ];
  }

  function frontPiece(p, j) {
    const t = p.t, W = p.W, e = j.tipE;
    const fh = j.Dfull - p.gap;
    const [as, bs] = j.slotW;
    const s0 = j.smallC + t - j.smallTab / 2, s1 = j.smallC + t + j.smallTab / 2;
    return [
      [-e, W + t], [-e, bs + t], [t, bs + t], [t, as + t], [-e, as + t], [-e, t],
      [s0, t], [s0, -e], [s1, -e], [s1, t],
      [fh + t, t], [fh + t, W + t], [s1, W + t], [s1, W + 2 * t + e],
      [s0, W + 2 * t + e], [s0, W + t],
    ];
  }

  function rectPts(w, h) {
    return [[0, 0], [w, 0], [w, h], [0, h]];
  }

  function roundedRect(x, y, w, h, r) {
    return { x, y, w, h, r };
  }

  function model(params) {
    const p = Object.assign({}, DEFAULTS, params);
    if (params && params.ov != null && params.kerf == null) p.kerf = params.ov / 2;
    const j = joints(p);
    const t = p.t, W = p.W, H = p.H, Df = j.Dfull;
    const insH = Df - p.gap;
    const acrW = W - 2 * ACR_SIDE;
    const acrL = H + t + p.lip;

    const pieces = [
      { id: "bottom", name: "Дно", material: "ply", pts: bottomPiece(p, j) },
      { id: "top", name: "Верх с окном", material: "ply", pts: topPiece(p, j),
        holes: [roundedRect(t + p.frame, t + p.frame, W - 2 * p.frame, H - 2 * p.frame, WIN_R)] },
      { id: "sideL", name: "Боковая Л", material: "ply", pts: sidePiece(p, j) },
      { id: "sideR", name: "Боковая П", material: "ply",
        pts: sidePiece(p, j).map(([x, y]) => [Df + 2 * t - x, y]) },
      { id: "back", name: "Задняя", material: "ply", pts: backPiece(p, j) },
      { id: "front", name: "Передняя", material: "ply", pts: frontPiece(p, j) },
      { id: "ins1", name: "Вкладка 1", material: "ply", pts: rectPts(H, insH) },
      { id: "ins2", name: "Вкладка 2", material: "ply", pts: rectPts(H, insH) },
      { id: "acrylic", name: "Оргстекло", material: "acrylic",
        rounded: roundedRect(0, 0, acrW, acrL, ACR_R),
        strip: { x: 0, y: acrL - p.tornOff - STRIP_H, w: acrW, h: STRIP_H },
        torn: {
          x: acrW / 2 + TORN_DX_FROM_CENTER,
          y: acrL - p.tornOff - STRIP_H + TORN_DY_FROM_STRIP,
          d: TORN_D, scale: PT,
        } },
    ];
    for (const pc of pieces) {
      if (pc.pts) {
        const mx = Math.min(...pc.pts.map((q) => q[0]));
        const my = Math.min(...pc.pts.map((q) => q[1]));
        if (mx || my) {
          pc.pts = pc.pts.map(([x, y]) => [x - mx, y - my]);
          if (pc.holes) pc.holes = pc.holes.map((h) => Object.assign({}, h, { x: h.x - mx, y: h.y - my }));
        }
        pc.off = [mx, my];
        pc.w = Math.max(...pc.pts.map((q) => q[0]));
        pc.h = Math.max(...pc.pts.map((q) => q[1]));
      } else {
        pc.w = pc.rounded.w;
        pc.h = pc.rounded.h;
      }
    }
    return { p, j, Dfull: Df, pieces };
  }

  function placements(m, opts) {
    const { p, j } = m;
    const t = p.t, W = p.W, H = p.H, Df = j.Dfull;
    const ex = (opts && opts.explode) || 0;
    const slide = (opts && opts.slide) || 0;
    const by = (id) => m.pieces.find((q) => q.id === id);

    const list = [
      { piece: by("bottom"), th: t,
        origin: [-t, -t, -t], u: [1, 0, 0], v: [0, 1, 0], ext: [0, 0, 1],
        offset: [0, 0, -ex] },
      { piece: by("top"), th: t,
        origin: [-t, H + t, Df], u: [1, 0, 0], v: [0, -1, 0], ext: [0, 0, 1],
        offset: [0, 0, ex] },
      { piece: by("sideL"), th: t,
        origin: [-t, -t, -t], u: [0, 0, 1], v: [0, 1, 0], ext: [1, 0, 0],
        offset: [-ex, 0, 0] },
      { piece: by("sideR"), th: t,
        origin: [W + t, -t, Df + t], u: [0, 0, -1], v: [0, 1, 0], ext: [-1, 0, 0],
        offset: [ex, 0, 0] },
      { piece: by("back"), th: t,
        origin: [-t, 0, Df + t], u: [0, 0, -1], v: [1, 0, 0], ext: [0, -1, 0],
        offset: [0, -ex, 0] },
      { piece: by("front"), th: t,
        origin: [-t, H, -t], u: [0, 0, 1], v: [1, 0, 0], ext: [0, 1, 0],
        offset: [0, ex, 0] },
      { piece: by("ins1"), th: t,
        origin: [t, 0, 0], u: [0, 1, 0], v: [0, 0, 1], ext: [-1, 0, 0],
        offset: [-ex * 0.45, 0, 0] },
      { piece: by("ins2"), th: t,
        origin: [W - t, 0, 0], u: [0, 1, 0], v: [0, 0, 1], ext: [1, 0, 0],
        offset: [ex * 0.45, 0, 0] },
      { piece: by("acrylic"), th: p.acr,
        origin: [ACR_SIDE, 0, Df - p.gap], u: [1, 0, 0], v: [0, 1, 0], ext: [0, 0, 1],
        offset: [0, slide * (H * 0.8), ex * 0.6] },
    ];
    for (const pl of list) {
      const off = pl.piece.off;
      if (off && (off[0] || off[1]))
        pl.origin = pl.origin.map((c, i) => c + pl.u[i] * off[0] + pl.v[i] * off[1]);
    }
    return list;
  }

  return { DEFAULTS, model, placements, TORN_D, PT, STRIP_H, STRIP_FRONT, ACR_SIDE, ACR_R };
});
