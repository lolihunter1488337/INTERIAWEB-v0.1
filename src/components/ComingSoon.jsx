import { motion } from "framer-motion";
import { Tag } from "./brand.jsx";

const DATA = {
  merch: {
    tag: "Мерч",
    title: "MERCH",
    sub: "Наклейки. Постеры. Браслеты. Брелоки. Одежда.",
    items: [
      { t: "Стикерпак", s: "виниловые наклейки" },
      { t: "Постер A2", s: "лимитированный тираж" },
      { t: "Браслет", s: "силикон / металл" },
      { t: "Брелок", s: "акрил / металл" },
      { t: "Худи / Футболка", s: "капсула INTERIA!" },
      { t: "Лимитка", s: "номерная серия" },
    ],
  },
  collabs: {
    tag: "Коллаборации",
    title: "INFLUENCERS",
    sub: "Маркетинг с блогерами и площадками.",
    items: [
      { t: "TikTok-кампании", s: "охваты и тренды" },
      { t: "Reels / Shorts", s: "вирусный контент" },
      { t: "Интеграции", s: "у блогеров" },
      { t: "Челленджи", s: "под релизы" },
      { t: "Амбассадоры", s: "лицо лейбла" },
      { t: "Спецпроекты", s: "коллабы и дропы" },
    ],
  },
};

export default function ComingSoon({ variant }) {
  const d = DATA[variant] || DATA.merch;
  return (
    <main className="relative mx-auto min-h-screen max-w-6xl px-5 pb-24 pt-28 md:px-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10">
        <Tag n="//">{d.tag}</Tag>
        <h1 className="mt-4 text-[clamp(48px,12vw,150px)] font-bold uppercase leading-[.82] tracking-tighter">{d.title}</h1>
        <p className="mt-4 max-w-md text-[16px] text-muted">{d.sub}</p>
      </motion.div>

      <div className="relative">
        <div className="cs-blur grid select-none grid-cols-2 gap-4 md:grid-cols-3">
          {d.items.map((it, i) => (
            <div key={i} className="flex aspect-[4/5] flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-white/[.06] to-transparent p-5">
              <div className="mb-auto h-20 w-20 rounded-xl bg-white/10" />
              <div className="text-xl font-semibold tracking-tight">{it.t}</div>
              <div className="label mt-1 text-muted">{it.s}</div>
            </div>
          ))}
        </div>

        <div className="absolute inset-0 grid place-items-center p-4">
          <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="glass max-w-sm rounded-3xl border-white/15 px-8 py-10 text-center backdrop-blur-xl">
            <div className="label text-muted">Coming soon</div>
            <div className="chrome chrome-anim mt-3 text-[clamp(40px,8vw,80px)] font-bold uppercase leading-none tracking-tighter">Скоро</div>
            <p className="mx-auto mt-4 max-w-xs text-[15px] leading-relaxed text-muted">Готовим кое-что мощное. Загляни позже — это будет огонь.</p>
            <a href="#/" className="btn-fill mt-7 inline-block rounded-full px-7 py-3.5 text-sm font-semibold">← На главную</a>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
