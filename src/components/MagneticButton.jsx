import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function MagneticButton({ children, className = "", href = "#", strength = 0.35 }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 14 });
  const sy = useSpring(y, { stiffness: 220, damping: 14 });

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const reset = () => { x.set(0); y.set(0); };

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.95 }}
      className={className}
    >
      {children}
    </motion.a>
  );
}
