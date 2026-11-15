// Fig 1 · Deadline gauge, drawn with the Anatomy kit (MIT, see LICENSE-anatomy.txt; kit copied unchanged as iso-kit.js).
// A dial indicator on a surface plate. The carriage carries one gauge block per open opportunity in the trackers, and each
// block is exactly as tall as the days left to apply (0.3 units a day). Slide the carriage and the plunger rides up onto the
// block beneath it; one turn of the needle is 100 days, so the dial reads the days left. The data is data.js, read live in
// the visitor's browser, so the heights are today's.
import * as k from "./iso-kit.js";

const host = document.querySelector("#gauge-fig");
if (host && window.OPP) build(host, window.OPP);

function build(host, OPP) {
  const now = new Date();
  const daysLeft = (d) => Math.ceil((new Date(d + "T23:59:59") - now) / 864e5);
  const rows = [
    ...OPP.internships.map((o) => ({ o, page: "internships.html" })),
    ...OPP.conferences.map((o) => ({ o, page: "conferences.html" })),
  ]
    .filter(({ o }) => o.deadline && o.status !== "later" && o.status !== "closed")
    .map((r) => ({ ...r, days: daysLeft(r.o.deadline) }))
    .filter((r) => r.days >= 0 && r.days <= 100)
    .sort((a, b) => a.days - b.days)
    .slice(0, 7)
    .reverse(); // tallest at the back (low x), shortest nearest the viewer, so no near block hides the plunger
  if (!rows.length) { host.closest("section").hidden = true; return; }

  const n = rows.length;
  const K = 0.3; // world units per day
  const PER_TURN = 100 * K; // one needle turn = 100 days
  const WIDTH = 720, HEIGHT = 420;

  const PLATE = { x: -128, y: -64, w: 256, d: 128, r: 8 }, PLATE_H = 12, FOOT_H = 5;
  const MAG = { x: -24, y: -60, w: 48, d: 26, r: 3 }, MAG_H = 24;
  const POST = [0, -47], POST_TOP = 122, CLAMP_Z = 100;
  const DIAL = [0, 0], DIAL_R = 20, DIAL_Z = 82, DIAL_H = 10, DIAL_TOP = DIAL_Z + DIAL_H;
  const RAIL_FROM = -112, RAIL_TO = 112;
  const BLOCK_W = 12, STEP = 15, TIP_R = 2.6, BASE = 8, CARRIAGE_Z = 3;
  const span = (n - 1) * STEP + BLOCK_W;
  const BX0 = -span / 2;
  const CARRIAGE = { x: BX0 - 10, y: -24, w: span + 20, d: 48, r: 3 };
  const heights = rows.map((r) => Math.max(r.days * K, 0.6)); // a block closing today is a thin plate, not nothing
  const STOPS = rows.map((_, i) => -(BX0 + BLOCK_W / 2) - STEP * i);
  const REACH = [Math.min(...STOPS) - 6, Math.max(...STOPS) + 6];
  const LABEL = { x: 78, y: -58, w: 38, d: 16, r: 1.5 };

  const P = k.fitProjection(
    [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [POST[0], POST[1], POST_TOP + 2], [DIAL[0] + DIAL_R, 0, DIAL_TOP]],
    WIDTH, HEIGHT, { pad: 26, azimuth: 42 },
  );
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const D = (points, style) => k.dotsSvg(points, style);
  const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

  function plate() {
    const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
    for (const [x, y] of byDepth(k.corners(PLATE, 22))) {
      out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
      out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
    }
    out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
    out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
    const screws = k.corners(PLATE, 10);
    out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
    out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
    // ruler strip along the front edge
    const strip = { x: -112, y: PLATE.y + PLATE.d - 15, w: 224, d: 7, r: 1 };
    out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
    const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
    out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
    out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
    // label plate with three rule lines (printed text stand-ins)
    out.push(S(k.slabOf(LABEL, 0, 0.8, P, 3, 0.3), { tone: "lo", crease: "none" }));
    for (const dy of [4.5, 8, 11.5]) out.push(L(k.lineOnTop([LABEL.x + 5, LABEL.y + dy], [LABEL.x + (dy === 8 ? 26 : 33), LABEL.y + dy], 0.8, P), { tone: "faint", free: true }));
    out.push(D([at([LABEL.x + 2, LABEL.y + 2, 0.8]), at([LABEL.x + LABEL.w - 2, LABEL.y + LABEL.d - 2, 0.8])], { size: 0.4 }));
    return out.join("");
  }

  function rails() {
    const out = [];
    for (const y of [-20, 15]) {
      out.push(S(k.slabOf({ x: RAIL_FROM, y, w: RAIL_TO - RAIL_FROM, d: 5, r: 1 }, 0, 3, P, 3, 0.4), { tone: "mid" }));
      out.push(D([RAIL_FROM + 6, 0, RAIL_TO - 6].map((x) => at([x, y + 2.5, 3])), { size: 0.4 }));
    }
    for (const x of [RAIL_FROM - 5, RAIL_TO]) {
      out.push(S(k.slabOf({ x, y: -23, w: 5, d: 46, r: 1.2 }, 0, 7, P, 3, 0.5), { tone: "mid" }));
      out.push(D([at([x + 2.5, -18, 7]), at([x + 2.5, 18, 7])], { size: 0.45 }));
    }
    return out.join("");
  }

  function fixture() {
    const out = [];
    out.push(S(k.slabOf(MAG, 0, 11, P, 6, 0.8), { tone: "mid" }));
    out.push(S(k.slabOf(k.insetPlan(MAG, 0.8), 11, MAG_H - 11, P, 6, 0.8), { tone: "mid" }));
    out.push(L(k.planOutline(k.insetPlan(MAG, 3), MAG_H, P), { tone: "faint" }));
    out.push(D([at([MAG.x + 5, MAG.y + 5, MAG_H]), at([MAG.x + MAG.w - 5, MAG.y + 5, MAG_H]), at([MAG.x + 5, MAG.y + MAG.d - 5, MAG_H])], { size: 0.45 }));
    const knob = [MAG.x + MAG.w - 9, MAG.y + MAG.d - 8];
    out.push(S(k.cylinder(knob[0], knob[1], 5, MAG_H, 4, P, 32), { tone: "mid" }));
    out.push(L(k.knurl(knob[0], knob[1], 5, MAG_H, MAG_H + 4, 32, P), { tone: "lo" }));
    out.push(L(k.lineOnTop([knob[0], knob[1]], [knob[0] + 5, knob[1]], MAG_H + 4, P), { tone: "hi" }));
    out.push(D([at([knob[0], knob[1], MAG_H + 4])], { size: 0.5, tone: "hi" }));
    out.push(S(k.cylinder(POST[0], POST[1], 5, MAG_H, 4, P, 28), { tone: "mid" }));
    const clamp = { x: POST[0] - 7, y: POST[1] - 7, w: 14, d: 14, r: 2.5 };
    out.push(S(k.cylinder(POST[0], POST[1], 3.2, MAG_H + 4, CLAMP_Z - 4 - MAG_H - 4, P, 28), { tone: "mid", crease: "none" }));
    out.push(L([56, 78].map((z) => k.sideArc(POST[0], POST[1], 3.2, z, P, 16)).join(""), { tone: "faint" }));
    out.push(S(k.slabOf(clamp, CLAMP_Z - 4, 12, P, 4, 0.6), { tone: "mid" }));
    out.push(S(k.cylinder(POST[0], POST[1], 3.2, CLAMP_Z + 8, POST_TOP - CLAMP_Z - 8, P, 28), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(POST[0], POST[1], 3.8, POST_TOP, 2, P, 28), { tone: "mid" }));
    // thumb screw on the clamp's right side
    const thumbX = clamp.x + clamp.w;
    out.push(S(k.slabOf({ x: thumbX, y: POST[1] - 1.4, w: 3, d: 2.8, r: 0.8 }, CLAMP_Z + 1, 4, P, 2), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(thumbX + 4.4, POST[1], 2.6, CLAMP_Z, 6, P, 20), { tone: "mid" }));
    out.push(L(k.knurl(thumbX + 4.4, POST[1], 2.6, CLAMP_Z, CLAMP_Z + 6, 18, P), { tone: "lo" }));
    // arm from the clamp out to the dial
    const arm = { x: -3, y: POST[1] + 7, w: 6, d: -DIAL_R + 2 - (POST[1] + 7), r: 2 };
    out.push(S(k.slabOf(arm, CLAMP_Z, 4, P, 4, 0.5), { tone: "mid" }));
    out.push(D([at([0, arm.y + 4, CLAMP_Z + 4]), at([0, arm.y + arm.d - 5, CLAMP_Z + 4])], { size: 0.45 }));
    return out.join("");
  }

  function carriage() {
    const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CARRIAGE, 3), CARRIAGE_Z, 0.1, P)}" style="filter:blur(4px)"/>`];
    out.push(S(k.slabOf(CARRIAGE, CARRIAGE_Z, BASE - CARRIAGE_Z, P, 5, 0.6), { tone: "mid" }));
    const bolts = [];
    for (let x = CARRIAGE.x + 6; x <= CARRIAGE.x + CARRIAGE.w - 6; x += 14) bolts.push(at([x, CARRIAGE.y + CARRIAGE.d - 2.6, BASE]));
    out.push(D(bolts, { size: 0.4, tone: "lo" }));
    out.push(L(k.lineOnTop([CARRIAGE.x, -15.5], [CARRIAGE.x + CARRIAGE.w, -15.5], BASE, P), { tone: "faint" }));
    out.push(L(k.lineOnTop([CARRIAGE.x, 15.5], [CARRIAGE.x + CARRIAGE.w, 15.5], BASE, P), { tone: "faint" }));
    rows.forEach((_, i) => {
      const plan = { x: BX0 + STEP * i, y: -12, w: BLOCK_W, d: 24, r: 1 };
      const h = heights[i];
      out.push(S(k.slabOf(plan, BASE, h, P, 3, h > 2 ? 0.5 : 0), { tone: "hi", crease: "lo" }));
      if (h > 1.5) out.push(L(k.planOutline(k.insetPlan(plan, 2), BASE + h, P, 3), { tone: "faint" }));
    });
    const handle = [CARRIAGE.x + CARRIAGE.w - 8, CARRIAGE.y + CARRIAGE.d + 3];
    out.push(S(k.slabOf({ x: handle[0] - 2, y: CARRIAGE.y + CARRIAGE.d - 1, w: 4, d: 4, r: 1 }, CARRIAGE_Z + 1, 3, P, 2), { tone: "mid", crease: "none" }));
    out.push(S(k.cylinder(handle[0], handle[1] + 1, 3, CARRIAGE_Z, 5, P, 20), { tone: "mid" }));
    out.push(L(k.knurl(handle[0], handle[1] + 1, 3, CARRIAGE_Z, CARRIAGE_Z + 5, 18, P), { tone: "lo" }));
    return out.join("");
  }

  function plunger() {
    return S(k.cylinder(DIAL[0], DIAL[1], TIP_R, 0, 2.4, P, 20), { tone: "hi", lit: true })
      + S(k.cylinder(DIAL[0], DIAL[1], 1.4, 2.4, 46, P, 16), { tone: "hi", crease: "none", lit: true });
  }

  function dial() {
    const out = [];
    const [x, y] = DIAL;
    out.push(S(k.cylinder(x, y, 2.9, 54, DIAL_Z - 54, P, 20), { tone: "mid" }));
    out.push(L(k.sideArc(x, y, 2.9, 60, P, 12), { tone: "lo" }));
    out.push(S(k.slabOf({ x: x - 4, y: y - DIAL_R - 6, w: 8, d: 8, r: 1.5 }, DIAL_Z + 2, CLAMP_Z - DIAL_Z - 2, P, 3, 0.4), { tone: "mid" }));
    out.push(S(k.cylinder(x, y, DIAL_R, DIAL_Z, DIAL_H, P, 64, 0.8), { tone: "hi", crease: "lo" }));
    out.push(L(k.knurl(x, y, DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 84, P, 0.3), { tone: "lo" }));
    out.push(L(k.sideArc(x, y, DIAL_R, DIAL_TOP - 3.4, P, 40), { tone: "faint" }));
    out.push(L(k.ring(x, y, DIAL_R - 2.2, DIAL_TOP, P, 64), { tone: "lo" }));
    const ticks = k.radialTicks(x, y, DIAL_R - 3, 50, 5, DIAL_TOP, [1.3, 2.8], P);
    out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
    out.push(S(k.slabOf({ x: x + DIAL_R - 1, y: -2.4, w: 5, d: 4.8, r: 1.2 }, DIAL_Z + 2, 5, P, 3), { tone: "mid" }));
    out.push(S(k.slabOf({ x: x + DIAL_R + 3.6, y: -3.2, w: 2.6, d: 6.4, r: 1.2 }, DIAL_Z + 1.2, 6.6, P, 3), { tone: "mid" }));
    out.push(L(k.ring(x, y, 1.6, DIAL_TOP, P, 16), { tone: "mid" }));
    out.push(k.faceTextSvg(k.topMatrix([x, y + 9], DIAL_TOP, P, "x"), "DAYS", { size: 2.4, tone: "lo", anchor: "middle" }));
    return out.join("");
  }

  const needleAt = (turn) => {
    const a = turn * Math.PI * 2, [x, y] = DIAL;
    return k.lineOnTop([x - Math.sin(a) * 3.4, y + Math.cos(a) * 3.4], [x + Math.sin(a) * (DIAL_R - 4), y - Math.cos(a) * (DIAL_R - 4)], DIAL_TOP + 0.2, P);
  };

  const first = n - 1; // the soonest deadline
  const textFor = (i) => i < 0 ? "between blocks" : `${rows[i].o.short || rows[i].o.name} · ${rows[i].days === 0 ? "closes today" : rows[i].days + (rows[i].days === 1 ? " day" : " days") + " left"}`;
  const svg = k.figureSvg({
    width: WIDTH, height: HEIGHT,
    label: `A dial indicator on a surface plate. A carriage on two rails carries ${n} gauge blocks, one for each open opportunity in the Medinsider trackers; each block is as tall as the days left to apply. The plunger rests on the block under it and the dial reads those days.`,
    body: [
      plate(), rails(), fixture(),
      `<g data-part="carriage" transform="${k.translateAlong(P, [STOPS[first], 0, 0])}">${carriage()}</g>`,
      `<g data-part="plunger" transform="${k.translateAlong(P, [0, 0, BASE + heights[first]])}">${plunger()}</g>`,
      dial(),
      `<path data-part="needle" class="iso-line" data-tone="lit" data-free="start" d="${needleAt(heights[first] / PER_TURN)}" style="stroke-width:1.1"/>`,
    ],
  });

  const soonest = rows[first];
  host.innerHTML = k.plateHtml({
    fig: "Fig 1",
    title: "Deadline gauge",
    hint: "Hover or tap to slide",
    readout: textFor(first),
    keys: [
      { mark: "lit", label: "Plunger and needle: days left under the probe" },
      { mark: "raised", label: `${n} blocks, one per open opportunity` },
    ],
    caption: `Each block is as tall as the days left to apply, and one turn of the needle is 100 days. The heights come from the trackers, counted from today. Soonest: ${textFor(first)}.`,
    body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Deadline gauge: arrow keys move from one opportunity to the next" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${soonest.days}" aria-valuetext="${textFor(first)}">${svg}</div>`,
  });
  const link = document.querySelector("#gauge-open");
  if (link) link.href = soonest.page;

  // live behaviour, ported from the kit's dial-indicator example
  const stage = host.querySelector(".iso-stage");
  const svgEl = stage.querySelector("svg");
  const carriageEl = svgEl.querySelector('[data-part="carriage"]');
  const plungerEl = svgEl.querySelector('[data-part="plunger"]');
  const needleEl = svgEl.querySelector('[data-part="needle"]');
  const readout = host.querySelector("[data-readout]");
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const blockUnder = (cx) => rows.findIndex((_, i) => { const from = cx + BX0 + STEP * i; return DIAL[0] >= from && DIAL[0] <= from + BLOCK_W; });
  const heightUnder = (cx) => {
    let top = BASE;
    rows.forEach((_, i) => { const from = cx + BX0 + STEP * i, to = from + BLOCK_W; if (to > DIAL[0] - TIP_R && from < DIAL[0] + TIP_R) top = Math.max(top, BASE + heights[i]); });
    return top;
  };
  let x = STOPS[first], target = x, tip = { at: BASE + heights[first], rate: 0 };
  let frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idle = 0;
  const tour = [...STOPS].reverse(); // soonest first
  const tourAt = (t) => tour[Math.floor(t / 2.4) % tour.length];
  function draw() {
    carriageEl.setAttribute("transform", k.translateAlong(P, [x, 0, 0]));
    plungerEl.setAttribute("transform", k.translateAlong(P, [0, 0, tip.at]));
    needleEl.setAttribute("d", needleAt((tip.at - BASE) / PER_TURN));
    const i = blockUnder(x), text = textFor(i);
    if (readout.textContent !== text) readout.textContent = text;
    stage.setAttribute("aria-valuenow", String(i < 0 ? 0 : rows[i].days));
    stage.setAttribute("aria-valuetext", text);
  }
  function tick(t) {
    const dt = last ? Math.min((t - last) / 1000, 1 / 30) : 1 / 60;
    last = t;
    const calm = still.matches;
    if (touring) { clock += dt; target = tourAt(clock); }
    x = calm ? target : x + (target - x) * (1 - Math.exp(-dt / 0.28));
    if (Math.abs(target - x) < 0.01) x = target;
    const want = heightUnder(x);
    const stiff = 420, drag = calm ? 2 * Math.sqrt(stiff) : 26;
    for (let s = 0; s < 4; s++) { tip.rate += ((want - tip.at) * stiff - tip.rate * drag) * dt / 4; tip.at += tip.rate * dt / 4; }
    if (calm || (Math.abs(want - tip.at) < 0.005 && Math.abs(tip.rate) < 0.005)) { tip.at = want; tip.rate = 0; }
    draw();
    const settled = !touring && x === target && tip.rate === 0 && tip.at === want;
    frame = visible && !settled ? requestAnimationFrame(tick) : 0;
  }
  const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
  const steer = (next) => {
    touring = false; target = clamp(next, REACH[0], REACH[1]);
    clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 4000);
    run();
  };
  const fromPointer = (e) => {
    const box = svgEl.getBoundingClientRect();
    const share = clamp(((e.clientX - box.left) / box.width - 0.2) / 0.6, 0, 1);
    steer(REACH[0] + share * (REACH[1] - REACH[0]));
  };
  new IntersectionObserver((es) => { visible = es[es.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
  stage.addEventListener("pointermove", fromPointer);
  stage.addEventListener("pointerdown", fromPointer);
  stage.addEventListener("keydown", (e) => {
    const here = STOPS.reduce((best, s, i) => (Math.abs(s - target) < Math.abs(STOPS[best] - target) ? i : best), 0);
    let to = null;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") to = Math.max(0, here - 1);
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") to = Math.min(n - 1, here + 1);
    if (e.key === "Home") to = n - 1;
    if (e.key === "End") to = 0;
    if (to === null) return;
    e.preventDefault(); steer(STOPS[to]);
  });
  draw();
}
