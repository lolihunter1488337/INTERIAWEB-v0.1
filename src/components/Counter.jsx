import { useEffect, useRef } from "react";
import { useInView, useMotionValue, animate } from "framer-motion";

export default function Counter({ to = 50, suffix = "", duration = 1.6, className = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const mv = useMotionValue(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(mv, to, {
      duration, ease: [0.22, 0.7, 0.2, 1],
      onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v) + suffix; },
    });
    return () => controls.stop();
  }, [inView, to, suffix, duration]);

  return <span ref={ref} className={className}>0{suffix}</span>;
}
