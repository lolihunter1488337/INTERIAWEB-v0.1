// AI-сводка артиста через Groq (llama-3)
// POST { tgChatId } — анализирует чат или данные панели, пишет в note
import { authUser } from "./_users.js";
const KVURL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const KVTOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const GROQ  = process.env.GROQ_API_KEY;

async function kv(cmd) {
  const r = await fetch(KVURL, { method: "POST", headers: { Authorization: "Bearer " + KVTOK, "Content-Type": "application/json" }, body: JSON.stringify(cmd) });
  return (await r.json()).result;
}

async function groq(system, user) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: "Bearer " + GROQ, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.1-8b-instant", max_tokens: 250, messages: [{ role: "system", content: system }, { role: "user", content: user }] })
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content?.trim() || null;
}

async function detectIntent(msgs) {
  if (!msgs || msgs.length < 2) return null;
  const dialog = msgs.slice(-15).map(m => m.from + ": " + m.text).join("\n").slice(0, 2000);
  const system = [
    "Ты анализируешь переписку артиста с музыкальным лейблом.",
    "Определи намерение артиста относительно новых релизов.",
    "Ответь ТОЛЬКО одним ключевым словом и через дефис краткое пояснение на русском (до 8 слов).",
    "Варианты: new_track (хочет/готов отгрузить новый трек), in_progress (дорабатывает, скоро будет), promised (назвал дату или срок), left (отказывается от сотрудничества), unknown (неясно).",
    "Пример: in_progress - финализирует микс, отгрузит на неделе"
  ].join(" ");
  const raw = await groq(system, dialog);
  if (!raw) return null;
  const types = ["new_track", "in_progress", "promised", "left", "unknown"];
  const found = types.find(t => raw.toLowerCase().startsWith(t));
  if (!found || found === "unknown") return null;
  const detail = raw.includes(" - ") ? raw.split(" - ").slice(1).join(" - ").trim() : "";
  return { type: found, detail, updatedAt: new Date().toISOString().slice(0, 10) };
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false });

  const key = req.headers["x-panel-key"] || "";
  if (!authUser(key)) return res.status(401).json({ ok: false, error: "unauthorized" });
  if (!GROQ) return res.status(503).json({ ok: false, error: "GROQ_API_KEY не настроен" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const { tgChatId } = body || {};
  if (!tgChatId) return res.status(400).json({ ok: false, error: "нет tgChatId" });

  const artistsRaw = await kv(["GET", "interia:artists"]);
  let artists = [];
  try { artists = JSON.parse(artistsRaw || "[]"); } catch {}
  const idx = artists.findIndex(a => String(a.tgChatId) === String(tgChatId));
  if (idx < 0) return res.status(404).json({ ok: false, error: "артист не найден" });
  const a = artists[idx];

  const raw = await kv(["GET", "interia:msgs:" + tgChatId]);
  let msgs = [];
  try { msgs = JSON.parse(raw || "[]"); } catch {}

  let summary = null;

  if (msgs.length > 0) {
    const dialog = msgs.map(m => m.from + ": " + m.text).join("\n").slice(0, 3000);
    summary = await groq(
      "Ты помощник менеджера музыкального лейбла INTERIA!. Прочитай переписку с артистом и напиши ТОЛЬКО конкретные действия — что надо сделать менеджеру прямо сейчас. Начинай каждый пункт с глагола (Написать / Запросить / Уточнить / Отгрузить). Максимум 3 коротких пункта через точку. Не описывай что было, только что делать.",
      dialog
    );
  } else {
    const tracks = Array.isArray(a.tracks) ? a.tracks : [];
    const tInfo = tracks.length
      ? tracks.map(t => {
          const s = t.released ? "вышел" : t.shipped ? "отгружен, ждёт выхода" : t.cover ? "обложка есть, не отгружен" : t.form ? "форма подана, нет обложки" : "в работе";
          return "«" + t.title + "» — " + s;
        }).join("; ")
      : "треков нет";
    const docStr = a.docs ? "документы сданы" : "ДОКУМЕНТЫ НЕ СДАНЫ — это приоритет";
    summary = await groq(
      "Ты помощник менеджера музыкального лейбла INTERIA!. На основе статуса артиста укажи КОНКРЕТНО что должен сделать менеджер следующим шагом. Начинай с глагола. Максимум 3 коротких пункта через точку. Не описывай ситуацию, только действия.",
      "Артист: " + a.artist + ". " + docStr + ". Треки: " + tInfo + ". Молчит с: " + (a.last || "дата неизвестна")
    );
  }

  if (!summary) return res.status(502).json({ ok: false, error: "Groq не ответил" });

  const prefix = msgs.length > 0 ? "🧠" : "📊";
  artists[idx].note = prefix + " " + new Date().toLocaleDateString("ru-RU") + ": " + summary;
  if (msgs.length > 0) {
    const intent = await detectIntent(msgs);
    if (intent) artists[idx].intent = intent;
  }
  await kv(["SET", "interia:artists", JSON.stringify(artists)]);

  return res.status(200).json({ ok: true, summary, intent: artists[idx].intent || null, source: msgs.length > 0 ? "chat" : "data" });
}
