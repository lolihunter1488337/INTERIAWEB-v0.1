import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useSpring, useTransform, AnimatePresence } from "framer-motion";
import Reveal, { container, fadeUp } from "./components/Reveal.jsx";
import Preloader from "./components/Preloader.jsx";
import MagneticButton from "./components/MagneticButton.jsx";
import Counter from "./components/Counter.jsx";
import CursorGlow from "./components/CursorGlow.jsx";
import Spotlight from "./components/Spotlight.jsx";
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
  { n: "01", title: "90 / 10", text: "Ты забираешь 90%. Прозрачно, выше рынка." },
  { n: "02", title: "Обложка в подарок", text: "Уникальный кавер-арт на каждый релиз." },
  { n: "03", title: "Питчинг", text: "Заносим на все крупные площадки." },
  { n: "04", title: "Продвижение", text: "TikTok, соцсети и реклама под релиз." },
];

const PROCESS = [
  { n: "01", t: "Демо", d: "Скидываешь готовый трек." },
  { n: "02", t: "Условия", d: "Согласуем детали." },
  { n: "03", t: "Договор", d: "Подписываем официально." },
  { n: "04", t: "Выплаты", d: "Релиз, питчинг — деньги тебе." },
];

const FAQ = [
  { q: "Сколько я получаю?", a: "90% доходов — твои, 10% — лейблу. Выше среднерыночных условий." },
  { q: "Кто делает обложку?", a: "Мы. Уникальный кавер-арт включён в каждый релиз бесплатно." },
  { q: "Права защищены?", a: "Да. Каждый релиз — отдельный договор с полной юридической силой." },
  { q: "Какие площадки?", a: "Spotify, Apple Music, YouTube Music, VK, Звук, SoundCloud и другие. Питчинг на нас." },
  { q: "Что за карточки артистов?", a: "Иногда добавляем карточки наших артистов для алгоритмов. Твоя доля не меняется." },
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
  return <img src="./logo.jpg" alt="INTERIA!" onError={() => setErr(true)} className={"logo-blend " + className} />;
}

