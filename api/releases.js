// Публичный каталог релизов лейбла для главной страницы (лента «Каталог»).
// Тянет актуальные альбомы с Яндекс.Музыки (label 6401624), кэш на CDN.
// БЕЗ авторизации (только чтение публичного каталога). Токен ТОЛЬКО в env.
const BASE = "https://api.music.yandex.net";
const TOKEN = process.env.YANDEX_MUSIC_TOKEN;
const LABEL = 6401624;

async function yget(path) {
  const r = await fetch(BASE + path, {
    headers: {
      Authorization: "OAuth " + TOKEN,
      "User-Agent": "Yandex-Music-API",
      "X-Yandex-Music-Client": "YandexMusicAndroid/24023621",
    },
  });
  const t = await r.text();
  try { return JSON.parse(t); } catch { return null; }
}

// coverUri приходит как "avatars.yandex.net/.../%%" -> подставляем размер
const cover = (c) => (c ? "https://" + String(c).replace("%%", "400x400") : "");

export default async function handler(req, res) {
  // кэш на CDN 1 час, отдаём устаревшее ещё сутки пока ревалидируем в фоне
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  if (!TOKEN) return res.status(500).json({ ok: false, error: "Токен не настроен (env YANDEX_MUSIC_TOKEN)" });
  try {
    const j = await yget("/labels/" + LABEL + "/albums?sortBy=year&page=0&pageSize=300");
    const albums = (j && j.result && j.result.albums ? j.result.albums : []).map((a) => ({
      id: a.id,
      title: a.title,
      artists: (a.artists || []).map((x) => x.name).join(", "),
      year: a.year,
      type: a.type || "single",
      cover: cover(a.coverUri),
      url: "https://music.yandex.ru/album/" + a.id,
    }));
    return res.json({ ok: true, releases: albums, total: albums.length });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
