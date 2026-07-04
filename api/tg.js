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
