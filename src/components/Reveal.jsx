import { motion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 56, scale: 0.96, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
    transition: { duration: 0.85, ease: EASE } },
};

export const fromLeft = {
  hidden: { opacity: 0, x: -70, filter: "blur(8px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.85, ease: EASE } },
};

export const fromRight = {
  hidden: { opacity: 0, x: 70, filter: "blur(8px)" },
  show: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.85, ease: EASE } },
};

export const container = (stagger = 0.1) => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: 0.05 } },
});

export default function Reveal({ children, className = "", delay = 0, y = 56 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-90px" }}
      variants={{
        hidden: { opacity: 0, y, scale: 0.96, filter: "blur(8px)" },
        show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)",
          transition: { duration: 0.85, delay, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}
