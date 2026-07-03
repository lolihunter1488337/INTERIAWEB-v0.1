// Приветственное сообщение + ссылки форм (единый источник для бота и кнопки в Пульте).
// ⚠️ Текст приветствия можно заменить на свой (юзер даст заготовку).
export const FORMS = {
  docs: "https://docs.google.com/forms/d/e/1FAIpQLSfNW8RErT1_ILg6ArhO5ZW_2punfYlrKkT4qccgkQw9X1IlVA/viewform",
  track: "https://docs.google.com/forms/d/e/1FAIpQLSdHEU467RD8v5LGxfFbIwIkdnb_EN1RlF-6uz_r6h1ufo-VQA/viewform",
  pitch: "", // добавить ссылку на питч-форму, когда будет
};

export function welcomeText() {
  let t = "🖤 Добро пожаловать в INTERIA! RECORDS\n\nРады, что ты с нами. Чтобы всё запустить, заполни формы:\n\n";
  t += "📄 Документы (один раз):\n" + FORMS.docs + "\n\n";
  t += "🎵 Форма на релиз (на каждый трек):\n" + FORMS.track + "\n";
  if (FORMS.pitch) t += "\n📣 Форма на питч (на каждый трек):\n" + FORMS.pitch + "\n";
  t += "\nЕсли есть вопросы — пиши сюда, мы на связи. 🚀";
  return t;
}
