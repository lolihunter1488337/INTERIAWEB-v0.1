import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePlayer } from "../player.jsx";

export default function NowPlaying() {
  const { current, next, prev, close } = usePlayer();
  const [open, setOpen] = useState(true);

  return (
    <AnimatePresence>
      {current && (
        <motion.div key="np" initial={{ y: 160 }} animate={{ y: 0 }} exit={{ y: 160 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed inset-x-0 bottom-0 z-[88]">
          <div className="mx-auto max-w-5xl px-3 pb-3">
            <div className="overflow-hidden rounded-2xl border border-white/12 bg-bg/90 shadow-2xl backdrop-blur-xl">
              {/* iframe всегда смонтирован — звук не прерывается при сворачивании */}
              <motion.div animate={{ height: open ? 180 : 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden" style={{ borderBottom: open ? "1px solid rgba(255,255,255,.1)" : "none" }}>
                <iframe key={current.id} title={current.title} src={`https://music.yandex.ru/iframe/album/${current.id}/`}
                  className="h-[180px] w-full" frameBorder="0" allow="autoplay; encrypted-media" />
              </motion.div>

              <div className="flex items-center gap-3 p-2.5">
                <img src={current.cover} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{current.title}</div>
                  <div className="label truncate text-muted">{current.artists}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={prev} className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink" aria-label="Назад">⏮</button>
                  <button onClick={next} className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink" aria-label="Вперёд">⏭</button>
                  <button onClick={() => setOpen((o) => !o)} className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink" aria-label="Свернуть плеер">{open ? "▾" : "▴"}</button>
                  <button onClick={close} className="grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink" aria-label="Закрыть">✕</button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
