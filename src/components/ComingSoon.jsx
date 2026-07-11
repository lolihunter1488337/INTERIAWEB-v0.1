import { motion } from "framer-motion";

// Заглушка для разделов в разработке (Мерч / Коллабы / Мои релизы).
// Минимальный экран: хром-надпись «Скоро» + кнопка на главную.
export default function ComingSoon() {
  return (
    <main className="relative mx-auto grid min-h-screen max-w-6xl place-items-center px-5 pb-24 pt-28 md:px-8">
      <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
        className="glass max-w-sm rounded-3xl border-white/15 px-8 py-10 text-center backdrop-blur-xl">
        <div className="chrome chrome-anim text-[clamp(40px,8vw,80px)] font-bold uppercase leading-none tracking-tighter">Скоро</div>
        <a href="#/" className="btn-fill mt-7 inline-block rounded-full px-7 py-3.5 text-sm font-semibold">&larr; На главную</a>
      </motion.div>
    </main>
  );
}
