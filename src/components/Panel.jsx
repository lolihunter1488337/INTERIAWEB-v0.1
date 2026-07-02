import { useState, useEffect, useRef } from "react";
import Bible from "./Bible.jsx";

// Пароль больше НЕ в коде: проверяется на сервере (env PANEL_PASSWORD).
// В сессии храним введённый пароль и шлём его в заголовке x-panel-key.
const PKEY = "interia_panel_key";
const authHeaders = () => ({ "x-panel-key": sessionStorage.getItem(PKEY) || "" });

const PEOPLE = ["Владислав", "Сергей", "Александр", "Ашот"];
const DUE_OPTS = ["1 day", "2 day", "3 day", "4 day", "5 day", "6 day", "7 day", "8 day", "9 day", "10 day", "Без срока"];
const PRIORITY_COLORS = { red: "#ef4444", yellow: "#eab308", green: "#22c55e" };
const PRIORITY_ORDER = ["", "red", "yellow", "green"];

const OUTREACH_TEMPLATES = [
  { name: "Персональный", text: "{name}, привет! Это INTERIA! RECORDS. Залипли на твоей странице — {listeners} слушателей в месяц, звук реально живой. Пишем не по рассылке, а точечно.\n\nЧто мы делаем: снимаем с тебя всю рутину — дистрибуция, обложка, оформление, — и питчим релизы в редакторские плейлисты площадок. Это те охваты, которые самому почти не поднять. Деньги — 90% тебе, права остаются твои, никакой кабалы.\n\nПредлагаем не «подписаться навсегда», а попробовать один релиз и посмотреть на цифры. Скинуть, как это выглядит?" },
  { name: "Растущий", text: "{name}, здарова! Следим за тобой — {listeners} слушателей и {delta} за месяц, ты на подъёме. Как раз в такой момент важно не слиться, а докрутить.\n\nМы — INTERIA! RECORDS, независимый лейбл. Берём на себя всю техчасть и питчим твои треки в плейлисты, чтобы рост не остановился. Ты просто делаешь музыку. 90% дохода тебе, без эксклюзив-ловушек.\n\nДавай возьмём один твой релиз в работу и покажем, что получится?" },
  { name: "Коротко", text: "{name}, привет! INTERIA! RECORDS. Слушаем тебя — заходит ({listeners}/мес). Мы снимаем с артиста всю рутину: дистрибуция, обложка, питчинг в плейлисты. 90% денег тебе, без лок-ина. Возьмём один релиз на пробу — скину условия?" },
];

const RELEASE_COLS = [
  { key: "artist", label: "Артист" },
  { key: "title", label: "Релиз" },
  { key: "status", label: "Статус", type: "select", options: ["Демо", "Оформление", "Модерация", "Вышел", "Питчинг"] },
  { key: "date", label: "Дата" },
  { key: "streams", label: "Стримы" },
  { key: "pitch", label: "Питч / плейлист" },
  { key: "owner", label: "Кто ведёт", type: "select", options: PEOPLE },
];
const TASK_COLS = [
  { key: "priority", label: "•", type: "priority", narrow: true },
  { key: "task", label: "Задача", type: "textarea" },
  { key: "owner", label: "Ответственный", type: "select", options: PEOPLE },
  { key: "due", label: "Срок", type: "select", options: DUE_OPTS },
  { key: "status", label: "Статус", type: "select", options: ["Новая", "В работе", "Готово"] },
];
const TASK_AR_COLS = [
  { key: "priority", label: "•", type: "priority", narrow: true },
  { key: "task", label: "Задача", type: "textarea" },
  { key: "owner", label: "A&R (исполнитель)" },
  { key: "due", label: "Срок", type: "select", options: DUE_OPTS },
  { key: "status", label: "Статус", type: "select", options: ["Новая", "В работе", "Готово"] },
];

