// Прокси к Яндекс.Музыке для A&R-автопоиска. Токен ТОЛЬКО в env (не в коде/гите).
const BASE = "https://api.music.yandex.net";
const TOKEN = process.env.YANDEX_MUSIC_TOKEN;
import { authUser } from "./_users.js";
const PANEL_PASSWORD = process.env.PANEL_PASSWORD;
const authed = (req) => {
  const key = req.headers["x-panel-key"] || "";
  return !!authUser(key) || (PANEL_PASSWORD && key === PANEL_PASSWORD);
};

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

function artistsFromTracks(tracks) {
  const map = new Map();
  for (const t of tracks || []) {
    const tr = t.track || t;
    for (const ar of tr.artists || []) if (ar && ar.id && !map.has(String(ar.id))) map.set(String(ar.id), ar.name);
  }
  return [...map].map(([id, name]) => ({ id, name }));
}

export default async function handler(req, res) {
  if (!authed(req)) return res.status(401).json({ ok: false, error: "unauthorized" });
  if (!TOKEN) return res.status(500).json({ ok: false, error: "Токен не настроен (env YANDEX_MUSIC_TOKEN)" });
  const action = req.query.action;
  try {
    if (action === "searchPlaylists") {
      const q = encodeURIComponent(req.query.q || "");
      const j = await yget(`/search?text=${q}&type=playlist&page=0&nocorrect=false`);
      const items = (j?.result?.playlists?.results || []).map((p) => ({
        owner: p.owner?.uid, kind: p.kind, title: p.title, tracks: p.trackCount,
      }));
      return res.json({ ok: true, items });
    }
    if (action === "playlistArtists") {
      const { owner, kind } = req.query;
      const j = await yget(`/users/${owner}/playlists/${kind}`);
      return res.json({ ok: true, artists: artistsFromTracks(j?.result?.tracks) });
    }
    if (action === "labelReleases") {
      const j = await yget("/labels/6401624/albums?sortBy=year&page=0&pageSize=300");
      const albums = (j?.result?.albums || []).map((a) => ({
        id: a.id,
        title: a.title,
        artists: (a.artists || []).map((x) => x.name).join(", "),
        year: a.year,
        cover: a.coverUri || "",
        url: "https://music.yandex.ru/album/" + a.id,
      }));
      return res.json({ ok: true, albums, total: j?.result?.pager?.total || albums.length });
    }
    if (action === "chartArtists") {
      const j = await yget(`/landing3/chart`);
      return res.json({ ok: true, artists: artistsFromTracks(j?.result?.chart?.tracks) });
    }
    if (action === "artists") {
      const ids = (req.query.ids || "").split(",").filter(Boolean).slice(0, 30);
      const out = [];
      await Promise.all(ids.map(async (id) => {
        const j = await yget(`/artists/${id}/brief-info`);
        const r = j?.result;
        if (r?.artist) out.push({
          id,
          name: r.artist.name,
          listeners: r.stats?.lastMonthListeners ?? 0,
          delta: r.stats?.lastMonthListenersDelta ?? 0,
          links: (r.artist.links || []).map((l) => ({ type: l.socialNetwork || l.type || "link", href: l.href, title: l.title })),
          url: "https://music.yandex.ru/artist/" + id,
        });
      }));
      return res.json({ ok: true, artists: out });
    }
    return res.status(400).json({ ok: false, error: "unknown action" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) });
  }
}
