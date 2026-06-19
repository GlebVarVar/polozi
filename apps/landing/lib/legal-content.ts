import type { Locale } from "./i18n";

export const SUPPORT_EMAIL = "info@polozi.rs";

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type PrivacyDoc = {
  title: string;
  updatedLabel: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

export type FaqItem = { q: string; a: string };

export type SupportDoc = {
  title: string;
  intro: string;
  contactHeading: string;
  contactBody: string;
  faqHeading: string;
  faq: FaqItem[];
  privacyNote: string;
  privacyLinkLabel: string;
};

export const homeLabel: Record<Locale, string> = {
  sr: "Početna",
  ru: "Главная",
  en: "Home",
};

export const privacyContent: Record<Locale, PrivacyDoc> = {
  sr: {
    title: "Politika privatnosti",
    updatedLabel: "Poslednje ažuriranje",
    updated: "16. jun 2026.",
    intro:
      "Ova Politika privatnosti objašnjava kako mobilna aplikacija Položi! („Aplikacija“, „mi“) postupa sa informacijama. Korišćenjem Aplikacije prihvatate ovu politiku.",
    sections: [
      {
        heading: "Podaci koje prikupljamo",
        paragraphs: [
          "Aplikacija ne zahteva nalog i ne prikuplja lične podatke koji vas identifikuju. Vaš napredak, rezultati i podešavanja čuvaju se lokalno na vašem uređaju i ne šalju se nama.",
          "Ne koristimo sopstvene alate za analitiku ni praćenje.",
        ],
      },
      {
        heading: "Oglašavanje",
        paragraphs: [
          "Aplikacija je besplatna i finansira se putem oglasa. Naši partneri za oglašavanje (treće strane) mogu prikupljati i obrađivati podatke o uređaju — uključujući reklamni identifikator (IDFA na iOS-u), približne informacije o uređaju i interakciju sa oglasima — radi prikazivanja i merenja oglasa.",
          "Na iOS-u tražimo vašu dozvolu putem App Tracking Transparency (ATT) pre bilo kakvog praćenja. Možete je odbiti, a reklamni identifikator možete u svakom trenutku poništiti ili ograničiti u podešavanjima uređaja (Podešavanja → Privatnost i bezbednost → Praćenje / Apple oglašavanje).",
        ],
      },
      {
        heading: "Deljenje podataka",
        paragraphs: [
          "Ne prodajemo vaše lične podatke. Podatke koji se obrađuju radi oglašavanja obrađuju naši partneri za oglašavanje u skladu sa sopstvenim politikama privatnosti.",
        ],
      },
      {
        heading: "Deca",
        paragraphs: [
          "Aplikacija nije namenjena deci mlađoj od 13 godina i svesno ne prikupljamo njihove podatke.",
        ],
      },
      {
        heading: "Vaš izbor",
        paragraphs: [
          "Personalizovane oglase možete isključiti i reklamni identifikator poništiti u podešavanjima uređaja. Brisanjem Aplikacije uklanjaju se svi lokalno sačuvani podaci.",
        ],
      },
      {
        heading: "Izmene ove politike",
        paragraphs: [
          "Ovu politiku možemo povremeno ažurirati. Bitne izmene biće prikazane na ovoj stranici sa novim datumom ažuriranja.",
        ],
      },
      {
        heading: "Kontakt",
        paragraphs: [
          `Za pitanja o ovoj politici pišite nam na ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
  ru: {
    title: "Политика конфиденциальности",
    updatedLabel: "Последнее обновление",
    updated: "16 июня 2026 г.",
    intro:
      "Настоящая Политика конфиденциальности описывает, как мобильное приложение Položi! («Приложение», «мы») обращается с информацией. Используя Приложение, вы соглашаетесь с этой политикой.",
    sections: [
      {
        heading: "Какие данные мы собираем",
        paragraphs: [
          "Приложение не требует учётной записи и не собирает персональные данные, которые вас идентифицируют. Ваш прогресс, результаты и настройки хранятся локально на устройстве и нам не передаются.",
          "Мы не используем собственные средства аналитики или трекинга.",
        ],
      },
      {
        heading: "Реклама",
        paragraphs: [
          "Приложение бесплатное и поддерживается рекламой. Наши сторонние рекламные партнёры могут собирать и обрабатывать данные устройства — включая рекламный идентификатор (IDFA на iOS), приблизительные сведения об устройстве и взаимодействие с рекламой — для показа и измерения рекламы.",
          "На iOS перед любым отслеживанием мы запрашиваем ваше разрешение через App Tracking Transparency (ATT). Вы можете отказаться, а рекламный идентификатор в любой момент сбросить или ограничить в настройках устройства (Настройки → Конфиденциальность и безопасность → Отслеживание / Реклама Apple).",
        ],
      },
      {
        heading: "Передача данных",
        paragraphs: [
          "Мы не продаём ваши персональные данные. Данные, обрабатываемые для рекламы, обрабатываются нашими рекламными партнёрами в соответствии с их собственными политиками конфиденциальности.",
        ],
      },
      {
        heading: "Дети",
        paragraphs: [
          "Приложение не предназначено для детей младше 13 лет, и мы осознанно не собираем их данные.",
        ],
      },
      {
        heading: "Ваш выбор",
        paragraphs: [
          "Вы можете отключить персонализированную рекламу и сбросить рекламный идентификатор в настройках устройства. Удаление Приложения удаляет все локально сохранённые данные.",
        ],
      },
      {
        heading: "Изменения политики",
        paragraphs: [
          "Мы можем периодически обновлять эту политику. Существенные изменения будут отражены на этой странице с новой датой обновления.",
        ],
      },
      {
        heading: "Контакты",
        paragraphs: [`По вопросам о политике пишите нам на ${SUPPORT_EMAIL}.`],
      },
    ],
  },
  en: {
    title: "Privacy Policy",
    updatedLabel: "Last updated",
    updated: "16 June 2026",
    intro:
      'This Privacy Policy explains how the Položi! mobile app ("the App", "we") handles information. By using the App, you agree to this policy.',
    sections: [
      {
        heading: "Information we collect",
        paragraphs: [
          "The App does not require an account and does not collect personal data that identifies you. Your progress, results and settings are stored locally on your device and are not transmitted to us.",
          "We do not use our own analytics or tracking SDKs.",
        ],
      },
      {
        heading: "Advertising",
        paragraphs: [
          "The App is free and supported by advertising. Our third-party advertising partners may collect and process device data — including an advertising identifier (IDFA on iOS), approximate device information and interaction with ads — to deliver and measure advertising.",
          "On iOS, we ask for your permission via App Tracking Transparency (ATT) before any tracking. You can decline, and you can reset or limit your advertising identifier at any time in your device settings (Settings → Privacy & Security → Tracking / Apple Advertising).",
        ],
      },
      {
        heading: "Data sharing",
        paragraphs: [
          "We do not sell your personal data. Data processed for advertising is handled by our advertising partners under their own privacy policies.",
        ],
      },
      {
        heading: "Children",
        paragraphs: [
          "The App is not directed to children under the age of 13, and we do not knowingly collect their data.",
        ],
      },
      {
        heading: "Your choices",
        paragraphs: [
          "You can turn off personalized ads and reset your advertising identifier in your device settings. Deleting the App removes all locally stored data.",
        ],
      },
      {
        heading: "Changes to this policy",
        paragraphs: [
          "We may update this policy from time to time. Material changes will be reflected on this page with a new last-updated date.",
        ],
      },
      {
        heading: "Contact",
        paragraphs: [
          `If you have questions about this policy, email us at ${SUPPORT_EMAIL}.`,
        ],
      },
    ],
  },
};

export const supportContent: Record<Locale, SupportDoc> = {
  sr: {
    title: "Podrška",
    intro: "Potrebna vam je pomoć sa aplikacijom Položi!? Tu smo za vas.",
    contactHeading: "Kontakt",
    contactBody:
      "Pišite nam na e-poštu i odgovorićemo vam, obično u roku od 2 radna dana.",
    faqHeading: "Često postavljana pitanja",
    faq: [
      {
        q: "Da li je aplikacija besplatna?",
        a: "Da. Položi! je besplatna i finansira se putem oglasa.",
      },
      {
        q: "Kako se čuva moj napredak?",
        a: "Vaš napredak se čuva lokalno na uređaju. Ponovna instalacija ili promena uređaja poništava ga.",
      },
      {
        q: "Koji jezici su podržani?",
        a: "Srpski, engleski i ruski.",
      },
      {
        q: "Kako da upravljam praćenjem za oglase?",
        a: "Na iOS-u idite u Podešavanja → Privatnost i bezbednost → Praćenje da upravljate dozvolama ili poništite reklamni identifikator pod Apple oglašavanje.",
      },
    ],
    privacyNote: "Pitanja o podacima i privatnosti? Pogledajte našu",
    privacyLinkLabel: "Politiku privatnosti",
  },
  ru: {
    title: "Поддержка",
    intro: "Нужна помощь с приложением Položi!? Мы на связи.",
    contactHeading: "Контакты",
    contactBody:
      "Напишите нам на почту — обычно отвечаем в течение 2 рабочих дней.",
    faqHeading: "Частые вопросы",
    faq: [
      {
        q: "Приложение бесплатное?",
        a: "Да. Položi! бесплатное и поддерживается рекламой.",
      },
      {
        q: "Как сохраняется мой прогресс?",
        a: "Прогресс хранится локально на устройстве. Переустановка приложения или смена устройства сбрасывает его.",
      },
      {
        q: "Какие языки поддерживаются?",
        a: "Сербский, английский и русский.",
      },
      {
        q: "Как управлять рекламным отслеживанием?",
        a: "На iOS откройте Настройки → Конфиденциальность и безопасность → Отслеживание, чтобы управлять разрешениями, или сбросьте рекламный идентификатор в разделе «Реклама Apple».",
      },
    ],
    privacyNote: "Вопросы о данных и конфиденциальности? Смотрите нашу",
    privacyLinkLabel: "Политику конфиденциальности",
  },
  en: {
    title: "Support",
    intro: "Need help with Položi!? We're here for you.",
    contactHeading: "Contact",
    contactBody:
      "Email us and we'll get back to you, usually within 2 business days.",
    faqHeading: "Frequently asked questions",
    faq: [
      {
        q: "Is the app free?",
        a: "Yes. Položi! is free and supported by ads.",
      },
      {
        q: "How is my progress saved?",
        a: "Your progress is stored locally on your device. Reinstalling the app or switching devices resets it.",
      },
      {
        q: "Which languages are supported?",
        a: "Serbian, English and Russian.",
      },
      {
        q: "How do I manage ad tracking?",
        a: "On iOS, go to Settings → Privacy & Security → Tracking to manage permissions, or reset your advertising identifier under Apple Advertising.",
      },
    ],
    privacyNote: "Questions about data and privacy? Read our",
    privacyLinkLabel: "Privacy Policy",
  },
};
