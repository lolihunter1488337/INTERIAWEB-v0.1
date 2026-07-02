// Утренний дайджест в Telegram (вызывается Vercel Cron в 6:00 МСК = 03:00 UTC).
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  const r = await fetch(URL, { method: "POST", headers: { Authorization: "Bearer " + TOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  const j = await r.json(); return j.result;
}
async function kvGet(key) { const v = await redis(["GET", key]); try { return v ? JSON.parse(v) : null; } catch { return null; } }

const dsl = (s) => { if (!s) return null; const d = new Date(s); return isNaN(d.getTime()) ? null : Math.floor((Date.now() - d.getTime()) / 86400000); };
const thisWeek = (s) => { if (!s) return false; const d = new Date(s); if (isNaN(d.getTime())) return false; const diff = (Date.now() - d.getTime()) / 86400000; return diff >= -1 && diff <= 7; };
const nc = (t) => t.form && !t.cover;
const rd = (t) => t.form && t.cover && !t.shipped;
const np = (t) => t.shipped && !t.pitch;
const rw = (t) => t.released && thisWeek(t.date);

// Instagram-ротация (та же, что в панели)
const IG_ROT = ["🏆 Достижение артиста", "⭐ Артист недели", "🏢 Inside INTERIA", "📚 INTERIA Archive", "🌑 Атмосфера"];
const IG_ANCHOR = Date.UTC(2026, 6, 7);
function igToday() {
  const d = new Date(); const dow = d.getDay();
  if (dow === 5) return "🎵 Release Day";
  if (dow === 2) { const w = Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - IG_ANCHOR) / (7 * 86400000)); return IG_ROT[((w % 5) + 5) % 5]; }
  return null;
}

export default async function handler(req, res) {
  const chatId = await kvGet("interia:digest_chat");
  if (!chatId) return res.json({ ok: false, error: "чат для дайджеста не задан — напиши /digesthere в нужном чате" });
  const artists = ((await kvGet("interia:artists")) || []).map((a) => ({ ...a, tracks: Array.isArray(a.tracks) ? a.tracks : [], docs: a.docs !== undefined ? !!a.docs : !!a.f_doc }));

  const overdue = (a) => { const d = dsl(a.last); return d != null && d >= 5 && (!a.docs || a.tracks.some(np)); };
  const c = {
    attention: artists.filter((a) => a.tracks.some((t) => nc(t) || rd(t))).length,
    overdue: artists.filter(overdue).length,
    ready: artists.filter((a) => a.tracks.some(rd)).length,
    docs: artists.filter((a) => a.artist && !a.docs).length,
    cover: artists.filter((a) => a.tracks.some(nc)).length,
    pitch: artists.filter((a) => a.tracks.some(np)).length,
    week: artists.filter((a) => a.tracks.some(rw)).length,
  };
  const dateStr = new Date().toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Moscow" });
  const ig = igToday();
  const lines = [
    "☀️ *INTERIA — " + dateStr + "*",
    "",
    "🔴 Требуют внимания: " + c.attention,
    "🟡 Просрочено: " + c.overdue,
    "🟢 Готово к DSP: " + c.ready,
    "📄 Ждут документы: " + c.docs,
    "🎨 Ждут обложку: " + c.cover,
    "📝 Ждут питч: " + c.pitch,
    "🎵 Релизы недели: " + c.week,
    ig ? "\n📣 Сегодня пост в Instagram: " + ig : "",
    "\nОткрыть пульт → interiarecords.com/#/panel",
  ].filter(Boolean).join("\n");

  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: lines, parse_mode: "Markdown", disable_web_page_preview: true }),
  }).then((x) => x.json()).catch((e) => ({ ok: false, error: String(e) }));
  return res.json({ ok: true, sent: r && r.ok, counts: c });
}
