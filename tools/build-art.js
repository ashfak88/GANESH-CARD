#!/usr/bin/env node
// Generates the invitation's original SVG artwork, plus the geometry the
// animations need (hero layer positions, envelope glow paths).
// Run: node tools/build-art.js
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets');
fs.mkdirSync(OUT, { recursive: true });

const mulberry = seed => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const n = v => +v.toFixed(1);
const rad = d => d * Math.PI / 180;

/* ---------- shared paint ---------- */
const PAINT = `
<linearGradient id="pt" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#eeb2bf"/><stop offset=".38" stop-color="#f8dadf"/><stop offset="1" stop-color="#fffaf6"/></linearGradient>
<linearGradient id="pt2" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e79fb0"/><stop offset=".5" stop-color="#f5cfd6"/><stop offset="1" stop-color="#fdeeec"/></linearGradient>
<linearGradient id="bd" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e68ea3"/><stop offset=".55" stop-color="#f4c2cc"/><stop offset="1" stop-color="#fdece9"/></linearGradient>
<linearGradient id="lf" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#3b1530"/><stop offset="1" stop-color="#7b3556"/></linearGradient>
<linearGradient id="lf2" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#8b5a4c"/><stop offset="1" stop-color="#c79a7d"/></linearGradient>
<radialGradient id="ctr"><stop offset="0" stop-color="#f7c58f"/><stop offset="1" stop-color="#d0776f"/></radialGradient>`;

/* ---------- botanical primitives ---------- */
const petal = (a, sc, fill, op = 1) =>
  `<path transform="rotate(${n(a)}) scale(${n(sc)})" d="M0,0C-24,-4 -38,-34 -27,-58C-19,-75 -7,-82 0,-82C7,-82 19,-75 27,-58C38,-34 24,-4 0,0Z" fill="url(#${fill})" stroke="#b5788a" stroke-opacity=".3" stroke-width=".9" opacity="${op}"/>`;

function magnolia(r, x, y, s, rot) {
  let g = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})">`;
  for (let i = 0; i < 6; i++) g += petal(i * 60 + r() * 16 - 8, 0.9 + r() * 0.18, 'pt');
  for (let i = 0; i < 5; i++) g += petal(20 + i * 72 + r() * 12 - 6, 0.68 + r() * 0.1, 'pt2', 0.98);
  for (let i = 0; i < 3; i++) g += petal(-30 + i * 30 + r() * 8, 0.46 + r() * 0.06, 'pt', 0.95);
  g += `<circle r="10" fill="url(#ctr)"/>`;
  for (let i = 0; i < 16; i++) {
    const a = i * 22.5 + r() * 8, d = 3 + r() * 6;
    g += `<circle cx="${n(Math.sin(rad(a)) * d)}" cy="${n(-Math.cos(rad(a)) * d)}" r="1.5" fill="#e0955f" opacity=".9"/>`;
  }
  return g + '</g>';
}

const bud = (x, y, s, rot) =>
  `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})"><path d="M0,0C-17,-10 -19,-44 0,-68C19,-44 17,-10 0,0Z" fill="url(#bd)" stroke="#b5788a" stroke-opacity=".35" stroke-width=".9"/><path d="M0,-2C-7,-22 -5,-46 0,-66" fill="none" stroke="#b5788a" stroke-opacity=".3"/><path d="M-5,0Q0,-9 5,0Z" fill="#8b5a4c"/></g>`;

function leaf(x, y, len, rot, fill = 'lf') {
  const w = len * 0.34;
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})"><path d="M0,0C${n(w)},${n(-len * .25)} ${n(w * .9)},${n(-len * .75)} 0,${n(-len)}C${n(-w * .9)},${n(-len * .75)} ${n(-w)},${n(-len * .25)} 0,0Z" fill="url(#${fill})"/><path d="M0,0L0,${n(-len * .92)}" stroke="#ffd9cf" stroke-opacity=".3" stroke-width="1"/></g>`;
}

const blossom = (r, x, y, s = 1) => {
  let g = `<g transform="translate(${n(x)} ${n(y)}) scale(${s})">`;
  for (let i = 0; i < 5; i++) {
    const a = i * 72 + r() * 10;
    g += `<circle cx="${n(Math.sin(rad(a)) * 3.6)}" cy="${n(-Math.cos(rad(a)) * 3.6)}" r="3.4" fill="#f4c6cd"/>`;
  }
  return g + `<circle r="1.8" fill="#d98189"/></g>`;
};

// heading: 0 = up, 90 = right, 180 = down, 270 = left
function branch(r, x, y, heading, length, bend, { leafy = 1, tip = 'blossom', width = 2.2 } = {}) {
  const N = 26, step = length / N;
  let px = x, py = y, h = heading, d = `M${n(x)},${n(y)}`, side = 1, extra = '', under = '';
  for (let i = 1; i <= N; i++) {
    h += bend / N + (r() - 0.5) * 2.5;
    px += Math.sin(rad(h)) * step; py -= Math.cos(rad(h)) * step;
    d += `L${n(px)},${n(py)}`;
    if (i % 3 === 0 && i < N) {
      const size = (26 + r() * 14) * (1 - i / N * 0.55) * leafy;
      under += leaf(px, py, size, h + side * (48 + r() * 24), r() > 0.35 ? 'lf' : 'lf2');
      side = -side;
      if (i % 6 === 0) extra += blossom(r, px + Math.sin(rad(h + 90 * side)) * 7, py - Math.cos(rad(h + 90 * side)) * 7, 0.9 + r() * 0.4);
    }
  }
  let end = '';
  if (tip === 'blossom') end = blossom(r, px, py, 1.5);
  else if (tip === 'bud') end = bud(px, py, 0.42, h);
  return `${under}<path d="${d}" fill="none" stroke="#8a5a4c" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>${extra}${end}`;
}

