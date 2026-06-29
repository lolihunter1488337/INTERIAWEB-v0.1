import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import data from "../releases.json";

function Card({ r, onPlay }) {
  return (
    <button onClick={() => onPlay(r)}
      className="group relative block w-[128px] shrink-0 overflow-hidden rounded-lg border border-white/10 text-left md:w-[150px]">
      <img src={r.cover} alt={r.title} loading="lazy"
        className="aspect-square w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-90" />
      <div className="absolute inset-0 grid place-items-center">
        <span className="grid h-11 w-11 scale-50 place-items-center rounded-full bg-white text-black opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">▶</span>
      </div>
      <div className="absolute inset-x-0 bottom-0 p-2.5">
        <div className="truncate text-[13px] font-semibold leading-tight text-white">{r.title}</div>
        <div className="mt-0.5 truncate text-[11px] text-white/60">{r.artists}</div>
      </div>
    </button>
  );
}

function Row({ list, reverse, onPlay }) {
  const doubled = [...list, ...list];
  return (
    <div className="group flex overflow-hidden"
      style={{ maskImage: "linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)" }}>
      <div className={"flex shrink-0 gap-3 animate-marquee group-hover:[animation-play-state:paused] " + (reverse ? "[animation-direction:reverse]" : "")}>
        {doubled.map((r, i) => <Card key={i} r={r} onPlay={onPlay} />)}
      </div>
    </div>
  );
}

function PlayerModal({ r, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <motion.div className="fixed inset-0 z-[90] flex items-center justify-center p-5"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <motion.div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-bg"
        initial={{ scale: 0.92, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 12, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 24 }}>
        <div className="flex items-center justify-between gap-4 border-b border-white/10 p-4">
          <div className="min-w-0">
            <div className="truncate font-semibold">{r.title}</div>
            <div className="label truncate text-muted">{r.artists}</div>
          </div>
          <button onClick={onClose} className="text-3xl leading-none text-muted transition-colors hover:text-ink">×</button>
        </div>
        <iframe title={r.title} src={`https://music.yandex.ru/iframe/album/${r.id}/`}
          className="h-[180px] w-full" frameBorder="0" allow="autoplay" />
        <a href={r.url} target="_blank" rel="noreferrer"
          className="label block border-t border-white/10 p-3 text-center text-muted transition-colors hover:text-ink">Открыть на Яндекс.Музыке →</a>
      </motion.div>
    </motion.div>
  );
}

export default function Releases() {
  const [sel, setSel] = useState(null);
  const half = Math.ceil(data.length / 2);
  return (
    <div className="space-y-3">
      <Row list={data.slice(0, half)} onPlay={setSel} />
      <Row list={data.slice(half)} reverse onPlay={setSel} />
      <AnimatePresence>{sel && <PlayerModal r={sel} onClose={() => setSel(null)} />}</AnimatePresence>
    </div>
  );
}
