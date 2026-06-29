import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="border-t border-white/10">
      {items.map((it, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="border-b border-white/10">
            <button onClick={() => setOpen(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left transition-opacity hover:opacity-80">
              <span className="flex items-baseline gap-5">
                <span className="label label-dim w-6">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-lg font-medium text-ink md:text-2xl">{it.q}</span>
              </span>
              <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3 }}
                className="text-2xl font-light text-muted">+</motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden">
                  <p className="max-w-2xl pb-6 pl-11 text-[15px] leading-relaxed text-muted">{it.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
