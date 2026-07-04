// Telegram-вебхук: авто-регистрация чатов в Пульт + трекинг активности + команды.
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  const r = await fetch(URL, { method: "POST", headers: { Authorization: "Bearer " + TOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  const j = await r.json(); return j.result;
}
async function kvGet(key) { const v = await redis(["GET", key]); try { return v ? JSON.parse(v) : null; } catch { return null; } }
async function kvSet(key, val) { await redis(["SET", key, JSON.stringify(val)]); }
async function tg(method, payload) {
  try { return await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }).then((r) => r.json()); }
  catch { return null; }
}
// Артист-чат = только по шаблону «Артист | INTERIA!» (есть «|», справа содержит INTERIA).
function parseArtist(title) {
  if (!title || title.indexOf("|") < 0) return null;
  const i = title.indexOf("|");
  const left = title.slice(0, i).trim();
  const right = title.slice(i + 1);
  if (!/interia/i.test(right)) return null;
  return left || null;
}
const today = () => new Date().toISOString().slice(0, 10);

async function registerChat(chat) {
  if (!chat || chat.type === "private") return;
  const name = parseArtist(chat.title);
  if (!name) return; // командные/прочие чаты (без «| INTERIA!») в Пульт НЕ заводим
  const artists = (await kvGet("interia:artists")) || [];
  let a = artists.find((x) => x && x.tgChatId === chat.id);
  if (!a) {
    let invite = "";
    const r = await tg("exportChatInviteLink", { chat_id: chat.id });
    if (r && r.ok) invite = r.result;
    artists.push({ artist: name, chat: invite, tgChatId: chat.id, owner: "", contact: "", docs: false, last: today(), note: "", tracks: [] });
    await kvSet("interia:artists", artists);
  } else {
    let changed = false;
    if (a.artist !== name) { a.artist = name; changed = true; }
    // авто-добавляем ссылку на чат если она пустая (бот должен быть админом)
    if (!a.chat) {
      const r = await tg("exportChatInviteLink", { chat_id: chat.id });
      if (r && r.ok && r.result) { a.chat = r.result; changed = true; }
    }
    if (changed) await kvSet("interia:artists", artists);
  }
}
async function touchActivity(chatId) {
  const artists = (await kvGet("interia:artists")) || [];
  const a = artists.find((x) => x && x.tgChatId === chatId);
  if (a) { a.last = today(); await kvSet("interia:artists", artists); }
}

// сохраняем последние 100 сообщений чата для AI-сводки
async function storeMessage(chatId, from, text) {
  if (!text || !text.trim()) return;
  const key = "interia:msgs:" + chatId;
  const raw = await redis(["GET", key]);
  let msgs = [];
  try { msgs = JSON.parse(raw || "[]"); } catch {}
  msgs.push({ from: from || "?", text: text.slice(0, 400), ts: Date.now() });
  if (msgs.length > 100) msgs = msgs.slice(-100);
  await redis(["SET", key, JSON.stringify(msgs)]);
  await redis(["EXPIRE", key, 60 * 60 * 24 * 60]); // 60 дней
}

import { welcomeText } from "./_welcome.js";

const dsl = (s) => { if (!s) return null; const d = new Date(s); return isNaN(d) ? null : Math.floor((Date.now() - d) / 86400000); };
function getAction(a) {
  const ds = dsl(a.last);
  const tr = Array.isArray(a.tracks) ? a.tracks : [];
  if (a.intent && a.intent.type === "left") return { lvl: "red",    txt: "🚫 Сигнал об уходе — срочно поговорить" };
  if (!a.docs)                              return { lvl: "red",    txt: "📄 Запросить форму документов" };
  const noForm  = tr.find(t => !t.released && !t.form);
  if (noForm)                               return { lvl: "red",    txt: "📝 Напомнить заполнить форму трека" };
  const noCover = tr.find(t => !t.released && t.form && !t.cover);
  if (noCover)                              return { lvl: "red",    txt: "🎨 Запросить обложку: " + (noCover.title || "трек") };
  const notShip = tr.find(t => t.cover && !t.shipped);
  if (notShip)                              return { lvl: "blue",   txt: "🚀 Отгрузить на DSP: " + (notShip.title || "трек") };
  if (ds !== null && ds >= 14)              return { lvl: "red",    txt: "🔴 Не отвечает " + ds + " дн. — написать" };
  if (ds !== null && ds >= 7)              return { lvl: "yellow", txt: "🟡 Молчит " + ds + " дн. — написать" };
  if (tr.length === 0)                      return { lvl: "yellow", txt: "🎵 Нет треков — запросить материал" };
  if (tr.every(t => t.released))            return { lvl: "green",  txt: "✅ Все треки вышли" };
  return                                           { lvl: "ok",     txt: "✔️ В процессе" };
}
const INTENT_LABEL = { new_track: "🎵 Хочет отгрузить трек", in_progress: "🔨 Дорабатывает трек", promised: "📅 Обещал дату", left: "🚫 Сигнализирует об уходе" };

