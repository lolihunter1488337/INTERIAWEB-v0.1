import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

function Word({ children, progress, range }) {
  const opacity = useTransform(progress, range, [0.12, 1]);
  const y = useTransform(progress, range, [8, 0]);
  return (
    <span className="relative mr-[0.28em] inline-block">
      <motion.span style={{ opacity, y }} className="inline-block">{children}</motion.span>
    </span>
  );
}

// премиум-эффект 21st/aceternity: слова проявляются по мере скролла
export default function ScrollText({ text, className = "" }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.35"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={"flex flex-wrap " + className}>
      {words.map((w, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return <Word key={i} progress={scrollYProgress} range={[start, end]}>{w}</Word>;
      })}
    </p>
  );
}
