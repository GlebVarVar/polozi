export type Locale = "sr" | "ru" | "en";

export const defaultLocale: Locale = "sr";

export const locales: Locale[] = ["sr", "ru", "en"];

export const localeNames: Record<Locale, string> = {
  sr: "Srpski",
  ru: "Русский",
  en: "English",
};

export const localeFlags: Record<Locale, string> = {
  sr: "SR",
  ru: "RU",
  en: "EN",
};

const translations: Record<Locale, Record<string, string>> = {
  sr: {
    // Navbar
    "nav.features": "Mogućnosti",
    "nav.howItWorks": "Kako radi",
    "nav.testimonials": "Iskustva",
    "nav.download": "Preuzmi",
    "nav.cta": "Preuzmi aplikaciju",

    // Hero
    "hero.badge": "Besplatna aplikacija za iOS",
    "hero.title1": "Položi vozački",
    "hero.title2": "iz prvog puta!",
    "hero.description":
      "Vežbaj pitanja, simuliraj ispit, prati napredak i pronađi najbolju auto školu — sve u jednoj aplikaciji.",
    "hero.cta": "Preuzmi besplatno",
    "hero.ctaSecondary": "Saznaj više",
    "hero.statQuestions": "Pitanja",
    "hero.statSchools": "Auto škola",
    "hero.statLanguages": "Jezika",

    // Features
    "features.title": "Sve što ti treba za polaganje",
    "features.subtitle":
      "Položi! kombinuje sve alate za pripremu u jednu aplikaciju.",
    "features.training.title": "Trening po kategorijama",
    "features.training.desc":
      "Vežbaj pitanja iz saobraćajnih znakova, pravila i prve pomoći. Sa objašnjenjima za svaki odgovor.",
    "features.exam.title": "Simulacija ispita",
    "features.exam.desc":
      "40 pitanja, 45 minuta — tačno kao pravi ispit. Proveri da li si spreman pre nego što ideš na polaganje.",
    "features.stats.title": "Praćenje napretka",
    "features.stats.desc":
      "Detaljna statistika po kategorijama, istorija ispita i rad na greškama.",
    "features.schools.title": "Rejting auto škola",
    "features.schools.desc":
      "Pronađi najbolju auto školu u svom gradu. Pogledaj ocene, cene i iskustva drugih polaznika.",
    "features.offline.title": "Radi bez interneta",
    "features.offline.desc":
      "Sva pitanja su dostupna offline. Vežbaj bilo gde — u busu, parku ili kod kuće.",
    "features.languages.title": "3 jezika",
    "features.languages.desc":
      "Srpski, ruski i engleski. Promeni jezik u podešavanjima jednim klikom.",

    // How it works
    "how.title": "Kako funkcioniše?",
    "how.subtitle": "Četiri jednostavna koraka do vozačke dozvole.",
    "how.step1.title": "Preuzmi aplikaciju",
    "how.step1.desc": "Besplatno iz App Store-a. Registracija nije potrebna.",
    "how.step2.title": "Vežbaj po kategorijama",
    "how.step2.desc":
      "Počni sa znakovima i pravilima. Čitaj objašnjenja i uči iz grešaka.",
    "how.step3.title": "Simuliraj ispit",
    "how.step3.desc":
      "Kada budeš spreman — probaj simulaciju. 40 pitanja, 45 minuta, kao pravi ispit.",
    "how.step4.title": "Položi iz prvog puta!",
    "how.step4.desc":
      "Sa dovoljno vežbe, ispit neće biti problem. Idi na polaganje sa samopouzdanjem.",

    // Testimonials
    "testimonials.title": "Šta kažu naši korisnici",
    "testimonials.subtitle":
      "Hiljade studenata su položili ispit koristeći Položi!",
    "testimonial.1.name": "Marko J.",
    "testimonial.1.city": "Beograd",
    "testimonial.1.text":
      "Položio sam iz prvog puta zahvaljujući ovoj aplikaciji. Simulacija ispita je bila identična pravom!",
    "testimonial.2.name": "Ana S.",
    "testimonial.2.city": "Novi Sad",
    "testimonial.2.text":
      "Najbolja app za pripremu. Volim što radi offline — mogla sam da vežbam u busu svaki dan.",
    "testimonial.3.name": "Stefan M.",
    "testimonial.3.city": "Niš",
    "testimonial.3.text":
      "Rad na greškama mi je bio ključan. Aplikacija pamti gde grešiš i daje ti ista pitanja ponovo.",
    "testimonial.4.name": "Milica R.",
    "testimonial.4.city": "Kragujevac",
    "testimonial.4.text":
      "Odlična stvar što ima rejting auto škola. Pronašla sam sjajnu školu preko aplikacije.",
    "testimonial.5.name": "Nikola D.",
    "testimonial.5.city": "Kruševac",
    "testimonial.5.text":
      "Koristim rusku verziju jer mi je lakše. Super što podržava više jezika!",
    "testimonial.6.name": "Jovana P.",
    "testimonial.6.city": "Beograd",
    "testimonial.6.text":
      "Preporučujem svim drugovima. Tri meseca sam vežbala i položila sa 39 od 40 pitanja!",

    // Download
    "download.title": "Preuzmi Položi! danas",
    "download.subtitle":
      "Počni da vežbaš odmah. Tvoja vozačka dozvola je na par klikova.",
    "download.benefit1": "Potpuno besplatno",
    "download.benefit2": "Bez registracije",
    "download.benefit3": "Radi offline",
    "download.benefit4": "Srpski, ruski, engleski",
    "download.appStore": "Download on App Store",

    // Footer
    "footer.description":
      "Aplikacija za pripremu vozačkog ispita u Srbiji. Vežbaj pitanja, simuliraj ispit i položi iz prvog puta.",
    "footer.nav": "Navigacija",
    "footer.contact": "Kontakt",
    "footer.rights": "Sva prava zadržana.",
  },

  ru: {
    "nav.features": "Возможности",
    "nav.howItWorks": "Как работает",
    "nav.testimonials": "Отзывы",
    "nav.download": "Скачать",
    "nav.cta": "Скачать приложение",

    "hero.badge": "Бесплатное приложение для iOS",
    "hero.title1": "Сдай экзамен",
    "hero.title2": "с первого раза!",
    "hero.description":
      "Тренируй вопросы, симулируй экзамен, отслеживай прогресс и найди лучшую автошколу — всё в одном приложении.",
    "hero.cta": "Скачать бесплатно",
    "hero.ctaSecondary": "Узнать больше",
    "hero.statQuestions": "Вопросов",
    "hero.statSchools": "Автошкол",
    "hero.statLanguages": "Языка",

    "features.title": "Всё что нужно для сдачи экзамена",
    "features.subtitle":
      "Položi! объединяет все инструменты подготовки в одном приложении.",
    "features.training.title": "Тренировка по категориям",
    "features.training.desc":
      "Тренируй вопросы по знакам, правилам и первой помощи. С объяснениями к каждому ответу.",
    "features.exam.title": "Симуляция экзамена",
    "features.exam.desc":
      "40 вопросов, 45 минут — точно как настоящий экзамен. Проверь готовность перед поездкой на сдачу.",
    "features.stats.title": "Отслеживание прогресса",
    "features.stats.desc":
      "Детальная статистика по категориям, история экзаменов и работа над ошибками.",
    "features.schools.title": "Рейтинг автошкол",
    "features.schools.desc":
      "Найди лучшую автошколу в своём городе. Смотри оценки, цены и отзывы других учеников.",
    "features.offline.title": "Работает без интернета",
    "features.offline.desc":
      "Все вопросы доступны офлайн. Тренируйся где угодно — в автобусе, парке или дома.",
    "features.languages.title": "3 языка",
    "features.languages.desc":
      "Сербский, русский и английский. Смени язык в настройках одним нажатием.",

    "how.title": "Как это работает?",
    "how.subtitle": "Четыре простых шага до водительских прав.",
    "how.step1.title": "Скачай приложение",
    "how.step1.desc": "Бесплатно из App Store. Регистрация не нужна.",
    "how.step2.title": "Тренируйся по категориям",
    "how.step2.desc":
      "Начни со знаков и правил. Читай объяснения и учись на ошибках.",
    "how.step3.title": "Симулируй экзамен",
    "how.step3.desc":
      "Когда будешь готов — попробуй симуляцию. 40 вопросов, 45 минут, как настоящий экзамен.",
    "how.step4.title": "Сдай с первого раза!",
    "how.step4.desc":
      "С достаточной практикой экзамен не будет проблемой. Иди на сдачу с уверенностью.",

    "testimonials.title": "Что говорят наши пользователи",
    "testimonials.subtitle":
      "Тысячи студентов сдали экзамен с помощью Položi!",
    "testimonial.1.name": "Марко Й.",
    "testimonial.1.city": "Белград",
    "testimonial.1.text":
      "Сдал с первого раза благодаря этому приложению. Симуляция экзамена была идентична настоящему!",
    "testimonial.2.name": "Ана С.",
    "testimonial.2.city": "Нови-Сад",
    "testimonial.2.text":
      "Лучшее приложение для подготовки. Нравится что работает офлайн — могла тренироваться в автобусе каждый день.",
    "testimonial.3.name": "Стефан М.",
    "testimonial.3.city": "Ниш",
    "testimonial.3.text":
      "Работа над ошибками была ключевой. Приложение запоминает где ошибаешься и даёт те же вопросы снова.",
    "testimonial.4.name": "Милица Р.",
    "testimonial.4.city": "Крагуевац",
    "testimonial.4.text":
      "Отличная фишка с рейтингом автошкол. Нашла отличную школу через приложение.",
    "testimonial.5.name": "Никола Д.",
    "testimonial.5.city": "Крушевац",
    "testimonial.5.text":
      "Использую русскую версию — так проще. Супер что поддерживает несколько языков!",
    "testimonial.6.name": "Йована П.",
    "testimonial.6.city": "Белград",
    "testimonial.6.text":
      "Рекомендую всем друзьям. Три месяца тренировалась и сдала с результатом 39 из 40!",

    "download.title": "Скачай Položi! сегодня",
    "download.subtitle":
      "Начни тренироваться прямо сейчас. Твои водительские права в нескольких кликах.",
    "download.benefit1": "Полностью бесплатно",
    "download.benefit2": "Без регистрации",
    "download.benefit3": "Работает офлайн",
    "download.benefit4": "Сербский, русский, английский",
    "download.appStore": "Download on App Store",

    "footer.description":
      "Приложение для подготовки к экзамену по вождению в Сербии. Тренируй вопросы, симулируй экзамен и сдай с первого раза.",
    "footer.nav": "Навигация",
    "footer.contact": "Контакты",
    "footer.rights": "Все права защищены.",
  },

  en: {
    "nav.features": "Features",
    "nav.howItWorks": "How it works",
    "nav.testimonials": "Testimonials",
    "nav.download": "Download",
    "nav.cta": "Get the app",

    "hero.badge": "Free iOS app",
    "hero.title1": "Pass your driving exam",
    "hero.title2": "on the first try!",
    "hero.description":
      "Practice questions, simulate the exam, track your progress and find the best driving school — all in one app.",
    "hero.cta": "Download free",
    "hero.ctaSecondary": "Learn more",
    "hero.statQuestions": "Questions",
    "hero.statSchools": "Driving schools",
    "hero.statLanguages": "Languages",

    "features.title": "Everything you need to pass",
    "features.subtitle":
      "Položi! combines all preparation tools into one app.",
    "features.training.title": "Category training",
    "features.training.desc":
      "Practice questions on road signs, traffic rules and first aid. With explanations for every answer.",
    "features.exam.title": "Exam simulation",
    "features.exam.desc":
      "40 questions, 45 minutes — exactly like the real exam. Check if you're ready before going to take it.",
    "features.stats.title": "Progress tracking",
    "features.stats.desc":
      "Detailed statistics by category, exam history and work on mistakes.",
    "features.schools.title": "Driving school ratings",
    "features.schools.desc":
      "Find the best driving school in your city. Check ratings, prices and reviews from other students.",
    "features.offline.title": "Works offline",
    "features.offline.desc":
      "All questions available offline. Practice anywhere — on the bus, in the park or at home.",
    "features.languages.title": "3 languages",
    "features.languages.desc":
      "Serbian, Russian and English. Switch language in settings with one tap.",

    "how.title": "How does it work?",
    "how.subtitle": "Four simple steps to your driver's license.",
    "how.step1.title": "Download the app",
    "how.step1.desc": "Free from the App Store. No registration needed.",
    "how.step2.title": "Practice by category",
    "how.step2.desc":
      "Start with signs and rules. Read explanations and learn from mistakes.",
    "how.step3.title": "Simulate the exam",
    "how.step3.desc":
      "When you're ready — try the simulation. 40 questions, 45 minutes, just like the real exam.",
    "how.step4.title": "Pass on the first try!",
    "how.step4.desc":
      "With enough practice, the exam won't be a problem. Go with confidence.",

    "testimonials.title": "What our users say",
    "testimonials.subtitle":
      "Thousands of students passed the exam using Položi!",
    "testimonial.1.name": "Marko J.",
    "testimonial.1.city": "Belgrade",
    "testimonial.1.text":
      "Passed on my first try thanks to this app. The exam simulation was identical to the real one!",
    "testimonial.2.name": "Ana S.",
    "testimonial.2.city": "Novi Sad",
    "testimonial.2.text":
      "Best app for preparation. Love that it works offline — I could practice on the bus every day.",
    "testimonial.3.name": "Stefan M.",
    "testimonial.3.city": "Niš",
    "testimonial.3.text":
      "Working on mistakes was key. The app remembers where you go wrong and gives you the same questions again.",
    "testimonial.4.name": "Milica R.",
    "testimonial.4.city": "Kragujevac",
    "testimonial.4.text":
      "Great feature with driving school ratings. Found an amazing school through the app.",
    "testimonial.5.name": "Nikola D.",
    "testimonial.5.city": "Kruševac",
    "testimonial.5.text":
      "I use the Russian version since it's easier for me. Great that it supports multiple languages!",
    "testimonial.6.name": "Jovana P.",
    "testimonial.6.city": "Belgrade",
    "testimonial.6.text":
      "I recommend it to all my friends. Practiced for three months and passed with 39 out of 40!",

    "download.title": "Download Položi! today",
    "download.subtitle":
      "Start practicing right now. Your driver's license is just a few taps away.",
    "download.benefit1": "Completely free",
    "download.benefit2": "No registration",
    "download.benefit3": "Works offline",
    "download.benefit4": "Serbian, Russian, English",
    "download.appStore": "Download on App Store",

    "footer.description":
      "App for driving exam preparation in Serbia. Practice questions, simulate the exam and pass on the first try.",
    "footer.nav": "Navigation",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved.",
  },
};

export function t(locale: Locale, key: string): string {
  return translations[locale]?.[key] ?? translations.sr[key] ?? key;
}
