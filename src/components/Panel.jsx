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

// общий склад данных (Vercel KV) с фолбэком на localStorage.
// Анти-баг «удалённое возвращается»: refresh при фокусе окна + dirty-guard (не перезаписываем несохранённым).
const arrOf = (x) => (Array.isArray(x) ? x : []);
function useShared(apiKey, initial) {
  const [val, setVal] = useState(initial);
  const [loaded, setLoaded] = useState(false);
  const dirty = useRef(false); // есть несохранённые локальные изменения
  const lk = "interia_panel_" + apiKey;
  const readLocal = () => { try { return arrOf(JSON.parse(localStorage.getItem(lk) || "[]")); } catch { return []; } };

  useEffect(() => {
    let alive = true;
    fetch("/api/panel?key=" + apiKey, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        const local = readLocal();
        const remote = arrOf(j && j.data);
        if (j && j.ok) {
          if (remote.length === 0 && local.length > 0) setVal(local); // миграция локального в общий
          else setVal(remote);
        } else if (local.length) setVal(local);
        setLoaded(true);
      })
      .catch(() => { const local = readLocal(); if (local.length) setVal(local); setLoaded(true); });
    return () => { alive = false; };
  }, [apiKey]);

  // сохранение (debounce). Отмечаем dirty, пока запись не долетела до сервера.
  useEffect(() => {
    if (!loaded) return;
    dirty.current = true;
    try { localStorage.setItem(lk, JSON.stringify(val)); } catch (e) {}
    const t = setTimeout(() => {
      fetch("/api/panel?key=" + apiKey, { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ data: val }) })
        .then(() => { dirty.current = false; })
        .catch(() => { dirty.current = false; });
    }, 600);
    return () => clearTimeout(t);
  }, [val, loaded, apiKey]);

  // при возврате в окно/вкладку — подтягиваем свежее с сервера (если нет несохранённых правок)
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState !== "visible" || dirty.current) return;
      fetch("/api/panel?key=" + apiKey, { headers: authHeaders() })
        .then((r) => r.json())
        .then((j) => { if (j && j.ok && !dirty.current) setVal(arrOf(j.data)); })
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("focus", refresh);
    return () => { document.removeEventListener("visibilitychange", refresh); window.removeEventListener("focus", refresh); };
  }, [apiKey]);

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
                      <a key={k} href={/^https?:\/\//i.test(l.href || "") ? l.href : "#"} target="_blank" rel="noreferrer noopener" className="mr-2 inline-block text-white/70 underline hover:text-white">{l.type}</a>
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

// ——— ПУЛЬТ АРТИСТОВ (Label OS): артист → треки, вёдра INTERIA CONTROL ———
const normArtist = (a) => ({
  ...a,
  artist: a.artist || "", chat: a.chat || "", owner: a.owner || "", contact: a.contact || "",
  docs: a.docs !== undefined ? !!a.docs : !!a.f_doc, last: a.last || "", note: a.note || "",
  tracks: Array.isArray(a.tracks) ? a.tracks : [],
});
const dslA = (s) => { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : Math.floor((Date.now() - d.getTime()) / 86400000); };
const thisWeek = (s) => { if (!s) return false; const d = new Date(s); if (isNaN(d.getTime())) return false; const diff = (Date.now() - d.getTime()) / 86400000; return diff >= -1 && diff <= 7; };
const need_cover = (t) => t.form && !t.cover;
const ready_dsp = (t) => t.form && t.cover && !t.shipped;
const need_pitch = (t) => t.shipped && !t.pitch;
const rel_week = (t) => t.released && thisWeek(t.date);

const INTENT_UI = {
  new_track:   { icon: "🎵", label: "Хочет отгрузить трек",   cls: "border-green-500/30 text-green-400"   },
  in_progress: { icon: "🔨", label: "Дорабатывает трек",      cls: "border-blue-500/30 text-blue-400"    },
  promised:    { icon: "📅", label: "Обещал дату отгрузки",   cls: "border-yellow-500/30 text-yellow-300" },
  left:        { icon: "🚫", label: "Сигнализирует об уходе", cls: "border-red-500/40 text-red-400"      },
};

// Авто-вычисляет КОНКРЕТНОЕ следующее действие для менеджера
function getAction(a) {
  const ds = dslA(a.last);
  const tracks = Array.isArray(a.tracks) ? a.tracks : [];
  if (a.intent?.type === "left") return { lvl: "red", txt: "🚫 Сигнал об уходе — срочно поговорить" };
  if (!a.docs)
    return { lvl: "red",    txt: "Запросить форму документов" };
  const noForm = tracks.find(t => !t.released && !t.form);
  if (noForm)
    return { lvl: "red",    txt: "Напомнить заполнить форму трека" };
  const noCover = tracks.find(t => !t.released && t.form && !t.cover);
  if (noCover)
    return { lvl: "red",    txt: `Запросить обложку: «${noCover.title || "трек"}»` };
  const notShip = tracks.find(t => t.cover && !t.shipped);
  if (notShip)
    return { lvl: "blue",   txt: `Отгрузить на DSP: «${notShip.title || "трек"}»` };
  if (ds !== null && ds >= 14)
    return { lvl: "red",    txt: `Не отвечает ${ds} дн. — срочно написать` };
  if (ds !== null && ds >= 7)
    return { lvl: "yellow", txt: `Молчит ${ds} дн. — написать в чат` };
  if (tracks.length === 0)
    return { lvl: "yellow", txt: "Нет треков — запросить материал" };
  if (tracks.every(t => t.released))
    return { lvl: "green",  txt: "Все треки вышли — планировать следующий" };
  return           { lvl: "ok",    txt: "В процессе" };
}

const CONTROL = [
  ["attention", "🔴 Требуют внимания"], ["overdue", "🟡 Просрочено"], ["ready", "🟢 Готово к DSP"],
  ["docs", "📄 Ждут документы"], ["cover", "🎨 Ждут обложку"], ["pitch", "📝 Ждут питч"], ["week", "🎵 Релизы недели"],
];

function ArtistBoard() {
  const [rows, setRows] = useShared("artists", []);
  const list = (Array.isArray(rows) ? rows : []).map(normArtist);
  const [filter, setFilter] = useState(null);
  const [open, setOpen] = useState(null);
  const [sent, setSent] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const sendWelcome = (a) => {
    if (!a.tgChatId) return;
    fetch("/api/tg-send", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ chatId: a.tgChatId }) })
      .then((r) => r.json())
      .then((j) => { if (j && j.ok) { setSent((s) => ({ ...s, [a.tgChatId]: true })); setTimeout(() => setSent((s) => { const n = { ...s }; delete n[a.tgChatId]; return n; }), 3000); } else alert("Не отправилось: " + ((j && j.error) || "")); })
      .catch(() => alert("Ошибка сети"));
  };

  const setA = (i, patch) => setRows(list.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  const addA = () => setRows([...list, normArtist({})]);
  const delA = (i) => setRows(list.filter((_, idx) => idx !== i));
  const setTracks = (i, tracks) => setA(i, { tracks });
  const addT = (i) => setTracks(i, [...list[i].tracks, { title: "", form: false, cover: false, shipped: false, pitch: false, released: false, date: "" }]);
  const updT = (i, ti, patch) => setTracks(i, list[i].tracks.map((t, idx) => (idx === ti ? { ...t, ...patch } : t)));
  const delT = (i, ti) => setTracks(i, list[i].tracks.filter((_, idx) => idx !== ti));

  const preds = {
    attention: (a) => getAction(a).lvl === "red",
    overdue:   (a) => getAction(a).lvl === "yellow",
    ready: (a) => a.tracks.some(ready_dsp), docs: (a) => !a.docs,
    cover: (a) => a.tracks.some(need_cover), pitch: (a) => a.tracks.some(need_pitch), week: (a) => a.tracks.some(rel_week),
  };
  const counts = Object.fromEntries(CONTROL.map(([k]) => [k, list.filter(preds[k]).length]));
  const indexed = list.map((a, i) => ({ a, i })).filter(({ a }) => !filter || preds[filter](a));

  const inp = "rounded-md border border-white/10 bg-white/[.04] px-2.5 py-1.5 text-white outline-none placeholder:text-white/30 focus:border-white/40 focus:bg-white/[.08]";
  const Chk = ({ on, onClick }) => <button onClick={onClick} className={"mx-auto grid h-6 w-6 place-items-center rounded border text-xs transition " + (on ? "border-green-500/40 bg-green-500/15 text-green-400" : "border-white/15 text-white/20 hover:bg-white/5")}>{on ? "✓" : ""}</button>;
  const summary = (a) => {
    const shipped = a.tracks.filter((t) => t.shipped).length;
    const cur = a.tracks.find((t) => !t.released);
    let st = "";
    if (cur) { if (!cur.form) st = "ждёт трек-форму"; else if (!cur.cover) st = "ждёт обложку"; else if (!cur.shipped) st = "готово к DSP"; else if (!cur.pitch) st = "ждёт питч"; else st = "ждёт выхода"; }
    return { shipped, cur, st };
  };

  // Срочный список: что делать прямо сейчас
  const urgentList = list
    .map((a, i) => ({ a, i, act: getAction(a) }))
    .filter(({ act }) => ["red", "blue", "yellow"].includes(act.lvl))
    .sort((x, y) => { const o = { red: 0, blue: 1, yellow: 2 }; return (o[x.act.lvl] ?? 3) - (o[y.act.lvl] ?? 3); });

  return (
    <div>
      {/* ⚡ НУЖНО СДЕЛАТЬ — главный экран */}
      {urgentList.length === 0
        ? <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3 text-sm text-green-400">✅ Активных задач нет — все артисты в порядке</div>
        : (
          <div className="mb-4 rounded-xl border border-white/10 bg-black/50 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/60">⚡ Нужно сделать</span>
              {urgentList.filter(x => x.act.lvl === "red").length > 0 && <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-400">● {urgentList.filter(x => x.act.lvl === "red").length} срочно</span>}
              {urgentList.filter(x => x.act.lvl === "blue").length > 0 && <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] text-blue-400">▶ {urgentList.filter(x => x.act.lvl === "blue").length} отгрузить</span>}
              {urgentList.filter(x => x.act.lvl === "yellow").length > 0 && <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[11px] text-yellow-400">◑ {urgentList.filter(x => x.act.lvl === "yellow").length} молчат</span>}
            </div>
            <div className="divide-y divide-white/[.04]">
              {urgentList.slice(0, 12).map(({ a, i, act }) => (
                <div key={i} className="flex cursor-pointer items-center gap-3 rounded px-1 py-1.5 hover:bg-white/[.04]"
                  onClick={() => { setFilter(null); setOpen(i); }}>
                  <span className={"shrink-0 text-sm " + (act.lvl === "red" ? "text-red-400" : act.lvl === "blue" ? "text-blue-400" : "text-yellow-400")}>
                    {act.lvl === "red" ? "●" : act.lvl === "blue" ? "▶" : "◑"}
                  </span>
                  <span className="w-28 shrink-0 truncate text-sm font-medium text-white">{a.artist || "—"}</span>
                  <span className="text-xs text-white/50">{act.txt}</span>
                  {a.chat && (
                    <a href={/^https?:\/\//.test(a.chat) ? a.chat : "https://" + a.chat} target="_blank" rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="ml-auto shrink-0 rounded border border-blue-500/30 px-2 py-0.5 text-[11px] text-blue-400 hover:bg-blue-500/10">
                      чат →
                    </a>
                  )}
                </div>
              ))}
              {urgentList.length > 12 && <div className="pt-2 text-center text-xs text-white/30">ещё {urgentList.length - 12} артистов…</div>}
            </div>
          </div>
        )
      }
      <div className="mb-4 flex flex-wrap gap-2">
        {CONTROL.map(([k, label]) => (
          <button key={k} onClick={() => setFilter(filter === k ? null : k)}
            className={"rounded-lg border px-3 py-1.5 text-xs transition " + (filter === k ? "border-white bg-white/10 text-white" : "border-white/15 text-white/70 hover:bg-white/5")}>
            {label} <span className="ml-1 font-bold text-white">{counts[k]}</span>
          </button>
        ))}
        {filter && <button onClick={() => setFilter(null)} className="rounded-lg px-3 py-1.5 text-xs text-white/40 hover:text-white">сбросить ✕</button>}
      </div>

      <div className="mb-3 flex items-center gap-2">
        <button onClick={addA} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">+ Артист</button>
        <button onClick={() => {
          const seen = new Map();
          const deduped = [];
          for (const a of list) {
            const key = (a.artist || "").toLowerCase().trim();
            if (!key) { deduped.push(a); continue; }
            if (!seen.has(key)) { seen.set(key, deduped.length); deduped.push(a); }
            else {
              // оставляем того у кого больше треков / данных
              const prev = deduped[seen.get(key)];
              if ((a.tracks || []).length > (prev.tracks || []).length) deduped[seen.get(key)] = a;
            }
          }
          if (deduped.length < list.length) {
            setRows(deduped);
            alert("Убрано дублей: " + (list.length - deduped.length));
          } else {
            alert("Дублей не найдено");
          }
        }} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 hover:bg-white/5">
          Убрать дубли
        </button>
        <span className="ml-auto text-xs text-white/30">{indexed.length}{filter ? " / " + list.length : ""} артистов</span>
      </div>

      <div className="space-y-2">
        {indexed.length === 0 && <div className="rounded-xl border border-white/10 px-3 py-6 text-center text-sm text-white/30">{filter ? "В этой категории пусто." : "Пусто. Нажми «+ Артист»."}</div>}
        {indexed.map(({ a, i }) => {
          const s = summary(a); const ds = dslA(a.last); const silent = ds != null && ds >= 5; const isOpen = open === i;
          return (
            <div key={i} className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2 p-2.5">
                <input value={a.artist} onChange={(e) => setA(i, { artist: e.target.value })} placeholder="Артист" className={inp + " w-40"} />
                <span className="flex items-center gap-1.5 text-xs text-white/50">📄 <Chk on={a.docs} onClick={() => setA(i, { docs: !a.docs })} /></span>
                <span className="text-xs text-white/50">отгружено <b className="text-white">{s.shipped}</b></span>
                {(() => {
                  const act = getAction(a);
                  const cls = { red: "border-red-500/40 text-red-400", blue: "border-blue-500/40 text-blue-400", yellow: "border-yellow-500/40 text-yellow-300", green: "border-green-500/30 text-green-400", ok: "border-white/10 text-white/25" };
                  return <span className={"rounded-full border px-2.5 py-0.5 text-[11px] " + (cls[act.lvl] || cls.ok)}>{act.txt}</span>;
                })()}
                {ds != null && <span className="text-[11px] text-white/30">{ds === 0 ? "сегодня" : ds + " дн"}</span>}
                {a.intent && INTENT_UI[a.intent.type] && (
                  <span className={"rounded-full border px-2.5 py-0.5 text-[11px] " + INTENT_UI[a.intent.type].cls}
                    title={"Обновлено: " + (a.intent.updatedAt || "—")}>
                    {INTENT_UI[a.intent.type].icon} {a.intent.detail || INTENT_UI[a.intent.type].label}
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <button onClick={() => setOpen(isOpen ? null : i)} className="rounded-md border border-white/15 px-2.5 py-1 text-xs text-white/70 hover:bg-white/5">{isOpen ? "Свернуть" : "Открыть"}</button>
                  <button onClick={() => delA(i)} className="grid h-7 w-7 place-items-center rounded-md text-white/30 hover:bg-red-500/15 hover:text-red-400">✕</button>
                </div>
              </div>
              {isOpen && (
                <div className="border-t border-white/[.06] p-3">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <input value={a.chat} onChange={(e) => setA(i, { chat: e.target.value })} placeholder="ссылка на чат (t.me/…)" className={inp + " min-w-[160px] flex-1"} />
                    <input value={a.contact} onChange={(e) => setA(i, { contact: e.target.value })} placeholder="контакт" className={inp + " w-44"} />
                    <input type="date" value={a.last} onChange={(e) => setA(i, { last: e.target.value })} className={inp + " w-40 [color-scheme:dark]"} />
                    {a.chat && <a href={/^https?:\/\//.test(a.chat) ? a.chat : "https://" + a.chat} target="_blank" rel="noreferrer" className="rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5">чат ↗</a>}
                    {a.tgChatId && <button onClick={() => sendWelcome(a)} className={"rounded-md border px-3 py-1.5 text-xs transition " + (sent[a.tgChatId] ? "border-green-500/40 text-green-400" : "border-white/15 text-white/70 hover:bg-white/5")}>{sent[a.tgChatId] ? "✓ отправлено" : "✉ Отправить приветствие"}</button>}
                  </div>
                  <textarea
                    value={a.note}
                    onChange={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; setA(i, { note: e.target.value }); }}
                    ref={(el) => { if (el) { el.style.height = "auto"; el.style.height = Math.max(el.scrollHeight, 56) + "px"; } }}
                    placeholder="заметка (авто-обновляется от AI в 5:00 МСК)"
                    rows={1}
                    className={inp + " mb-3 w-full resize-none leading-relaxed overflow-hidden"}
                  />
                  <div className="overflow-x-auto rounded-lg border border-white/10">
                    <table className="w-full border-collapse text-sm">
                      <thead><tr>
                        {["#", "Трек", "Трек-форма", "Обложка", "Отгружен", "Питч", "Вышел", "Дата", ""].map((h, k) => <th key={k} className="whitespace-nowrap border-b border-white/10 bg-white/[.03] px-2.5 py-1.5 text-left text-[10px] uppercase tracking-wider text-white/50">{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {a.tracks.length === 0 && <tr><td colSpan={9} className="px-3 py-3 text-center text-xs text-white/30">Треков нет. Нажми «+ трек».</td></tr>}
                        {a.tracks.map((t, ti) => (
                          <tr key={ti} className="border-b border-white/[.05]">
                            <td className="px-2.5 py-1.5 text-white/30">{ti + 1}</td>
                            <td className="px-1.5 py-1"><input value={t.title} onChange={(e) => updT(i, ti, { title: e.target.value })} placeholder="название" className={inp + " min-w-[140px]"} /></td>
                            <td className="px-1.5 text-center"><Chk on={t.form} onClick={() => updT(i, ti, { form: !t.form })} /></td>
                            <td className="px-1.5 text-center"><Chk on={t.cover} onClick={() => updT(i, ti, { cover: !t.cover })} /></td>
                            <td className="px-1.5 text-center"><Chk on={t.shipped} onClick={() => updT(i, ti, { shipped: !t.shipped })} /></td>
                            <td className="px-1.5 text-center"><Chk on={t.pitch} onClick={() => updT(i, ti, { pitch: !t.pitch })} /></td>
                            <td className="px-1.5 text-center"><Chk on={t.released} onClick={() => updT(i, ti, { released: !t.released })} /></td>
                            <td className="px-1.5 py-1"><input type="date" value={t.date} onChange={(e) => updT(i, ti, { date: e.target.value })} className={inp + " w-32 [color-scheme:dark]"} /></td>
                            <td className="px-1.5 text-center"><button onClick={() => delT(i, ti)} className="text-white/30 hover:text-red-400">✕</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <button onClick={() => addT(i)} className="mt-2 rounded-md border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5">+ трек</button>
                  {a.tgChatId && (
                    <button disabled={!!aiLoading[a.tgChatId]} onClick={() => {
                      setAiLoading(s => ({ ...s, [a.tgChatId]: true }));
                      fetch("/api/ai-summary", { method: "POST", headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify({ tgChatId: a.tgChatId }) })
                        .then(r => r.json())
                        .then(j => {
                          setAiLoading(s => { const n = { ...s }; delete n[a.tgChatId]; return n; });
                          if (j.ok && j.summary) {
                            setA(i, { note: "🧠 " + new Date().toLocaleDateString("ru-RU") + ": " + j.summary });
                          } else {
                            alert("Ошибка: " + (j.error || "?"));
                          }
                        })
                        .catch(() => { setAiLoading(s => { const n = { ...s }; delete n[a.tgChatId]; return n; }); alert("Ошибка сети"); });
                    }} className={"mt-3 rounded-md border px-3 py-1.5 text-xs transition " + (aiLoading[a.tgChatId] ? "border-white/10 text-white/30 cursor-wait" : "border-white/15 text-white/70 hover:bg-white/5")}>
                      {aiLoading[a.tgChatId] ? "⏳ Генерирую сводку…" : "🧠 Обновить AI-сводку"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 text-xs text-white/25">Пока заполняем вручную. Дальше: формы ставят галочки сами (B), Яндекс отмечает «Вышел» (C), бот + AI-сводки чатов (D).</div>
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
  const groqExpiry = new Date("2025-01-01");
  const daysLeft = Math.ceil((new Date("2026-01-01") - new Date()) / 86400000);
  return (
    <div className="space-y-4">
      {daysLeft <= 60 && (
        <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm text-yellow-300">
          ⚠️ Groq API ключ истекает 1 января 2027 — осталось {daysLeft} дн. Зайди на <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="underline">console.groq.com</a> и создай новый ключ → обнови в Vercel → Settings → Environment Variables → GROQ_API_KEY.
        </div>
      )}
      <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">
        <div className="text-[11px] uppercase tracking-wider text-white/40">Курс</div>
        <p className="mt-2 text-lg font-semibold text-white">Строим операционную систему лейбла (Label OS), а не просто CRM.</p>
        <p className="mt-2 text-sm text-white/50">Экран показывает «что делать сегодня». Статус берём из форм / Яндекса / бота, а не из чтения чатов. Рост: больше артистов → релизов → питчинг. Сплит 90/10 → 80/20. Без выдуманных бюджетов.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <DashCard title="✅ Уже работает" items={[
          "Сайт на домене + SSL + OG",
          "Приложение: PWA (телефон) + .exe (ПК)",
          "Панель с логинами на каждого (БД пользователей)",
          "Трекеры: Релизы · Задачи · Задачи A&R (общие)",
          "A&R-автопоиск артистов (Яндекс) + аутрич-шаблоны",
          "Соцсети: календарь Instagram (авто-ротация Вт/Пт)",
          "INTERIA Bible · языки (5) · аудит безопасности",
        ]} />
        <DashCard title="🚧 Строим: Пульт артистов (Label OS)" tag="в работе" items={[
          "Главный экран INTERIA CONTROL — вёдра работы",
          "(требуют внимания · просрочено · готово к DSP · ждут доки/обложку/питч)",
          "Карточка артиста → его треки + статусы по каждому",
          "🧠 AI-сводка чата (30 сек вместо 300 сообщений)",
          "Фазы: A оболочка · B формы→авто-статус · C Яндекс «вышел» · D бот+AI",
        ]} />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <DashCard title="💡 Идеи / бэклог" items={[
          "Believe: план интеграции (доступ уже дали) ⭐",
          "Брендовые HTML-письма (лого, красивое оформление)",
          "Автозаполнение форм из профиля артиста",
          "Логин через почту",
          "Контент-планы Telegram + YouTube · контакты из ВК",
          "Свои формы (docs/track/pitch) после ИП",
        ]} />
        <DashCard title="🎯 Принципы" items={[
          "Работа-первична: экран = что делать сегодня, не список людей",
          "Статус — из форм/Яндекса/бота, не из чтения чатов",
          "Telegram — источник данных, а не место работы",
          "Один owner на задачу · всё в общем хранилище · без бюджетов",
        ]} />
      </div>
      <div className="text-xs text-white/25">Подробно: ПЛАН ЛЕЙБЛА → ПУЛЬТ-АРТИСТОВ.md · ДЭШБОРД.html · БЕЗОПАСНОСТЬ.md</div>
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

// ——— РЕЛИЗЫ: авто-каталог лейбла с Яндекс.Музыки ———
function LabelReleases() {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState("");
  useEffect(() => {
    fetch("/api/ya?action=labelReleases", { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => { if (j && j.ok) setRows(j.albums || []); else setErr("Не удалось загрузить каталог."); setBusy(false); })
      .catch(() => { setErr("Ошибка сети (работает только на боевом сайте)."); setBusy(false); });
  }, []);
  const cov = (c) => (c ? "https://" + c.replace("%%", "100x100") : "");
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="text-sm text-white/60">Каталог лейбла с Яндекс.Музыки — обновляется сам</div>
        <span className="ml-auto text-xs text-white/30">{rows.length} релизов</span>
      </div>
      {busy && <div className="text-sm text-white/50">Загружаю каталог…</div>}
      {err && <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{err}</div>}
      {!busy && !err && (
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/30 backdrop-blur-sm">
          <table className="w-full border-collapse text-sm">
            <thead><tr>
              {["#", "", "Релиз", "Артисты", "Год", ""].map((h, i) => <th key={i} className="whitespace-nowrap border-b border-white/10 bg-white/[.03] px-3 py-2 text-left text-[11px] uppercase tracking-wider text-white/50">{h}</th>)}
            </tr></thead>
            <tbody>
              {rows.map((a, i) => (
                <tr key={a.id} className="border-b border-white/[.05] odd:bg-white/[.012] hover:bg-white/[.04]">
                  <td className="px-3 py-2 text-white/30">{i + 1}</td>
                  <td className="px-2 py-1.5">{a.cover ? <img src={cov(a.cover)} alt="" loading="lazy" className="h-9 w-9 rounded object-cover" /> : <div className="h-9 w-9 rounded bg-white/5" />}</td>
                  <td className="px-3 py-2 font-semibold text-white">{a.title}</td>
                  <td className="px-3 py-2 text-white/70">{a.artists}</td>
                  <td className="px-3 py-2 text-white/50">{a.year || ""}</td>
                  <td className="px-3 py-2"><a href={a.url} target="_blank" rel="noreferrer" className="whitespace-nowrap text-white/50 underline hover:text-white">открыть ↗</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ——— СЕГОДНЯ: что нужно сделать сегодня (соцсети + задачи + артисты) ———
function Today({ go }) {
  const [tasks] = useShared("tasks", []);
  const [tasksAr] = useShared("tasks_ar", []);
  const [artists] = useShared("artists", []);
  const [igDone] = useShared("social_ig_done", []);
  const now = new Date();
  const dateStr = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  const igPlan = igPlanFor(now);
  const dk = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
  const igPosted = (igDone || []).includes(dk);

  const openTasks = [...(tasks || []), ...(tasksAr || [])].filter((t) => t && t.task && t.status !== "Готово");
  const prank = { "": 1, red: 0, yellow: 2, green: 3 };
  openTasks.sort((a, b) => (prank[a.priority || ""] ?? 1) - (prank[b.priority || ""] ?? 1));

  const attn = (artists || []).map(normArtist).filter((a) => a.artist).map((a) => {
    const ds = dslA(a.last); let need = "";
    if (!a.docs) need = "нет документов";
    else if (a.tracks.some(need_pitch)) need = "ждёт питч";
    else if (a.tracks.some(ready_dsp)) need = "готово к DSP";
    else if (a.tracks.some(need_cover)) need = "ждёт обложку";
    if (ds != null && ds >= 5) need = (need ? need + " · " : "") + "молчит " + ds + " дн";
    return { name: a.artist, need };
  }).filter((x) => x.need);

  const Card = ({ children }) => <div className="rounded-xl border border-white/10 bg-white/[.03] p-4">{children}</div>;
  const Btn = ({ tab, children }) => <button onClick={() => go(tab)} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-white/70 hover:bg-white/5">{children}</button>;

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold capitalize text-white">Сегодня · {dateStr}</div>
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <div className="mb-1 text-[11px] uppercase tracking-wider text-white/40">📣 Соцсети</div>
          {igPlan ? (igPosted
            ? <div className="text-sm text-green-400">✅ Пост отмечен выполненным</div>
            : <div><div className="text-white">Сегодня пост в Instagram:</div><div className="mt-1 text-lg font-semibold text-white">{igPlan.icon} {igPlan.title}</div></div>)
            : <div className="text-sm text-white/40">Сегодня постов по плану нет</div>}
          <div className="mt-3"><Btn tab="social">К соцсетям →</Btn></div>
        </Card>
        <Card>
          <div className="mb-1 flex items-center justify-between"><span className="text-[11px] uppercase tracking-wider text-white/40">✅ Задачи</span><span className="text-2xl font-bold text-white">{openTasks.length}</span></div>
          <ul className="space-y-1 text-sm text-white/60">
            {openTasks.slice(0, 5).map((t, i) => <li key={i} className="truncate">{t.priority === "red" ? "🔴 " : ""}{t.task} <span className="text-white/30">· {t.owner || "—"}</span></li>)}
            {openTasks.length === 0 && <li className="text-white/30">Всё закрыто 🎉</li>}
          </ul>
          <div className="mt-3"><Btn tab="tasks">К задачам →</Btn></div>
        </Card>
        <Card>
          <div className="mb-1 flex items-center justify-between"><span className="text-[11px] uppercase tracking-wider text-white/40">🎛 Артисты — внимание</span><span className="text-2xl font-bold text-white">{attn.length}</span></div>
          <ul className="space-y-1 text-sm text-white/60">
            {attn.slice(0, 5).map((a, i) => <li key={i} className="truncate"><span className="text-white">{a.name}</span> <span className="text-white/40">— {a.need}</span></li>)}
            {attn.length === 0 && <li className="text-white/30">Никто не требует действий</li>}
          </ul>
          <div className="mt-3"><Btn tab="artists">К пульту →</Btn></div>
        </Card>
      </div>
      <div className="rounded-xl border border-white/10 bg-white/[.02] p-3 text-xs text-white/40">Заходи сюда каждый день — здесь вся картина дня: что постить, какие задачи и кто из артистов требует действий.</div>
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
  const [tab, setTab] = useState(() => { try { return localStorage.getItem("interia_panel_tab") || "today"; } catch { return "today"; } });
  const [navOpen, setNavOpen] = useState(true);
  useEffect(() => { try { localStorage.setItem("interia_panel_tab", tab); } catch (e) {} }, [tab]);
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

        {/* Навигация — закрываемая */}
        {(() => {
          const TABS = [["today","🏠 Сегодня"],["artists","🎛 Пульт артистов"],["dashboard","Дашборд"],["releases","Релизы"],["tasks","Задачи"],["tasks_ar","Задачи A&R"],["social","📣 Соцсети"],["search","🔎 Поиск артистов"],["bible","📚 База знаний"]];
          const activeLabel = TABS.find(([id]) => id === tab)?.[1] || tab;
          return (
            <div className="mb-5">
              {navOpen ? (
                <div className="flex flex-wrap items-center gap-2">
                  {TABS.map(([id, label]) => (
                    <button key={id} onClick={() => setTab(id)} className={"rounded-full px-4 py-2 text-sm " + (tab === id ? "bg-white font-semibold text-black" : "border border-white/15 text-white/70 hover:bg-white/5")}>{label}</button>
                  ))}
                  <button onClick={() => setNavOpen(false)} className="ml-auto rounded-full border border-white/10 px-3 py-2 text-xs text-white/30 hover:bg-white/5 hover:text-white/70" title="Скрыть меню">✕</button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => setNavOpen(true)} className="rounded-full border border-white/15 px-3 py-2 text-sm text-white/70 hover:bg-white/5">☰</button>
                  <span className="text-sm text-white/50">{activeLabel}</span>
                </div>
              )}
            </div>
          );
        })()}

        {tab === "today" ? <Today go={setTab} />
          : tab === "artists" ? <ArtistBoard />
          : tab === "dashboard" ? <Dashboard />
          : tab === "releases" ? <LabelReleases />
          : tab === "tasks" ? <Tracker cols={TASK_COLS} rows={tasks} setRows={setTasks} />
          : tab === "tasks_ar" ? <Tracker cols={TASK_AR_COLS} rows={tasksAr} setRows={setTasksAr} />
          : tab === "social" ? <Social />
          : tab === "bible" ? <Bible />
          : <ArtistSearch />}
      </div>
    </div>
  );
}
