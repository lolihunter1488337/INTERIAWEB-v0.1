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
- tailwind.config.js — шрифты (display=Geist, mono=Geist Mono, serif=Instrument Serif), анимации
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
