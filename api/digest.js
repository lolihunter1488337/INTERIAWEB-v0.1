// Утренний дайджест в Telegram (Vercel Cron, 6:00 МСК = 03:00 UTC)
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const KVURL = process.env.KV_REST_API_URL  || process.env.UPSTASH_REDIS_REST_URL;
const KVTOK = process.env.KV_REST_API_TOKEN|| process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  const r = await fetch(KVURL, { method: "POST", headers: { Authorization: "Bearer " + KVTOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  return (await r.json()).result;
}
async function kvGet(key) { const v = await redis(["GET", key]); try { return v ? JSON.parse(v) : null; } catch { return null; } }

const dsl = (s) => { if (!s) return null; const d = new Date(s); return isNaN(d) ? null : Math.floor((Date.now() - d) / 86400000); };
const thisWeek = (s) => { if (!s) return false; const d = new Date(s); if (isNaN(d)) return false; const diff = (Date.now() - d) / 86400000; return diff >= -1 && diff <= 7; };

function getAction(a) {
  const ds = dsl(a.last);
  const tr = Array.isArray(a.tracks) ? a.tracks : [];
  if (a.intent && a.intent.type === "left") return { lvl: "red",    txt: "сигнал об уходе — срочно поговорить" };
  if (!a.docs)                              return { lvl: "red",    txt: "запросить форму документов" };
  const noForm  = tr.find(t => !t.released && !t.form);
  if (noForm)                               return { lvl: "red",    txt: "напомнить заполнить форму трека" };
  const noCover = tr.find(t => !t.released && t.form && !t.cover);
  if (noCover)                              return { lvl: "red",    txt: "запросить обложку: " + (noCover.title || "трек") };
  const notShip = tr.find(t => t.cover && !t.shipped);
  if (notShip)                              return { lvl: "blue",   txt: "отгрузить на DSP: " + (notShip.title || "трек") };
  if (ds !== null && ds >= 14)              return { lvl: "red",    txt: "не отвечает " + ds + " дн. — написать" };
  if (ds !== null && ds >= 7)              return { lvl: "yellow", txt: "молчит " + ds + " дн. — написать" };
  if (tr.length === 0)                      return { lvl: "yellow", txt: "нет треков — запросить материал" };
  if (tr.every(t => t.released))            return { lvl: "green",  txt: "все треки вышли" };
  return                                           { lvl: "ok",     txt: "в процессе" };
}

const IG_ROT = ["Достижение артиста", "Артист недели", "Inside INTERIA", "INTERIA Archive", "Атмосфера"];
const IG_ANCHOR = Date.UTC(2026, 6, 7);
function igToday() {
  const d = new Date(); const dow = d.getDay();
  if (dow === 5) return "Release Day 🎵";
  if (dow === 2) { const w = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - IG_ANCHOR) / (7 * 86400000)); return IG_ROT[((w % 5) + 5) % 5]; }
  return null;
}

export default async function handler(req, res) {
  const chatId = await kvGet("interia:digest_chat");
  if (!chatId) return res.json({ ok: false, error: "чат не задан — напиши /digesthere" });

  const rawArtists = await kvGet("interia:artists") || [];
  const artists = rawArtists.filter(a => a && a.artist).map(a => ({
    ...a, tracks: Array.isArray(a.tracks) ? a.tracks : [], docs: a.docs !== undefined ? !!a.docs : !!a.f_doc
  }));

  const ORDER = { red: 0, blue: 1, yellow: 2 };
  const urgent = artists
    .map(a => ({ a, act: getAction(a) }))
    .filter(x => ORDER[x.act.lvl] !== undefined)
    .sort((x, y) => (ORDER[x.act.lvl] ?? 3) - (ORDER[y.act.lvl] ?? 3));

  const relWeek = [];
  for (const a of artists) {
    for (const t of a.tracks) {
      if (t.released && thisWeek(t.date)) relWeek.push(a.artist + " — " + t.title);
    }
  }
  const waiting = artists.reduce((n, a) => n + a.tracks.filter(t => t.shipped && !t.released).length, 0);

  const dateStr = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Moscow" });
  const lines = ["☀️ INTERIA — " + dateStr, ""];

  if (urgent.length === 0) {
    lines.push("✅ Активных задач нет — всё в порядке");
  } else {
    lines.push("⚡ СДЕЛАЙ СЕГОДНЯ:");
    for (const { a, act } of urgent.slice(0, 5)) {
      const dot = act.lvl === "red" ? "●" : act.lvl === "blue" ? "▶" : "◑";
      lines.push(dot + " " + a.artist + " — " + act.txt);
      if (a.chat) lines.push("   " + a.chat);
    }
    if (urgent.length > 5) lines.push("...ещё " + (urgent.length - 5));
  }

  if (relWeek.length > 0) {
    lines.push(""); lines.push("🎵 ВЫШЛО НА ЭТОЙ НЕДЕЛЕ:");
    relWeek.forEach(r => lines.push("• " + r));
  }

  if (waiting > 0) { lines.push(""); lines.push("⏳ Ждут выхода: " + waiting + " треков"); }

  const ig = igToday();
  if (ig) { lines.push(""); lines.push("📣 Instagram: " + ig); }
  lines.push(""); lines.push("→ interiarecords.com/#/panel");

  const r = await fetch("https://api.telegram.org/bot" + TOKEN + "/sendMessage", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines.join("\n"), disable_web_page_preview: true })
  }).then(x => x.json()).catch(e => ({ ok: false, error: String(e) }));

  return res.json({ ok: true, sent: r && r.ok, urgentCount: urgent.length });
}
