import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useSpring, useTransform, useMotionValue, AnimatePresence } from "framer-motion";
import Reveal, { container, fadeUp } from "./components/Reveal.jsx";
import Preloader from "./components/Preloader.jsx";
import MagneticButton from "./components/MagneticButton.jsx";
import Counter from "./components/Counter.jsx";
import CursorGlow from "./components/CursorGlow.jsx";
import LiquidBackground from "./components/LiquidBackground.jsx";
import ComingSoon from "./components/ComingSoon.jsx";
import Panel from "./components/Panel.jsx";
import ScrollText from "./components/ScrollText.jsx";
import SpotlightCard from "./components/SpotlightCard.jsx";
import Releases from "./components/Releases.jsx";
import Accordion from "./components/Accordion.jsx";
import { Cross, Tag } from "./components/brand.jsx";
import { PlayerProvider } from "./player.jsx";
import Cursor from "./components/Cursor.jsx";
import NowPlaying from "./components/NowPlaying.jsx";
import SoundToggle from "./components/SoundToggle.jsx";
import { playHover, playClick } from "./sound.js";

const POPULAR = ["INTERIA!", "11NZZiDENT", "ORXCOOL", "XISAGE", "ClxwnSlxps", "decaying", "HADES!", "NIKOTREN", "KALXSH", "WORTAX!", "LASTCHANCE!", "ZANKYO"];
const ALL_ARTISTS = ["11NZZiDENT","svdst","DXWNFAME","ZXLXN","decaying","Ethereal Love","LXHXNTER","KXNO1X","Mwwlkiy","SAMUELCG","XISAGE","davxdminxnko","HERXHEIMER","ClxwnSlxps","INTERIA!","ORXCOOL","MXDSTER","BXRNCLUEL","Lutsern","KALXSH","Prblmsss","ZANKYO","MXTXL","BACD","14thesenses","30moll","nxofitov","heesolo","KerAE","DJF1STRIK","DJ QEWER","SX1ENT","RXPSODIYA","WORTAX!","LASTCHANCE!","NIKOTREN","Verious","MXPAL","KAZORO","SLXRDX","Minx","DJ WRZ","1DONE","w1rtyz","WINTERvision","HADES!","WXSP","SKYSET!","STRATIUM!"];
const REST = ALL_ARTISTS.filter((a) => !POPULAR.includes(a));

const GENRES = ["Бразил-фанк", "Фонк", "Электроника", "Эксперимент"];

const OFFERS = [
  { n: "01", title: "90% роялти", text: "Артист получает до 90% дохода от цифровых продаж и стриминга в соответствии с условиями договора." },
  { n: "02", title: "Разработка обложки", text: "Разработка индивидуального дизайна обложки для каждого релиза осуществляется лейблом и предоставляется артисту без дополнительной оплаты." },
  { n: "03", title: "Питчинг релизов", text: "Подача релизов в редакционные команды ведущих стриминговых платформ для попадания треков в редакторские плейлисты." },
];

const PROCESS = [
  { n: "01", t: "Рассмотрение демозаписи", d: "Направьте готовый трек на рассмотрение команде лейбла." },
  { n: "02", t: "Согласование условий", d: "Обсуждаем формат сотрудничества, условия выпуска и другие детали." },
  { n: "03", t: "Заключение договора", d: "Юридически закрепляем права и обязанности сторон путём подписания договора." },
  { n: "04", t: "Выпуск и выплаты", d: "Организуем выпуск и продвижение релиза, после чего артист получает выплаты в соответствии с условиями договора." },
];

const FAQ = [
  { q: "Сколько я получаю?", a: "90% доходов — твои, 10% — лейблу. Выше среднерыночных условий." },
  { q: "Кто делает обложку?", a: "Мы. Уникальный кавер-арт включён в каждый релиз бесплатно." },
  { q: "Права защищены?", a: "Да. Каждый релиз — отдельный договор с полной юридической силой." },
  { q: "На каких платформах выходят релизы?", a: "На всех цифровых сервисах и стриминговых платформах международного рынка." },
  { q: "Что за карточки артистов?", a: "На часть релизов добавляем карточки наших артистов (1NZZiDENT, ØRXCOOL, ClxwnSlxps, INTERIA!, XISAGE) — это усиливает алгоритмическое продвижение и питчинг. На долю артиста никак не влияет." },
];

function ChromeMark({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-label="INTERIA!">
      <defs><linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" /><stop offset=".5" stopColor="#8b8f99" /><stop offset="1" stopColor="#fff" />
      </linearGradient></defs>
      <path d="M32 2 L38 26 L62 32 L38 38 L32 62 L26 38 L2 32 L26 26 Z" fill="url(#cg)" />
    </svg>
  );
}

