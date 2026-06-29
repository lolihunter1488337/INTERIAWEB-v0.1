import { motion } from "framer-motion";

export default function Spotlight() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[.4]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px)",
          backgroundSize: "76px 76px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 32%,#000 20%,transparent 72%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 32%,#000 20%,transparent 72%)",
        }} />
      <motion.div className="absolute left-1/2 top-[-14%] h-[640px] w-[640px] -translate-x-1/2 rounded-full blur-[100px]"
        style={{ background: "radial-gradient(circle,rgba(255,255,255,.10),transparent 62%)" }}
        animate={{ scale: [1, 1.12, 1], opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute right-[-10%] bottom-[-14%] h-[480px] w-[480px] rounded-full blur-[110px]"
        style={{ background: "radial-gradient(circle,rgba(255,255,255,.05),transparent 70%)" }}
        animate={{ x: [0, -36, 0], y: [0, -22, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}