function cluster(r, x, y, s, rot) {
  let g = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})">`;
  for (let i = 0; i < 9; i++) g += leaf(0, 0, 70 + r() * 40, -110 + i * 28 + r() * 14, i % 3 ? 'lf' : 'lf2');
  g += branch(r, 20, 20, 130, 150, -18, { tip: 'blossom' });
  g += branch(r, -20, 10, 235, 130, 14, { tip: 'bud' });
  g += bud(-58, -20, 0.8, -50) + bud(64, -32, 0.7, 42);
  g += magnolia(r, 0, 0, 1.12, r() * 20 - 10);
  g += magnolia(r, 78, 58, 0.78, 25 + r() * 20);
  g += magnolia(r, -70, 66, 0.6, -35 + r() * 20);
  return g + '</g>';
}

/* ---------- file helpers ---------- */
const XMLNS = 'xmlns="http://www.w3.org/2000/svg"';
const write = (name, s) => { fs.writeFileSync(path.join(OUT, name), s); console.log('wrote', name.padEnd(28), (s.length / 1024).toFixed(0).padStart(4) + ' kb'); };
const svg = (w, h, body, extra = '') =>
  `<svg ${XMLNS} viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"${extra}><defs>${PAINT}</defs>${body}</svg>\n`;
// A cropped layer of a larger canvas: same coordinates, tight viewBox.
const layerSvg = (b, body, defs) =>
  `<svg ${XMLNS} viewBox="${b.x} ${b.y} ${b.w} ${b.h}" width="${b.w}" height="${b.h}"><defs>${defs}</defs>${body}</svg>\n`;

/* ---------- corner clusters for paper sections ---------- */
function corner(seed, flip) {
  const r = mulberry(seed);
  let b = cluster(r, 330, 86, 1.05, 12);
  b += branch(r, 396, 210, 178, 330, -12, { tip: 'blossom' });
  b += branch(r, 300, 26, 262, 230, 10, { tip: 'bud' });
  b += bud(384, 300, 0.7, 170);
  return svg(420, 600, flip ? `<g transform="rotate(180 210 300)">${b}</g>` : b);
}
write('corner-tr.svg', corner(11, false));
write('corner-bl.svg', corner(29, true));

/* ---------- drifting sprig ---------- */
{
  const r = mulberry(7);
  let b = branch(r, 110, 470, 6, 360, 22, { tip: 'bud', width: 2.6 });
  b += branch(r, 120, 400, 60, 150, -26, { tip: 'blossom' });
  b += branch(r, 116, 300, 300, 120, 22, { tip: 'blossom' });
  b += magnolia(r, 196, 120, 0.62, 18) + magnolia(r, 96, 214, 0.44, -22);
  write('sprig.svg', svg(320, 480, b));
}

/* ---------- timeline marker & favicon ---------- */
write('flower.svg', svg(72, 72, magnolia(mulberry(3), 36, 42, 0.5, 8)));
write('favicon.svg', svg(64, 64, `<circle cx="32" cy="32" r="32" fill="#682e49"/>` + magnolia(mulberry(5), 32, 38, 0.36, 0)));

/* ---------- wax seal ---------- */
{
  let d = '';
  for (let i = 0; i <= 90; i++) {
    const a = i / 90 * Math.PI * 2;
    const rr = 88 + 4.5 * Math.sin(5 * a + 0.6) + 3 * Math.sin(9 * a + 1.3) + 1.6 * Math.sin(13 * a);
    d += `${i ? 'L' : 'M'}${n(110 + Math.cos(a) * rr)},${n(110 + Math.sin(a) * rr)}`;
  }
  const s = `<linearGradient id="wax" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3e1d2"/><stop offset=".55" stop-color="#e2c1aa"/><stop offset="1" stop-color="#c99b83"/></linearGradient>
<filter id="sh" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="6" stdDeviation="7" flood-color="#1e0a16" flood-opacity=".55"/></filter>`;
  const body = `<g filter="url(#sh)"><path d="${d}Z" fill="url(#wax)"/></g>
<circle cx="110" cy="110" r="66" fill="none" stroke="#b98a72" stroke-opacity=".55" stroke-width="2"/>
<circle cx="110" cy="110" r="63" fill="none" stroke="#fff4ea" stroke-opacity=".6" stroke-width="1.2"/>
<g transform="translate(110 132)"><g fill="#d3ad97" stroke="#a97b64" stroke-width="1.4" stroke-linejoin="round">
<path d="M0,-8C-24,-6 -38,-22 -44,-34C-24,-40 -6,-30 0,-8Z"/><path d="M0,-8C24,-6 38,-22 44,-34C24,-40 6,-30 0,-8Z"/>
<path d="M0,0C-18,-8 -22,-46 0,-78C22,-46 18,-8 0,0Z" fill="#ecd3c2"/></g>
<path d="M0,-2C-7,-24 -5,-52 0,-74" fill="none" stroke="#a97b64" stroke-width="1.3"/><path d="M0,0V26" stroke="#a97b64" stroke-width="2.5" stroke-linecap="round"/></g>`;
  write('seal.svg', `<svg ${XMLNS} viewBox="0 0 220 220" width="220" height="220"><defs>${s}</defs>${body}</svg>\n`);
}

