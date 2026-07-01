// Общий склад данных для трекеров панели (Релизы/Задачи) через Vercel KV (Upstash Redis REST).
// Env (Vercel сам добавит при подключении KV): KV_REST_API_URL + KV_REST_API_TOKEN
const URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOK = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEYS = { releases: "interia:releases", tasks: "interia:tasks", tasks_ar: "interia:tasks_ar", social_ig_done: "interia:social_ig_done" };
const PANEL_PASSWORD = process.env.PANEL_PASSWORD; // если задан — API требует заголовок x-panel-key

async function redis(cmd) {
  const r = await fetch(URL, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOK, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  return j.result;
}

export default async function handler(req, res) {
  if (PANEL_PASSWORD && (req.headers["x-panel-key"] || "") !== PANEL_PASSWORD) return res.status(401).json({ ok: false, error: "unauthorized" });
  if (!URL || !TOK) return res.status(503).json({ ok: false, error: "storage not configured" });
  const key = KEYS[req.query.key];
  if (!key) return res.status(400).json({ ok: false, error: "bad key" });
  try {
    if (req.method === "GET") {
      const v = await redis(["GET", key]);
      let data = [];
      if (v) { try { data = JSON.parse(v); } catch { data = []; } }
      return res.json({ ok: true, data });
    }
    if (req.method === "POST") {
      let body = req.body;
      if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
      const data = (body && body.data) || [];
      await redis(["SET", key, JSON.stringify(data)]);
      return res.json({ ok: true });
    }
    return res.status(405).json({ ok: false, error: "method" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
