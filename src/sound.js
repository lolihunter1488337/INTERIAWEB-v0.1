let enabled = (typeof localStorage !== "undefined") ? localStorage.getItem("interia-sound") !== "off" : true;
let ctx;

function tone(freq, dur, gain) {
  if (!enabled || typeof window === "undefined") return;
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = "sine"; o.frequency.value = freq;
    g.gain.value = gain; o.connect(g); g.connect(ctx.destination);
    const t = ctx.currentTime;
    o.start(t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.stop(t + dur);
  } catch (e) {}
}

export const playHover = () => tone(900, 0.035, 0.012);
export const playClick = () => tone(420, 0.07, 0.03);
export const isSoundOn = () => enabled;
export const setSound = (v) => { enabled = v; try { localStorage.setItem("interia-sound", v ? "on" : "off"); } catch (e) {} };
