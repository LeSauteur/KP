(() => {
  "use strict";

  const heroes = {
    b: {
      title: "Свой офис недвижимости. Не с нуля.",
      lead: "Dомиан уже прошёл этот путь — вам не придётся проходить его одному."
    },
    c: {
      title: "Dомиан в каждом дворе. Следующий офис — ваш.",
      lead: "Проведём от идеи до работающего агентства под вывеской Dомиан."
    }
  };
  const variant = new URLSearchParams(location.search).get("hero");
  if (Object.hasOwn(heroes, variant)) {
    document.querySelector("#hero-title").textContent = heroes[variant].title;
    document.querySelector("#hero-lead").textContent = heroes[variant].lead;
  }

  const content = window.DOMIAN_CONTENT;
  if (content) {
    const facts = {
      offices: content.network.officesDisplay,
      since: content.network.since,
      launch: content.heroFacts.find((fact) => fact.note === "launch")?.display,
      royalty: content.heroFacts.find((fact) => fact.label === "снижается роялти")?.display,
      adFee: content.conditions.find((fact) => fact.label === "обязательный рекламный сбор")?.value
    };
    document.querySelectorAll("[data-fact]").forEach((node) => {
      const value = facts[node.dataset.fact];
      if (value) node.textContent = value;
    });
    document.querySelectorAll("[data-note]").forEach((node) => {
      const value = content.notes[node.dataset.note];
      if (value) node.textContent = value;
    });
    configureContacts(content.contacts);
  }
  document.querySelector("#year").textContent = new Date().getFullYear();

  const ticker = document.querySelector(".ticker-track");
  const tickerCopy = ticker.firstElementChild.cloneNode(true);
  const tickerToggle = document.querySelector(".ticker-toggle");
  tickerCopy.classList.add("ticker-copy");
  tickerCopy.setAttribute("aria-hidden", "true");
  ticker.append(tickerCopy);
  tickerToggle.hidden = false;
  tickerToggle.addEventListener("click", () => {
    const paused = ticker.toggleAttribute("data-paused");
    tickerToggle.textContent = paused ? "▶" : "Ⅱ";
    tickerToggle.setAttribute("aria-label", paused ? "Запустить бегущую строку" : "Приостановить бегущую строку");
  });

  const hero = document.querySelector(".hero");
  const final = document.querySelector(".final");
  const stickyCall = document.querySelector(".sticky-call");
  const stickyObserver = new IntersectionObserver(() => {
    const betweenCalls = hero.getBoundingClientRect().bottom <= 0 && final.getBoundingClientRect().top >= innerHeight;
    stickyCall.hidden = !betweenCalls;
  });
  stickyObserver.observe(hero);
  stickyObserver.observe(final);

  function configureContacts(contacts) {
    const phone = contacts.phone.trim();
    const dial = phone.replace(/[^+\d]/g, "");
    if (/^\+?\d+$/.test(dial)) {
      document.querySelectorAll("[data-phone]").forEach((link) => {
        link.href = `tel:${dial}`;
        if (!link.matches("[data-phone-label]") && !link.querySelector("[data-phone-label]")) {
          link.setAttribute("aria-label", `Записаться на экскурсию по телефону ${phone}`);
        }
      });
      document.querySelectorAll("[data-phone-label]").forEach((label) => { label.textContent = phone; });
    }

    const telegram = contacts.telegram.trim();
    const whatsapp = contacts.whatsapp.trim();
    const channels = document.querySelector("#contact-channels");
    const links = [
      ["Telegram", /^https:\/\/t\.me\/[\w/]+$/i.test(telegram) ? telegram : /^@?\w+$/.test(telegram) ? `https://t.me/${telegram.replace(/^@/, "")}` : ""],
      ["WhatsApp", /^https:\/\/wa\.me\/\d+$/i.test(whatsapp) ? whatsapp : /^\+?[\d\s()-]+$/.test(whatsapp) ? `https://wa.me/${whatsapp.replace(/\D/g, "")}` : ""]
    ];
    links.forEach(([label, url]) => {
      if (!url) return;
      const link = document.createElement("a");
      link.href = url;
      link.className = "text-link";
      link.textContent = label;
      channels.append(link);
    });
    channels.hidden = !channels.childElementCount;

    const endpoint = contacts.formEndpoint.trim();
    if (/^https:\/\/[^\s/]+/i.test(endpoint)) {
      const form = document.querySelector("#contact-form");
      form.action = endpoint;
      form.hidden = false;
    }
  }
})();
