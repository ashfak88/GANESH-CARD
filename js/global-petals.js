window.initGlobalPetals = function () {
  const canvas = document.createElement('canvas');
  canvas.className = 'global-petals';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '90'; 
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  const LOOP = 12;
  const TAU = Math.PI * 2;

  const mulberry = seed => () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const rnd = mulberry(101);

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

  const numPetals = 35;
  const petals = Array.from({ length: numPetals }, () => {
    return {
      life: LOOP,
      s: rnd() * LOOP,
      x0: rnd(),
      y0: -0.1 - rnd() * 0.2,
      vx: -0.05 + rnd() * 0.1,
      vy: 0.1 + rnd() * 0.08,
      sway: 10 + rnd() * 26, 
      f: 1.4 + rnd() * 2.2, 
      ph: rnd() * TAU,
      r0: rnd() * TAU, 
      rv: (rnd() - 0.5) * 5, 
      fph: rnd() * TAU, 
      fv: 2 + rnd() * 3.5,
      size: 0.65 + rnd() * 0.6, 
      tint: (rnd() * 3) | 0
    };
  });

  let raf = 0, running = false, fallback = 0, W = 0, H = 0, dpr = 1;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * dpr); 
    canvas.height = Math.round(H * dpr);
  }

  function loopTime() {
    return ((performance.now() - fallback) / 1000) % LOOP;
  }

  function draw(t) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); 
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
    for (const p of petals) {
      let age = t - p.s;
      if (age < 0) age += LOOP;

      const x = p.x0 * W + p.vx * W * age + p.sway * Math.sin(p.f * age * 0.55 + p.ph);
      const y = p.y0 * H + p.vy * H * age + 7 * Math.sin(1.7 * age + p.ph);
      
      if (y > H + 50) continue;

      const flip = 0.2 + 0.8 * Math.abs(Math.cos(p.fph + p.fv * age));
      
      let alpha = 1;
      if (y < 0) alpha = Math.max(0, 1 + y / 50);
      if (y > H - 50) alpha = Math.max(0, (H - y) / 50);

      ctx.globalAlpha = alpha * 0.8; // slightly transparent overall
      ctx.save(); 
      ctx.translate(x, y); 
      ctx.rotate(p.r0 + p.rv * age); 
      ctx.scale(1, flip);
      const w = 16 * p.size, h = 22 * p.size;
      ctx.drawImage(sprites[p.tint], -w / 2, -h / 2, w, h);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  function loop() {
    if (!running) return;
    draw(loopTime());
    raf = requestAnimationFrame(loop);
  }

  return {
    start() {
      if (running) return;
      resize(); running = true; fallback = performance.now();
      window.addEventListener('resize', resize);
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false; cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      ctx.setTransform(1, 0, 0, 1, 0, 0); 
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
};
