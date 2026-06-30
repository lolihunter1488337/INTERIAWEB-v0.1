# INTERIA! RECORDS — сайт лейбла (контекст проекта / "мозг")

> Это память для Claude. Прочитай меня первым делом — здесь всё, что нужно, чтобы
> сразу продолжить работу без объяснений с нуля. Отвечай пользователю по-русски, по-дружески.

## Что это
Сайт независимого музыкального лейбла INTERIA! (тёмная электроника, фонк, эксперимент).
Бренд: ЧЁРНО-БЕЛЫЙ + хром-логотип. Никакого красного (отказались). Андеграунд, премиум, минимализм.

## Стек
- Vite + React 18 + Tailwind CSS v3 + Framer Motion
- Деплой: Vercel (автодеплой из GitHub при пуше в main)
- Serverless: Vercel Functions (папка /api)
- Обработка картинок: jimp

## Доступы / ссылки
- Репозиторий: https://github.com/lolihunter1488337/INTERIAWEB-v0.1  (ветка main)
- Прод: https://interiaweb-v0-1.vercel.app
- Деплой = просто `git push` (креды закэшированы в Windows Credential Manager) -> Vercel сам собирает
- Telegram-бот: @interiaformbot
- Группа заявок: "INTERIA FORM", chat_id = -1003935357575 (супергруппа)
- TELEGRAM_BOT_TOKEN: хранится в Vercel env (и в истории чата). Если нужен — спросить юзера или /revoke у @BotFather.
- Личный chat_id владельца (Владислав, @lxhxnte): 5363315617

