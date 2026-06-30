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

function useStored(key, initial) {
  const [val, setVal] = useState(() => {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : initial; } catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {} }, [key, val]);
  return [val, setVal];
}

function emptyRow(cols) { const o = {}; cols.forEach((c) => (o[c.key] = "")); return o; }

function Tracker({ cols, rows, setRows }) {
  const update = (i, key, value) => setRows(rows.map((r, idx) => (idx === i ? { ...r, [key]: value } : r)));
  const add = () => setRows([...rows, emptyRow(cols)]);
  const del = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const exportCsv = () => {
    const head = cols.map((c) => c.label).join(";");
    const body = rows.map((r) => cols.map((c) => (r[c.key] || "").toString().replace(/;/g, ",")).join(";")).join("\n");
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
        <span className="ml-auto text-xs text-white/30">{rows.length} шт.</span>
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
            {rows.length === 0 && (
              <tr><td colSpan={cols.length + 1} className="px-3 py-6 text-center text-white/30">Пусто. Нажми «+ Строка».</td></tr>
            )}
            {rows.map((r, i) => (
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

export default function Panel() {
  const [ok, setOk] = useState(() => sessionStorage.getItem("interia_panel_ok") === "1");
  const [pw, setPw] = useState("");
  const [tab, setTab] = useState("releases");
  const [releases, setReleases] = useStored("interia_panel_releases", []);
  const [tasks, setTasks] = useStored("interia_panel_tasks", []);

  if (!ok) {
    return (
      <div className="grid min-h-screen place-items-center bg-black px-5">
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
    <div className="min-h-screen bg-black px-4 py-6 text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-xl font-bold">INTERIA! · панель</div>
            <div className="text-xs text-white/40">Внутренний трекер · данные пока хранятся в этом браузере (v0)</div>
          </div>
          <a href="#top" className="whitespace-nowrap text-xs text-white/40 hover:text-white">← на сайт</a>
        </div>

        <div className="mb-5 flex gap-2">
          <button onClick={() => setTab("releases")} className={"rounded-full px-4 py-2 text-sm " + (tab === "releases" ? "bg-white font-semibold text-black" : "border border-white/15 text-white/70")}>Релизы</button>
          <button onClick={() => setTab("tasks")} className={"rounded-full px-4 py-2 text-sm " + (tab === "tasks" ? "bg-white font-semibold text-black" : "border border-white/15 text-white/70")}>Задачи</button>
        </div>

        {tab === "releases"
          ? <Tracker cols={RELEASE_COLS} rows={releases} setRows={setReleases} />
          : <Tracker cols={TASK_COLS} rows={tasks} setRows={setTasks} />}
      </div>
    </div>
  );
}
