import data from "../releases.json";
import { usePlayer } from "../player.jsx";

function Card({ r, onPlay }) {
  return (
    <button onClick={() => onPlay(r, data)}
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

export default function Releases() {
  const { playOne } = usePlayer();
  const half = Math.ceil(data.length / 2);
  return (
    <div className="space-y-3">
      <Row list={data.slice(0, half)} onPlay={playOne} />
      <Row list={data.slice(half)} reverse onPlay={playOne} />
    </div>
  );
}
