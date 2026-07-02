// Логин по БД пользователей. Возвращает имя/логин; пароль клиент дальше шлёт как x-panel-key.
import { findByLogin } from "./_users.js";

export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false });
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const { login, password } = body || {};
  const u = findByLogin(login || "", password || "");
  if (!u) return res.status(401).json({ ok: false, error: "Неверный логин или пароль" });
  return res.json({ ok: true, name: u.name, login: u.login });
}
