// Приветственное сообщение + ссылки форм (единый источник для бота и кнопки в Пульте).
export const FORMS = {
  docs:  "https://forms.gle/7u6esAbnVQnPY1T8A",
  track: "https://forms.gle/GZ2DkhkWrLU7mTDEA",
  pitch: "https://forms.gle/UjRuoFHQsWWQ64R86",
};

export const CONTACTS = {
  shipping: "@cntrmn",    // отгрузчик релизов
  manager:  "@lxhxnte",   // менеджер артистов
  channel:  "https://t.me/INTERIArecords",
  chat:     "https://t.me/+Z9SCcbrbcvk0ZjUy",
};

export function welcomeText(name = "") {
  const hi = name ? `Привет, ${name}!\n\n` : "Привет!\n\n";
  return (
    hi +
    "Мы работаем с тремя основными формами:\n\n" +

    "1. «Форма для заполнения персональных данных» (требуется для составления договора)\n" +
    "   Эта форма заполняется один раз.\n" +
    "   Заполнить форму: " + FORMS.docs + "\n\n" +

    "2. «Форма для отгрузки релизов»\n" +
    "   Перед отправкой релизов согласовывайте их с нами. Для отгрузки используйте эту форму:\n" +
    "   Заполнить форму: " + FORMS.track + "\n\n" +

    "3. «Форма для питчинга релиза»\n" +
    "   Заполнить форму: " + FORMS.pitch + "\n\n" +

    CONTACTS.shipping + " — отгрузчик релизов. По всем вопросам, связанным с отгрузкой, к нему. Замена аудиозаписей на площадках, замена обложек и т.д. — тоже к нему.\n\n" +
    CONTACTS.manager  + " — менеджер артистов, он будет тебя курировать.\n\n" +
    "Наш телеграм канал: " + CONTACTS.channel + "\n" +
    "Общая беседа лейбла: " + CONTACTS.chat
  );
}