function Logo({ className }) {
  const [err, setErr] = useState(false);
  if (err) return <ChromeMark className={className} />;
  return <img src="./logo.png" alt="INTERIA!" onError={() => setErr(true)} className={className} />;
}

function Logo3D() {
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [14, -14]), { stiffness: 150, damping: 15 });
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 150, damping: 15 });
  return (
    <motion.div
      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); mx.set((e.clientX - r.left) / r.width - 0.5); my.set((e.clientY - r.top) / r.height - 0.5); }}
      onMouseLeave={() => { mx.set(0); my.set(0); }}
      style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d", transformPerspective: 800 }}
      className="relative mx-auto w-[clamp(200px,30vw,380px)]">
      <div className="absolute inset-0 -z-10 rounded-full blur-3xl" style={{ background: "radial-gradient(circle,rgba(255,255,255,.20),transparent 62%)" }} />
      <Logo className="animate-float w-full object-contain drop-shadow-[0_24px_60px_rgba(0,0,0,.65)]" />
    </motion.div>
  );
}

function Nav() {
  const links = [["Релизы", "#releases"], ["Условия", "#offer"], ["Артисты", "#roster"], ["Мерч", "#/merch"], ["Коллабы", "#/collabs"], ["Мои релизы", "#/myreleases"], ["FAQ", "#faq"]];
  const [open, setOpen] = useState(false);
  return (
    <motion.header initial={{ y: -90, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[.06] bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
        <a href="#top" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <Logo className="h-7 w-7 object-contain" />
          <span className="text-[15px] font-semibold tracking-tight">INTERIA!</span>
        </a>
        <nav className="hidden gap-7 text-[13px] text-muted md:flex">
          {links.map(([l, h]) => (
            <a key={h} href={h}
              className="relative whitespace-nowrap transition-colors hover:text-ink after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-ink/70 after:transition-all after:duration-300 hover:after:w-full">{l}</a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <MagneticButton href="#demo" className="btn-fill hidden rounded-full px-5 py-2 text-[13px] font-semibold sm:inline-flex">
            Прислать демо
          </MagneticButton>
          <button onClick={() => setOpen((o) => !o)} aria-label="Меню" aria-expanded={open}
            className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-ink transition-colors hover:bg-white/5 md:hidden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <><path d="M3 7h18" /><path d="M3 12h18" /><path d="M3 17h18" /></>}
            </svg>
          </button>
        </div>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-white/[.06] md:hidden">
            <div className="flex flex-col px-5 py-2">
              {links.map(([l, h]) => (
                <a key={h} href={h} onClick={() => setOpen(false)}
                  className="border-b border-white/[.05] py-3.5 text-[15px] text-muted transition-colors hover:text-ink">{l}</a>
              ))}
              <a href="#demo" onClick={() => setOpen(false)}
                className="btn-fill mt-3 rounded-full px-5 py-3 text-center text-[14px] font-semibold">Прислать демо</a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </motion.header>
  );
}

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const op = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section id="top" ref={ref} className="relative flex min-h-screen flex-col justify-center overflow-hidden px-5 pb-24 pt-32 md:px-8">
      <div className="pointer-events-none absolute inset-x-5 top-24 z-10 flex items-center justify-between md:inset-x-8">
        <span className="label text-muted">Независимый лейбл</span>
        <span className="label flex items-center gap-2 text-muted"><Cross /> EST. 2026</span>
      </div>

      <motion.div style={{ y, opacity: op }} className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <motion.div variants={container(0.13)} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="mb-8">
            <Logo3D />
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-[clamp(56px,13vw,150px)] font-bold leading-[.85] tracking-[-0.04em]">
            INTERIA<span className="chrome chrome-anim">!</span>
          </motion.h1>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-3">
            <MagneticButton href="#demo" className="btn-fill rounded-full px-7 py-3.5 text-[15px] font-semibold">Прислать демо →</MagneticButton>
            <MagneticButton href="#releases" className="rounded-full border border-white/15 px-7 py-3.5 text-[15px] font-medium text-ink transition-colors hover:bg-white/5">Слушать релизы</MagneticButton>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div style={{ opacity: op }} className="relative z-10 mx-auto mt-12 grid w-full max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.06] sm:mt-16">
        {[["90", "% артисту"], ["10", "% лейблу"], ["60", "+ артистов"]].map(([n, l], i) => (
          <div key={i} className="grid min-h-[104px] place-items-center bg-bg px-3 py-5 text-center">
            <div>
              <div className="text-3xl font-bold tracking-tight md:text-4xl"><Counter to={parseInt(n)} /></div>
              <div className="label label-dim mt-1.5 leading-relaxed">{l}</div>
            </div>
          </div>
        ))}
      </motion.div>
    </section>
  );
}

function Section({ id, n, tag, title, lead, children, narrow }) {
  return (
    <section id={id} className={"relative mx-auto px-5 py-20 md:px-8 md:py-28 " + (narrow ? "max-w-4xl" : "max-w-6xl")}>
      <Reveal className="mb-10">
        <Tag n={n}>{tag}</Tag>
        <h2 className="mt-5 text-[clamp(30px,5vw,62px)] font-bold leading-[.95] tracking-[-0.035em]">{title}</h2>
        {lead && <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-muted">{lead}</p>}
      </Reveal>
      {children}
    </section>
  );
}

function ArtistStrip() {
  const row = [...ALL_ARTISTS, ...ALL_ARTISTS];
  return (
    <div className="group relative overflow-hidden border-y border-white/[.06] py-6"
      style={{ maskImage: "linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)", WebkitMaskImage: "linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent)" }}>
      <div className="flex w-max items-center animate-marquee group-hover:[animation-play-state:paused]" style={{ animationDuration: "90s" }}>
        {row.map((a, i) => (
          <span key={i} className="flex items-center text-3xl font-semibold tracking-tight text-faint transition-colors duration-300 hover:text-ink md:text-5xl">
            {a}<span className="mx-7 text-lg text-white/15">✶</span>
          </span>
        ))}
      </div>
    </div>
  );
}

const VALUES = [
  { t: "Свобода", d: "Без границ и рамок." },
  { t: "Творчество", d: "Новые идеи, новый звук." },
  { t: "Подлинность", d: "Настоящие люди и искусство." },
];

function Manifesto() {
  return (
    <section id="about" className="relative mx-auto max-w-5xl px-5 py-28 md:px-8 md:py-40">
      <Reveal><Tag n="01">Манифест</Tag></Reveal>
      <ScrollText className="mt-8 text-[clamp(26px,4.6vw,60px)] font-semibold leading-[1.08] tracking-[-0.03em] text-ink"
        text="Мы создаём будущее музыки. Остальное — история." />
      <div className="mt-16 grid gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.06] sm:grid-cols-3">
        {VALUES.map((v, i) => (
          <div key={i} className="bg-bg p-7">
            <div className="label label-dim">0{i + 1}</div>
            <div className="mt-5 text-2xl font-semibold tracking-tight">{v.t}</div>
            <p className="mt-1.5 text-[15px] text-muted">{v.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReleasesSection() {
  return (
    <section id="releases" className="relative py-20 md:py-28">
      <div className="mx-auto mb-9 flex max-w-6xl items-end justify-between gap-4 px-5 md:px-8">
        <Reveal>
          <Tag n="02">Каталог</Tag>
          <h2 className="mt-5 text-[clamp(30px,5vw,62px)] font-bold leading-[.95] tracking-[-0.035em]">Релизы</h2>
        </Reveal>
        <a href="https://music.yandex.ru/label/6401624" target="_blank" rel="noreferrer"
          className="label hidden whitespace-nowrap text-muted transition-colors hover:text-ink md:block">Весь каталог →</a>
      </div>
      <Reveal><Releases /></Reveal>
    </section>
  );
}

function Offer() {
  return (
    <Section id="offer" n="03" tag="Условия" title="Что получает артист"
      lead="Все условия сотрудничества закрепляются договором и обеспечивают прозрачную и понятную модель работы.">
      <motion.div variants={container(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {OFFERS.map((o) => (
          <motion.div key={o.n} variants={fadeUp}>
            <SpotlightCard className="h-full p-6">
              <div className="label label-dim">{o.n}</div>
              <h3 className="mt-8 text-xl font-semibold tracking-tight">{o.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{o.text}</p>
            </SpotlightCard>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

function Process() {
  return (
    <Section id="process" n="04" tag="Как мы работаем" title="От демозаписи до выпуска релиза"
      lead="Прозрачный процесс сотрудничества на каждом этапе — от рассмотрения материала до получения роялти.">
      <motion.div variants={container(0.12)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="grid gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.06] md:grid-cols-4">
        {PROCESS.map((p, i) => (
          <motion.div key={i} variants={fadeUp} className="group relative bg-bg p-6 transition-colors hover:bg-white/[.02]">
            <div className="text-5xl font-bold tracking-tight text-white/[.08] transition-colors group-hover:text-ink">{p.n}</div>
            <h3 className="mt-5 text-lg font-semibold">{p.t}</h3>
            <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{p.d}</p>
            {i < PROCESS.length - 1 && <span className="absolute right-5 top-6 hidden text-muted md:block">→</span>}
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

const ROSTER = [
  { name: "1NZZiDENT", count: "2.5M", platform: "yandex" },
  { name: "svdst", count: "2M", platform: "spotify" },
  { name: "decaying", count: "1M", platform: "spotify" },
  { name: "KXNO1X", count: "600K", platform: "spotify" },
  { name: "ØRXCOOL", count: "400K", platform: "yandex" },
  { name: "DXWNFAME", count: "400K", platform: "yandex" },
  { name: "SAMUELCG", count: "250K", platform: "spotify" },
  { name: "LXHXNTER", count: "200K", platform: "yandex" },
  { name: "BACD", count: "200K", platform: "spotify" },
  { name: "ZXLXN", count: "200K", platform: "spotify" },
  { name: "XISAGE", count: "150K", platform: "yandex" },
  { name: "14thesenses", count: "150K", platform: "yandex" },
  { name: "Ethereal Love", count: "120K", platform: "yandex" },
  { name: "BXRNCLUEL", count: "120K", platform: "spotify" },
  { name: "ClxwnSlxps", count: "100K", platform: "spotify" },
  { name: "Mwwlkiy", count: "100K", platform: "yandex" },
  { name: "MXTXL", count: "100K", platform: "spotify" },
  { name: "davxdminxnko", count: "100K", platform: "yandex" },
];

function SpotifyIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-label="Spotify">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}

function YandexIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-label="Yandex Music">
      <path d="M12.00 1.00L12.70 9.39L16.60 4.03L13.91 10.09L21.87 6.30L14.61 11.30L20.60 12.00L14.61 12.70L21.53 17.50L13.91 13.91L16.70 20.14L12.70 14.61L12.00 23.50L11.30 14.61L7.80 19.27L10.09 13.91L2.47 17.50L9.39 12.70L2.80 12.00L9.39 11.30L2.13 6.30L10.09 10.09L7.70 4.55L11.30 9.39Z"/>
    </svg>
  );
}

function Roster() {
  return (
    <Section id="roster" n="05" tag="Артисты" title="Ростер"
      lead="С нами более 60 артистов. Вот несколько имён, которых ты точно слышал.">
      <motion.div variants={container(0.05)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-70px" }}
        className="grid gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.06] sm:grid-cols-2 lg:grid-cols-3">
        {ROSTER.map((a) => (
          <motion.div key={a.name} variants={fadeUp}
            className="group flex items-center justify-between gap-4 bg-bg px-6 py-5 transition-colors hover:bg-white/[.03]">
            <span className="truncate text-lg font-semibold tracking-tight transition-colors group-hover:text-ink md:text-xl">{a.name}</span>
            <span className={"flex shrink-0 cursor-pointer items-center gap-2 text-faint transition-all duration-300 "
              + (a.platform === "spotify"
                  ? "hover:text-[#1DB954] hover:[filter:drop-shadow(0_0_7px_rgba(29,185,84,.75))]"
                  : "hover:text-[#FFCC00] hover:[filter:drop-shadow(0_0_7px_rgba(255,204,0,.75))]")}>
              {a.platform === "spotify" ? <SpotifyIcon className="h-[18px] w-[18px]" /> : <YandexIcon className="h-[18px] w-[18px]" />}
              <span className="label tracking-wide">{a.count}</span>
            </span>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  );
}

function Faq() {
  return (
    <Section id="faq" n="06" tag="Вопросы" title="Часто спрашивают" narrow>
      <Accordion items={FAQ} />
    </Section>
  );
}

function Field({ label, placeholder, area, name }) {
  const base = "w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-[16px] text-ink outline-none transition focus:border-ink placeholder:text-faint";
  return (
    <label className="flex flex-col gap-2">
      <span className="label text-muted">{label}</span>
      {area ? <textarea name={name} rows={3} placeholder={placeholder} className={base + " resize-none"} />
            : <input name={name} type="text" placeholder={placeholder} className={base} />}
    </label>
  );
}

function Demo() {
  const [status, setStatus] = useState("idle");
  const submit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    const form = e.currentTarget;
    const isLocal = /localhost|127\.0\.0\.1/.test(location.hostname);
    if (isLocal) { setStatus("local"); setTimeout(() => setStatus("idle"), 4500); return; }
    const data = Object.fromEntries(new FormData(form).entries());
    setStatus("sending");
    try {
      const r = await fetch("/api/demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const j = await r.json().catch(() => ({ ok: false }));
      if (j.ok) { setStatus("ok"); form.reset(); } else setStatus("error");
    } catch { setStatus("error"); }
    setTimeout(() => setStatus("idle"), 4000);
  };
  const labelBtn = { idle: "Отправить демо →", sending: "Отправляем…", ok: "Отправлено ✓", error: "Ошибка — напиши @interialabel", local: "Только на сайте (не локально)" }[status];
  return (
    <section id="demo" className="relative overflow-hidden px-5 py-28 md:px-8 md:py-36">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle,rgba(255,255,255,.06),transparent 65%)" }} />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-14 md:grid-cols-2 md:items-center">
        <Reveal>
          <Tag n="07">Демо</Tag>
          <h2 className="mt-5 text-[clamp(40px,7vw,84px)] font-bold leading-[.9] tracking-[-0.04em]">
            Готовы выпустить свой релиз?
          </h2>
          <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-muted">Направьте демозапись на рассмотрение нашей команде. Мы внимательно изучим материал и свяжемся с вами.</p>
          <div className="label mt-8 space-y-1.5 text-muted">
            <div className="text-ink">Контакт</div>
            <div>interiarecordsru@gmail.com</div>
            <div>@ceo_INTERIA</div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.form onSubmit={submit} className="flex flex-col gap-7">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <div className="grid gap-7 sm:grid-cols-2">
              <Field name="name" label="Имя / псевдоним" placeholder="Имя или псевдоним" />
              <Field name="contact" label="Контакт для связи" placeholder="@telegram или email" />
            </div>
            <Field name="link" label="Ссылка на релиз" placeholder="SoundCloud, Google Drive, Dropbox, Яндекс Диск или другой сервис с открытым доступом." />
            <Field name="about" label="Дополнительная информация" placeholder="Кратко расскажите о себе, музыкальном стиле, опыте и целях сотрудничества." area />
            <motion.button type="submit" disabled={status === "sending"} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
              className="btn-fill mt-2 flex items-center justify-center overflow-hidden rounded-full px-8 py-4 text-[15px] font-semibold disabled:opacity-70">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={status} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -18, opacity: 0 }}>
                  {labelBtn}
                </motion.span>
              </AnimatePresence>
            </motion.button>
          </motion.form>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[.08] px-5 py-12 md:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <Logo className="h-7 w-7 object-contain" />
          <span className="text-[15px] font-semibold tracking-tight">INTERIA!</span>
        </div>
        <span className="label label-dim">© 2026</span>
      </div>
    </footer>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.001 });
  return <motion.div style={{ scaleX }} className="fixed left-0 top-0 z-[70] h-px w-full origin-left bg-white/70" />;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(typeof window !== "undefined" ? window.location.hash : "");
  useEffect(() => {
    const f = () => {
      const h = window.location.hash;
      setRoute(h);
      if (h.startsWith("#/")) {
        window.scrollTo(0, 0);
      } else if (h.length > 1) {
        requestAnimationFrame(() => {
          const el = document.getElementById(h.slice(1));
          if (el) el.scrollIntoView({ behavior: "smooth" });
        });
      }
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 2400);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const over = (e) => { if (e.target.closest && e.target.closest("a,button,[role=button]")) playHover(); };
    const click = () => playClick();
    document.addEventListener("pointerover", over);
    document.addEventListener("click", click);
    return () => { document.removeEventListener("pointerover", over); document.removeEventListener("click", click); };
  }, []);
  if (route === "#/panel") return (
    <PlayerProvider>
      <LiquidBackground />
      <Cursor />
      <Panel />
    </PlayerProvider>
  );

  return (
    <PlayerProvider>
      <div className="relative">
        <LiquidBackground />
        <AnimatePresence>{loading && <Preloader key="preloader" />}</AnimatePresence>
        <div className="grain" />
        <div className="crt" />
        <Cursor />
        <ScrollProgress />
        <CursorGlow />
        <Nav />
        {route === "#/merch" ? <ComingSoon variant="merch" />
          : route === "#/collabs" ? <ComingSoon variant="collabs" />
          : route === "#/myreleases" ? <ComingSoon variant="myreleases" />
          : (<>
              <main>
                <Hero />
                <ArtistStrip />
                <Manifesto />
                <ReleasesSection />
                <Offer />
                <Process />
                <Roster />
                <Faq />
                <Demo />
              </main>
              <Footer />
            </>)}
        <NowPlaying />
        <SoundToggle />
      </div>
    </PlayerProvider>
  );
}
