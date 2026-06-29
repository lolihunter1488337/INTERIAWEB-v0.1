import { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CursorGlow() {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 120, damping: 20 });
  const sy = useSpring(y, { stiffness: 120, damping: 20 });
  useEffect(() => {
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <motion.div
      aria-hidden
      style={{ left: sx, top: sy }}
      className="pointer-events-none fixed z-[1] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
    >
      <div className="h-full w-full rounded-full"
        style={{ background: "radial-gradient(circle, rgba(180,188,210,.10), transparent 60%)" }} />
    </motion.div>
  );
}
