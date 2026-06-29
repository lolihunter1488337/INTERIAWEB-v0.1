import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function Preloader() {
  const [n, setN] = useState(0);
  useEffect(() => {
    let v = 0;
    const id = setInterval(() => {
      v = Math.min(100, v + Math.ceil(Math.random() * 6) + 3);
      setN(v);
      if (v >= 100) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg"
      exit={{ y: "-100%" }} transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}>
      <motion.img src="./logo.jpg" alt="" onError={(e) => (e.currentTarget.style.display = "none")}
        className="logo-blend mb-10 w-20 animate-float" initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }} />
      <div className="font-display text-[clamp(64px,16vw,140px)] font-bold leading-none tracking-tighter">
        {String(n).padStart(3, "0")}
      </div>
      <div className="label mt-4 text-muted">INTERIA! — Загрузка</div>
      <div className="mt-7 h-px w-64 max-w-[70vw] overflow-hidden bg-white/10">
        <motion.div className="h-full bg-white" animate={{ width: n + "%" }} transition={{ ease: "linear" }} />
      </div>
    </motion.div>
  );
}