// общий склад данных (Vercel KV через /api/panel) с фолбэком на localStorage
function useShared(apiKey, initial) {
  const [val, setVal] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const lk = "interia_panel_" + apiKey;
  useEffect(() => {
    let alive = true;
    const arr = (x) => (Array.isArray(x) ? x : []);
    const readLocal = () => { try { return arr(JSON.parse(localStorage.getItem(lk) || "[]")); } catch { return []; } };
    fetch("/api/panel?key=" + apiKey, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const local = readLocal();
        const remote = arr(j && j.data);
        if (j && j.ok) {
          if (remote.length === 0 && local.length > 0) setVal(local); // миграция локального в общий
          else setVal(remote);
        } else if (local.length) setVal(local);
        setLoaded(true);
      })
      .catch(() => { const local = readLocal(); if (local.length) setVal(local); setLoaded(true); });
    return () => { alive = false; };
  }, [apiKey]);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(lk, JSON.stringify(val)); } catch (e) {}
    const t = setTimeout(() => {
      fetch("/api/panel?key=" + apiKey, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ data: val }) }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [val, loaded, apiKey]);
  return [val, setVal];
}

function emptyRow(cols) { const o = {}; cols.forEach((c) => (o[c.key] = "")); return o; }

function AutoTextarea({ value, onChange, placeholder, className }) {
  const ref = useRef(null);
  useEffect(() => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = Math.min(el.scrollHeight, 260) + "px"; } }, [value]);
  return <textarea ref={ref} rows={1} value={value} onChange={onChange} placeholder={placeholder} className={className} />;
}

