(() => {
  'use strict';

  const data = window.WEDDING_DATA;
  const { couple, wedding, venue, details, schedule = [] } = data;
  const rsvpConfig = data.rsvp || {};
  const media = data.media || {};
  const names = `${couple.first} & ${couple.second}`;

  /* ───────── helpers ───────── */
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const safeUrl = value => {
    try {
      const u = new URL(value, location.href);
      return ['http:', 'https:', 'file:'].includes(u.protocol) ? u.href : '';
    } catch { return ''; }
  };
  const mediaUrl = key => (media[key] ? safeUrl(media[key]) : '');
  const HERO_ART = './assets/hero.svg';

  document.title = `${names} | Ring / Roka Ceremony invitation`;
  document.body.classList.add('locked');

  const startsAt = new Date(wedding.dateISO);
  const hasDate = !Number.isNaN(startsAt.getTime());

  /* ───────── markup ───────── */
  const entrance = () => `
    <div class="entrance" id="entrance">
      <div class="env-clip">
        <div class="env-stage" id="env-stage">
          <div class="env-body">
            <img class="env-layer env-base" src="./assets/envelope-base.svg" alt="Plum embossed envelope with a magnolia wax seal" fetchpriority="high">
            <img class="env-layer env-part env-left" src="./assets/envelope-left.svg" alt="">
            <img class="env-layer env-part env-right" src="./assets/envelope-right.svg" alt="">
            <img class="env-layer env-part env-bottom" src="./assets/envelope-bottom.svg" alt="">
            <img class="env-layer env-flap" src="./assets/envelope-flap.svg" alt="">
            <div class="seal-wrap"><img class="seal" src="./assets/seal.svg" alt="" width="220" height="220"><span class="seal-glow"></span></div>
            <canvas class="env-fx" id="env-fx" aria-hidden="true"></canvas>
          </div>
        </div>
        <div class="env-bloom" aria-hidden="true"></div>
        <button class="open-invitation" id="open" aria-label="Open the wedding invitation">
          <span class="open-caption">Open your invitation<small>${esc(couple.first)} &amp; ${esc(couple.second)}</small></span>
        </button>
      </div>
      <video class="opening-video" id="opening-video" muted playsinline preload="none" hidden></video>
      <button class="skip-opening" id="skip" hidden>Skip opening</button>
    </div>`;

  const LAYERED_HERO = !mediaUrl('heroVideo') && !mediaUrl('heroPoster');
  const HERO_ALT = 'A marble arch draped in blush silk and magnolia blossoms, overlooking a lake at sunrise';
  const layer = name => `<img class="hl hl-${name}" src="./assets/hero-${name}.svg" alt="" decoding="async" draggable="false">`;
  const hero = () => `
    <section class="hero" aria-label="Wedding invitation">
      ${LAYERED_HERO ? `<div class="hero-stage" role="img" aria-label="${HERO_ALT}">
        ${layer('sun')}${layer('clouds')}${layer('land')}
        <canvas class="hero-fx hero-fx-back" aria-hidden="true"></canvas>
        ${['curtain-l-low-b', 'curtain-r-low-b', 'curtain-l-low-a', 'curtain-r-low-a', 'curtain-l-up', 'curtain-r-up'].map(layer).join('')}
        <canvas class="hero-fx hero-fx-front" aria-hidden="true"></canvas>
        ${layer('frame')}${['tl', 'tr', 'bl', 'br'].map(c => layer('flowers-' + c)).join('')}
      </div>` : `<img class="hero-art" src="${esc(mediaUrl('heroPoster') || HERO_ART)}" alt="${HERO_ALT}" decoding="async">`}
      <video class="hero-video" id="hero-video" muted loop playsinline preload="none" hidden></video>
      <div class="hero-copy">
        <p class="occasion">The Ring / Roka Ceremony of</p>
        <p class="date">${esc(wedding.dateLabel)}</p>
        <h1 class="names" id="names" tabindex="-1"><span>${esc(couple.first)}</span><i>&amp;</i><span>${esc(couple.second)}</span></h1>
        <p class="hero-note">${esc(couple.heroNote)}</p>
        <a class="hero-link" href="#our-invitation">With love, you are invited</a>
      </div>
      <span class="scroll-cue" aria-hidden="true"></span>
    </section>`;

  const intro = () => `
    <section class="paper-section floral intro" id="our-invitation" aria-label="Our invitation">
      <svg width="0" height="0" style="position: absolute;">
        <filter id="remove-black-bg" color-interpolation-filters="sRGB">
          <feColorMatrix type="matrix" values="
            1 0 0 0 0
            0 1 0 0 0
            0 0 1 0 0
            3 3 3 0 -0.1
          " />
        </filter>
      </svg>
      <div class="reveal" style="display: flex; justify-content: center; margin-bottom: 20px;">
        <img src="./media/ganesha2.jpg" alt="Lord Ganesha" style="width: 220px; height: auto; filter: url(#remove-black-bg) drop-shadow(0px 12px 18px rgba(0,0,0,0.15));">
      </div>
      <h2 class="script reveal">${esc(couple.subtitle)}</h2>
      <div class="rule" aria-hidden="true"></div>
      <p class="reveal">${esc(wedding.salutation)}</p>
      <p class="invitation-note reveal">${esc(wedding.invitationNote)}</p>
      <div class="parents-section reveal" style="margin-top: 2rem; font-family: 'Cormorant Garamond', serif; font-size: 1.2rem;">
        <p style="margin-bottom: 1rem;">
          <strong>Grandson of:</strong><br>${esc(couple.groomGrandparents)}<br>
          <strong>Son of:</strong><br>${esc(couple.groomParents)}
        </p>
        <p><strong>Daughter of:</strong><br>${esc(couple.brideParents)}</p>
      </div>
    </section>`;

  const countdown = () => `
    <section class="paper-section countdown-section torn" aria-labelledby="countdown-title">
      <h2 class="script" id="countdown-title">Until we say “I do”</h2>
      <div class="countdown" id="countdown" role="timer" aria-label="Time until the wedding">
        ${['days', 'hours', 'minutes', 'seconds'].map(k => `<div><strong data-count="${k}">00</strong><span>${k[0].toUpperCase() + k.slice(1)}</span></div>`).join('')}
      </div>
      <p class="countdown-note" id="countdown-note">${esc(wedding.longDate)}</p>
    </section>`;

  const timeline = () => `
    <section class="paper-section floral schedule-section" aria-labelledby="schedule-title">
      <h2 class="script reveal" id="schedule-title">Every lovely moment</h2>
      <ol class="timeline">
        ${schedule.map(e => `<li class="reveal"><time>${esc(e.time)}</time><span class="event-marker" aria-hidden="true"></span><span class="event-name">${esc(e.title)}</span></li>`).join('')}
      </ol>
      <p class="schedule-note">${esc(wedding.scheduleNote)}</p>
    </section>`;

  const venueSection = () => `
    <section class="paper-section venue-section torn" aria-labelledby="venue-title">
      <h2 class="script reveal" id="venue-title">Where we celebrate</h2>
      <img class="venue-scene reveal" src="${HERO_ART}" alt="" loading="lazy">
      <p class="venue-caption">${esc(venue.sceneCaption)}</p>
      <div class="location-frame reveal">
        <h3 class="venue-name">${esc(venue.name)}</h3>
        <div class="rule" aria-hidden="true"></div>
        <address class="venue-address">${esc(venue.address)}</address>
        <p>${esc(venue.timeLabel)}</p>
        <div class="actions">
          <a class="action" id="maps" target="_blank" rel="noopener noreferrer">Open in maps</a>
          <button class="action secondary" id="calendar" type="button">Add to calendar</button>
        </div>
      </div>
      <p class="travel-note">${esc(venue.note)}</p>
    </section>`;

  const etiquette = () => `
    <section class="paper-section floral etiquette" aria-label="Guest details">
      <article class="reveal"><h2 class="script">Dress code</h2><p>${esc(details.dressCode)}</p></article>
      <div class="rule" aria-hidden="true"></div>
      <article class="reveal"><h2 class="script">Your presence, our present</h2><p>${esc(details.giftPreference)}</p></article>
    </section>`;

  const rsvpSection = () => `
    <section class="paper-section floral rsvp-section" aria-labelledby="rsvp-title">
      <div class="rsvp-card reveal">
        <span class="rsvp-kicker">Kindly reply</span>
        <svg class="rsvp-envelope" viewBox="0 0 48 36" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true"><rect x="2" y="3" width="44" height="30" rx="2"/><path d="m3 5 21 16L45 5M3 32l14-14m28 14L31 18"/></svg>
        <h2 class="script" id="rsvp-title">${esc(rsvpConfig.heading || 'A place for you')}</h2>
        <p>${esc(rsvpConfig.note || 'We would love to celebrate with you. Kindly let us know if you can join us.')}</p>
        ${rsvpConfig.deadline ? `<p class="rsvp-deadline">Kindly reply by ${esc(rsvpConfig.deadline)}</p>` : ''}
        <form class="rsvp-form" id="rsvp-form" novalidate></form>
      </div>
    </section>`;

  const closing = () => `
    <footer class="closing" aria-labelledby="closing-title">
      <div class="closing-scene">
        <img class="closing-art" src="${esc(mediaUrl('closingPoster') || HERO_ART)}" alt="" loading="lazy" decoding="async">
        <div class="closing-copy reveal">
          <p class="closing-eyebrow">The beginning of our forever</p>
          <h2 class="closing-title" id="closing-title">With all<br><em>our love</em></h2>
          <div class="closing-rule" aria-hidden="true"></div>
          <p class="closing-names"><span>${esc(couple.first)}</span><i>&amp;</i><span>${esc(couple.second)}</span></p>
          <p class="closing-date">${esc(wedding.dateLabel)}</p>
          <p class="closing-note">The day will be beautiful.<br>Even more so with you.</p>
          <a class="closing-rsvp" href="#rsvp-title">Join our celebration <span aria-hidden="true">↗</span></a>
        </div>
        <p class="closing-caption">A little moment. A lifetime of love.</p>
      </div>
      <div class="closing-colophon">
        <a href="https://www.instagram.com/zetron.tech" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 8px; color: var(--metal); text-decoration: none; font-size: 11px; letter-spacing: .2em; text-transform: uppercase; margin-bottom: 20px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
          CRAFTED BY ZETRON.TECH
        </a>
        ${mediaUrl('music') && media.musicTitle ? `<p class="music-credit">Music: ${mediaUrl('musicSource') ? `<a href="${esc(mediaUrl('musicSource'))}" target="_blank" rel="noopener noreferrer">${esc(media.musicTitle)}</a>` : esc(media.musicTitle)}</p>` : ''}
      </div>
    </footer>`;

  $('app').innerHTML = `
    ${entrance()}
    <main class="invitation" id="invitation" inert>
      ${hero()}${intro()}${countdown()}${timeline()}${venueSection()}${etiquette()}${rsvpSection()}${closing()}
    </main>
    <div class="media-controls" id="media-controls" hidden>

      <button class="media-button" id="music" type="button" aria-pressed="false" hidden>Play music</button>
    </div>
    <audio id="audio" loop preload="none"></audio>
    <p id="status" class="status" role="status" hidden></p>`;

  /* ───────── state & elements ───────── */
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const heroVideo = $('hero-video'), openingVideo = $('opening-video'), audio = $('audio');
  const ambience = window.initInvitationMotion({ reduced });
  const heroEl = document.querySelector('.hero');
  const heroScene = LAYERED_HERO ? window.createHeroScene(heroEl) : null;
  const globalPetals = window.initGlobalPetals ? window.initGlobalPetals() : null;
  let heroRevealed = false;
  const builtInOpening = !mediaUrl('openingVideo');
  const opening = window.createOpening({
    entrance: $('entrance'), stage: $('env-stage'), canvas: $('env-fx'),
    onReveal: () => revealHero(false), onDone: () => finishOpening()
  });
  opening.reset();
  const musicBox = mediaUrl('music') ? null : (window.createMusicBox && window.createMusicBox());
  let opened = false, motionPaused = reduced.matches;
  let openingTimer, hideTimer, toastTimer, observing = false;

  window.initWeddingRSVP($('rsvp-form'), rsvpConfig, names);

  if (mediaUrl('openingVideo')) {
    openingVideo.src = mediaUrl('openingVideo');
    openingVideo.poster = mediaUrl('openingPoster') || './assets/envelope.svg';
    openingVideo.preload = 'auto';
  }
  if (mediaUrl('heroVideo')) { heroVideo.src = mediaUrl('heroVideo'); heroVideo.poster = mediaUrl('heroPoster') || HERO_ART; }
  if (mediaUrl('music')) { audio.src = mediaUrl('music'); audio.volume = 0.45; }

  const toast = message => {
    const el = $('status');
    el.textContent = message; el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, 4500);
  };

  /* ───────── music ───────── */
  const hasMusic = !!(mediaUrl('music') || musicBox);
  const musicPlaying = () => (musicBox ? musicBox.playing : !audio.paused);
  const paintMusicButton = () => {
    const on = musicPlaying();
    $('music').textContent = on ? 'Pause music' : 'Play music';
    $('music').setAttribute('aria-pressed', String(on));
  };
  async function playMusic() {
    try { await (musicBox ? musicBox.play() : audio.play()); } catch { toast('Music could not be played. Please try again.'); }
    paintMusicButton();
  }
  function pauseMusic() { musicBox ? musicBox.pause() : audio.pause(); paintMusicButton(); }
  $('music').addEventListener('click', () => (musicPlaying() ? pauseMusic() : playMusic()));
  audio.addEventListener('error', () => { paintMusicButton(); if (opened) toast('Music could not be loaded. You can still enjoy the invitation.'); });

  /* ───────── motion toggle ───────── */
  function syncMotion() {
    const stopped = motionPaused || reduced.matches;
    ambience.setPaused(stopped || !opened);
    const live = opened && heroRevealed && !stopped;
    heroEl.classList.toggle('live', live && LAYERED_HERO);
    if (heroScene) live ? heroScene.start() : heroScene.stop();
    if (globalPetals) live ? globalPetals.start() : globalPetals.stop();
    heroVideo.hidden = stopped || !mediaUrl('heroVideo');
    if (stopped || !opened || !heroRevealed) heroVideo.pause();
    else if (mediaUrl('heroVideo')) heroVideo.play().catch(() => { heroVideo.hidden = true; });
  }

  reduced.addEventListener('change', e => { motionPaused = e.matches; if (e.matches && opened) finishOpening(); syncMotion(); });
  heroVideo.addEventListener('error', () => { heroVideo.hidden = true; });

  /* ───────── scroll-driven reveals ───────── */
  function startObservers() {
    if (observing || !('IntersectionObserver' in window)) return;
    observing = true;
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (!reduced.matches && !motionPaused) entry.target.classList.add('arriving');
      reveal.unobserve(entry.target);
    }), { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => reveal.observe(el));

    const items = [...document.querySelectorAll('.timeline li')];
    const current = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      items.forEach(li => li.classList.remove('is-current'));
      entry.target.classList.add('is-current');
    }), { rootMargin: '-30% 0px -45% 0px' });
    items.forEach(li => current.observe(li));
  }

  /* ───────── opening the envelope ───────── */
  function revealHero(fast) {
    if (heroRevealed) return;
    heroRevealed = true;
    document.body.style.setProperty('--text-delay', fast ? '.15s' : '.9s');
    document.body.classList.add('revealed');
    syncMotion();
  }

  function finishOpening() {
    const el = $('entrance');
    if (el.classList.contains('leaving') || el.hidden) return;
    clearTimeout(openingTimer);
    revealHero(true);
    el.classList.add('leaving');
    $('invitation').inert = false;
    document.body.classList.remove('locked');
    $('media-controls').hidden = false;
    $('music').hidden = !hasMusic;
    $('skip').hidden = true;
    syncMotion();
    startObservers();
    $('names').focus({ preventScroll: true });
    hideTimer = setTimeout(() => { el.hidden = true; openingVideo.pause(); opening.stop(); }, reduced.matches ? 0 : 900);
  }

  async function openInvitation() {
    if (opened) return;
    opened = true;
    $('open').disabled = true;
    document.body.classList.add('opened');
    if (mediaUrl('heroVideo') && !reduced.matches) { heroVideo.preload = 'auto'; heroVideo.load(); }
    if (hasMusic) {
      $('media-controls').hidden = false;
      $('music').hidden = false;
      playMusic();                 // starts inside the tap so browsers allow audio
    }
    if (reduced.matches) return finishOpening();
    $('skip').hidden = false;
    if (!builtInOpening) {
      $('skip').focus();
      openingVideo.hidden = false;
      openingTimer = setTimeout(finishOpening, 20000);
      try { await openingVideo.play(); } catch { finishOpening(); }
      return;
    }
    opening.play();                // the scripted envelope sequence
  }

  function reopenEnvelope() {
    clearTimeout(hideTimer); clearTimeout(openingTimer);
    window.scrollTo({ top: 0, behavior: 'instant' });
    opened = false; heroRevealed = false;
    document.body.classList.remove('revealed', 'opened');
    document.body.classList.add('locked');
    ambience.setPaused(true);
    heroEl.classList.remove('live'); if (heroScene) heroScene.stop();
    if (globalPetals) globalPetals.stop();
    openingVideo.pause(); openingVideo.currentTime = 0; openingVideo.hidden = true;
    heroVideo.pause(); heroVideo.currentTime = 0;
    opening.reset();
    const el = $('entrance');
    el.hidden = false;
    void el.offsetWidth;               // let the browser register the visible state before animating back
    el.classList.remove('leaving');
    $('open').disabled = false;
    $('skip').hidden = true;
    $('invitation').inert = true;
    $('media-controls').hidden = true;
    $('open').focus();
  }

  $('open').addEventListener('click', openInvitation);
  $('skip').addEventListener('click', () => { opening.stop(); finishOpening(); });

  openingVideo.addEventListener('ended', finishOpening);
  openingVideo.addEventListener('error', () => { if (opened) finishOpening(); });
  openingVideo.addEventListener('timeupdate', () => {
    if (Number.isFinite(openingVideo.duration) && openingVideo.currentTime >= openingVideo.duration - 0.8) finishOpening();
  });

  /* ───────── countdown ───────── */
  const counters = Object.fromEntries(['days', 'hours', 'minutes', 'seconds'].map(k => [k, document.querySelector(`[data-count="${k}"]`)]));
  function tick() {
    if (!hasDate) { $('countdown').hidden = true; return; }
    const remaining = Math.max(0, startsAt.getTime() - Date.now());
    const s = Math.floor(remaining / 1000);
    const values = { days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60 };
    for (const [key, value] of Object.entries(values)) {
      const el = counters[key], text = String(value).padStart(2, '0');
      if (el.textContent === text) continue;
      el.textContent = text;
      if (key === 'seconds' && opened && !reduced.matches && !motionPaused) {
        el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
      }
    }
    if (!remaining) {
      $('countdown-title').textContent = 'Our celebration has begun';
      $('countdown-note').textContent = 'Thank you for being part of our story.';
    }
  }
  tick();
  setInterval(tick, 1000);

  /* ───────── venue actions ───────── */
  const mapsUrl = venue.mapsUrl ? safeUrl(venue.mapsUrl) : '';
  $('maps').hidden = !mapsUrl && !String(venue.address).trim();
  $('maps').href = mapsUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${venue.name} ${venue.address}`)}`;

  const icsText = v => String(v).replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  const icsStamp = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  $('calendar').disabled = !hasDate;
  $('calendar').addEventListener('click', () => {
    const declaredEnd = new Date(wedding.endISO);
    const end = Number.isFinite(declaredEnd.getTime()) && declaredEnd > startsAt ? declaredEnd : new Date(startsAt.getTime() + 6 * 3600 * 1000);
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Wedding Invitation//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
      `UID:wedding-${startsAt.getTime()}@invitation.local`,
      `DTSTAMP:${icsStamp(new Date())}`, `DTSTART:${icsStamp(startsAt)}`, `DTEND:${icsStamp(end)}`,
      `SUMMARY:${icsText(`${names} wedding`)}`,
      `LOCATION:${icsText(`${venue.name}, ${venue.address}`)}`,
      `DESCRIPTION:${icsText(wedding.invitationNote)}`,
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n') + '\r\n';
    const href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href, download: 'wedding.ics' });
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    toast('Your calendar invitation has been downloaded.');
  });
  window.__invitation = { opening, heroScene };   // debug handle (used by the visual tests)
})();