/* ======================================================================
   Embossed envelope: a base (side + bottom flaps), a separate top flap that
   can swing open, and the vine / petal paths the opening animation lights up.
   ====================================================================== */
{
  const r = mulberry(21);
  const rose = '#d29a86';
  const CX = 360, CY = 640;               // where the four flaps meet (the seal)
  const veins = [], outlines = [];

  // tiny affine-matrix toolkit so emboss outlines can be exported as polylines
  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  const T = (x, y) => [1, 0, 0, 1, x, y];
  const R = d => { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return [c, s, -s, c, 0, 0]; };
  const S = k => [k, 0, 0, k, 0, 0];
  const ap = (m, p) => [m[0] * p[0] + m[2] * p[1] + m[4], m[1] * p[0] + m[3] * p[1] + m[5]];
  const cubic = (p0, p1, p2, p3, k) => Array.from({ length: k }, (_, i) => {
    const t = i / k, u = 1 - t;
    return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]];
  });
  const inFlap = p => p[1] < CY && Math.abs(p[0] - CX) < 360 * (CY - p[1]) / CY;
  const record = (pts, closed) => {
    const c = pts.reduce((a, p) => [a[0] + p[0] / pts.length, a[1] + p[1] / pts.length], [0, 0]);
    outlines.push({ pts: closed ? [...pts, pts[0]] : pts, flap: inFlap(c) });
  };
  const PETAL = [[[0, 0], [-24, -4], [-38, -34], [-27, -58]], [[-27, -58], [-19, -75], [-7, -82], [0, -82]], [[0, -82], [7, -82], [19, -75], [27, -58]], [[27, -58], [38, -34], [24, -4], [0, 0]]];
  const BUD = [[[0, 0], [-17, -10], [-19, -44], [0, -68]], [[0, -68], [19, -44], [17, -10], [0, 0]]];
  const leafSegs = len => { const w = len * 0.33; return [[[0, 0], [w, -len * .25], [w * .9, -len * .75], [0, -len]], [[0, -len], [-w * .9, -len * .75], [-w, -len * .25], [0, 0]]]; };
  const trace = (segs, m, k) => segs.flatMap(s => cubic(s[0], s[1], s[2], s[3], k)).map(p => ap(m, p));

  const epetal = (a, sc) =>
    `<g transform="rotate(${n(a)}) scale(${n(sc)})"><path d="M2,3C-22,-1 -36,-31 -25,-55C-17,-72 -5,-79 2,-79C9,-79 21,-72 29,-55C40,-31 26,-1 2,3Z" fill="#33101f" opacity=".55"/><path d="M0,0C-24,-4 -38,-34 -27,-58C-19,-75 -7,-82 0,-82C7,-82 19,-75 27,-58C38,-34 24,-4 0,0Z" fill="#7a3557" stroke="${rose}" stroke-width="1.6" stroke-opacity=".85"/><path d="M0,-6C-6,-26 -4,-54 0,-76M-8,-20C-14,-34 -12,-50 -6,-62M8,-20C14,-34 12,-50 6,-62" fill="none" stroke="${rose}" stroke-opacity=".5" stroke-width="1"/></g>`;
  const eflower = (x, y, s, rot) => {
    const F = mul(mul(T(x, y), R(rot)), S(s));
    let g = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(${n(s)})">`;
    for (let i = 0; i < 6; i++) {
      const a = i * 60 + r() * 14 - 7, sc = 0.92 + r() * 0.14;
      g += epetal(a, sc);
      record(trace(PETAL, mul(F, mul(R(a), S(sc))), 4), true);
    }
    for (let i = 0; i < 5; i++) g += epetal(24 + i * 72 + r() * 10, 0.66);
    g += `<circle r="9" fill="#5a2140" stroke="${rose}" stroke-width="1.4"/>`;
    for (let i = 0; i < 14; i++) { const a = i * 25.7; g += `<circle cx="${n(Math.sin(rad(a)) * 6)}" cy="${n(-Math.cos(rad(a)) * 6)}" r="1.4" fill="${rose}"/>`; }
    return g + '</g>';
  };
  const eleaf = (x, y, len, rot) => {
    const w = len * 0.33;
    record(trace(leafSegs(len), mul(T(x, y), R(rot)), 5), true);
    return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})"><path d="M2,3C${n(w)},${n(-len * .25)} ${n(w)},${n(-len * .75)} 2,${n(-len)}C${n(-w)},${n(-len * .75)} ${n(-w)},${n(-len * .25)} 2,3Z" fill="#33101f" opacity=".5"/><path d="M0,0C${n(w)},${n(-len * .25)} ${n(w * .9)},${n(-len * .75)} 0,${n(-len)}C${n(-w * .9)},${n(-len * .75)} ${n(-w)},${n(-len * .25)} 0,0Z" fill="#6b2a49" stroke="${rose}" stroke-width="1.4" stroke-opacity=".8"/><path d="M0,0L0,${n(-len * .9)}" stroke="${rose}" stroke-opacity=".6"/></g>`;
  };
  const ebranch = (x, y, heading, length, bend) => {
    const N = 22, step = length / N; let px = x, py = y, h = heading, d = `M${x},${y}`, side = 1, l = ''; const stem = [[x, y]];
    for (let i = 1; i <= N; i++) {
      h += bend / N; px += Math.sin(rad(h)) * step; py -= Math.cos(rad(h)) * step; d += `L${n(px)},${n(py)}`; stem.push([px, py]);
      if (i % 3 === 0) { l += eleaf(px, py, 34 + r() * 22, h + side * (50 + r() * 20)); side = -side; }
    }
    record(stem, false);
    return `<path d="${d}" fill="none" stroke="${rose}" stroke-width="2.4" stroke-opacity=".85" stroke-linecap="round"/>${l}`;
  };
  const ebud = (x, y, s, rot) => {
    record(trace(BUD, mul(T(x, y), mul(R(rot), S(s))), 5), true);
    return `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M2,3C-15,-8 -17,-42 2,-66C21,-42 19,-8 2,3Z" fill="#33101f" opacity=".5"/><path d="M0,0C-17,-10 -19,-44 0,-68C19,-44 17,-10 0,0Z" fill="#7a3557" stroke="${rose}" stroke-width="1.6"/><path d="M0,-2C-7,-22 -5,-46 0,-66" fill="none" stroke="${rose}" stroke-opacity=".6"/></g>`;
  };
  // A vine growing out of the seal: a thick embossed stem with leaves. The
  // opening animation sends a ray of golden light racing along these.
  const evine = (ang, length, bend) => {
    const N = 44, step = length / N, R0 = 100;
    let px = CX + Math.sin(rad(ang)) * R0, py = CY - Math.cos(rad(ang)) * R0, h = ang, side = 1, leaves = '';
    const pts = [[px, py]];
    for (let i = 1; i <= N; i++) {
      h += bend / N + (r() - 0.5) * 2;
      px += Math.sin(rad(h)) * step; py -= Math.cos(rad(h)) * step; pts.push([px, py]);
      if (i % 4 === 0 && i < N - 2) { leaves += eleaf(px, py, 30 + r() * 16, h + side * (52 + r() * 16)); side = -side; }
    }
    veins.push(pts);
    const d = 'M' + pts.map(p => `${n(p[0])},${n(p[1])}`).join('L');
    return `<path d="${d}" transform="translate(2 3)" fill="none" stroke="#33101f" stroke-opacity=".5" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${rose}" stroke-width="3.2" stroke-opacity=".9" stroke-linecap="round" stroke-linejoin="round"/>${leaves}`;
  };

  const tri = (pts, fill, extra = '') => `<path d="M${pts.join('L')}Z" fill="${fill}"${extra}/>`;
  let base = '', flap = '', left = '', right = '', bottom = '';
  // side flaps sit beneath, then the bottom flap, and the top flap (separate layer) closes over all
  base += `<path d="M0,0L720,0L${CX},${CY}Z" fill="url(#panel)"/>`;     // dark inner back-panel, revealed as the flap lifts
  left += ebranch(30, 470, 12, 260, -18) + ebud(70, 330, 0.8, -14) + eflower(60, 830, 1.25, -30) + ebranch(40, 1010, 4, 210, 14);
  right += ebranch(690, 440, -8, 240, 16) + eflower(650, 560, 1.15, 20) + ebud(676, 960, 0.85, 16) + ebranch(680, 1150, -8, 210, -12);
  bottom += `<path d="M0,1280L${CX},${CY}L720,1280Z" fill="#6f2d4b" filter="url(#fs)"/>`;
  bottom += eflower(CX, 1030, 1.5, -6) + eflower(190, 1180, 0.95, 40) + eflower(560, 1170, 1.0, -30) + ebranch(150, 1010, 300, 180, 12) + ebranch(575, 1000, 60, 170, -14);
  bottom += ebud(300, 900, 0.9, -10) + ebud(430, 900, 0.9, 12);
  // vines radiating from the seal across the side and bottom flaps
  right += evine(36, 640, -14) + evine(74, 470, 12) + evine(120, 480, -10);
  bottom += evine(160, 700, 10) + evine(202, 700, -10);
  left += evine(246, 480, 10) + evine(290, 470, -12) + evine(324, 650, 14);
  const edge = `fill="none" stroke="${rose}" stroke-width="2.2" stroke-opacity=".7" stroke-linejoin="round"`;
  bottom += `<path d="M0,1280L${CX},${CY}L720,1280" ${edge}/>`;

  // the top flap, its own layer so it can tilt open around its upper edge
  flap += `<path d="M0,0L720,0L${CX},${CY}Z" fill="#743151" filter="url(#fs)"/>`;
  flap += eflower(CX, 210, 1.6, 4) + eflower(140, 90, 0.95, -25) + eflower(600, 110, 1.05, 30) + ebranch(120, 300, 20, 170, 14) + ebranch(600, 320, -16, 170, -14);
  flap += ebud(250, 380, 0.9, 20) + ebud(470, 380, 0.9, -18);
  flap += evine(1, 470, 6);
  flap += `<path d="M0,0L${CX},${CY}L720,0" ${edge}/>`;

  const defs = `<radialGradient id="bg" cx=".5" cy=".5" r=".75"><stop offset="0" stop-color="#7c3559"/><stop offset="1" stop-color="#4a1a33"/></radialGradient>
<linearGradient id="panel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34101f"/><stop offset="1" stop-color="#4b1a32"/></linearGradient>
<clipPath id="tri"><path d="M0,0L720,0L${CX},${CY}Z"/></clipPath>
<clipPath id="tri-l"><path d="M0,0L0,1280L${CX},${CY}Z"/></clipPath>
<clipPath id="tri-r"><path d="M720,0L720,1280L${CX},${CY}Z"/></clipPath>
<clipPath id="tri-b"><path d="M0,1280L720,1280L${CX},${CY}Z"/></clipPath>
<filter id="fs" x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="0" stdDeviation="9" flood-color="#1e0a16" flood-opacity=".55"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="t"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 .85  0 0 0 0 .8  0 0 0 .16 0"/></filter>`;
  const grain = clip => `<rect width="720" height="1280" filter="url(#grain)" opacity=".7"${clip ? ` clip-path="url(#${clip})"` : ''}/>`;
  const bg = `<rect width="720" height="1280" fill="url(#bg)"/>`;
  // each of the four flaps is its own layer (clipped to its triangle) so it can swing open on its outer edge
  const leftL = tri([[0, 0], [0, 1280], [CX, CY]], '#622641') + `<g clip-path="url(#tri-l)">${left}</g>`;
  const rightL = tri([[720, 0], [720, 1280], [CX, CY]], '#5c2239') + `<g clip-path="url(#tri-r)">${right}</g>`;
  const bottomL = bottom.replace(/^(<path[^>]*\/>)/, '$1<g clip-path="url(#tri-b)">') + '</g>';
  const wrap = body => `<svg ${XMLNS} viewBox="0 0 720 1280" width="720" height="1280"><defs>${defs}</defs>${body}</svg>\n`;
  write('envelope-base.svg', wrap(bg + base + grain(false)));
  write('envelope-left.svg', wrap(leftL + grain('tri-l')));
  write('envelope-right.svg', wrap(rightL + grain('tri-r')));
  write('envelope-bottom.svg', wrap(bottomL + grain('tri-b')));
  write('envelope-flap.svg', `<svg ${XMLNS} viewBox="0 0 720 720" width="720" height="720"><defs>${defs}</defs>${flap}${grain('tri')}</svg>\n`);
  write('envelope.svg', `<svg ${XMLNS} viewBox="0 0 720 1280" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${bg}${leftL}${rightL}${bottomL}${base}${flap}${grain(false)}</svg>\n`);

  // paths the opening animation traces with golden light
  const flat = pts => pts.flatMap(p => [n(p[0]), n(p[1])]);
  const fx = {
    w: 720, h: 1280, seal: [CX, CY], sealR: 96,
    veins: veins.map(v => ({ p: flat(v) })),
    outlines: outlines.map(o => ({ p: flat(o.pts), flap: o.flap ? 1 : 0 }))
  };
  const js = `/* Generated by tools/build-art.js. Vine and petal paths (in envelope art units) that the opening animation lights up. */\nwindow.ENVELOPE_FX = ${JSON.stringify(fx)};\n`;
  fs.mkdirSync(path.join(ROOT, 'js'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'js', 'envelope-fx.js'), js);
  console.log('wrote', 'js/envelope-fx.js'.padEnd(28), (js.length / 1024).toFixed(0).padStart(4) + ' kb', `(${veins.length} vines, ${outlines.length} outlines)`);
}

