import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Tabs({ tabs }) {
  const [active, setActive] = useState(0);
  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setActive(i)}
            className="relative rounded-full px-5 py-2 text-sm font-medium transition-colors"
            style={{ color: active === i ? "#fff" : "#8a8a92" }}>
            {active === i && (
              <motion.span layoutId="tabPill" className="absolute inset-0 rounded-full bg-red"
                transition={{ type: "spring", stiffness: 380, damping: 30 }} />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="relative mt-6 min-h-[120px]">
        <AnimatePresence mode="wait">
          <motion.div key={active}
            initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(6px)" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
            {tabs[active].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
