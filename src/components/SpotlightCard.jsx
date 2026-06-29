import { useRef, useState } from "react";

export default function SpotlightCard({ children, className = "" }) {
  const ref = useRef(null);
  const [p, setP] = useState({ x: 0, y: 0, o: 0 });
  return (
    <div ref={ref}
      onMouseMove={(e) => { const r = ref.current.getBoundingClientRect(); setP({ x: e.clientX - r.left, y: e.clientY - r.top, o: 1 }); }}
      onMouseLeave={() => setP((s) => ({ ...s, o: 0 }))}
      className={"group relative overflow-hidden rounded-2xl hairline bg-white/[.015] transition-colors duration-300 hover:border-white/20 " + className}>
      <div className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{ opacity: p.o, background: `radial-gradient(440px circle at ${p.x}px ${p.y}px, rgba(255,255,255,.10), transparent 45%)` }} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}
