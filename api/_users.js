// Серверная БД пользователей панели. В репо только ХЕШИ паролей (не сами пароли).
// Пароли (для раздачи команде) — в файле ДОСТУПЫ-ПАНЕЛЬ.txt на Desktop, НЕ в гите.
import crypto from "crypto";
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

export const USERS = [
  { login: "sek1ro", name: "Никита", nick: "Sek1roRem", hash: "a5a984d810acfb1e5933d9de203ee31a7e8c340045643139bf70427d5fd048ab" },
  { login: "nikotren", name: "Никита", nick: "NIKOTREN", hash: "7a8e492ddc3ccc8a792cf148fb69d06f287386ba267124d439e26022a3b661d9" },
  { login: "senses", name: "Дамир", nick: "senses", hash: "29b5cf7c449c41ed0e3b1ed8cbd435e66cd87175d345d39e9136c7fb4fdfac37" },
  { login: "gruats", name: "Лев", nick: "GRUAT$", hash: "15f71ab660cbf12a624815c8cb56eb352a13cf4a2315913b56aa0f4ac3ae0c3f" },
  { login: "fixluv", name: "Даня", nick: "fixluv", hash: "0df00f4563598f3e945d3135e57acf65bf6e58b40e4e5de790abede3e6fca07f" },
  { login: "lxhxnter", name: "Владислав", nick: "LXHXNTER", hash: "c4c0bc70a24859bb64cde725842f97683855c84a7d19fb8f2d02900e4789dd30" },
  { login: "interia", name: "Сергей", nick: "INTERIA", hash: "41fece2c6a9c25e37961b5d699b25f84d727d5cf9e8a6ccb45c1f29832ebb080" },
  { login: "cntrm", name: "Александр", nick: "CNTRM", hash: "f192e6aa7b1ba19ac77fb2ac63c9421873c511f2e0f91a004edc41b290dfb2bf" },
  { login: "mxdster", name: "Ашот", nick: "MXDSTER", hash: "ba18b07946df870853bd78f868af8b9027507e24090e0757e93c7304eead76f8" },
];

export function authUser(key) {
  if (!key) return null;
  const h = sha(key);
  return USERS.find((u) => u.hash === h) || null;
}
export function findByLogin(login, pw) {
  const u = USERS.find((x) => x.login === String(login).toLowerCase().trim());
  return u && u.hash === sha(pw) ? u : null;
}
