/*
 * Единая конфигурация контента лендинга.
 * Пути указываются относительно index.html, например:
 * assets/docs/franchise-agreement.pdf
 */
window.DOMIAN_CONTENT = {
  heroMetrics: [
    { value: 71, display: "71", label: "действующий офис" },
    { value: 62, display: "62", label: "франшизных офиса" },
    { value: 2008, display: "с 2008", label: "года на рынке" }
  ],

  networkMetrics: [
    { value: 71, display: "71", label: "действующий офис", tone: "red" },
    { value: 62, display: "62", label: "франшизных офиса", tone: "blue" },
    { value: 52, display: "52", label: "собственника", tone: "green" },
    { value: 7, display: "7", label: "партнёров развивают несколько офисов", tone: "gold" }
  ],

  turnover: {
    value: 374.04,
    display: "374,04 млн ₽",
    description: "совокупный комиссионный оборот 55 партнёрских единиц за январь-июнь 2026 года"
  },

  economy: {
    monthlyTurnover: "от 404 тыс. до 1,16 млн ₽",
    modelResult: "от 121 тыс. до 348 тыс. ₽",
    ownerShare: "до 50%",
    scenarios: [
      {
        title: "Рабочая модель",
        turnover: "800 000 ₽",
        result: "240 000 ₽",
        note: "при модели 30%"
      },
      {
        title: "Сильный офис",
        turnover: "1 160 000 ₽",
        result: "348 000 ₽",
        note: "при модели 30%"
      },
      {
        title: "Собственник в сделках",
        turnover: "1 160 000 ₽",
        result: "до 580 000 ₽",
        note: "совокупного дохода при сценарии 50%"
      }
    ]
  },

  conditions: [
    { value: "Российская Федерация", label: "территория развития" },
    { value: "Около месяца", label: "ориентировочный срок запуска" },
    { value: "От 25 м²", label: "помещение" },
    { value: "Бессрочный", label: "договор" },
    { value: "Отсутствует", label: "рекламный сбор" },
    { value: "Нет", label: "дополнительных обязательных регулярных платежей" }
  ],

  cities: [
    "Аксай",
    "Батайск",
    "Новочеркасск",
    "Шахты",
    "Таганрог",
    "Волгодонск",
    "Сальск",
    "Каменск-Шахтинский",
    "Миллерово",
    "Белая Калитва",
    "Кореновск",
    "Севастополь"
  ],

  documents: [
    {
      title: "Франшизный договор",
      description: "Условия сотрудничества, права и обязанности сторон",
      file: ""
    },
    {
      title: "Помощь в открытии ИП",
      description: "Последовательность регистрации бизнеса перед запуском офиса",
      file: ""
    },
    {
      title: "Памятка по выбору ОКВЭД",
      description: "Рекомендации по видам деятельности для агентства недвижимости",
      file: ""
    },
    {
      title: "Сопровождение открытия офиса",
      description: "Этапы запуска и зона поддержки ведущего специалиста",
      file: ""
    },
    {
      title: "Брендбук",
      description: "Правила использования фирменного стиля Домиан",
      file: ""
    },
    {
      title: "Требования к оформлению офиса",
      description: "Рекомендации по помещению, вывеске и фирменным материалам",
      file: ""
    },
    {
      title: "Программа обучения",
      description: "Четырёхдневный вводный курс и дальнейшее развитие команды",
      file: ""
    },
    {
      title: "Стандарты работы сети",
      description: "Принципы продаж, управления офисом и межофисного взаимодействия",
      file: ""
    }
  ],

  contacts: {
    phone: "",
    email: "",
    telegram: "",
    whatsapp: "",
    formEndpoint: ""
  },

  socialLinks: {
    vk: "",
    youtube: "",
    rutube: "",
    dzen: ""
  },

  partners: [],

  galleries: {
    certificates: {
      title: "Сертификаты",
      eyebrow: "Компетенции сети",
      items: []
    },
    diplomas: {
      title: "Грамоты",
      eyebrow: "Профессиональное признание",
      items: []
    },
    awards: {
      title: "Награды",
      eyebrow: "Достижения",
      items: []
    },
    offices: {
      title: "Офисы Домиан",
      eyebrow: "Среда для команды и клиентов",
      items: []
    },
    brokerTours: {
      title: "Брокер-туры",
      eyebrow: "Прямой контакт с рынком",
      items: []
    },
    training: {
      title: "Обучение",
      eyebrow: "Развитие команды",
      items: []
    },
    forums: {
      title: "Форумы",
      eyebrow: "Обмен практиками",
      items: []
    },
    corporateEvents: {
      title: "Корпоративные мероприятия",
      eyebrow: "Сообщество сети",
      items: []
    },
    partners: {
      title: "Партнёры и застройщики",
      eyebrow: "Сотрудничество",
      items: []
    }
  }
};
