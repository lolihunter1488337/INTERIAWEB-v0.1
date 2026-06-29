import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function Cursor() {
  const x = useMotionValue(-100), y = useMotionValue(-100);
  const dx = useSpring(x, { stiffness: 600, damping: 40 }), dy = useSpring(y, { stiffness: 600, damping: 40 });
  const rx = useSpring(x, { stiffness: 170, damping: 20 }), ry = useSpring(y, { stiffness: 170, damping: 20 });
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const move = (e) => {
      x.set(e.clientX); y.set(e.clientY);
      const t = e.target;
      setHover(!!(t && t.closest && t.closest("a,button,[role=button]")));
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <>
      <motion.div className="cur cur-dot" style={{ x: dx, y: dy }} />
      <motion.div className="cur cur-ring" style={{ x: rx, y: ry }}
        animate={{ scale: hover ? 1.7 : 1, opacity: hover ? 1 : 0.55 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }} />
    </>
  );
}
