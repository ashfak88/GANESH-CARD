/* Ambient motion: gentle parallax on the illustrated scenes and swaying
   botanical sprigs. Only scenes currently on screen are measured, and all work
   stops when motion is paused, the tab is hidden, or the visitor prefers
   reduced motion. */
window.initInvitationMotion = function ({ reduced }) {
  const scenes = [...document.querySelectorAll('.hero, .paper-section, .closing')];
  const onScreen = new Set();
  const DEPTH = 30;
  let paused = true, frame = 0;

  scenes.forEach((scene, i) => {
    scene.classList.add('motion-scene');
    if (!scene.matches('.hero, .intro, .venue-section, .etiquette')) return;
    // Decorative only: never intercepts gestures, hidden from assistive tech.
    const layer = document.createElement('div');
    layer.className = 'motion-decor';
    layer.setAttribute('aria-hidden', 'true');
    const drift = document.createElement('span');
    drift.className = 'botanical-drift ' + (i % 2 ? 'drift-right' : 'drift-left');
    const img = new Image(320, 480);
    img.src = './assets/sprig.svg';
    img.alt = '';
    img.decoding = 'async';
    img.loading = scene.matches('.hero') ? 'eager' : 'lazy';
    drift.append(img);
    layer.append(drift);
    scene.append(layer);
  });

  const off = () => paused || reduced.matches || document.hidden;

  function paint() {
    frame = 0;
    if (off()) return;
    const vh = window.innerHeight;
    // Read every rect first, then write, to avoid layout thrash.
    const reads = [...onScreen].map(scene => {
      const r = scene.getBoundingClientRect();
      const p = (vh / 2 - (r.top + r.height / 2)) / ((vh + r.height) / 2);
      return [scene, Math.max(-1, Math.min(1, p))];
    });
    reads.forEach(([scene, p]) => {
      scene.style.setProperty('--parallax-y', (p * DEPTH).toFixed(2) + 'px');
      scene.style.setProperty('--scene-y', (p * DEPTH * 0.65).toFixed(2) + 'px');
    });
  }
  const queue = () => { if (!off() && !frame) frame = requestAnimationFrame(paint); };

  function sync() {
    const stop = off();
    document.body.classList.toggle('motion-paused', stop);
    if (stop) {
      cancelAnimationFrame(frame); frame = 0;
      scenes.forEach(s => { s.style.setProperty('--parallax-y', '0px'); s.style.setProperty('--scene-y', '0px'); });
    } else queue();
  }

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        target.classList.toggle('motion-visible', isIntersecting);
        isIntersecting ? onScreen.add(target) : onScreen.delete(target);
      });
      queue();
    });
    scenes.forEach(s => io.observe(s));
  } else {
    scenes.forEach(s => { onScreen.add(s); s.classList.add('motion-visible'); });
  }

  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue, { passive: true });
  document.addEventListener('visibilitychange', sync);
  sync();

  return { setPaused(value) { paused = value; sync(); } };
};
