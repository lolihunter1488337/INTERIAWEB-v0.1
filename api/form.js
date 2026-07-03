// Webhook: Google Apps Script → обновляет статус артиста в KV при отправке формы.
// POST { secret, formType: "docs"|"track"|"pitch", contact, artistName, trackTitle? }
// secret = env FORM_WEBHOOK_SECRET (добавить в Vercel)

const KVURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KVTOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const SECRET = process.env.FORM_WEBHOOK_SECRET;
const BOT    = process.env.TELEGRAM_BOT_TOKEN;

async function kv(cmd) {
  const r = await fetch(KVURL, { method: "POST", headers: { Authorization: "Bearer " + KVTOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  return (await r.json()).result;
}
async function tgSend(chatId, text) {
  if (!BOT || !chatId) return;
  await fetch("https://api.telegram.org/bot" + BOT + "/sendMessage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }) }).catch(() => {});
}

const norm = (a) => ({ ...a, artist: a.artist || "", contact: a.contact || "", docs: !!a.docs, tracks: Array.isArray(a.tracks) ? a.tracks : [] });

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const { secret, formType, contact = "", artistName = "", trackTitle = "" } = body || {};

  if (!SECRET || secret !== SECRET) return res.status(403).json({ ok: false, error: "forbidden" });
  if (!["docs", "track", "pitch"].includes(formType)) return res.status(400).json({ ok: false, error: "bad_formType" });
  if (!KVURL || !KVTOK) return res.status(503).json({ ok: false, error: "no_kv" });

  // читаем артистов из KV
  let artists = [];
  try { artists = JSON.parse((await kv(["GET", "interia:artists"])) || "[]"); } catch {}

  // ищем артиста: сначала по @контакту, потом по имени
  const cmp = (s) => String(s || "").toLowerCase().trim();
  let idx = -1;
  if (contact) idx = artists.findIndex((a) => cmp(a.contact) === cmp(contact));
  if (idx < 0 && artistName) idx = artists.findIndex((a) => cmp(a.artist) === cmp(artistName));
  if (idx < 0) return res.status(404).json({ ok: false, error: "artist_not_found" });

  const a = norm(artists[idx]);
  const title = trackTitle.trim();
  let note = "";

  if (formType === "docs") {
    artists[idx] = { ...a, docs: true };
    note = "📄 " + a.artist + " заполнил форму документов";
  }

  if (formType === "track") {
    const tracks = [...a.tracks];
    // ищем трек без form=true с совпадающим названием, или первый без form, или создаём новый
    let ti = title ? tracks.findIndex((t) => cmp(t.title) === cmp(title) && !t.form) : -1;
    if (ti < 0) ti = tracks.findIndex((t) => !t.form);
    if (ti >= 0) {
      tracks[ti] = { ...tracks[ti], form: true, title: title || tracks[ti].title || "трек" };
    } else {
      tracks.push({ title: title || "трек", form: true, cover: false, shipped: false, pitch: false, released: false, date: "" });
    }
    artists[idx] = { ...a, tracks };
    note = "🎵 " + a.artist + " отправил трек-форму" + (title ? ": «" + title + "»" : "");
  }

  if (formType === "pitch") {
    const tracks = [...a.tracks];
    // ставим pitch=true: по названию или на последний отгруженный без питча
    let ti = -1;
    if (title) ti = tracks.findIndex((t) => cmp(t.title) === cmp(title) && !t.pitch);
    if (ti < 0) {
      for (let i = tracks.length - 1; i >= 0; i--) { if (tracks[i].shipped && !tracks[i].pitch) { ti = i; break; } }
    }
    if (ti >= 0) tracks[ti] = { ...tracks[ti], pitch: true };
    artists[idx] = { ...a, tracks };
    note = "📣 " + a.artist + " заполнил форму питча" + (title ? ": «" + title + "»" : "");
  }

  // сохраняем
  await kv(["SET", "interia:artists", JSON.stringify(artists)]);

  // уведомление в дайджест-чат
  const digestId = await kv(["GET", "interia:digest_chat_id"]).catch(() => null);
  if (digestId && note) await tgSend(digestId, "✅ " + note);

  return res.status(200).json({ ok: true, artist: a.artist, formType, note });
}
