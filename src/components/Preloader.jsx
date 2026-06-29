import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { chime } from "../sound.js";

const STATES = ["Инициализация", "Загрузка каталога", "Подключение", "Готово"];

export default function Preloader() {
  const [n, setN] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(100, v + Math.ceil(Math.random() * 6) + 3);
      setN(v);
      if (v >= 100 && !done.current) { done.current = true; clearInterval(id); chime(); }
    }, 70);
    return () => clearInterval(id);
  }, []);
  const s = n >= 100 ? 3 : n > 66 ? 2 : n > 33 ? 1 : 0;

  return (
    <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-bg"
      exit={{ y: "-100%" }} transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}>
      <div aria-hidden className="absolute inset-0 opacity-[.35]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.05) 1px,transparent 1px)", backgroundSize: "64px 64px", maskImage: "radial-gradient(circle at 50% 45%,#000,transparent 70%)", WebkitMaskImage: "radial-gradient(circle at 50% 45%,#000,transparent 70%)" }} />
      <motion.img src="./logo.png" alt="" onError={(e) => (e.currentTarget.style.display = "none")}
        className="relative z-10 mb-6 w-20 animate-float" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} />
      <motion.div key={s} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="label relative z-10 text-muted">{STATES[s]}</motion.div>
      <div className="chrome chrome-anim relative z-10 mt-2 font-display text-[clamp(96px,24vw,260px)] font-bold leading-none tracking-tighter tabular-nums">
        {String(n).padStart(3, "0")}
      </div>
      <div className="relative z-10 mt-4 h-px w-72 max-w-[78vw] overflow-hidden bg-white/10">
        <motion.div className="h-full bg-white" animate={{ width: n + "%" }} transition={{ ease: "linear" }} />
      </div>
      <div className="label relative z-10 mt-4 text-faint">INTERIA! — EST. 2026</div>
    </motion.div>
  );
}
