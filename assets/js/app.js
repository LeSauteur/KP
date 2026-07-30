(function () {
  "use strict";

  const content = window.DOMIAN_CONTENT || {};
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const transparentPixel = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";

  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const text = (value) => String(value ?? "");
  const clean = (value) => text(value).trim();

  function createIcon(id) {
    return `<svg aria-hidden="true"><use href="#${id}"></use></svg>`;
  }

  function renderHeroMetrics() {
    const root = qs("#hero-metrics");
    if (!root || !Array.isArray(content.heroMetrics)) return;

    root.innerHTML = content.heroMetrics.map((item) => {
      const display = clean(item.display);
      const prefix = display.startsWith("с ") ? "с " : "";
      const grouping = prefix ? "false" : "true";
      return `
        <li class="hero-metric">
          <strong data-counter="${Number(item.value) || 0}" data-prefix="${prefix}" data-grouping="${grouping}">${display}</strong>
          <span>${text(item.label)}</span>
        </li>`;
    }).join("");
  }

  function renderNetworkMetrics() {
    const root = qs("#network-metrics");
    if (!root || !Array.isArray(content.networkMetrics)) return;

    root.innerHTML = content.networkMetrics.map((item, index) => `
      <article class="metric-card tone-${clean(item.tone) || "blue"}" data-reveal data-delay="${index * 60}">
        <strong data-counter="${Number(item.value) || 0}">${text(item.display)}</strong>
        <span>${text(item.label)}</span>
      </article>`).join("");

  }

  function renderEconomy() {
    if (!content.economy) return;

    const mapping = [
      ["#economy-turnover", content.economy.monthlyTurnover],
      ["#economy-result", content.economy.modelResult],
      ["#economy-share", content.economy.ownerShare]
    ];

    mapping.forEach(([selector, value]) => {
      const node = qs(selector);
      if (node) node.textContent = text(value);
    });

    const root = qs("#economy-scenarios");
    if (!root || !Array.isArray(content.economy.scenarios)) return;

    root.innerHTML = content.economy.scenarios.map((scenario, index) => {
      const details = Array.isArray(scenario.details) ? scenario.details : [];
      return `
        <article class="scenario-card" data-reveal data-delay="${index * 75}">
          <span class="scenario-number">0${index + 1}</span>
          <h3>${text(scenario.title)}</h3>
          <ul class="scenario-details">${details.map((detail) => `<li>${text(detail)}</li>`).join("")}</ul>
          <div class="scenario-row">
            <span>Оборот<strong>${text(scenario.turnover)}</strong></span>
            <span class="scenario-result">${text(scenario.resultLabel || "Результат")}<strong>${text(scenario.result)}</strong></span>
          </div>
          <p class="scenario-note">${text(scenario.note)}</p>
        </article>`;
    }).join("");
  }

  function renderCities() {
    const root = qs("#city-list");
    if (!root || !Array.isArray(content.cities)) return;
    root.innerHTML = content.cities.map((city) => `<li class="city-tag">${text(city)}</li>`).join("");
  }

  function renderConditions() {
    const root = qs("#conditions-grid");
    if (!root || !Array.isArray(content.conditions)) return;

    root.innerHTML = content.conditions.map((item, index) => `
      <div class="condition-item" data-reveal data-delay="${(index % 2) * 70}">
        <dt>${text(item.label)}</dt>
        <dd>${text(item.value)}</dd>
      </div>`).join("");
  }

  function renderDocuments() {
    const root = qs("#documents-grid");
    if (!root || !Array.isArray(content.documents)) return;

    root.innerHTML = content.documents.map((documentItem, index) => {
      const file = clean(documentItem.file);
      const href = file || "#final-cta";
      const label = file ? "Открыть документ" : "Получить для ознакомления";
      const target = file ? ` target="_blank" rel="noopener"` : "";
      return `
        <article class="document-card" data-reveal data-delay="${(index % 4) * 55}">
          <span class="document-icon">${createIcon("icon-file")}</span>
          <h3>${text(documentItem.title)}</h3>
          <p>${text(documentItem.description)}</p>
          <a class="document-link" href="${href}"${target}>${label}${createIcon("icon-arrow")}</a>
        </article>`;
    }).join("");
  }

  const galleryItems = [];

  function normalizeGalleryItem(item, groupTitle) {
    if (!item || typeof item !== "object") return null;
    const src = clean(item.src || item.image || item.logo);
    if (!src) return null;
    const caption = clean(item.caption || item.name || item.alt || groupTitle);
    return {
      src,
      thumb: clean(item.thumb) || src,
      alt: clean(item.alt) || caption,
      caption,
      groupTitle
    };
  }

  function renderGalleries() {
    const section = qs("#materials");
    const root = qs("#gallery-groups");
    if (!section || !root || !content.galleries) return;

    const groups = Object.entries(content.galleries).map(([key, group]) => {
      const baseItems = Array.isArray(group.items) ? group.items : [];
      const partnerItems = key === "partners" && Array.isArray(content.partners) ? content.partners : [];
      const items = [...baseItems, ...partnerItems]
        .map((item) => normalizeGalleryItem(item, group.title))
        .filter(Boolean);
      return { ...group, key, items };
    }).filter((group) => group.items.length > 0);

    if (!groups.length) {
      section.hidden = true;
      return;
    }

    galleryItems.length = 0;
    root.innerHTML = groups.map((group) => {
      const buttons = group.items.map((item) => {
        const itemIndex = galleryItems.push(item) - 1;
        return `
          <button class="gallery-item" type="button" data-gallery-index="${itemIndex}" aria-label="Открыть: ${text(item.alt)}">
            <img src="${item.thumb}" alt="${text(item.alt)}" loading="lazy" decoding="async">
            <span>${text(item.caption)}</span>
          </button>`;
      }).join("");

      return `
        <section class="gallery-group" data-gallery-group="${group.key}" aria-labelledby="gallery-${group.key}">
          <div class="gallery-group-header">
            <div><p class="eyebrow">${text(group.eyebrow)}</p><h3 id="gallery-${group.key}">${text(group.title)}</h3></div>
          </div>
          <div class="gallery-grid">${buttons}</div>
        </section>`;
    }).join("");

    section.hidden = false;

    qsa(".gallery-item", root).forEach((button) => {
      button.addEventListener("click", () => openLightbox(Number(button.dataset.galleryIndex)));
      const image = qs("img", button);
      if (image) {
        image.addEventListener("error", () => {
          const group = button.closest(".gallery-group");
          button.remove();
          if (group && !qs(".gallery-item", group)) group.remove();
          if (!qs(".gallery-group", root)) section.hidden = true;
        }, { once: true });
      }
    });
  }

  let activeGalleryIndex = 0;
  const lightbox = qs("#lightbox");
  const lightboxImage = qs("#lightbox-image");
  const lightboxCaption = qs("#lightbox-caption");
  const lightboxPrev = qs(".lightbox-prev");
  const lightboxNext = qs(".lightbox-next");
  const lightboxClose = qs(".lightbox-close");

  function updateLightbox() {
    const item = galleryItems[activeGalleryIndex];
    if (!item || !lightboxImage || !lightboxCaption) return;
    lightboxImage.src = item.src;
    lightboxImage.alt = item.alt;
    lightboxCaption.textContent = item.caption;
    const showNavigation = galleryItems.length > 1;
    if (lightboxPrev) lightboxPrev.hidden = !showNavigation;
    if (lightboxNext) lightboxNext.hidden = !showNavigation;
  }

  function openLightbox(index) {
    if (!lightbox || !galleryItems[index]) return;
    activeGalleryIndex = index;
    updateLightbox();
    document.body.classList.add("lightbox-open");
    if (typeof lightbox.showModal === "function") lightbox.showModal();
    else lightbox.setAttribute("open", "");
  }

  function closeLightbox() {
    if (!lightbox) return;
    if (typeof lightbox.close === "function" && lightbox.open) lightbox.close();
    else lightbox.removeAttribute("open");
    document.body.classList.remove("lightbox-open");
    if (lightboxImage) {
      lightboxImage.src = transparentPixel;
      lightboxImage.alt = "";
    }
  }

  function moveLightbox(direction) {
    if (galleryItems.length < 2) return;
    activeGalleryIndex = (activeGalleryIndex + direction + galleryItems.length) % galleryItems.length;
    updateLightbox();
  }

  function configureLightbox() {
    if (!lightbox) return;
    lightboxClose?.addEventListener("click", closeLightbox);
    lightboxPrev?.addEventListener("click", () => moveLightbox(-1));
    lightboxNext?.addEventListener("click", () => moveLightbox(1));
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
    lightbox.addEventListener("cancel", (event) => {
      event.preventDefault();
      closeLightbox();
    });
    lightbox.addEventListener("close", () => document.body.classList.remove("lightbox-open"));
    document.addEventListener("keydown", (event) => {
      if (!lightbox.open) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeLightbox();
      }
      if (event.key === "ArrowLeft") moveLightbox(-1);
      if (event.key === "ArrowRight") moveLightbox(1);
    });
  }

  function normalizeTelegram(value) {
    const raw = clean(value);
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://t.me/${raw.replace(/^@/, "")}`;
  }

  function normalizeWhatsApp(value) {
    const raw = clean(value);
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://wa.me/${raw.replace(/\D/g, "")}`;
  }

  function renderContacts() {
    const contacts = content.contacts || {};
    const actionsRoot = qs("#contact-actions");
    const fallback = qs("#cta-fallback");
    const formWrap = qs("#contact-form-wrap");
    if (!actionsRoot || !fallback || !formWrap) return;

    const phone = clean(contacts.phone);
    const email = clean(contacts.email);
    const telegram = normalizeTelegram(contacts.telegram);
    const whatsapp = normalizeWhatsApp(contacts.whatsapp);
    const actions = [];

    if (phone) actions.push({ label: phone, href: `tel:${phone.replace(/[^+\d]/g, "")}` });
    if (email) actions.push({ label: "Написать на email", href: `mailto:${email}` });
    if (telegram) actions.push({ label: "Telegram", href: telegram, external: true });
    if (whatsapp) actions.push({ label: "WhatsApp", href: whatsapp, external: true });

    actionsRoot.innerHTML = actions.map((action) => `
      <a class="contact-action" href="${action.href}"${action.external ? ` target="_blank" rel="noopener"` : ""}>
        ${text(action.label)}${createIcon("icon-arrow")}
      </a>`).join("");

    const endpoint = clean(contacts.formEndpoint);
    if (endpoint) {
      formWrap.hidden = false;
      formWrap.innerHTML = `
        <form class="contact-form" action="${endpoint}" method="post">
          <label for="contact-name">Имя</label>
          <input id="contact-name" name="name" type="text" autocomplete="name" placeholder="Ваше имя" required>
          <label for="contact-phone">Телефон</label>
          <input id="contact-phone" name="phone" type="tel" autocomplete="tel" placeholder="Ваш телефон" required>
          <button class="button button-primary" type="submit">Обсудить запуск</button>
        </form>`;
    } else {
      formWrap.hidden = true;
      formWrap.innerHTML = "";
    }

    fallback.hidden = actions.length > 0 || Boolean(endpoint);
  }

  function renderSocialLinks() {
    const root = qs("#social-links");
    if (!root) return;
    const socials = content.socialLinks || {};
    const labels = { vk: "VK", youtube: "YouTube", rutube: "RuTube", dzen: "Дзен" };
    root.innerHTML = Object.entries(socials)
      .filter(([, value]) => clean(value))
      .map(([key, value]) => `<a href="${clean(value)}" target="_blank" rel="noopener">${labels[key] || key}</a>`)
      .join("");
  }

  function configureMenu() {
    const toggle = qs(".menu-toggle");
    const menu = qs("#mobile-menu");
    if (!toggle || !menu) return;

    const closeMenu = () => {
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Открыть меню");
      menu.hidden = true;
      document.body.classList.remove("menu-open");
    };

    const openMenu = () => {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Закрыть меню");
      menu.hidden = false;
      document.body.classList.add("menu-open");
    };

    toggle.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") === "true") closeMenu();
      else openMenu();
    });

    qsa("a", menu).forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) {
        closeMenu();
        toggle.focus();
      }
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 960 && !menu.hidden) closeMenu();
    });
  }

  function configureHeaderAndTopButton() {
    const header = qs("[data-header]");
    const topButton = qs(".back-to-top");
    const update = () => {
      const scrolled = window.scrollY > 16;
      header?.classList.toggle("is-scrolled", scrolled);
      topButton?.classList.toggle("is-visible", window.scrollY > 700);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    topButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));
  }

  function configureFaq() {
    qsa(".faq-list details").forEach((details) => {
      const summary = qs("summary", details);
      if (!summary) return;
      summary.setAttribute("aria-expanded", String(details.open));
      details.addEventListener("toggle", () => summary.setAttribute("aria-expanded", String(details.open)));
    });
  }

  function configureActiveNavigation() {
    if (!("IntersectionObserver" in window)) return;
    const navLinks = qsa(".desktop-nav a");
    const linksById = new Map(navLinks.map((link) => [link.getAttribute("href")?.slice(1), link]));
    const sections = Array.from(linksById.keys()).map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => link.classList.toggle("is-active", link === linksById.get(visible.target.id)));
    }, { rootMargin: "-24% 0px -60% 0px", threshold: [0.05, 0.25, 0.5] });

    sections.forEach((section) => observer.observe(section));
  }

  function finalCounterText(element) {
    const value = Number(element.dataset.counter) || 0;
    const decimals = Number(element.dataset.decimals) || 0;
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    const useGrouping = element.dataset.grouping !== "false";
    const formatted = new Intl.NumberFormat("ru-RU", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping
    }).format(value);
    return `${prefix}${formatted}${suffix}`;
  }

  function animateCounter(element) {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";
    if (reducedMotion) {
      element.textContent = finalCounterText(element);
      return;
    }

    const target = Number(element.dataset.counter) || 0;
    const decimals = Number(element.dataset.decimals) || 0;
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";
    const useGrouping = element.dataset.grouping !== "false";
    const duration = 950;
    const startTime = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;
      const formatted = new Intl.NumberFormat("ru-RU", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping
      }).format(current);
      element.textContent = `${prefix}${formatted}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
      else element.textContent = finalCounterText(element);
    };

    requestAnimationFrame(tick);
  }

  function configureCounters() {
    const counters = qsa("[data-counter]");
    if (!("IntersectionObserver" in window) || reducedMotion) {
      counters.forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.55 });

    counters.forEach((counter) => observer.observe(counter));
  }

  function configureReveal() {
    const items = qsa("[data-reveal]");
    items.forEach((item) => item.style.setProperty("--reveal-delay", `${Number(item.dataset.delay) || 0}ms`));

    if (!("IntersectionObserver" in window) || reducedMotion) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("reveal-ready");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -8% 0px" });

    items.forEach((item) => observer.observe(item));
  }

  function initialize() {
    renderHeroMetrics();
    renderNetworkMetrics();
    renderEconomy();
    renderCities();
    renderConditions();
    renderDocuments();
    renderGalleries();
    renderContacts();
    renderSocialLinks();

    const year = qs("#current-year");
    if (year) year.textContent = String(new Date().getFullYear());

    configureLightbox();
    configureMenu();
    configureHeaderAndTopButton();
    configureFaq();
    configureActiveNavigation();
    configureCounters();
    configureReveal();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
