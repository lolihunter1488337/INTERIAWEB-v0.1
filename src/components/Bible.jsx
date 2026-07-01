import { useState, useMemo } from "react";
import { marked } from "marked";

const raw = import.meta.glob("../bible/**/*.md", { query: "?raw", import: "default", eager: true });
const FILES = Object.entries(raw)
  .map(([k, v]) => ({ path: k.replace(/^.*\/bible\//, ""), content: v }))
  .sort((a, b) => a.path.localeCompare(b.path, "ru"));

function label(path) {
  return path.split("/").pop().replace(/\.md$/, "").replace(/^\d+[_-]/, "").replace(/_/g, " ");
}

const ROOT = FILES.filter((f) => !f.path.includes("/"));
const FOLDERS = {};
FILES.filter((f) => f.path.includes("/")).forEach((f) => {
  const dir = f.path.split("/")[0];
  (FOLDERS[dir] = FOLDERS[dir] || []).push(f);
});

export default function Bible() {
  const startFile = FILES.find((f) => /START_HERE/i.test(f.path)) || FILES[0];
  const [sel, setSel] = useState(startFile ? startFile.path : "");
  const [open, setOpen] = useState({});
  const [q, setQ] = useState("");

  const current = FILES.find((f) => f.path === sel);
  const html = useMemo(() => marked.parse(current ? current.content : ""), [sel]);
  const found = q.trim() ? FILES.filter((f) => (f.path + " " + f.content).toLowerCase().includes(q.trim().toLowerCase())) : null;

  const FileBtn = ({ f }) => (
    <button onClick={() => setSel(f.path)}
      className={"block w-full truncate rounded-md px-2.5 py-1.5 text-left text-sm transition " + (sel === f.path ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white")}>
      {label(f.path)}
    </button>
  );

  return (
    <div className="flex flex-col gap-4 md:flex-row">
      <aside className="w-full shrink-0 md:w-60">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Поиск по Библии…"
          className="mb-2 w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/40" />
        <div className="max-h-[65vh] space-y-0.5 overflow-y-auto rounded-xl border border-white/10 bg-white/[.02] p-2">
          {found ? (
            found.length ? found.map((f) => <FileBtn key={f.path} f={f} />) : <div className="px-2 py-2 text-sm text-white/30">Ничего не найдено</div>
          ) : (
            <>
              {ROOT.map((f) => <FileBtn key={f.path} f={f} />)}
              {Object.keys(FOLDERS).map((dir) => (
                <div key={dir}>
                  <button onClick={() => setOpen((o) => ({ ...o, [dir]: !o[dir] }))}
                    className="flex w-full items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wider text-white/40 hover:text-white/70">
                    <span className="inline-block w-3">{open[dir] ? "▾" : "▸"}</span> {dir}
                  </button>
                  {open[dir] && <div className="ml-3 border-l border-white/10 pl-1">{FOLDERS[dir].map((f) => <FileBtn key={f.path} f={f} />)}</div>}
                </div>
              ))}
            </>
          )}
        </div>
      </aside>
      <div className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 p-5 backdrop-blur-sm">
        {current ? <div className="bible-md" dangerouslySetInnerHTML={{ __html: html }} /> : <div className="text-white/40">Выбери раздел слева.</div>}
      </div>
    </div>
  );
}
