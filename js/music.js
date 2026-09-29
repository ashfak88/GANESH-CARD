/* A soft, original music-box lullaby synthesised with the Web Audio API.
   Used when no audio file is configured in wedding-data.js, so the invitation
   has a gentle soundtrack without shipping any copyrighted recording. */
window.createMusicBox = function () {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;

  const BPM = 72, EIGHTH = 60 / BPM / 2;
  // Warm four-bar loop: Cmaj7 · Am7 · Fmaj7 · G6 (MIDI note numbers).
  const CHORDS = [[48, 55, 59, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59]];
  const ARP = [0, 1, 2, 3, 2, 1, 3, 2];
  const MELODY = [72, 74, 76, 79, 81, 84];   // C major pentatonic
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  let ctx, master, dry, send, timer = 0, nextTime = 0, step = 0, melodyAt = 2, playing = false;

  function build() {
    ctx = new AudioCtx();
    master = ctx.createGain(); master.gain.value = 0.0001; master.connect(ctx.destination);
    dry = ctx.createGain(); dry.gain.value = 0.85; dry.connect(master);
    // Generated hall reverb: decaying stereo noise.
    const verb = ctx.createConvolver();
    const len = Math.floor(ctx.sampleRate * 3.2), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    verb.buffer = ir;
    send = ctx.createGain(); send.gain.value = 0.55;
    send.connect(verb); verb.connect(master);
  }

  function bell(t, midi, level) {
    const f = mtof(midi), out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(level, t + 0.006);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 2.6);
    [[1, 1], [2, 0.26], [3.01, 0.1], [4.16, 0.04]].forEach(([mult, amp]) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = f * mult; g.gain.value = amp;
      o.connect(g); g.connect(out); o.start(t); o.stop(t + 2.7);
    });
    out.connect(dry); out.connect(send);
  }

  function pad(t, midi, dur) {
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = mtof(midi);
    lp.type = 'lowpass'; lp.frequency.value = 620;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.03, t + dur * 0.45);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 1.4);
    o.connect(lp); lp.connect(g); g.connect(dry); g.connect(send);
    o.start(t); o.stop(t + dur + 1.5);
  }

  function schedule(s, t) {
    const pos = s % 8, chord = CHORDS[Math.floor(s / 8) % CHORDS.length];
    if (pos === 0) {
      chord.forEach((m, i) => pad(t, m + (i ? 0 : 0), EIGHTH * 8));
      bell(t, chord[0], 0.1);
    }
    if (Math.random() > 0.12) {
      const octave = Math.random() > 0.72 ? 24 : 12;
      bell(t, chord[ARP[pos]] + octave, pos === 0 ? 0.085 : 0.05 + Math.random() * 0.02);
    }
    if ((pos === 0 || pos === 4) && Math.random() > 0.35) {
      melodyAt = Math.max(0, Math.min(MELODY.length - 1, melodyAt + Math.floor(Math.random() * 3) - 1));
      bell(t + EIGHTH * 0.5, MELODY[melodyAt], 0.075);
    }
  }

  function pump() {
    while (nextTime < ctx.currentTime + 0.6) {
      schedule(step++, nextTime);
      nextTime += EIGHTH;
    }
  }

  return {
    get playing() { return playing; },
    async play() {
      if (!ctx) build();
      await ctx.resume();
      const now = ctx.currentTime;
      nextTime = now + 0.15;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.7, now + 3);   // soft fade-in
      clearInterval(timer);
      timer = setInterval(pump, 120);
      pump();
      playing = true;
    },
    pause() {
      if (!ctx || !playing) return;
      playing = false;
      clearInterval(timer);
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), now);
      master.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      setTimeout(() => { if (!playing) ctx.suspend(); }, 900);
    }
  };
};
