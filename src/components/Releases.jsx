import { motion } from "framer-motion";
import data from "../releases.json";

function Card({ r }) {
  return (
    <a href={r.url} target="_blank" rel="noopener noreferrer"
      className="group relative block w-[128px] shrink-0 overflow-hidden rounded-lg border border-white/10 md:w-[150px]">
      <img src={r.cover} alt={r.title} loading="lazy"
        className="aspect-square w-full object-cover grayscale transition duration-500 group-hover:scale-105 group-hover:grayscale-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 transition-opacity group-hover:opacity-90" />
      <div className="absolute inset-x-0 bottom-0 translate-y-1 p-2.5 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <div className="truncate text-[13px] font-semibold leading-tight text-white">{r.title}</div>
        <div className="mt-0.5 truncate text-[11px] text-white/60">{r.artists}</div>
      </div>
    </a>
  );
}

function Row({ list, reverse }) {
  const doubled = [...list, ...list];
  return (
    <div className="flex overflow-hidden"
      style={{ maskImage: "linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 7%,#000 93%,transparent)" }}>
      <motion.div className="flex shrink-0 gap-3"
        animate={{ x: reverse ? ["-50%", "0%"] : ["0%", "-50%"] }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        style={{ willChange: "transform" }}>
        {doubled.map((r, i) => <Card key={i} r={r} />)}
      </motion.div>
    </div>
  );
}

export default function Releases() {
  const half = Math.ceil(data.length / 2);
  return (
    <div className="space-y-3">
      <Row list={data.slice(0, half)} />
      <Row list={data.slice(half)} reverse />
    </div>
  );
}