function Tracker({ cols, rows, setRows }) {
  const raw = Array.isArray(rows) ? rows : [];
  const hasPriority = cols.some((c) => c.type === "priority");
  const PRANK = { "": 0, red: 1, yellow: 2, green: 3 }; // без цвета вверх, зелёный вниз
  const list = hasPriority
    ? raw.map((r, idx) => ({ r, idx })).sort((a, b) => ((PRANK[a.r.priority || ""] ?? 0) - (PRANK[b.r.priority || ""] ?? 0)) || (a.idx - b.idx)).map((x) => x.r)
    : raw;
  const update = (i, key, value) => setRows(list.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const add = () => setRows([...list, emptyRow(cols)]);
  const del = (i) => setRows(list.filter((_, idx) => idx !== i));
  const cyclePriority = (i, cur) => update(i, "priority", PRIORITY_ORDER[(PRIORITY_ORDER.indexOf(cur || "") + 1) % PRIORITY_ORDER.length]);
  const exportCsv = () => {
    const head = cols.map((c) => c.label).join(";");
    const body = list.map((r) => cols.map((c) => (r[c.key] || "").toString().replace(/;/g, ",").replace(/\n/g, " ")).join(";")).join("\n");
    const blob = new Blob(["﻿" + head + "\n" + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "interia.csv"; a.click();
  };

  const cellBase = "w-full rounded-md border border-white/10 bg-white/[.04] px-2.5 py-2 text-white outline-none transition placeholder:text-white/30 focus:border-white/40 focus:bg-white/[.08]";

  const renderCell = (c, r, i) => {
    if (c.type === "priority") {
      const col = PRIORITY_COLORS[r.priority];
      return (
        <button onClick={() => cyclePriority(i, r.priority)} title="Приоритет: клик меняет цвет (красный→жёлтый→зелёный)" className="mx-auto grid h-7 w-7 place-items-center rounded-full hover:bg-white/5">
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: col || "transparent", boxShadow: col ? "0 0 7px " + col : "none", border: col ? "none" : "1px solid rgba(255,255,255,.3)" }} />
        </button>
      );
    }
    if (c.type === "select") {
      const cur = r[c.key] || "";
      const opts = cur && !c.options.includes(cur) ? [cur, ...c.options] : c.options;
      return (
        <select value={cur} onChange={(e) => update(i, c.key, e.target.value)} className={cellBase + " min-w-[130px]"}>
          <option value="" className="bg-zinc-900">— {c.label} —</option>
          {opts.map((o) => (<option key={o} value={o} className="bg-zinc-900">{o}</option>))}
        </select>
      );
    }
    if (c.type === "textarea") {
      return <AutoTextarea value={r[c.key] || ""} onChange={(e) => update(i, c.key, e.target.value)} placeholder={c.label} className={cellBase + " min-w-[280px] resize-none leading-snug"} />;
    }
    return <input value={r[c.key] || ""} onChange={(e) => update(i, c.key, e.target.value)} placeholder={c.label} className={cellBase + " min-w-[120px]"} />;
  };

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button onClick={add} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">+ Строка</button>
        <button onClick={exportCsv} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">Экспорт CSV</button>
        <span className="ml-auto text-xs text-white/30">{list.length} шт.</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-10 border-b border-white/10 bg-white/[.03] px-2 py-2 text-center text-[11px] uppercase tracking-wider text-white/50">#</th>
              {cols.map((c) => (
                <th key={c.key} className={"whitespace-nowrap border-b border-white/10 bg-white/[.03] px-3 py-2 text-[11px] uppercase tracking-wider text-white/50 " + (c.narrow ? "w-10 text-center" : "text-left")}>{c.label}</th>
              ))}
              <th className="w-10 border-b border-white/10 bg-white/[.03] px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={cols.length + 2} className="px-3 py-6 text-center text-white/30">Пусто. Нажми «+ Строка».</td></tr>
            )}
            {list.map((r, i) => (
              <tr key={i} className="border-b border-white/[.05] transition-colors odd:bg-white/[.012] hover:bg-white/[.04]">
                <td className="px-2 py-1.5 text-center text-xs text-white/30">{i + 1}</td>
                {cols.map((c) => (
                  <td key={c.key} className={"px-2 py-1.5 align-middle " + (c.narrow ? "text-center" : "")}>{renderCell(c, r, i)}</td>
                ))}
                <td className="px-2 text-center align-middle">
                  <button onClick={() => del(i)} className="grid h-7 w-7 place-items-center rounded-md text-white/30 transition-colors hover:bg-red-500/15 hover:text-red-400" title="Удалить">✕</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function fmt(n) { return (n || 0).toLocaleString("ru-RU"); }

function ArtistSearch() {
  const [q, setQ] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [picked, setPicked] = useState(null);
  const [min, setMin] = useState(100000);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [scanned, setScanned] = useState([]);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [onlyContacts, setOnlyContacts] = useState(true);
  const [tplText, setTplText] = useState(OUTREACH_TEMPLATES[0].text);
  const [copiedId, setCopiedId] = useState(null);

  const api = (qs) => fetch("/api/ya?" + qs, { headers: authHeaders() }).then((r) => r.json());

  const copyMsg = async (a) => {
    const deltaStr = (a.delta >= 0 ? "+" : "−") + fmt(Math.abs(a.delta || 0));
    const msg = tplText
      .replace(/\{name\}/g, a.name)
      .replace(/\{listeners\}/g, fmt(a.listeners))
      .replace(/\{delta\}/g, "рост " + deltaStr);
    try { await navigator.clipboard.writeText(msg); }
    catch (e) {
      const ta = document.createElement("textarea"); ta.value = msg; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e2) {}
      document.body.removeChild(ta);
    }
    setCopiedId(a.id); setTimeout(() => setCopiedId(null), 1500);
  };

  const searchPl = async (e) => {
    if (e) e.preventDefault();
    setErr(""); setNote(""); setPlaylists([]);
    try {
      const j = await api("action=searchPlaylists&q=" + encodeURIComponent(q));
      if (!j.ok) throw new Error(j.error);
      setPlaylists(j.items || []);
      if (!(j.items || []).length) setNote("Ничего не нашлось — попробуй другой запрос.");
    } catch (x) { setErr("Не сработало. Поиск работает только на боевом сайте (не localhost) и при настроенном токене."); }
  };

  const scan = async (artists) => {
    setBusy(true); setScanned([]); setProgress({ done: 0, total: artists.length });
    const ids = artists.map((a) => a.id);
    const acc = [];
    const B = 15;
    for (let i = 0; i < ids.length; i += B) {
      try {
        const j = await api("action=artists&ids=" + ids.slice(i, i + B).join(","));
        (j.artists || []).forEach((a) => acc.push(a));
      } catch (x) {}
      setProgress({ done: Math.min(i + B, ids.length), total: ids.length });
      setScanned([...acc]);
    }
    setBusy(false);
  };

  const runPlaylist = async (p) => {
    setPicked(p); setErr(""); setNote(""); setBusy(true); setScanned([]);
    try {
      const j = await api("action=playlistArtists&owner=" + p.owner + "&kind=" + p.kind);
      if (!j.ok) throw new Error();
      await scan(j.artists || []);
    } catch (x) { setErr("Не удалось получить артистов плейлиста."); setBusy(false); }
  };

  const runChart = async () => {
    setPicked({ title: "Чарт России" }); setErr(""); setNote(""); setBusy(true); setScanned([]);
    try { const j = await api("action=chartArtists"); await scan(j.artists || []); }
    catch (x) { setErr("Чарт не сработал."); setBusy(false); }
  };

  const rows = scanned
    .filter((a) => a.listeners >= min)
    .filter((a) => (onlyContacts ? a.links && a.links.length > 0 : true))
    .sort((x, y) => y.listeners - x.listeners);

  const exportCsv = () => {
    const head = "Артист;Слушатели;Дельта;Контакты;Ссылка";
    const body = rows.map((a) => [a.name, a.listeners, a.delta, (a.links || []).map((l) => l.type + ":" + l.href).join(" "), a.url].join(";")).join("\n");
    const blob = new Blob(["﻿" + head + "\n" + body], { type: "text/csv;charset=utf-8" });
    const u = document.createElement("a"); u.href = URL.createObjectURL(blob); u.download = "artists.csv"; u.click();
  };

  return (
    <div>
      <form onSubmit={searchPl} className="mb-3 flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Плейлист: напр. бразильский фонк"
          className="min-w-[220px] flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/40" />
        <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">Найти плейлисты</button>
        <button type="button" onClick={runChart} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">Чарт РФ</button>
      </form>

      {playlists.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {playlists.map((p) => (
            <button key={p.owner + "-" + p.kind} onClick={() => runPlaylist(p)}
              className={"rounded-lg border px-3 py-2 text-left text-xs " + (picked && picked.owner === p.owner && picked.kind === p.kind ? "border-white bg-white/10" : "border-white/15 text-white/70 hover:bg-white/5")}>
              <div className="font-semibold text-white">{p.title}</div>
              <div className="text-white/40">{p.tracks} треков</div>
            </button>
          ))}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="text-sm text-white/60">Слушателей от:</label>
        <input type="number" value={min} onChange={(e) => setMin(+e.target.value || 0)}
          className="w-32 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none" />
        {[50000, 100000, 300000].map((v) => (
          <button key={v} onClick={() => setMin(v)} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60 hover:bg-white/5">{fmt(v)}+</button>
        ))}
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-white/60">
          <input type="checkbox" checked={onlyContacts} onChange={(e) => setOnlyContacts(e.target.checked)} className="h-4 w-4 accent-white" />
          Только с контактами
        </label>
        {scanned.length > 0 && <button onClick={exportCsv} className="ml-auto rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">Экспорт CSV</button>}
      </div>

      {err && <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
      {note && <div className="mb-3 text-sm text-white/40">{note}</div>}
      {busy && <div className="mb-3 text-sm text-white/60">Сканирую артистов: {progress.done} / {progress.total}…</div>}
      {picked && !busy && scanned.length > 0 && <div className="mb-2 text-sm text-white/50">{picked.title}: подходит <b className="text-white">{rows.length}</b> из {scanned.length} (порог {fmt(min)}+)</div>}

      {rows.length > 0 && (
        <div className="mb-3 rounded-xl border border-white/10 bg-white/[.02] p-3">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider text-white/40">Шаблон сообщения</span>
            {OUTREACH_TEMPLATES.map((t) => (
              <button key={t.name} onClick={() => setTplText(t.text)} className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/60 hover:bg-white/5">{t.name}</button>
            ))}
            <span className="ml-auto text-xs text-white/30">{"{name}"} → имя артиста</span>
          </div>
          <textarea value={tplText} onChange={(e) => setTplText(e.target.value)} rows={3}
            className="w-full resize-y rounded-md border border-white/10 bg-white/[.04] px-3 py-2 text-sm text-white outline-none focus:border-white/40" />
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full border-collapse text-sm">
            <thead><tr>
              {["#", "Артист", "Слушателей/мес", "Δ мес", "Контакты", "Я.Музыка", "Сообщение"].map((h) => (
                <th key={h} className="whitespace-nowrap border-b border-white/10 bg-white/[.03] px-3 py-2 text-left text-[11px] uppercase tracking-wider text-white/50">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={a.id} className="hover:bg-white/[.02]">
                  <td className="border-b border-white/[.06] px-3 py-2 text-white/30">{i + 1}</td>
                  <td className="border-b border-white/[.06] px-3 py-2 font-semibold text-white">{a.name}</td>
                  <td className="border-b border-white/[.06] px-3 py-2 text-white">{fmt(a.listeners)}</td>
                  <td className={"border-b border-white/[.06] px-3 py-2 " + (a.delta >= 0 ? "text-green-400" : "text-red-400")}>{a.delta >= 0 ? "+" : ""}{fmt(a.delta)}</td>
                  <td className="border-b border-white/[.06] px-3 py-2">
                    {(a.links && a.links.length) ? a.links.map((l, k) => (
                      <a key={k} href={l.href} target="_blank" rel="noreferrer" className="mr-2 inline-block text-white/70 underline hover:text-white">{l.type}</a>
                    )) : <span className="text-white/25">—</span>}
                  </td>
                  <td className="border-b border-white/[.06] px-3 py-2"><a href={a.url} target="_blank" rel="noreferrer" className="text-white/50 underline hover:text-white">открыть</a></td>
                  <td className="border-b border-white/[.06] px-3 py-2">
                    <button onClick={() => copyMsg(a)} className={"whitespace-nowrap rounded-md border px-2.5 py-1 text-xs transition " + (copiedId === a.id ? "border-green-500/40 text-green-400" : "border-white/15 text-white/80 hover:bg-white/5")}>
                      {copiedId === a.id ? "✓ скопировано" : "✉ копировать"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DashCard({ title, tag, items }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="font-semibold text-white">{title}</div>
        {tag && <span className="whitespace-nowrap text-[10px] uppercase tracking-wider text-white/40">{tag}</span>}
      </div>
      <ul className="space-y-1.5 text-sm text-white/60">
        {items.map((t, i) => <li key={i}>{t}</li>)}
      </ul>
    </div>
  );
}

function Dashboard() {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
        <div className="text-[11px] uppercase tracking-wider text-white/40">Как мы растём</div>
        <p className="mt-2 text-lg font-semibold text-white">Больше артистов → больше релизов → качественный питчинг → больше стримов.</p>
        <p className="mt-2 text-sm text-white/50">Бюджетов и маркетинга нет. Тянет команда за счёт инструментов и соцсетей. Сплит 90/10, при росте → 80/20. Без выдуманных бюджетов и платного промо.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <DashCard title="1 · Трафик артистов" tag="в работе" items={["Автопоиск через Яндекс.Музыку ✅", "Заготовки аутрича ✅", "Контакты из ВК — потом"]} />
        <DashCard title="2 · Инструменты" tag="в работе" items={["Панель + общие трекеры ✅", "A&R-поиск ✅", "Дашборд-вкладка ✅", "Отгрузка/связь с Believe — обсуждаем"]} />
        <DashCard title="3 · Соцсети" tag="в плане" items={["Instagram: профиль + план ✅", "Telegram + YouTube — дальше"]} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <DashCard title="Что НЕ делаем" items={["Выдуманные бюджеты и платное промо", "Фокус на 2–3 артистах вместо потока", "Сплит 70/30", "Форму с ПД до ИП + РКН"]} />
        <DashCard title="Сейчас в работе" items={["Разделили задачи: команда / A&R", "Связать релиз-трекер с Believe (обсуждаем)", "Соцсети: запуск Instagram", "Авторизация + безопасность — в планах"]} />
      </div>
      <div className="text-xs text-white/30">Полная версия — в файле ПЛАН ЛЕЙБЛА/ДЭШБОРД.html</div>
    </div>
  );
}

// ——— СОЦСЕТИ: Instagram (2 поста/нед: Вт ротация + Пт Release Day) ———
const IG_RELEASE = { key: "release", icon: "🎵", title: "Release Day", desc: "Главный пост недели. Новый сингл / EP / альбом. Релиз = событие." };
const IG_ROTATION = [
  { key: "achv", icon: "🏆", title: "Достижение артиста", desc: "Важное: 100K/500K/1M прослушиваний, редакторский плейлист, вирусный момент, крупная коллаба." },
  { key: "aotw", icon: "⭐", title: "Артист недели", desc: "Самый сильный релиз недели: арт/фото, краткая история, почему выбран, ссылка на трек." },
  { key: "inside", icon: "🏢", title: "Inside INTERIA", desc: "Закулисье: подготовка релизов, работа над сайтом, дизайн, команда, разбор демо, мерч." },
  { key: "archive", icon: "📚", title: "INTERIA Archive", desc: "История вышедшего релиза: создание, обложка, «год спустя», интересные факты." },
  { key: "atmo", icon: "🌑", title: "Атмосфера", desc: "Фирменный вайб: ACCESS GRANTED, SIGNAL RECEIVED, хром-крест, тизеры сайта. Редко." },
];
const IG_ANCHOR = new Date(2026, 6, 7); // вт 7 июля 2026 = Неделя 1, ротация[0]

function igPlanFor(date) {
  const dow = date.getDay();
  if (dow === 5) return IG_RELEASE;
  if (dow === 2) {
    const ms = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - Date.UTC(IG_ANCHOR.getFullYear(), IG_ANCHOR.getMonth(), IG_ANCHOR.getDate());
    const weeks = Math.round(ms / (7 * 86400000));
    return IG_ROTATION[((weeks % 5) + 5) % 5];
  }
  return null;
}

function SocialCalendar() {
  const today = new Date();
  const [cur, setCur] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [sel, setSel] = useState(null);
  const [done, setDone] = useShared("social_ig_done", []);
  const dkey = (d) => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  const isDone = (d) => done.includes(dkey(d));
  const toggleDone = (d) => { const k = dkey(d); setDone(done.includes(k) ? done.filter((x) => x !== k) : [...done, k]); };
  const y = cur.getFullYear(), m = cur.getMonth();
  const monthName = cur.toLocaleDateString("ru-RU", { month: "long", year: "numeric" });
  const startDow = (new Date(y, m, 1).getDay() + 6) % 7;
  const dim = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(new Date(y, m, d));
  const isToday = (d) => d && d.toDateString() === today.toDateString();
  const upcoming = [];
  for (let i = 0; i < 45 && upcoming.length < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const p = igPlanFor(d);
    if (p) upcoming.push({ d, p });
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => setCur(new Date(y, m - 1, 1))} className="rounded-md border border-white/15 px-3 py-1 text-sm text-white/70 hover:bg-white/5">←</button>
        <div className="text-sm font-semibold capitalize text-white">{monthName}</div>
        <button onClick={() => setCur(new Date(y, m + 1, 1))} className="rounded-md border border-white/15 px-3 py-1 text-sm text-white/70 hover:bg-white/5">→</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wider text-white/30">
        {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((w) => <div key={w} className="py-1">{w}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const p = igPlanFor(d);
          const doneD = p && isDone(d);
          return (
            <button key={i} onClick={() => setSel(p ? { d, p } : null)}
              className={"flex min-h-[54px] flex-col rounded-lg border p-1.5 text-left transition " +
                (p ? "border-white/15 bg-white/[.05] hover:bg-white/[.09]" : "border-transparent bg-white/[.015]") +
                (isToday(d) ? " ring-1 ring-white/60" : "") +
                (doneD ? " opacity-40 blur-[0.4px]" : "")}>
              <span className="text-[11px] text-white/40">{d.getDate()}</span>
              {p && <span className="mt-auto truncate text-[11px] text-white/80">{doneD ? "✓ " : ""}{p.icon} {p.title}</span>}
            </button>
          );
        })}
      </div>
      {sel && (
        <div className="mt-3 rounded-lg border border-white/15 bg-white/[.04] p-3">
          <div className="text-sm font-semibold text-white">{sel.p.icon} {sel.p.title} · {sel.d.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" })}</div>
          <div className="mt-1 text-sm text-white/60">{sel.p.desc}</div>
          <button onClick={() => toggleDone(sel.d)}
            className={"mt-3 rounded-md border px-3 py-1.5 text-sm transition " + (isDone(sel.d) ? "border-green-500/40 text-green-400" : "border-white/15 text-white/80 hover:bg-white/5")}>
            {isDone(sel.d) ? "✓ Выполнено — снять" : "Отметить выполненным"}
          </button>
        </div>
      )}
      <div className="mt-4">
        <div className="mb-2 text-[11px] uppercase tracking-wider text-white/40">Ближайшие посты</div>
        <div className="space-y-1.5">
          {upcoming.map(({ d, p }, i) => (
            <label key={i} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/10 bg-white/[.02] px-3 py-2 text-sm">
              <input type="checkbox" checked={isDone(d)} onChange={() => toggleDone(d)} className="h-4 w-4 accent-white" />
              <span className="w-28 shrink-0 text-white/50">{d.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "short" })}</span>
              <span className={"text-white " + (isDone(d) ? "line-through opacity-40" : "")}>{p.icon} {p.title}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function Social() {
  const [net, setNet] = useState("instagram");
  const nets = [["instagram", "Instagram"], ["telegram", "Telegram"], ["youtube", "YouTube"], ["tiktok", "TikTok"]];
  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {nets.map(([id, label]) => (
          <button key={id} onClick={() => id === "instagram" && setNet(id)} disabled={id !== "instagram"}
            className={"rounded-lg border px-3 py-2 text-sm " + (net === id ? "border-white bg-white/10 text-white" : id === "instagram" ? "border-white/15 text-white/70 hover:bg-white/5" : "cursor-not-allowed border-white/10 text-white/25")}>
            {label}{id !== "instagram" && " · скоро"}
          </button>
        ))}
      </div>
      {net === "instagram" && (
        <div>
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-white/60">
            <b className="text-white">Instagram · 2 поста/нед</b> — <b className="text-white">Вторник</b> (ротация рубрик) + <b className="text-white">Пятница</b> (Release Day). Ротация строится автоматически — план бесконечный.
          </div>
          <SocialCalendar />
          <div className="mt-4">
            <div className="mb-2 text-[11px] uppercase tracking-wider text-white/40">Рубрики</div>
            <div className="grid gap-2 sm:grid-cols-2">
              {[IG_RELEASE, ...IG_ROTATION].map((r) => (
                <div key={r.key} className="rounded-lg border border-white/10 bg-white/[.02] p-2.5">
                  <div className="text-sm font-semibold text-white">{r.icon} {r.title}</div>
                  <div className="mt-0.5 text-xs text-white/50">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 text-xs text-white/25">Дальше: кнопка «сгенерить и запостить» для Inst/TG, задачи-исполнителям для TikTok/YouTube. Полная стратегия — в ПЛАН ЛЕЙБЛА/СОЦСЕТИ-INSTAGRAM.md.</div>
        </div>
      )}
    </div>
  );
}

export default function Panel() {
  const [ok, setOk] = useState(() => sessionStorage.getItem("interia_panel_ok") === "1");
  const [pw, setPw] = useState("");
  const [login, setLogin] = useState("");
  const [authErr, setAuthErr] = useState("");
  const [userName, setUserName] = useState(() => sessionStorage.getItem("interia_panel_name") || "");
  const logout = () => { sessionStorage.removeItem("interia_panel_ok"); sessionStorage.removeItem(PKEY); sessionStorage.removeItem("interia_panel_name"); setOk(false); setPw(""); setUserName(""); };
  const [tab, setTab] = useState("dashboard");
  const [releases, setReleases] = useShared("releases", []);
  const [tasks, setTasks] = useShared("tasks", []);
  const [tasksAr, setTasksAr] = useShared("tasks_ar", []);

  if (!ok) {
    return (
      <div className="relative z-10 grid min-h-screen place-items-center px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setAuthErr("");
            fetch("/api/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login, password: pw }) })
              .then((r) => r.json())
              .then((j) => {
                if (j && j.ok) {
                  sessionStorage.setItem(PKEY, pw);
                  sessionStorage.setItem("interia_panel_name", j.name);
                  sessionStorage.setItem("interia_panel_ok", "1");
                  setUserName(j.name); setOk(true);
                } else { setAuthErr((j && j.error) || "Неверный логин или пароль"); }
              })
              .catch(() => setAuthErr("Сеть недоступна"));
          }}
          className="w-full max-w-xs"
        >
          <div className="mb-1 text-center text-2xl font-bold text-white">INTERIA!</div>
          <div className="mb-6 text-center text-sm text-white/40">Вход для команды</div>
          <input value={login} onChange={(e) => setLogin(e.target.value)} placeholder="Логин" autoFocus autoCapitalize="none" autoCorrect="off"
            className="mb-2 w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/40" />
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Пароль"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-white outline-none focus:border-white/40" />
          {authErr && <div className="mt-2 text-center text-sm text-red-400">{authErr}</div>}
          <button className="mt-3 w-full rounded-lg bg-white px-4 py-3 font-semibold text-black">Войти</button>
        </form>
      </div>
    );
  }

  return (
    <div className="relative z-10 min-h-screen px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-bold">INTERIA! · панель</div>
            <div className="text-xs text-white/40">{userName ? "Вошёл: " + userName : "Командный штаб"}</div>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <a href="#top" className="whitespace-nowrap hover:text-white">← на сайт</a>
            <button onClick={logout} className="whitespace-nowrap rounded-md border border-white/15 px-2.5 py-1 hover:bg-white/5 hover:text-white">Выйти</button>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {[["dashboard", "Планы"], ["releases", "Релизы"], ["tasks", "Задачи"], ["tasks_ar", "Задачи A&R"], ["social", "📣 Соцсети"], ["search", "🔎 Поиск артистов"], ["bible", "📖 Библия"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={"rounded-full px-4 py-2 text-sm " + (tab === id ? "bg-white font-semibold text-black" : "border border-white/15 text-white/70 hover:bg-white/5")}>{label}</button>
          ))}
        </div>

        {tab === "dashboard" ? <Dashboard />
          : tab === "releases" ? <Tracker cols={RELEASE_COLS} rows={releases} setRows={setReleases} />
          : tab === "tasks" ? <Tracker cols={TASK_COLS} rows={tasks} setRows={setTasks} />
          : tab === "tasks_ar" ? <Tracker cols={TASK_AR_COLS} rows={tasksAr} setRows={setTasksAr} />
          : tab === "social" ? <Social />
          : tab === "bible" ? <Bible />
          : <ArtistSearch />}
      </div>
    </div>
  );
}
