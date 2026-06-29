import { useRef, useEffect } from "react";
import { usePlayer } from "../player.jsx";

export default function LiquidBackground() {
  const ref = useRef(null);
  const { current } = usePlayer();
  const playingRef = useRef(false);
  playingRef.current = !!current;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w, h, dpr, parts = [], raf, t = 0;
    const mouse = { x: -9999, y: -9999 };

    const count = () => Math.min(90, Math.floor((w * h) / 24000));
    function init() {
      parts = [];
      const n = count();
      for (let i = 0; i < n; i++) parts.push({
        x: Math.random() * w, y: Math.random() * h, z: Math.random() * 0.8 + 0.3,
        vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12, r: Math.random() * 1.3 + 0.4,
      });
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      init();
    }
    function frame() {
      t += 0.004;
      ctx.clearRect(0, 0, w, h);
      // D — жидкий хром: медленно плывущее металлическое пятно
      const cx = w * (0.5 + 0.28 * Math.sin(t * 0.6)), cy = h * (0.42 + 0.22 * Math.cos(t * 0.5));
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.75);
      g.addColorStop(0, "rgba(255,255,255,0.045)");
      g.addColorStop(0.5, "rgba(130,130,140,0.018)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
      // C — аудио-режим: мягкая пульсация, когда играет трек
      const beat = playingRef.current ? (0.5 + 0.5 * Math.sin(t * 5.2)) * 0.6 : 0;
      const speed = 1 + beat * 0.7;
      // B — пыль + отталкивание от курсора + связи
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.x += p.vx * speed * p.z; p.y += p.vy * speed * p.z;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 16000) { const d = Math.sqrt(d2) || 1, f = (16000 - d2) / 16000 * 1.4; p.x += dx / d * f; p.y += dy / d * f; }
        if (p.x < 0) p.x += w; else if (p.x > w) p.x -= w;
        if (p.y < 0) p.y += h; else if (p.y > h) p.y -= h;
        const a = (0.10 + 0.22 * p.z) * (0.75 + 0.6 * beat);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + beat * 0.4), 0, 6.283);
        ctx.fillStyle = "rgba(255,255,255," + a.toFixed(3) + ")"; ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    const onMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onOut = () => { mouse.x = -9999; mouse.y = -9999; };
    const onVis = () => { cancelAnimationFrame(raf); if (!document.hidden && !reduce) raf = requestAnimationFrame(frame); };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerout", onOut);
    document.addEventListener("visibilitychange", onVis);
    if (reduce) { frame(); cancelAnimationFrame(raf); } else raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onOut);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 h-full w-full" style={{ zIndex: -1 }} />;
}