function Nav() {
  const links = [["Лейбл", "#about"], ["Релизы", "#releases"], ["Условия", "#offer"], ["Артисты", "#roster"], ["FAQ", "#faq"]];
  return (
    <motion.header initial={{ y: -90, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 border-b border-white/[.06] bg-bg/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 md:px-8">
        <a href="#top" className="flex items-center gap-2.5">
          <Logo className="h-7 w-7 object-contain" />
          <span className="text-[15px] font-semibold tracking-tight">INTERIA!</span>
        </a>
        <nav className="hidden gap-9 text-[13px] text-muted md:flex">
          {links.map(([l, h]) => (
            <a key={h} href={h} className="transition-colors hover:text-ink">{l}</a>
          ))}
        </nav>
        <MagneticButton href="#demo" className="btn-fill rounded-full px-5 py-2 text-[13px] font-semibold">
          Прислать демо
        </MagneticButton>
      </div>
    </motion.header>
  );
}

function Hero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const op = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <section id="top" ref={ref} className="relative flex min-h-screen flex-col justify-center overflow-hidden px-5 pb-24 pt-32 md:px-8">
      <Spotlight />
      <div className="pointer-events-none absolute inset-x-5 top-24 z-10 flex items-center justify-between md:inset-x-8">
        <span className="label text-muted">Независимый лейбл</span>
        <span className="label flex items-center gap-2 text-muted"><Cross /> EST. 2026</span>
      </div>

      <motion.div style={{ y, opacity: op }} className="relative z-10 mx-auto w-full max-w-4xl text-center">
        <motion.div variants={container(0.13)} initial="hidden" animate="show">
          <motion.div variants={fadeUp} className="relative mx-auto mb-8 w-[clamp(120px,16vw,190px)]">
            <div className="absolute inset-0 -z-10 rounded-full blur-3xl" style={{ background: "radial-gradient(circle,rgba(255,255,255,.22),transparent 65%)" }} />
            <Logo className="animate-float w-full object-contain" />
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-[clamp(56px,13vw,150px)] font-bold leading-[.85] tracking-[-0.04em]">
            INTERIA<span className="chrome chrome-anim">!</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="serif mt-3 text-[clamp(20px,3.4vw,40px)] leading-tight text-muted">
            будущее тёмной электроники
          </motion.p>

          <motion.div variants={fadeUp} className="label mt-7 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-muted">
            {GENRES.map((g, i) => (<span key={i} className="flex items-center gap-3">{i > 0 && <Cross />}<span className="text-ink/80">{g}</span></span>))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap justify-center gap-3">
            <MagneticButton href="#demo" className="btn-fill rounded-full px-7 py-3.5 text-[15px] font-semibold">Прислать демо →</MagneticButton>
            <MagneticButton href="#releases" className="rounded-full border border-white/15 px-7 py-3.5 text-[15px] font-medium text-ink transition-colors hover:bg-white/5">Слушать релизы</MagneticButton>
          </motion.div>
        </motion.div>
      </motion.div>

      <motion.div style={{ opacity: op }} className="relative z-10 mx-auto mt-16 grid w-full max-w-3xl grid-cols-4 gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.06]">
        {[["90", "% артисту"], ["10", "% лейблу"], ["33", "релиза"], ["50", "+ артистов"]].map(([n, l], i) => (
          <div key={i} className="bg-bg px-3 py-5 text-center">
            <div className="text-2xl font-bold tracking-tight md:text-4xl"><Counter to={parseInt(n)} /></div>
            <div className="label label-dim mt-1.5">{l}</div>
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
        text="Мы не штампуем релизы. Мы строим артистов, звук и культуру, которые остаются." />
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
    <Section id="offer" n="03" tag="Условия" title="Что ты получаешь"
      lead="Официально, по договору. Без подвохов и мелкого шрифта.">
      <motion.div variants={container(0.1)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
    <Section id="process" n="04" tag="Как мы работаем" title="От демо до выплаты">
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

function Roster() {
  return (
    <Section id="roster" n="05" tag="Артисты" title="Ростер"
      lead="С нами уже 50+ артистов. Несколько имён, которых ты точно слышал.">
      <motion.div variants={container(0.06)} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-70px" }}
        className="grid gap-px overflow-hidden rounded-2xl border border-white/[.08] bg-white/[.06] sm:grid-cols-2 lg:grid-cols-3">
        {POPULAR.map((a, i) => (
          <motion.div key={a} variants={fadeUp}
            className="group flex items-center justify-between gap-3 bg-bg px-6 py-5 transition-colors hover:bg-white/[.03]">
            <span className="text-lg font-semibold tracking-tight transition-colors group-hover:text-ink md:text-xl">{a}</span>
            <span className="label label-dim">{String(i + 1).padStart(2, "0")}</span>
          </motion.div>
        ))}
      </motion.div>
      <Reveal className="mt-8 border-t border-white/[.08] pt-6">
        <div className="label text-muted">+ ещё {REST.length} артистов в ростере</div>
        <p className="mt-3 max-w-4xl text-[14px] leading-relaxed text-faint">{REST.join("  ·  ")}</p>
      </Reveal>
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

function Field({ label, placeholder, area }) {
  const base = "w-full border-0 border-b border-white/15 bg-transparent px-0 py-3 text-[16px] text-ink outline-none transition focus:border-ink placeholder:text-faint";
  return (
    <label className="flex flex-col gap-2">
      <span className="label text-muted">{label}</span>
      {area ? <textarea rows={3} placeholder={placeholder} className={base + " resize-none"} />
            : <input type="text" placeholder={placeholder} className={base} />}
    </label>
  );
}

function Demo() {
  const [sent, setSent] = useState(false);
  return (
    <section id="demo" className="relative overflow-hidden px-5 py-28 md:px-8 md:py-36">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
        style={{ background: "radial-gradient(circle,rgba(255,255,255,.06),transparent 65%)" }} />
      <div className="relative z-10 mx-auto grid max-w-6xl gap-14 md:grid-cols-2 md:items-center">
        <Reveal>
          <Tag n="07">Демо</Tag>
          <h2 className="mt-5 text-[clamp(40px,7vw,84px)] font-bold leading-[.9] tracking-[-0.04em]">
            Готов <span className="serif font-normal text-muted">выпускаться?</span>
          </h2>
          <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-muted">Покажи свой звук — послушаем и вернёмся с ответом. Новая глава, новая энергия, тот же андеграунд.</p>
          <div className="label mt-8 space-y-1.5 text-muted">
            <div className="text-ink">Контакт</div>
            <div>info@interialabel.com</div>
            <div>DM @interialabel</div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <motion.form onSubmit={(e) => { e.preventDefault(); setSent(true); setTimeout(() => setSent(false), 2600); }}
            className="flex flex-col gap-7">
            <div className="grid gap-7 sm:grid-cols-2">
              <Field label="Имя / ник" placeholder="INTERIA!" />
              <Field label="Контакт" placeholder="@telegram" />
            </div>
            <Field label="Ссылка на трек" placeholder="SoundCloud, Я.Диск, Drive..." />
            <Field label="О себе" placeholder="Жанр, вайб, площадки..." area />
            <motion.button type="submit" whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
              className="btn-fill mt-2 flex items-center justify-center overflow-hidden rounded-full px-8 py-4 text-[15px] font-semibold">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span key={sent ? "ok" : "send"} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -18, opacity: 0 }}>
                  {sent ? "Отправлено ✓" : "Отправить демо →"}
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
        <div className="label flex flex-wrap gap-6 text-muted">
          <a href="https://music.yandex.ru/label/6401624" target="_blank" rel="noreferrer" className="hover:text-ink">Яндекс.Музыка</a>
          <a href="#demo" className="hover:text-ink">Демо</a>
          <span>info@interialabel.com</span>
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
  return (
    <PlayerProvider>
      <div className="relative">
        <AnimatePresence>{loading && <Preloader key="preloader" />}</AnimatePresence>
        <div className="grain" />
        <div className="crt" />
        <Cursor />
        <ScrollProgress />
        <CursorGlow />
        <Nav />
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
        <NowPlaying />
        <SoundToggle />
      </div>
    </PlayerProvider>
  );
}
