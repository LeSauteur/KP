(function () {
  "use strict";

  const content = window.DOMIAN_CONTENT || {};
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => clean(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);

  function safeLocalPdf(value) {
    const path = clean(value);
    return /^(?!https?:|\/\/|data:|javascript:)[a-z0-9_./-]+\.pdf(?:[?#].*)?$/i.test(path) ? path : "";
  }

  function renderCtaLabels() {
    const cta = content.cta || {};
    qsa("[data-cta-label]").forEach((node) => {
      const label = clean(cta[node.dataset.ctaLabel]);
      if (label) node.textContent = label;
    });
  }

  function renderPdfLinks() {
    const path = safeLocalPdf(content.proposalPdf);
    qsa("[data-pdf]").forEach((link) => {
      if (!path) {
        link.hidden = true;
        link.removeAttribute("href");
        return;
      }
      link.hidden = false;
      link.href = path;
      link.setAttribute("download", "");
    });
  }

  function renderHeroMetrics() {
    const root = qs("#hero-metrics");
    if (!root || !Array.isArray(content.heroMetrics)) return;
    root.innerHTML = content.heroMetrics.map((item) => `
      <li class="hero-metric"><strong>${escapeHtml(item.display)}</strong><span>${escapeHtml(item.label)}</span></li>
    `).join("");
  }

  function renderNetworkMetrics() {
    const root = qs("#network-metrics");
    if (!root || !Array.isArray(content.networkMetrics)) return;
    root.innerHTML = content.networkMetrics.map((item, index) => `
      <article class="metric-card" data-reveal data-delay="${index * 70}">
        <strong>${escapeHtml(item.display)}</strong><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.note)}</p>
      </article>
    `).join("");
  }

  function renderPerformance() {
    const root = qs("#performance-panels");
    const performance = content.performance || {};
    if (!root) return;
    root.innerHTML = Object.entries(performance).map(([key, period], periodIndex) => {
      const items = Array.isArray(period.items) ? period.items : [];
      const maximum = Math.max(...items.map((item) => Number(item.value) || 0), 1);
      const bars = items.map((item) => {
        const width = Math.max(10, ((Number(item.value) || 0) / maximum) * 100);
        return `
          <li class="ranking-row">
            <span class="ranking-place">${escapeHtml(item.rank)} место</span>
            <span class="ranking-track" aria-hidden="true"><i style="--bar-width:${width.toFixed(2)}%"></i></span>
            <strong>${escapeHtml(item.display)}</strong>
          </li>`;
      }).join("");
      return `
        <section class="performance-panel" id="performance-panel-${escapeHtml(key)}" role="tabpanel"
          aria-labelledby="performance-tab-${escapeHtml(key)}" ${periodIndex ? "hidden" : ""}>
          <div class="performance-highlight">
            <p>${escapeHtml(period.caption)}</p><strong>${escapeHtml(period.leader)}</strong>
            <span>${escapeHtml(period.leaderNote)}</span><em>${escapeHtml(period.monthly)}</em>
          </div>
          <ol class="ranking-list" aria-label="Рейтинг франшизных офисов по комиссионному обороту">${bars}</ol>
        </section>`;
    }).join("");
  }

  function configurePerformanceTabs() {
    const tabs = qsa('[role="tab"]');
    if (!tabs.length) return;
    const activate = (tab, focus = false) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute("aria-selected", String(selected));
        item.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(item.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(tab));
      tab.addEventListener("keydown", (event) => {
        let nextIndex = null;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        if (nextIndex === null) return;
        event.preventDefault();
        activate(tabs[nextIndex], true);
      });
    });
  }

  function renderMultiOfficeCases() {
    const root = qs("#multi-office-cases");
    if (!root || !Array.isArray(content.multiOfficeCases)) return;
    root.innerHTML = content.multiOfficeCases.map((item, index) => `
      <article class="multi-case" data-reveal data-delay="${index * 90}">
        <p class="eyebrow">${escapeHtml(item.eyebrow)}</p><h3>${escapeHtml(item.headline)}</h3>
        <div class="case-periods">
          <div><span>2025</span><strong>${escapeHtml(item.year2025)}</strong><small>совокупный комиссионный оборот ${escapeHtml(item.offices)} офисов</small></div>
          <div><span>I полугодие 2026</span><strong>${escapeHtml(item.h1_2026)}</strong><small>совокупный комиссионный оборот ${escapeHtml(item.offices)} офисов</small></div>
        </div>
      </article>
    `).join("");
  }

  function renderPartnerSplit() {
    const root = qs("#partner-split");
    const split = content.partnerServicesSplit || {};
    if (!root) return;
    const items = [
      { value: split.agent, label: "агенту", className: "agent" },
      { value: split.owner, label: "собственнику офиса", className: "owner" },
      { value: split.centralOffice, label: "центральному офису", className: "central" }
    ];
    root.innerHTML = items.map((item) => `
      <div class="split-part split-${item.className}" style="--split:${Number(item.value) || 0}">
        <strong>${Number(item.value) || 0}%</strong><span>${escapeHtml(item.label)}</span>
      </div>
    `).join("");
  }

  function renderLaunchSteps() {
    const root = qs("#launch-steps");
    if (!root || !Array.isArray(content.launchSteps)) return;
    root.innerHTML = content.launchSteps.map((item, index) => `
      <li data-reveal data-delay="${index * 55}">
        <span>${String(index + 1).padStart(2, "0")}</span><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></div>
      </li>
    `).join("");
  }

  function renderConditions() {
    const root = qs("#conditions-grid");
    if (!root || !Array.isArray(content.conditions)) return;
    root.innerHTML = content.conditions.map((item, index) => `
      <article data-reveal data-delay="${index * 50}">
        <strong>${escapeHtml(item.value)}</strong><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.note)}</p>
      </article>
    `).join("");
  }

  function renderCities() {
    const root = qs("#city-list");
    if (!root || !Array.isArray(content.cities)) return;
    root.innerHTML = content.cities.map((city) => `<li>${escapeHtml(city)}</li>`).join("");
  }

  function normalizeTelegram(value) {
    const raw = clean(value);
    if (!raw) return "";
    if (/^https:\/\/t\.me\//i.test(raw)) return raw;
    return `https://t.me/${raw.replace(/^@/, "").replace(/[^a-z0-9_]/gi, "")}`;
  }

  function normalizeWhatsApp(value) {
    const raw = clean(value);
    if (!raw) return "";
    if (/^https:\/\/wa\.me\//i.test(raw)) return raw;
    const number = raw.replace(/\D/g, "");
    return number ? `https://wa.me/${number}` : "";
  }

  function renderContacts() {
    const contacts = content.contacts || {};
    const actionsRoot = qs("#contact-actions");
    const formWrap = qs("#contact-form-wrap");
    if (!actionsRoot || !formWrap) return;
    const phone = clean(contacts.phone);
    const email = clean(contacts.email);
    const telegram = normalizeTelegram(contacts.telegram);
    const whatsapp = normalizeWhatsApp(contacts.whatsapp);
    const actions = [];
    if (phone) actions.push({ label: `Позвонить ${phone}`, href: `tel:${phone.replace(/[^+\d]/g, "")}` });
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) actions.push({ label: "Написать на email", href: `mailto:${email}` });
    if (telegram) actions.push({ label: "Написать в Telegram", href: telegram, external: true });
    if (whatsapp) actions.push({ label: "Написать в WhatsApp", href: whatsapp, external: true });
    actionsRoot.innerHTML = actions.map((action, index) => `
      <a class="button ${index ? "button-ghost" : "button-primary"}" href="${escapeHtml(action.href)}"${action.external ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(action.label)}</a>
    `).join("");

    const endpoint = clean(contacts.formEndpoint);
    if (/^https:\/\//i.test(endpoint)) {
      formWrap.hidden = false;
      formWrap.innerHTML = `
        <form class="contact-form" action="${escapeHtml(endpoint)}" method="post">
          <label for="contact-name">Имя</label><input id="contact-name" name="name" type="text" autocomplete="name" required>
          <label for="contact-phone">Телефон</label><input id="contact-phone" name="phone" type="tel" autocomplete="tel" required>
          <button class="button button-primary" type="submit">Отправить заявку</button>
        </form>`;
    } else {
      formWrap.hidden = true;
      formWrap.innerHTML = "";
    }
  }

  function renderSocialLinks() {
    const root = qs("#social-links");
    if (!root) return;
    const socials = content.socialLinks || {};
    const labels = { vk: "VK", youtube: "YouTube", rutube: "RuTube", dzen: "Дзен" };
    root.innerHTML = Object.entries(socials).filter(([, url]) => /^https:\/\//i.test(clean(url))).map(([key, url]) =>
      `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(labels[key] || key)}</a>`
    ).join("");
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
      qs("a", menu)?.focus();
    };
    toggle.addEventListener("click", () => toggle.getAttribute("aria-expanded") === "true" ? closeMenu() : openMenu());
    qsa("a", menu).forEach((link) => link.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !menu.hidden) { closeMenu(); toggle.focus(); }
    });
    window.addEventListener("resize", () => { if (window.innerWidth > 960 && !menu.hidden) closeMenu(); });
  }

  function configureHeader() {
    const header = qs("[data-header]");
    const topButton = qs(".back-to-top");
    const update = () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 16);
      topButton?.classList.toggle("is-visible", window.scrollY > 800);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    topButton?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));
  }

  function configureStickyCta() {
    const sticky = qs(".sticky-cta");
    const hero = qs("#top");
    const finalCta = qs("#final-cta");
    if (!sticky || !hero || !finalCta) return;
    const update = () => {
      const mobile = window.innerWidth <= 700;
      const heroPassed = hero.getBoundingClientRect().bottom < 0;
      const finalReached = finalCta.getBoundingClientRect().top < window.innerHeight * 0.72;
      sticky.classList.toggle("is-visible", mobile && heroPassed && !finalReached);
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
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
    const links = qsa(".desktop-nav a");
    const map = new Map(links.map((link) => [link.getAttribute("href")?.slice(1), link]));
    const sections = [...map.keys()].map((id) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      links.forEach((link) => link.classList.toggle("is-active", link === map.get(visible.target.id)));
    }, { rootMargin: "-25% 0px -60% 0px", threshold: [0.05, 0.3] });
    sections.forEach((section) => observer.observe(section));
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
    }, { threshold: 0.06, rootMargin: "0px 0px -6% 0px" });
    items.forEach((item) => observer.observe(item));
  }

  function initialize() {
    renderCtaLabels(); renderPdfLinks(); renderHeroMetrics(); renderNetworkMetrics(); renderPerformance();
    renderMultiOfficeCases(); renderPartnerSplit(); renderLaunchSteps(); renderConditions(); renderCities();
    renderContacts(); renderSocialLinks(); configurePerformanceTabs(); configureMenu(); configureHeader(); configureStickyCta();
    configureFaq(); configureActiveNavigation(); configureReveal();
    const year = qs("#current-year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
