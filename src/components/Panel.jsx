import { useState, useEffect } from "react";

// Пароль панели. Поменять при необходимости (видим только мы).
const PASS = "INTERIA";

const RELEASE_COLS = [
  { key: "artist", label: "Артист" },
  { key: "title", label: "Релиз" },
  { key: "status", label: "Статус", type: "select", options: ["Демо", "Оформление", "Модерация", "Вышел", "Питчинг"] },
  { key: "date", label: "Дата" },
  { key: "streams", label: "Стримы" },
  { key: "pitch", label: "Питч / плейлист" },
  { key: "owner", label: "Кто ведёт" },
];
const TASK_COLS = [
  { key: "task", label: "Задача" },
  { key: "owner", label: "Ответственный" },
  { key: "due", label: "Срок" },
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
    fetch("/api/panel?key=" + apiKey)
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
      fetch("/api/panel?key=" + apiKey, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ data: val }) }).catch(() => {});
    }, 600);
    return () => clearTimeout(t);
  }, [val, loaded, apiKey]);
  return [val, setVal];
}

function emptyRow(cols) { const o = {}; cols.forEach((c) => (o[c.key] = "")); return o; }

function Tracker({ cols, rows, setRows }) {
  const list = Array.isArray(rows) ? rows : [];
  const update = (i, key, value) => setRows(list.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const add = () => setRows([...list, emptyRow(cols)]);
  const del = (i) => setRows(list.filter((_, idx) => idx !== i));
  const exportCsv = () => {
    const head = cols.map((c) => c.label).join(";");
    const body = list.map((r) => cols.map((c) => (r[c.key] || "").toString().replace(/;/g, ",")).join(";")).join("\n");
    const blob = new Blob(["﻿" + head + "\n" + body], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "interia.csv";
    a.click();
  };
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <button onClick={add} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">+ Строка</button>
        <button onClick={exportCsv} className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 hover:bg-white/5">Экспорт CSV</button>
        <span className="ml-auto text-xs text-white/30">{list.length} шт.</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} className="whitespace-nowrap border-b border-white/10 bg-white/[.03] px-3 py-2 text-left text-[11px] uppercase tracking-wider text-white/50">{c.label}</th>
              ))}
              <th className="border-b border-white/10 bg-white/[.03] px-2 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="px-3 py-6 text-center text-white/30">Пусто. Нажми «+ Строка».</td></tr>
            )}
            {list.map((r, i) => (
              <tr key={i} className="hover:bg-white/[.02]">
                {cols.map((c) => (
                  <td key={c.key} className="border-b border-white/[.06] px-1.5 py-1">
                    {c.type === "select" ? (
                      <select value={r[c.key]} onChange={(e) => update(i, c.key, e.target.value)} className="w-full bg-transparent px-2 py-1.5 text-white outline-none">
                        <option value="" className="bg-zinc-900"></option>
                        {c.options.map((o) => (<option key={o} value={o} className="bg-zinc-900">{o}</option>))}
                      </select>
                    ) : (
                      <input value={r[c.key]} onChange={(e) => update(i, c.key, e.target.value)} className="w-full min-w-[90px] bg-transparent px-2 py-1.5 text-white outline-none placeholder:text-white/20" />
                    )}
                  </td>
                ))}
                <td className="border-b border-white/[.06] px-2 text-center">
                  <button onClick={() => del(i)} className="text-white/30 hover:text-red-400" title="Удалить">✕</button>
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

  const api = (qs) => fetch("/api/ya?" + qs).then((r) => r.json());

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
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full border-collapse text-sm">
            <thead><tr>
              {["#", "Артист", "Слушателей/мес", "Δ мес", "Контакты", "Я.Музыка"].map((h) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function Panel() {
  const [ok, setOk] = useState(() => sessionStorage.getItem("interia_panel_ok") === "1");
  const [pw, setPw] = useState("");

  // на странице панели кастомного курсора нет — форсим обычный системный
  useEffect(() => {
    const prevBody = document.body.style.cursor;
    const prevHtml = document.documentElement.style.cursor;
    document.body.style.cursor = "auto";
    document.documentElement.style.cursor = "auto";
    return () => { document.body.style.cursor = prevBody; document.documentElement.style.cursor = prevHtml; };
  }, []);
  const [tab, setTab] = useState("releases");
  const [releases, setReleases] = useShared("releases", []);
  const [tasks, setTasks] = useShared("tasks", []);

  if (!ok) {
    return (
      <div className="panel-scope grid min-h-screen place-items-center bg-black px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (pw === PASS) { sessionStorage.setItem("interia_panel_ok", "1"); setOk(true); }
            else { setPw(""); alert("Неверный пароль"); }
          }}
          className="w-full max-w-xs text-center"
        >
          <div className="mb-1 text-2xl font-bold text-white">INTERIA! · панель</div>
          <div className="mb-6 text-sm text-white/40">Внутренний доступ</div>
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Пароль" autoFocus
            className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-center text-white outline-none focus:border-white/40" />
          <button className="mt-3 w-full rounded-lg bg-white px-4 py-3 font-semibold text-black">Войти</button>
        </form>
      </div>
    );
  }

  return (
    <div className="panel-scope min-h-screen bg-black px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-bold">INTERIA! · панель</div>
            <div className="text-xs text-white/40">Внутренний командный трекер · общий для всех</div>
          </div>
          <a href="#top" className="whitespace-nowrap text-xs text-white/40 hover:text-white">← на сайт</a>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          <button onClick={() => setTab("releases")} className={"rounded-full px-4 py-2 text-sm " + (tab === "releases" ? "bg-white font-semibold text-black" : "border border-white/15 text-white/70")}>Релизы</button>
          <button onClick={() => setTab("tasks")} className={"rounded-full px-4 py-2 text-sm " + (tab === "tasks" ? "bg-white font-semibold text-black" : "border border-white/15 text-white/70")}>Задачи</button>
          <button onClick={() => setTab("search")} className={"rounded-full px-4 py-2 text-sm " + (tab === "search" ? "bg-white font-semibold text-black" : "border border-white/15 text-white/70")}>🔎 Поиск артистов</button>
        </div>

        {tab === "releases" ? <Tracker cols={RELEASE_COLS} rows={releases} setRows={setReleases} />
          : tab === "tasks" ? <Tracker cols={TASK_COLS} rows={tasks} setRows={setTasks} />
          : <ArtistSearch />}
      </div>
    </div>
  );
}
