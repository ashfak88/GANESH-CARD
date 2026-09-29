/* Live effects for the hero scene: a drifting swirl of rose petals, ripples
   spreading across the lake and glints on the water. The curtains, sun, clouds
   and flowers are animated with CSS; this canvas reads the same 8-second loop
   clock from them, so everything breathes together (calm, a breeze, calm).
   Petals and ripples are pure functions of the loop time, so the loop repeats
   seamlessly and any moment can be rendered on demand. */
window.createHeroScene = function (hero) {
  const stage = hero.querySelector('.hero-stage');
  if (!stage) return null;
  const back = stage.querySelector('.hero-fx-back'), front = stage.querySelector('.hero-fx-front');
  const bctx = back.getContext('2d'), fctx = front.getContext('2d');
  const probe = stage.querySelector('.hl-curtain-l-low-a');
  const W = 720, H = 1280, LOOP = 8;
  const TAU = Math.PI * 2;

  const mulberry = seed => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rnd = mulberry(23);

  /* ---- rose petals ---- */
  const TINTS = [['#fff3f0', '#f5c2cb'], ['#fbd6db', '#e69aac'], ['#ecaab9', '#bd6280']];
  const sprites = TINTS.map(([a, b]) => {
    const c = document.createElement('canvas'); c.width = 48; c.height = 66;
    const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 48, 66);
    g.addColorStop(0, a); g.addColorStop(1, b);
    x.fillStyle = g; x.beginPath();
    x.moveTo(24, 3); x.bezierCurveTo(44, 12, 50, 42, 32, 63); x.bezierCurveTo(27, 68, 21, 68, 16, 63); x.bezierCurveTo(-2, 42, 4, 12, 24, 3); x.fill();
    x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1.6; x.beginPath(); x.moveTo(24, 10); x.quadraticCurveTo(26, 34, 24, 58); x.stroke();
    x.strokeStyle = 'rgba(150,70,95,.22)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(24, 3); x.bezierCurveTo(44, 12, 50, 42, 32, 63); x.stroke();
    return c;
  });
  const petals = Array.from({ length: 40 }, () => {
    const life = 2.6 + rnd() * 2.0;
    return {
      life, s: 2.1 + rnd() * Math.min(3.9, LOOP - life - 2.15),      // born during the breeze, gone before the loop ends
      x0: W * (0.26 + rnd() * 0.62), y0: H * (0.02 + rnd() * 0.4),
      vx: -46 + rnd() * 60, vy: 20 + rnd() * 44, sway: 10 + rnd() * 26, f: 1.4 + rnd() * 2.2, ph: rnd() * TAU,
      r0: rnd() * TAU, rv: (rnd() - 0.5) * 5, fph: rnd() * TAU, fv: 2 + rnd() * 3.5,
      size: 0.85 + rnd() * 0.5, tint: (rnd() * 3) | 0
    };
  });

  /* ---- lake ripples & glints ---- */
  const RIPPLES = [[250, 905, 2.3], [470, 922, 2.9], [365, 888, 3.4], [590, 905, 3.9], [140, 930, 4.1], [300, 930, 4.6]];
  const glints = Array.from({ length: 46 }, () => ({
    x: 222 + (rnd() - 0.5) * 130 + (rnd() < 0.35 ? (rnd() - 0.5) * 520 : 0), y: 800 + rnd() * 132,
    w: 6 + rnd() * 16, k: 3 + ((rnd() * 3) | 0), ph: rnd() * TAU
  }));

  /* ---- clock: follows the CSS animation so both stay in step ---- */
  let raf = 0, running = false, fallback = 0, k = 1, dpr = 1;
  function loopTime() {
    const a = probe && probe.getAnimations()[0];
    if (a && a.currentTime != null) return (Number(a.currentTime) / 1000) % LOOP;
    return ((performance.now() - fallback) / 1000) % LOOP;
  }

  function resize() {
    const w = stage.clientWidth || 360;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    for (const c of [back, front]) { c.width = Math.round(w * dpr); c.height = Math.round(w * dpr * H / W); }
    k = back.width / W;
  }

  function draw(t) {
    // --- water (behind the curtains)
    bctx.setTransform(1, 0, 0, 1, 0, 0); bctx.clearRect(0, 0, back.width, back.height);
    bctx.setTransform(k, 0, 0, k, 0, 0);
    bctx.save(); bctx.beginPath(); bctx.rect(0, 796, W, 132); bctx.clip();
    for (const [cx, cy, t0] of RIPPLES) {
      for (let j = 0; j < 3; j++) {
        const u = (t - t0 - j * 0.42) / 2.4;
        if (u < 0 || u > 1) continue;
        const rx = 14 + 124 * u, a = Math.pow(1 - u, 1.6) * Math.min(1, u * 9) * 0.6;
        bctx.lineWidth = 1.5; bctx.strokeStyle = `rgba(255,255,255,${a})`;
        bctx.beginPath(); bctx.ellipse(cx, cy, rx, rx * 0.15, 0, 0, TAU); bctx.stroke();
        bctx.strokeStyle = `rgba(122,108,170,${a * 0.4})`;
        bctx.beginPath(); bctx.ellipse(cx, cy + 1.6, rx, rx * 0.15, 0, 0, TAU); bctx.stroke();
      }
    }
    bctx.restore();
    for (const g of glints) {
      const a = Math.pow(Math.max(0, Math.sin(TAU * g.k * t / LOOP + g.ph)), 4) * 0.85;
      if (a < 0.02) continue;
      bctx.fillStyle = `rgba(255,252,240,${a})`;
      bctx.fillRect(g.x - g.w / 2, g.y, g.w, 1.5);
    }

    // --- petals (in front of the curtains, behind the arch)
    fctx.setTransform(1, 0, 0, 1, 0, 0); fctx.clearRect(0, 0, front.width, front.height);
    fctx.setTransform(k, 0, 0, k, 0, 0);
    for (const p of petals) {
      const age = t - p.s;
      if (age < 0 || age > p.life) continue;
      const x = p.x0 + p.vx * age + p.sway * Math.sin(p.f * age * 0.55 + p.ph);
      const y = p.y0 + p.vy * age + 7 * Math.sin(1.7 * age + p.ph);
      const flip = 0.2 + 0.8 * Math.abs(Math.cos(p.fph + p.fv * age));
      fctx.globalAlpha = Math.min(1, age / 0.35) * Math.min(1, (p.life - age) / 0.6) * 0.95;
      fctx.save(); fctx.translate(x, y); fctx.rotate(p.r0 + p.rv * age); fctx.scale(1, flip);
      const w = 16 * p.size, h = 22 * p.size;
      fctx.drawImage(sprites[p.tint], -w / 2, -h / 2, w, h);
      fctx.restore();
    }
    fctx.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    if (hero.classList.contains('motion-visible')) draw(loopTime());
    raf = requestAnimationFrame(loop);
  }

  return {
    start() {
      if (running) return;
      resize(); running = true; fallback = performance.now();
      void probe.offsetWidth;            // make sure the CSS animation exists before we read its clock
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false; cancelAnimationFrame(raf);
      for (const [c, x] of [[back, bctx], [front, fctx]]) { x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, c.width, c.height); }
    },
    render(t) { resize(); draw(t == null ? loopTime() : t); },
    resize
  };
};