async function handleStatus(chatId, arg) {
  const artists = (await kvGet("interia:artists")) || [];
  const q = arg.toLowerCase().trim();
  if (!q) {
    // Показать топ-5 по приоритету
    const ORDER = { red: 0, blue: 1, yellow: 2 };
    const list = artists
      .filter(a => a && a.artist)
      .map(a => ({ a, act: getAction(a) }))
      .filter(x => ORDER[x.act.lvl] !== undefined)
      .sort((x, y) => (ORDER[x.act.lvl] ?? 3) - (ORDER[y.act.lvl] ?? 3))
      .slice(0, 5);
    if (list.length === 0) { await tg("sendMessage", { chat_id: chatId, text: "✅ Активных задач нет" }); return; }
    const lines = ["⚡ Топ задач:"];
    for (const { a, act } of list) lines.push("• " + a.artist + " — " + act.txt);
    await tg("sendMessage", { chat_id: chatId, text: lines.join("\n"), disable_web_page_preview: true });
    return;
  }
  // Найти артиста по имени (подстрока, без учёта регистра)
  const found = artists.find(a => a && a.artist && a.artist.toLowerCase().includes(q));
  if (!found) { await tg("sendMessage", { chat_id: chatId, text: "❓ Артист не найден: " + arg }); return; }
  const act = getAction(found);
  const tr = Array.isArray(found.tracks) ? found.tracks : [];
  const lines = ["📋 " + found.artist];
  lines.push("Статус: " + act.txt);
  if (found.intent && found.intent.type && found.intent.type !== "unknown") {
    const lbl = INTENT_LABEL[found.intent.type] || found.intent.type;
    lines.push("Намерение: " + lbl + (found.intent.detail ? " — " + found.intent.detail : ""));
  }
  if (tr.length > 0) {
    const released = tr.filter(t => t.released).length;
    lines.push("Треки: " + released + "/" + tr.length + " вышли");
    const active = tr.filter(t => !t.released);
    if (active.length > 0) lines.push("В работе: " + active.map(t => t.title || "без назв.").join(", "));
  }
  if (found.last) { const ds = dsl(found.last); if (ds !== null) lines.push("Последний контакт: " + ds + " дн. назад"); }
  if (found.chat) lines.push(found.chat);
  await tg("sendMessage", { chat_id: chatId, text: lines.join("\n"), disable_web_page_preview: true });
}

async function ensureArtist(chat, name) {
  const artists = (await kvGet("interia:artists")) || [];
  if (artists.find((x) => x && x.tgChatId === chat.id)) return;
  let invite = "";
  const r = await tg("exportChatInviteLink", { chat_id: chat.id });
  if (r && r.ok) invite = r.result;
  artists.push({ artist: name || "артист", chat: invite, tgChatId: chat.id, owner: "", contact: "", docs: false, last: today(), note: "", tracks: [] });
  await kvSet("interia:artists", artists);
}
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).json({ ok: true });
  let u = req.body; if (typeof u === "string") { try { u = JSON.parse(u); } catch { u = {}; } }
  try {
    const mcm = u.my_chat_member;
    if (mcm && mcm.chat) {
      const st = mcm.new_chat_member && mcm.new_chat_member.status;
      if (st === "member" || st === "administrator") await registerChat(mcm.chat);
      return res.status(200).json({ ok: true });
    }
    const msg = u.message || u.channel_post;
    if (msg && msg.chat) {
      const chat = msg.chat;
      const text = (msg.text || "").trim();
      if (text.startsWith("/digesthere")) {
        await kvSet("interia:digest_chat", chat.id);
        await tg("sendMessage", { chat_id: chat.id, text: "✅ Дайджест INTERIA будет приходить сюда каждое утро в 6:00 МСК." });
        return res.status(200).json({ ok: true });
      }
      // /status — только в командном/нехудожническом чате
      if (text.startsWith("/status") && !parseArtist(chat.title)) {
        const arg = text.replace(/^\/status(@\w+)?/i, "").trim();
        await handleStatus(chat.id, arg);
        return res.status(200).json({ ok: true });
      }
      if (text.startsWith("/artist") && chat.type !== "private") {
        const arg = text.replace(/^\/artist(@\w+)?/i, "").trim();
        const name = arg || parseArtist(chat.title) || chat.title || "";
        await ensureArtist(chat, name);
        await tg("sendMessage", { chat_id: chat.id, text: welcomeText(), disable_web_page_preview: true });
        return res.status(200).json({ ok: true });
      }
      if (chat.type !== "private") {
        await registerChat(chat);
        await touchActivity(chat.id);
        const from = msg.from ? (msg.from.username || msg.from.first_name || "?") : "?";
        await storeMessage(chat.id, from, text || msg.caption || "");
      }
      return res.status(200).json({ ok: true });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(200).json({ ok: false });
  }
}