/* ======================================================================
   Lakeside arch hero, built as separate layers so the sheer curtains, the
   sun, the clouds and the flowers can each move on their own. The same
   parts are also merged into a single still (hero.svg) for the venue and
   closing scenes and for reduced-motion visitors.
   ====================================================================== */
{
  const W = 720, H = 1280, HZ = 790;
  const OPENING = 'M112,980V372C112,236 252,156 326,66Q360,22 394,66C468,156 608,236 608,372V980Z';
  const DEFS = PAINT + `
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbeee8"/><stop offset=".45" stop-color="#fbe4dc"/><stop offset="1" stop-color="#f6c9c3"/></linearGradient>
<radialGradient id="sun" cx="222" cy="748" r="230" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6e6" stop-opacity=".95"/><stop offset=".25" stop-color="#ffe0c8" stop-opacity=".55"/><stop offset="1" stop-color="#f8c9c0" stop-opacity="0"/></radialGradient>
<linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dcd6"/><stop offset="1" stop-color="#ebc3c2"/></linearGradient>
<linearGradient id="stone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f2e2d9"/><stop offset=".5" stop-color="#e8d0c4"/><stop offset="1" stop-color="#dcc0b3"/></linearGradient>
<linearGradient id="col" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f5e8df"/><stop offset=".35" stop-color="#ead5c9"/><stop offset="1" stop-color="#d4b6a8"/></linearGradient>
<linearGradient id="cur" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f1bfc4" stop-opacity=".7"/><stop offset=".55" stop-color="#f6cfcf" stop-opacity=".48"/><stop offset="1" stop-color="#fbe2de" stop-opacity=".26"/></linearGradient>
<linearGradient id="cur2" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f8d6d6" stop-opacity=".5"/><stop offset=".6" stop-color="#fbe6e2" stop-opacity=".4"/><stop offset="1" stop-color="#fff2ee" stop-opacity=".3"/></linearGradient>
<linearGradient id="step" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6e6dc"/><stop offset="1" stop-color="#e2c6bb"/></linearGradient>
<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff2ec" stop-opacity=".8"/></linearGradient>
<filter id="soft"><feGaussianBlur stdDeviation="6"/></filter><filter id="soft2"><feGaussianBlur stdDeviation="2"/></filter>`;

  /* ---- parts ---- */
  const partSky = () => `<rect width="${W}" height="${H}" fill="url(#sky)"/>`;
  const partSun = () => `<circle cx="222" cy="748" r="230" fill="url(#sun)"/><circle cx="222" cy="752" r="15" fill="#fff8ec"/>`;
  const partClouds = () => `<g filter="url(#soft)" fill="#fff4ee" opacity=".7"><ellipse cx="170" cy="690" rx="130" ry="10"/><ellipse cx="520" cy="640" rx="110" ry="8"/><ellipse cx="340" cy="580" rx="90" ry="6"/></g>`;

  function partLand() {
    const r = mulberry(99);
    let b = `<g filter="url(#soft2)"><path d="M300,${HZ}L380,742L450,752L540,690L610,700L720,650V${HZ}Z" fill="#e7c2c4"/><path d="M420,${HZ}L520,730L600,745L720,716V${HZ}Z" fill="#d9b1b8" opacity=".9"/><path d="M0,${HZ}L60,762L120,752L190,770L260,${HZ}Z" fill="#dcb8bc"/></g>`;
    b += `<g fill="#b98d96" opacity=".85"><rect x="96" y="750" width="16" height="30"/><rect x="118" y="758" width="22" height="22"/><rect x="146" y="746" width="14" height="34"/><path d="M168,780L172,730L176,780Z"/><path d="M182,780L187,738L192,780Z"/><path d="M200,780L204,752L208,780Z"/><path d="M60,${HZ}Q140,764 250,${HZ}Z"/></g>`;
    b += `<rect y="${HZ - 26}" width="${W}" height="60" fill="#fdeee8" opacity=".55" filter="url(#soft)"/>`;
    b += `<rect y="${HZ}" width="${W}" height="190" fill="url(#lake)"/>`;
    for (let i = 0; i < 14; i++) b += `<ellipse cx="${n(222 + (r() - .5) * (14 + i * 4))}" cy="${HZ + 6 + i * 11}" rx="${n(6 + i * 3.2 + r() * 8)}" ry="1.6" fill="#fff3e6" opacity="${n(.75 - i * .04)}"/>`;
    for (let i = 0; i < 22; i++) b += `<rect x="${n(r() * W)}" y="${HZ + 8 + r() * 170}" width="${n(40 + r() * 110)}" height="1.2" fill="#fff" opacity=".22"/>`;
    const cypress = (x, base, h, w, col) => `<path d="M${x},${base}C${x - w},${base - h * .3} ${x - w * .8},${base - h * .8} ${x},${base - h}C${x + w * .8},${base - h * .8} ${x + w},${base - h * .3} ${x},${base}Z" fill="${col}"/>`;
    b += cypress(470, 940, 120, 13, '#8a8f86') + cypress(500, 940, 92, 11, '#8f9389') + cypress(566, 930, 235, 19, '#7d8479') + cypress(612, 930, 200, 17, '#858b80') + cypress(650, 930, 250, 20, '#788075') + cypress(690, 930, 110, 14, '#8b9086');
    b += `<path d="M330,962C400,912 480,902 720,888V962Z" fill="#d4b3ad"/><path d="M0,962V932C90,914 220,926 340,962Z" fill="#e0c1bb"/>`;
    b += `<g fill="#e8b4bb" opacity=".8">${Array.from({ length: 34 }, () => `<circle cx="${n(380 + r() * 340)}" cy="${n(884 + r() * 40)}" r="${n(6 + r() * 12)}"/>`).join('')}</g>`;
    b += `<g fill="#d99faa" opacity=".6">${Array.from({ length: 22 }, () => `<circle cx="${n(20 + r() * 300)}" cy="${n(918 + r() * 28)}" r="${n(5 + r() * 10)}"/>`).join('')}</g>`;
    b += `<rect x="530" y="836" width="52" height="60" fill="#ecd3ca"/><path d="M524,838L556,814L588,838Z" fill="#c69a90"/><rect x="546" y="856" width="8" height="16" fill="#b58a86"/>`;
    b += `<rect x="440" y="930" width="280" height="14" fill="#ecd6cc"/><rect x="440" y="900" width="280" height="10" rx="3" fill="#f2e1d8"/>`;
    for (let x = 452; x < 720; x += 24) b += `<path d="M${x},910C${x - 7},918 ${x - 7},924 ${x - 3},930H${x + 9}C${x + 13},924 ${x + 13},918 ${x + 6},910Z" fill="#e6cdc2"/>`;
    b += `<path d="M508,900h56v-14q0-8 -8-10h-40q-8 2 -8 10Z" fill="#dfc4b8"/><ellipse cx="536" cy="866" rx="34" ry="16" fill="#f0c1c8"/>` + Array.from({ length: 12 }, () => `<circle cx="${n(510 + r() * 52)}" cy="${n(852 + r() * 22)}" r="${n(5 + r() * 6)}" fill="#f8dcdf"/>`).join('');
    b += `<rect y="${HZ - 60}" width="${W}" height="200" fill="url(#fade)" opacity=".18"/>`;
    return b;
  }

  function partFrame() {
    const r = mulberry(55);
    let b = `<path fill-rule="evenodd" fill="url(#stone)" d="M0,0H${W}V1000H0Z${OPENING}"/>`;
    b += `<path d="M112,980V372C112,236 252,156 326,66Q360,22 394,66C468,156 608,236 608,372V980" fill="none" stroke="#f6e6dc" stroke-width="9" stroke-opacity=".85"/><path d="M104,980V372C104,232 246,150 320,58Q360,10 400,58C474,150 616,232 616,372V980" fill="none" stroke="#bb9a8c" stroke-width="2" stroke-opacity=".6"/>`;
    b += `<path d="M126,372C126,244 262,170 336,82Q360,50 384,82C458,170 594,244 594,372" fill="none" stroke="#d3b3a5" stroke-width="2" stroke-opacity=".7" stroke-dasharray="1 9" stroke-linecap="round"/>`;
    for (let i = 0; i < 9; i++) { const t = i / 8; const x = 128 + t * 464; const y = 350 - Math.sin(t * Math.PI) * 240; b += `<circle cx="${n(x)}" cy="${n(y + 26)}" r="9" fill="none" stroke="#f3e2d8" stroke-width="2.4" stroke-opacity=".7"/>`; }
    const column = mirror => `<g ${mirror ? `transform="translate(${W} 0) scale(-1 1)"` : ''}>
<rect x="10" y="500" width="84" height="470" fill="url(#col)" rx="4"/>
${[24, 40, 58, 76].map(x => `<rect x="${x}" y="512" width="2.2" height="446" fill="#a98576" opacity=".22"/>`).join('')}
<rect x="0" y="436" width="104" height="18" rx="4" fill="#efdcd2"/><rect x="4" y="454" width="96" height="22" fill="#e2c9bd"/>
<path d="M8,476Q0,494 16,504H88Q104,494 96,476Z" fill="#e8d1c6"/>
<circle cx="24" cy="470" r="10" fill="none" stroke="#c4a394" stroke-width="3"/><circle cx="80" cy="470" r="10" fill="none" stroke="#c4a394" stroke-width="3"/>
<path d="M36,464q16,-14 32,0q-16,18 -32,0Z" fill="#dcc0b3"/>
<rect x="2" y="944" width="100" height="18" rx="3" fill="#efdcd2"/><rect x="-4" y="960" width="112" height="24" rx="3" fill="#e6cec3"/></g>`;
    b += column(false) + column(true);
    [[960, 48], [1008, 50], [1058, 52], [1110, 56]].forEach(([y, hh], i) => {
      b += `<rect y="${y}" width="${W}" height="${hh}" fill="url(#step)"/><rect y="${y}" width="${W}" height="3.4" fill="#fff8f1" opacity=".9"/><rect y="${y + hh - 8}" width="${W}" height="8" fill="#c9a89c" opacity="${n(.16 + i * .04)}"/>`;
    });
    b += `<rect y="1166" width="${W}" height="${H - 1166}" fill="#f1ddd3"/><rect y="1166" width="${W}" height="120" fill="url(#fade)" opacity=".35"/>`;
    b += `<g fill="none" stroke="#d3b4a8" stroke-opacity=".4" stroke-width="1.4"><path d="M40,1200C160,1180 260,1236 420,1210S640,1226 720,1214"/><path d="M0,1246C120,1232 240,1264 380,1250"/></g>`;
    for (let i = 0; i < 9; i++) b += `<ellipse cx="${n(60 + r() * 600)}" cy="${n(1180 + r() * 80)}" rx="${n(7 + r() * 6)}" ry="${n(3 + r() * 3)}" transform="rotate(${n(r() * 180)} 300 1200)" fill="#f8d9de" opacity=".9"/>`;
    return b;
  }

  /* ---- sheer curtains, tied back at the pillar (left side; right is mirrored) ---- */
  const KNOT = [119, 696];                                  // tie-back the lower half swings from
  const CUR = {
    upper: 'M100,196C176,244 232,352 226,470C222,560 178,628 134,684L110,704L100,704Z',
    upperFolds: ['M114,214C158,292 184,410 166,540C160,596 140,650 122,694', 'M132,226C190,312 212,424 198,530C190,596 156,652 128,696', 'M150,240C212,334 224,440 214,516'],
    lowerA: 'M100,690L146,692C154,764 198,822 228,880C240,906 250,932 258,958C232,968 208,952 184,962C160,972 134,956 108,966L100,966Z',
    lowerAFolds: ['M116,694C122,780 150,880 150,962', 'M132,694C146,770 184,856 196,958', 'M144,696C164,764 210,838 238,950'],
    lowerB: 'M100,690L150,694C164,770 218,832 254,892C270,920 282,940 294,962C262,974 232,954 204,966C176,978 142,958 108,968L100,968Z',
    lowerBFolds: ['M124,696C138,776 176,868 186,964', 'M140,698C160,772 214,850 254,958']
  };
  const folds = (list, op = 0.36) => list.map(d => `<path d="${d}" fill="none" stroke="#fff" stroke-opacity="${op}" stroke-width="2.2" stroke-linecap="round"/>`).join('');
  const curtainUp = () => `<path d="${CUR.upper}" fill="url(#cur)"/><path d="${CUR.upper}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.6"/>${folds(CUR.upperFolds)}<path d="M100,690C112,702 130,702 146,692" fill="none" stroke="#d9a9a2" stroke-width="5" stroke-linecap="round"/><ellipse cx="${KNOT[0]}" cy="${KNOT[1]}" rx="10" ry="8" fill="#e4bcb2"/><path d="M${KNOT[0]},704v24" stroke="#d9a9a2" stroke-width="3" stroke-linecap="round"/><ellipse cx="${KNOT[0]}" cy="731" rx="4" ry="6" fill="#e4bcb2"/>`;
  const curtainLowA = () => `<path d="${CUR.lowerA}" fill="url(#cur)"/><path d="${CUR.lowerA}" fill="none" stroke="#fff" stroke-opacity=".34" stroke-width="1.6"/>${folds(CUR.lowerAFolds)}`;
  const curtainLowB = () => `<path d="${CUR.lowerB}" fill="url(#cur2)"/><path d="${CUR.lowerB}" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.4"/>${folds(CUR.lowerBFolds, 0.3)}`;
  const mirror = body => `<g transform="translate(${W} 0) scale(-1 1)">${body}</g>`;
  const mirrorBox = b => ({ x: W - (b.x + b.w), y: b.y, w: b.w, h: b.h });

  /* ---- flower clusters that frame the scene ---- */
  const flowersTL = () => { const r = mulberry(101); return cluster(r, 74, 72, 1.25, 8) + branch(r, 150, 130, 118, 240, -30, { tip: 'bud' }) + branch(r, 250, 210, 150, 120, -20, { tip: 'blossom' }); };
  const flowersTR = () => { const r = mulberry(102); return cluster(r, 660, 96, 1.1, -14) + branch(r, 610, 150, 246, 110, 20, { tip: 'bud' }) + branch(r, 668, 210, 186, 230, -12, { tip: 'blossom' }); };
  const flowersBL = () => { const r = mulberry(103); return cluster(r, 70, 1110, 1.35, 176) + branch(r, 40, 1040, 6, 240, 16, { tip: 'blossom' }) + branch(r, 112, 1100, 70, 190, -14, { tip: 'bud' }); };
  const flowersBR = () => { const r = mulberry(104); return cluster(r, 646, 1150, 1.25, 190) + branch(r, 690, 1080, -4, 210, -14, { tip: 'blossom' }) + branch(r, 610, 1130, 292, 150, 14, { tip: 'bud' }); };

  /* ---- layer table: file/class name, crop box, optional pivot (in art units) ---- */
  const B = {
    sun: { x: 0, y: 518, w: 460, h: 460 },
    clouds: { x: 0, y: 540, w: 720, h: 180 },
    land: { x: 0, y: 640, w: 720, h: 360 },
    up: { x: 86, y: 180, w: 190, h: 560 },
    lowA: { x: 86, y: 680, w: 190, h: 300 },
    lowB: { x: 86, y: 680, w: 230, h: 300 },
    frame: { x: 0, y: 0, w: W, h: H },
    tl: { x: 0, y: 0, w: 460, h: 460 }, tr: { x: 300, y: 0, w: 420, h: 460 },
    bl: { x: 0, y: 780, w: 420, h: 500 }, br: { x: 300, y: 780, w: 420, h: 500 }
  };
  const LAYERS = [
    { cls: 'sun', b: B.sun, body: partSun(), pivot: [222, 752] },
    { cls: 'clouds', b: B.clouds, body: partClouds() },
    { cls: 'land', b: B.land, body: partLand() },
    { cls: 'curtain-l-low-b', b: B.lowB, body: curtainLowB(), pivot: KNOT },
    { cls: 'curtain-r-low-b', b: mirrorBox(B.lowB), body: mirror(curtainLowB()), pivot: [W - KNOT[0], KNOT[1]] },
    { cls: 'curtain-l-low-a', b: B.lowA, body: curtainLowA(), pivot: KNOT },
    { cls: 'curtain-r-low-a', b: mirrorBox(B.lowA), body: mirror(curtainLowA()), pivot: [W - KNOT[0], KNOT[1]] },
    { cls: 'curtain-l-up', b: B.up, body: curtainUp(), pivot: [100, 200] },
    { cls: 'curtain-r-up', b: mirrorBox(B.up), body: mirror(curtainUp()), pivot: [W - 100, 200] },
    { cls: 'frame', b: B.frame, body: partFrame() },
    { cls: 'flowers-tl', b: B.tl, body: flowersTL(), pivot: [40, 30] },
    { cls: 'flowers-tr', b: B.tr, body: flowersTR(), pivot: [690, 30] },
    { cls: 'flowers-bl', b: B.bl, body: flowersBL(), pivot: [40, 1250] },
    { cls: 'flowers-br', b: B.br, body: flowersBR(), pivot: [690, 1250] }
  ];
  LAYERS.forEach(l => write(`hero-${l.cls}.svg`, layerSvg(l.b, l.body, DEFS)));

  // still image: the very same parts in their resting pose
  const still = partSky() + LAYERS.map(l => l.body).join('');
  write('hero.svg', `<svg ${XMLNS} viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice"><defs>${DEFS}</defs>${still}</svg>\n`);

  // where each layer sits on the 720×1280 stage, as percentages
  const pct = v => +v.toFixed(4);
  let css = '/* Generated by tools/build-art.js. Hero layer geometry, in percent of the 720×1280 stage. */\n';
  LAYERS.forEach(({ cls, b, pivot }) => {
    css += `.hl-${cls}{left:${pct(b.x / W * 100)}%;top:${pct(b.y / H * 100)}%;width:${pct(b.w / W * 100)}%;height:${pct(b.h / H * 100)}%`;
    if (pivot) css += `;transform-origin:${pct((pivot[0] - b.x) / b.w * 100)}% ${pct((pivot[1] - b.y) / b.h * 100)}%`;
    css += '}\n';
  });
  fs.writeFileSync(path.join(ROOT, 'css', 'hero-layers.css'), css);
  console.log('wrote', 'css/hero-layers.css'.padEnd(28), `(${LAYERS.length} layers)`);
}