## Структура
- index.html — мета/OG/шрифты, точка входа
- src/main.jsx — рендер + ErrorBoundary (показывает ошибку вместо белого экрана)
- src/App.jsx — все секции + hash-роутинг (#/merch, #/collabs)
- src/index.css — глоб. стили, утилиты (.chrome .label .glass .cur .crt .grain)
- tailwind.config.js — шрифты: ВСЕ на **Space Grotesk** (display/sans/mono/serif), анимации (marquee/shine/float)
- src/releases.json — 33 реальных релиза (с api.music.yandex.net/labels/6401624)
- src/components/:
  - LiquidBackground.jsx — canvas-фон: пыль + хром + аудио-пульс (когда играет плеер)
  - Releases.jsx — лента обложек (две стороны, пауза на hover) -> клик открывает плеер
  - NowPlaying.jsx — нижний бар-плеер (iframe Яндекса как движок; не размонтируется при сворачивании)
  - player.jsx — PlayerProvider / usePlayer (контекст текущего трека)
  - Preloader.jsx — интро 000->100 + чайм на 100% (sound.js)
  - Cursor.jsx — кастомный курсор (точка + кольцо)
  - sound.js — тихие звуки hover/click + chime; тумблер (SoundToggle.jsx)
  - ScrollText.jsx — скролл-ревил текста по словам
  - SpotlightCard.jsx — карточка с подсветкой за курсором
  - Accordion.jsx, Reveal.jsx, MagneticButton.jsx, Counter.jsx, brand.jsx (Cross/Tag/Marquee)
  - ComingSoon.jsx — блюр-тизеры "Мерч" и "Коллабы"
- public/:
  - logo.png — ВЫРЕЗАННЫЙ логотип (прозрачный фон, сделан jimp из logo.jpg)
  - logo.jpg, poster1.jpg, poster2.jpg, og.jpg (1200x630)
  - 404.html — брендовая 404 (standalone, офлайн)
  - story.html — раскадровка "от чего к чему пришли" (для показа команде)
  - .well-known/security.txt
- api/demo.js — приём формы -> Telegram-группа (chat_id зашит в коде = GROUP_CHAT_ID; env игнор)
- vercel.json — security headers (OWASP/Helmet-уровень) + framework=vite

## 📓 Журнал правок сайта
- 2026-06-30: **шрифты** — всё перевели на Space Grotesk (index.html link, tailwind.config.js, index.css: body/.serif/.label).
- 2026-06-30: **Hero** — убрали подзаголовок «будущее тёмной электроники» и строку жанров (GENRES). Это убрало наезд кнопок на статы.
- 2026-06-30: **Hero-статы** — убрали плитку «33 релиза», «50»→«60», сетка grid-cols-3.
- 2026-06-30: **Манифест** — текст: «Мы создаём будущее музыки. Остальное — история.»
- 2026-06-30: **Условия (Offer)** — «Что получает артист», 3 пункта (90% роялти / Разработка обложки / Питчинг релизов), сетка lg:grid-cols-3.
- 2026-06-30: **Процесс** — «От демозаписи до выпуска релиза» + подзаголовок, 4 шага (рассмотрение/согласование/договор/выпуск).
- 2026-06-30: **Ростер** — переписан: массив ROSTER (18 артистов) со слушателями и логотипами Spotify/Yandex (инлайн-SVG в App.jsx, монохром currentColor). Ховер: Spotify→зелёный glow, Yandex→жёлтый glow. Старый POPULAR/REST блок убран (POPULAR/ALL_ARTISTS ещё юзаются в ArtistStrip).
- 2026-06-30: **Лого Yandex Music** — звезда-вспышка (сгенерированный 12-лучевой path).
- 2026-06-30: **Форма** — «Готовы выпустить свой релиз?» (без serif-span), описание про рассмотрение демо; поля: Имя/псевдоним, Контакт для связи, Ссылка на релиз, Доп. информация. Контакты: interiarecordsru@gmail.com / @ceo_INTERIA.
- 2026-06-30: **Футер** — убрали Яндекс/Демо/info (оставили © 2026).
- 2026-06-30: **FAQ** — «На каких платформах выходят релизы?» + обновлён ответ про карточки артистов.
- 2026-06-30: **Баг кнопок** (фикс) — в App.jsx hashchange делал scrollTo(0,0) на ЛЮБОЙ якорь → первый клик кидал вверх. Теперь scrollTo только для SPA-роутов (#/...), а секции скроллятся через scrollIntoView в rAF.
- 2026-06-30: **Мобилка** — добавили бургер-меню в Nav (md:hidden), кнопку демо в шапке спрятали на <sm; курсор и cur-glow скрыты на тач (`@media (hover:none)` в index.css).
- 2026-06-30: **Анимации лент на мобиле** (фикс) — marquee замирал из-за залипания :hover (пауза) + iOS mask-image. Лечение в index.css: `@media (hover:none){ .animate-marquee{ animation-play-state:running !important } }` + translate3d/will-change для GPU-слоя.

## Безопасность
- Строгий CSP, HSTS, frame-ancestors none, COOP/CORP, nosniff, Permissions-Policy — в vercel.json
- Форма: honeypot-поле "website"
- Токен бота только в Vercel env (в репо НЕ коммитить)

## Рабочий процесс (важно!)
1. Правки -> `npm run build` (поймать ошибки) -> `git add -A && git commit && git push`
2. Vercel сам деплоит. Проверка прод-функции: POST на https://interiaweb-v0-1.vercel.app/api/demo
3. Dev: `npm run dev -- --host --port 5173` (всегда с --host, иначе только IPv6/::1)

## Гочи (на этом уже спотыкались)
- БЕЛЫЙ ЭКРАН в dev = Tailwind отдал пустой CSS, т.к. dev-сервер стартовал до правки конфига.
  Лечение: убить процесс на 5173, `rm -rf node_modules/.vite`, перезапустить dev.
- Белый экран в браузере, но билд ок = рантайм-ошибка (часто забытый импорт хука framer-motion).
  ErrorBoundary в main.jsx покажет текст ошибки.
- Heredoc в этом окружении (Git Bash) ОБРЕЗАЕТ длинные команды и ломается об ОДИНАРНЫЕ КАВЫЧКИ.
  Правило: писать файлы короткими кусками (cat > / cat >>), без одинарных кавычек (в SVG юзать %27).
- Форма работает ТОЛЬКО на проде (на localhost /api отдаёт HTML -> "ошибка"). В коде есть детект localhost.
- cwd сбрасывается в System32 после каждой команды — всегда начинать с `cd ~/Desktop/interia-app`.

## Идеи на будущее (обсуждали)
- Свой аудиоплеер с волной/перемоткой/громкостью (нужны превью-mp3 от юзера)
- Наполнить Мерч/Коллабы реальным контентом, когда будет
- Абсолютный og:image URL под финальный домен
- RU/EN переключатель
