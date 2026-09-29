/* The envelope opening, scripted as one timeline (about five seconds):
     0.8s  the wax seal warms from within
     1.2s  it bursts into a starburst of light
     1.4s  golden light races outward along the embossed vines, lighting the petals
     2.6s  all four flaps (top, sides, bottom) swing open
     3.2s  a warm bloom of light fills the screen; the hero is revealed behind it
     3.8s  the envelope sinks away and the haze clears
   Every frame is a pure function of the clock, so the sequence can be scrubbed
   (seek) and replayed (reset + play). Uses the path data in envelope-fx.js. */
window.createOpening = function ({ entrance, stage, canvas, onReveal, onDone }) {
  const FX = window.ENVELOPE_FX;
  const ctx = canvas.getContext('2d');
  const T = { reveal: 3.3, end: 5.2 };
  const [SX, SY] = FX.seal;

  const sm = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
  const ramp = (t, a, b) => sm((t - a) / (b - a));
  const bump = (t, a, b, c) => (t < a || t > c ? 0 : t < b ? sm((t - a) / (b - a)) : 1 - sm((t - b) / (c - b)));
  const mulberry = seed => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* ---- turn the exported paths into timed segments ---- */
  const V_START = 1.3, V_SPEED = 560, O_START = 1.5, O_SPEED = 660;
  const segs = [];
  FX.veins.forEach((v, idx) => {
    let run = 0;
    for (let i = 0; i < v.p.length / 2 - 1; i++) {
      const x1 = v.p[2 * i], y1 = v.p[2 * i + 1], x2 = v.p[2 * i + 2], y2 = v.p[2 * i + 3];
      run += Math.hypot(x2 - x1, y2 - y1);
      segs.push({ x1, y1, x2, y2, ta: V_START + idx * 0.04 + run / V_SPEED, vein: true, flap: false });
    }
  });
  FX.outlines.forEach(o => {
    for (let i = 0; i < o.p.length / 2 - 1; i++) {
      const x1 = o.p[2 * i], y1 = o.p[2 * i + 1], x2 = o.p[2 * i + 2], y2 = o.p[2 * i + 3];
      const d = Math.hypot((x1 + x2) / 2 - SX, (y1 + y2) / 2 - SY);
      segs.push({ x1, y1, x2, y2, ta: O_START + d / O_SPEED, vein: false, flap: true });
    }
  });
  const veinSegs = segs.filter(s => s.vein);

  // drifting glints along the lit paths, plus dust flung off the seal
  const rnd = mulberry(7), sparks = [];
  for (let i = 0; i < 340; i++) {
    const s = segs[(rnd() * segs.length) | 0], u = rnd();
    sparks.push({ x: s.x1 + (s.x2 - s.x1) * u, y: s.y1 + (s.y2 - s.y1) * u, t0: s.ta + rnd() * 0.35, life: 0.7 + rnd() * 0.9, vx: (rnd() - 0.5) * 46, vy: (rnd() - 0.65) * 46, r: 0.9 + rnd() * 2, ph: rnd() * 6.28 });
  }
  for (let i = 0; i < 90; i++) {
    const a = rnd() * 6.283, r0 = FX.sealR * (0.85 + rnd() * 0.3);
    sparks.push({ x: SX + Math.cos(a) * r0, y: SY + Math.sin(a) * r0, t0: 1.25 + rnd() * 1.7, life: 0.8 + rnd() * 1.1, vx: Math.cos(a) * (30 + rnd() * 90), vy: Math.sin(a) * (30 + rnd() * 90) - 12, r: 1 + rnd() * 2.2, ph: rnd() * 6.28 });
  }

  /* ---- canvas ---- */
  let scale = 1;
  function resize() {
    const w = stage.clientWidth || 360, dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(w * dpr * FX.h / FX.w);
    scale = canvas.width / FX.w;
  }

  function intensity(s, t) {
    const age = t - s.ta;
    if (age < 0) return 0;
    let a = s.vein
      ? (age < 0.09 ? age / 0.09 : Math.exp(-(age - 0.09) / 0.5))                    // bright head, fading tail
      : (age < 0.14 ? age / 0.14 : 0.5 + 0.5 * Math.exp(-(age - 0.14) / 0.45));      // ignites, settles to a steady glow
    const from = s.vein ? 2.5 : s.flap ? 2.35 : 3.0, len = s.vein ? 0.6 : s.flap ? 0.3 : 0.5;
    if (t > from) a *= Math.max(0, 1 - (t - from) / len);
    return a;
  }

  function glowDot(x, y, r, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,250,225,${a})`); g.addColorStop(0.35, `rgba(255,214,120,${a * 0.55})`); g.addColorStop(1, 'rgba(255,190,80,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  }

  function paint(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (t < 0.9 || t > 3.9) return;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.globalCompositeOperation = 'lighter';

    // starburst at the seal
    const f = bump(t, 1.0, 1.55, 2.5);
    if (f > 0) {
      const R = 300 * (0.5 + 0.5 * f), g = ctx.createRadialGradient(SX, SY, 0, SX, SY, R);
      g.addColorStop(0, `rgba(255,246,210,${0.9 * f})`); g.addColorStop(0.25, `rgba(255,214,120,${0.5 * f})`); g.addColorStop(1, 'rgba(255,190,80,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(SX, SY, R, 0, 6.283); ctx.fill();
    }
    const sf = bump(t, 1.1, 1.5, 2.1);
    if (sf > 0) {
      for (const ang of [0, 90, 35, -35, 58]) {
        const L = 130 + 300 * sf;
        ctx.save(); ctx.translate(SX, SY); ctx.rotate(ang * Math.PI / 180);
        const lg = ctx.createLinearGradient(-L, 0, L, 0);
        lg.addColorStop(0, 'rgba(255,225,140,0)'); lg.addColorStop(0.5, `rgba(255,250,228,${sf})`); lg.addColorStop(1, 'rgba(255,225,140,0)');
        ctx.fillStyle = lg; ctx.fillRect(-L, -1.8, 2 * L, 3.6); ctx.restore();
      }
    }

    // golden light along the vines and petal outlines, batched by brightness
    const bins = [[], [], [], [], []];
    for (const s of segs) {
      if (s.ta > t) continue;
      const a = intensity(s, t);
      if (a >= 0.03) bins[Math.min(4, (a * 5) | 0)].push(s);
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    bins.forEach((list, k) => {
      if (!list.length) return;
      const a = (k + 0.5) / 5;
      ctx.beginPath();
      for (const s of list) { ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); }
      ctx.strokeStyle = `rgba(255,178,70,${a * 0.32})`; ctx.lineWidth = 9; ctx.stroke();
      ctx.strokeStyle = `rgba(255,232,160,${a})`; ctx.lineWidth = 2.2; ctx.stroke();
    });
    for (const s of veinSegs) {
      const age = t - s.ta;
      if (age >= 0 && age < 0.09) glowDot(s.x2, s.y2, 26, 1 - (age / 0.09) * 0.4);
    }

    // sparkles
    for (const p of sparks) {
      const age = t - p.t0;
      if (age < 0 || age > p.life) continue;
      const a = Math.sin(Math.PI * age / p.life) * (0.65 + 0.35 * Math.sin(age * 26 + p.ph));
      ctx.fillStyle = `rgba(255,238,178,${Math.max(0, a)})`;
      ctx.beginPath(); ctx.arc(p.x + p.vx * age, p.y + p.vy * age, p.r * (1.2 - 0.4 * age / p.life), 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  /* ---- state, as a pure function of time ---- */
  function render(t) {
    const st = stage.style, glow = ramp(t, 0.75, 1.4) * (1 - 0.88 * ramp(t, 2.4, 3.1));
    const flapT = ramp(t, 2.6, 3.55);
    st.setProperty('--glow', glow.toFixed(3));
    st.setProperty('--seal-b', (1 + 0.25 * glow + 0.25 * ramp(t, 3.1, 3.6)).toFixed(3));
    st.setProperty('--flap-a', (flapT * 118).toFixed(2) + 'deg');
    st.setProperty('--left-a', (ramp(t, 2.7, 3.6) * 118).toFixed(2) + 'deg');
    st.setProperty('--right-a', (ramp(t, 2.7, 3.6) * 118).toFixed(2) + 'deg');
    st.setProperty('--bottom-a', (ramp(t, 2.8, 3.65) * 118).toFixed(2) + 'deg');
    st.setProperty('--flap-b', (1 + 0.7 * ramp(t, 2.6, 3.2)).toFixed(3));
    st.setProperty('--flap-o', (1 - ramp(t, 3.3, 3.6)).toFixed(3));
    st.setProperty('--env-o', (1 - ramp(t, 3.6, 4.5)).toFixed(3));
    st.setProperty('--drop', (ramp(t, 3.7, 4.6) * 7).toFixed(2) + '%');
    entrance.style.setProperty('--bg-o', (1 - ramp(t, 3.3, 4.2)).toFixed(3));
    entrance.style.setProperty('--bloom', bump(t, 3.1, 3.75, 4.7).toFixed(3));
    paint(t);
  }

  let raf = 0, t0 = 0, revealed = false, done = false;
  function frame(now) {
    const t = (now - t0) / 1000;
    render(t);
    if (!revealed && t >= T.reveal) { revealed = true; onReveal(); }
    if (t >= T.end) { if (!done) { done = true; onDone(); } return; }
    raf = requestAnimationFrame(frame);
  }

  return {
    play() {
      resize(); revealed = done = false;
      entrance.classList.add('opening');
      t0 = performance.now();
      raf = requestAnimationFrame(frame);
    },
    stop() { cancelAnimationFrame(raf); },
    reset() {
      cancelAnimationFrame(raf); revealed = done = false;
      entrance.classList.remove('opening');
      resize(); render(0);
    },
    seek(t) { resize(); render(t); },
    resize
  };
};
