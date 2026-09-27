(function () {
  "use strict";

  const content = window.DOMIAN_CONTENT || {};
  const doc = document.documentElement;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktopScene = window.matchMedia("(min-width: 1024px)");
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const clean = (value) => String(value ?? "").trim();
  const escapeHtml = (value) => clean(value).replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
  })[character]);
  const pad = (n) => String(n).padStart(2, "0");

  doc.classList.add("js");

  /* ---------------------------------------------------------------- footnotes */
  const noteOrder = [];
  function noteRef(key) {
    if (!key || !clean(content.notes?.[key])) return "";
    if (!noteOrder.includes(key)) noteOrder.push(key);
    const n = noteOrder.indexOf(key) + 1;
    return `<sup class="fn"><a href="#note-${n}" aria-label="Примечание ${n}">${n}</a></sup>`;
  }
  function renderNotes() {
    const root = qs("#notes-list");
    if (!root) return;
    const asOf = clean(content.asOf);
    root.innerHTML = noteOrder.map((key, index) => {
      let text = clean(content.notes[key]);
      if (key === "offices" && asOf) text += ` Данные на ${asOf}.`;
      if (key === "results" && clean(content.performanceSampleSize)) text += ` В сравнении ${clean(content.performanceSampleSize)} франшизных офисов.`;
      return `<li id="note-${index + 1}">${escapeHtml(text)}</li>`;
    }).join("");
    root.closest(".notes").hidden = noteOrder.length === 0;
  }

  /* ---------------------------------------------------------------- isometric system drawing */
  const PAPER = "#F2F0EB", WHITE = "#FBFAF7", INK = "#16171A", INK2 = "#56585E", FAINT = "#DEDAD2", LINE = "#C9C4BA", RED = "#D20A11";
  const G = 0.08;
  // Тона контуров: терракота (сделки), охра (управление), шалфей (команда).
  const TONES = [
    { top: "#F2D2C4", left: "#E4BCAA", right: "#D5A690", ink: "#9A4A2E", wash: "rgba(214, 140, 110, .16)" },
    { top: "#EFDDB1", left: "#E1CC97", right: "#D1B97E", ink: "#80611A", wash: "rgba(206, 170, 90, .18)" },
    { top: "#D1DED7", left: "#BCCDC4", right: "#A7BBB0", ink: "#3F6152", wash: "rgba(120, 160, 140, .18)" }
  ];
  const SLOTS = [[0, 1], [0, 0], [1, 0], [2, 0], [2, 1], [2, 2], [1, 2], [0, 2]];
  const TALL = [0.45, 0.7, 0.7, 0.7, 0.45, 0.2, 0.2, 0.2];
  const OUTLINES = [
    { pts: [[0, 0], [3, 0], [3, 1], [1, 1], [1, 2], [0, 2]], label: [-0.9, -0.3], anchor: "end" },
    { pts: [[2, 1], [3, 1], [3, 3], [2, 3]], label: [3.06, 2.77], anchor: "start" },
    { pts: [[0, 2], [2, 2], [2, 3], [0, 3]], label: [3.4, 3.4], anchor: "middle" }
  ];

  function makeIso(S, ox, oy) {
    const p = (x, y, z = 0) => [ox + (x - y) * S * 0.866, oy + (x + y) * S * 0.5 - z * S];
    const pts = (list) => list.map((q) => p(...q).map((v) => v.toFixed(1)).join(",")).join(" ");
    const poly = (list, fill, stroke, sw, extra = "") => `<polygon points="${pts(list)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round" ${extra}></polygon>`;
    const box = (x0, y0, x1, y1, h, top = WHITE, left = "#E2DED6", right = "#D6D1C7", stroke = INK, sw = 1) =>
      poly([[x1, y0, 0], [x1, y1, 0], [x1, y1, h], [x1, y0, h]], right, stroke, sw) +
      poly([[x0, y1, 0], [x1, y1, 0], [x1, y1, h], [x0, y1, h]], left, stroke, sw) +
      poly([[x0, y0, h], [x1, y0, h], [x1, y1, h], [x0, y1, h]], top, stroke, sw);
    const text = (x, y, z, s, size, color, dy = 0, anchor = "middle") => {
      const [a, b] = p(x, y, z);
      return `<text x="${a.toFixed(1)}" y="${(b + dy).toFixed(1)}" text-anchor="${anchor}" class="iso-text" font-size="${size}" fill="${color}">${escapeHtml(s)}</text>`;
    };
    return { p, poly, box, text, S };
  }

  function officeSvg(I, lit) {
    const x0 = 1 + G, y0 = 1 + G, x1 = 2 - G, y1 = 2 - G, hw = 0.42;
    const draw = 'pathLength="1" class="draw"';
    let o = "";
    o += I.poly([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], lit ? "#FFF3F2" : WHITE, RED, 2, draw);
    o += I.poly([[x0, y0, 0], [x1, y0, 0], [x1, y0, hw], [x0, y0, hw]], "#F7F4EF", RED, 2, draw);
    o += I.poly([[x0, y0, 0], [x0, y1, 0], [x0, y1, hw], [x0, y0, hw]], "#EFEBE4", RED, 2, draw);
    o += I.poly([[x0 + 0.28, y0, 0.16], [x0 + 0.62, y0, 0.16], [x0 + 0.62, y0, 0.33], [x0 + 0.28, y0, 0.33]], "#E4EBEF", INK, 1);
    o += I.poly([[x0, y0 + 0.52, 0], [x0, y0 + 0.72, 0], [x0, y0 + 0.72, 0.3], [x0, y0 + 0.52, 0.3]], "#E2DDD4", INK, 1);
    [[0.18, 0.2], [0.18, 0.5]].forEach(([dx, dy]) => {
      o += I.box(x0 + dx, y0 + dy, x0 + dx + 0.3, y0 + dy + 0.16, 0.1, WHITE, "#E6E2DA", "#DAD5CB", INK, 1);
      o += I.box(x0 + dx + 0.34, y0 + dy + 0.04, x0 + dx + 0.42, y0 + dy + 0.12, 0.06, lit ? RED : WHITE, "#E6E2DA", "#DAD5CB", INK, 0.8);
    });
    o += I.box(x0 + 0.58, y0 + 0.56, x0 + 0.76, y0 + 0.78, 0.09, WHITE, "#E6E2DA", "#DAD5CB", INK, 1);
    return `<g class="iso-office">${o}</g>`;
  }

  function buildIso(options) {
    const { width = 720, height = 540, S = 120, ox = 360, oy = 110, labels = "full", contourLabels = true, grid = true, legend = false, lit = false } = options;
    const I = makeIso(S, ox, oy);
    const modules = Array.isArray(content.modules) ? content.modules : [];
    const contours = Array.isArray(content.contours) ? content.contours : [];
    const fs = labels === "full" ? 14 : 26;
    let floor = "";
    if (grid) {
      for (let k = -1; k <= 4; k += 1) {
        floor += `<line class="iso-grid" x1="${I.p(k, -1)[0]}" y1="${I.p(k, -1)[1]}" x2="${I.p(k, 4)[0]}" y2="${I.p(k, 4)[1]}"></line>`;
        floor += `<line class="iso-grid" x1="${I.p(-1, k)[0]}" y1="${I.p(-1, k)[1]}" x2="${I.p(4, k)[0]}" y2="${I.p(4, k)[1]}"></line>`;
      }
    }
    OUTLINES.forEach((o, index) => {
      floor += I.poly(o.pts.map(([x, y]) => [x, y, 0]), TONES[index].wash, TONES[index].ink, 1.2, 'stroke-dasharray="2 6" class="iso-contour"');
      if (contourLabels && contours[index]) {
        const [a, b] = I.p(o.label[0], o.label[1]);
        floor += `<text x="${a.toFixed(1)}" y="${b.toFixed(1)}" text-anchor="${o.anchor}" class="iso-text iso-contour-label" font-size="15" fill="${TONES[index].ink}">НАПРАВЛЕНИЕ ${index + 1} · ${escapeHtml(contours[index].toUpperCase())}</text>`;
      }
    });
    const cells = SLOTS.map(([i, j], n) => ({ i, j, n, order: i + j })).concat([{ i: 1, j: 1, n: -1, order: 2 }]);
    cells.sort((a, b) => a.order - b.order || a.i - b.i);
    let body = "";
    cells.forEach(({ i, j, n }) => {
      if (n === -1) { body += officeSvg(I, lit); return; }
      const x0 = i + G, y0 = j + G, x1 = i + 1 - G, y1 = j + 1 - G;
      const name = modules[n]?.short || "";
      const tone = TONES[modules[n]?.contour ?? 0] || TONES[0];
      const label = (h) => labels === "full"
        ? I.text(i + 0.46, j + 0.46, h, pad(n + 1), fs - 1, INK2, -8) + I.text(i + 0.46, j + 0.46, h, name, fs - 1, INK, 10)
        : I.text(i + 0.5, j + 0.5, h, pad(n + 1), fs, INK2, 5);
      body += `<g class="iso-slot" data-i="${n}">${I.poly([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], "none", "#A9A49A", 1.2, 'stroke-dasharray="5 5" pathLength="1" class="draw-dash"')}${I.text(i + 0.5, j + 0.5, 0, pad(n + 1), fs, INK2, 5)}</g>`;
      body += `<g class="iso-tile" data-i="${n}">${I.box(x0, y0, x1, y1, 0.16, tone.top, tone.left, tone.right)}${label(0.16)}</g>`;
      body += `<g class="iso-tall" data-i="${n}">${I.box(x0, y0, x1, y1, TALL[n], tone.top, tone.left, tone.right)}${label(TALL[n])}</g>`;
    });
    let legendSvg = "";
    if (legend) {
      const lx = I.p(0, 3)[0] + 30, ly = I.p(3, 3)[1] + 30;
      legendSvg = `<rect x="${lx}" y="${ly - 11}" width="16" height="12" fill="none" stroke="${RED}" stroke-width="2"></rect>` +
        `<text x="${lx + 26}" y="${ly}" class="iso-text" font-size="${labels === "full" ? 15 : 24}" fill="${RED}">ВАШ ОФИС</text>`;
    }
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" focusable="false">${floor}${body}${legendSvg}</svg>`;
  }

  function setIsoState(root, built, current, final) {
    if (!root) return;
    qsa(".iso-tile", root).forEach((g) => {
      const i = Number(g.dataset.i);
      g.classList.toggle("is-on", i < built && !final);
      g.classList.toggle("is-current", i === current && !final);
    });
    qsa(".iso-tall", root).forEach((g) => g.classList.toggle("is-on", final));
    qsa(".iso-slot", root).forEach((g) => g.classList.toggle("is-off", Number(g.dataset.i) < built || final));
    root.classList.toggle("is-final", final);
  }

  function renderIsos() {
    const small = (el) => (el?.clientWidth || 0) < 560;
    const hero = qs("#hero-iso");
    if (hero) {
      hero.innerHTML = buildIso({ labels: small(hero) ? "num" : "full", contourLabels: !small(hero) });
      setIsoState(hero, 0, -1, false);
    }
    const system = qs("#system-iso");
    if (system) {
      system.innerHTML = buildIso({ labels: small(system) ? "num" : "full", contourLabels: !small(system), lit: true });
      applySystemState();
    }
    const fin = qs("#final-iso");
    if (fin) {
      fin.innerHTML = buildIso({ labels: "num", contourLabels: false, grid: false, legend: false, lit: true, height: 480 });
      setIsoState(fin, 8, -1, true);
    }
  }

  /* ---------------------------------------------------------------- system scene */
  let systemState = { built: 0, current: -1, final: false };
  function applySystemState() {
    const root = qs("#system-iso");
    const s = !reducedMotion ? systemState : { built: 8, current: -1, final: true };
    setIsoState(root, s.built, s.current, s.final);
    const legend = qs("#system-legend");
    const modules = content.modules || [];
    const contours = content.contours || [];
    if (legend) {
      if (s.final) legend.textContent = `${pad(modules.length)} / ${pad(modules.length)} · все направления подключены`;
      else if (s.current >= 0) legend.textContent = `${pad(s.current + 1)} / ${pad(modules.length)} · Направление ${modules[s.current].contour + 1} · ${contours[modules[s.current].contour] || ""}`;
      else legend.textContent = `00 / ${pad(modules.length)} · только ваш офис`;
    }
    qsa(".step", qs("#system-steps")).forEach((step) => {
      const i = step.dataset.final ? -2 : Number(step.dataset.i);
      step.classList.toggle("is-active", (s.final && i === -2) || (!s.final && i === s.current));
    });
  }

  function renderSystemSteps() {
    const root = qs("#system-steps");
    const modules = Array.isArray(content.modules) ? content.modules : [];
    const contours = content.contours || [];
    if (!root) return;
    root.innerHTML = modules.map((m, i) => {
      const artifact = m.artifact && clean(m.artifact.src)
        ? `<div><dt>Доказательство</dt><dd><figure class="artifact"><a href="${escapeHtml(m.artifact.src)}" target="_blank" rel="noopener" aria-label="Открыть экран в полном размере"><img src="${escapeHtml(m.artifact.src)}" alt="${escapeHtml(m.artifact.alt)}" width="1200" height="1100" loading="lazy" decoding="async"></a><figcaption>${escapeHtml(m.artifact.caption)}</figcaption></figure></dd></div>`
        : "";
      return `<article class="step" data-i="${i}">
        <p class="step-meta tone-${m.contour + 1}">${pad(i + 1)} / ${pad(modules.length)} · Направление ${m.contour + 1} · ${escapeHtml(contours[m.contour])}</p>
        <h3>${escapeHtml(m.action)}</h3>
        <dl class="grammar"><div><dt>Не строите сами</dt><dd>${escapeHtml(m.notBuild)}</dd></div><div><dt>Внутри</dt><dd>${escapeHtml(m.inside)}</dd></div>${artifact}</dl>
      </article>`;
    }).join("") + `<article class="step step-final" data-final="true">
        <p class="step-meta">${pad(modules.length)} / ${pad(modules.length)} · система подключена</p>
        <h3>Эти процессы уже работают в сети</h3>
        <ul class="contour-list">${contours.map((c, k) => `<li class="tone-${k + 1}"><span>Направление ${k + 1}</span>${escapeHtml(c)}</li>`).join("")}</ul>
        <blockquote>Вы покупаете не набор сервисов, а годы уже проделанной организационной работы.</blockquote>
      </article>`;
  }

  function configureSystemScroll() {
    const steps = qsa(".step", qs("#system-steps"));
    if (!steps.length || !("IntersectionObserver" in window)) { applySystemState(); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const step = entry.target;
        if (step.dataset.final) systemState = { built: 8, current: -1, final: true };
        else {
          const i = Number(step.dataset.i);
          systemState = { built: i + 1, current: i, final: false };
        }
        applySystemState();
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    steps.forEach((step) => observer.observe(step));
    const section = qs("#system");
    const reset = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.boundingClientRect.top > 0 && steps[0].getBoundingClientRect().top > window.innerHeight * 0.5) {
          systemState = { built: 0, current: -1, final: false };
          applySystemState();
        }
      });
    }, { threshold: [0, 0.2] });
    if (section) reset.observe(section);
  }

  /* ---------------------------------------------------------------- density map */
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function renderDensity() {
    const root = qs("#density-map");
    if (!root) return;
    const W = 640, H = 520, r = 21, cx = W / 2, cy = H / 2 + 6;
    const rand = mulberry(11);
    const hexW = Math.sqrt(3) * r, hexH = 1.5 * r;
    const cells = [];
    for (let row = -9; row <= 9; row += 1) {
      for (let col = -9; col <= 9; col += 1) {
        const x = cx + col * hexW + (row % 2 ? hexW / 2 : 0);
        const y = cy + row * hexH;
        const dx = (x - cx) / 285, dy = (y - cy) / 225;
        const angle = Math.atan2(dy, dx);
        const wobble = 1 + 0.12 * Math.sin(angle * 3 + 0.7) + 0.08 * Math.cos(angle * 5);
        if (Math.hypot(dx, dy) < wobble * 0.92) cells.push({ x, y, row, col, office: false });
      }
    }
    cells.forEach((c) => { c.office = rand() < 0.36; });
    const near = (x, y) => cells.reduce((best, c) => (Math.hypot(c.x - x, c.y - y) < Math.hypot(best.x - x, best.y - y) ? c : best), cells[0]);
    const you = near(cx - 120, cy + 20);
    const target = near(cx + 150, cy - 70);
    you.office = true; target.office = true;
    const hex = (c) => {
      const pts = [];
      for (let k = 0; k < 6; k += 1) {
        const a = Math.PI / 180 * (60 * k - 30);
        pts.push(`${(c.x + (r - 1.5) * Math.cos(a)).toFixed(1)},${(c.y + (r - 1.5) * Math.sin(a)).toFixed(1)}`);
      }
      return pts.join(" ");
    };
    let svg = "";
    cells.forEach((c) => {
      const cls = c === you ? "hex hex-you" : c === target ? "hex hex-target" : c.office ? "hex hex-office" : "hex";
      svg += `<polygon class="${cls}" points="${hex(c)}"></polygon>`;
    });
    cells.forEach((c) => {
      if (!c.office || c === you || c === target) return;
      svg += `<rect class="office-dot" x="${(c.x - 3).toFixed(1)}" y="${(c.y - 3).toFixed(1)}" width="6" height="6"></rect>`;
    });
    const mid = { x: (you.x + target.x) / 2, y: Math.min(you.y, target.y) - 70 };
    svg += `<path class="route" pathLength="1" d="M${you.x.toFixed(1)},${you.y.toFixed(1)} Q${mid.x.toFixed(1)},${mid.y.toFixed(1)} ${target.x.toFixed(1)},${target.y.toFixed(1)}"></path>`;
    svg += `<rect class="office-you" x="${(you.x - 6).toFixed(1)}" y="${(you.y - 6).toFixed(1)}" width="12" height="12"></rect>`;
    svg += `<rect class="office-target" x="${(target.x - 6).toFixed(1)}" y="${(target.y - 6).toFixed(1)}" width="12" height="12"></rect>`;
    svg += `<text class="map-label map-label-you" x="${you.x.toFixed(1)}" y="${(you.y + 42).toFixed(1)}" text-anchor="middle">ваш район</text>`;
    const apexY = 0.25 * you.y + 0.5 * mid.y + 0.25 * target.y;
    svg += `<text class="map-label" x="${target.x.toFixed(1)}" y="${(target.y + 42).toFixed(1)}" text-anchor="middle">район клиента</text>`;
    svg += `<text class="map-label map-label-mid" x="${mid.x.toFixed(1)}" y="${(apexY - 16).toFixed(1)}" text-anchor="middle">запрос передан в сети</text>`;
    root.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" focusable="false">${svg}</svg>`;
  }

  /* ---------------------------------------------------------------- simple renderers */
  function renderFacts(selector, list, cls) {
    const root = qs(selector);
    if (!root || !Array.isArray(list)) return;
    root.innerHTML = list.map((item) => `<div class="${cls}"><dt>${escapeHtml(item.display)}${noteRef(item.note)}</dt><dd>${escapeHtml(item.label)}</dd></div>`).join("");
  }

  function renderMembership() {
    const root = qs("#membership");
    const rgr = content.trust?.rgr;
    if (!root || !rgr) return;
    const number = clean(rgr.certificate);
    const url = clean(rgr.url);
    // Показываем членство только с проверяемым номером сертификата или ссылкой на реестр.
    if (!number && !/^https:\/\//i.test(url)) { root.hidden = true; return; }
    const label = escapeHtml(rgr.label) + (number ? ` · сертификат № ${escapeHtml(number)}` : "");
    root.innerHTML = /^https:\/\//i.test(url) ? `<a href="${escapeHtml(rgr.url)}" target="_blank" rel="noopener">${label}</a>` : label;
  }

  function renderPerformance() {
    const root = qs("#performance-panels");
    const performance = content.performance || {};
    if (!root) return;
    root.innerHTML = Object.entries(performance).map(([key, period], periodIndex) => {
      const items = Array.isArray(period.items) ? period.items : [];
      const maximum = Math.max(...items.map((item) => Number(item.value) || 0), 1);
      const rows = items.map((item) => {
        const width = Math.max(6, ((Number(item.value) || 0) / maximum) * 100);
        return `<li class="rank-row"><span class="rank-place">${escapeHtml(item.rank)} место</span><span class="rank-track" aria-hidden="true"><i style="--w:${width.toFixed(2)}%"></i></span><strong>${escapeHtml(item.display)}</strong></li>`;
      }).join("");
      return `<section class="panel" id="performance-panel-${escapeHtml(key)}" role="tabpanel" aria-labelledby="performance-tab-${escapeHtml(key)}" ${periodIndex ? "hidden" : ""}>
        <div class="panel-lead"><p>${escapeHtml(period.caption)}</p><strong>${escapeHtml(period.leader)}${noteRef("results")}</strong><span>${escapeHtml(period.leaderNote)}</span>${clean(period.monthly) ? `<em>${escapeHtml(period.monthly)}</em>` : ""}</div>
        <ol class="rank" aria-label="ТОП-5 франшизных офисов по комиссионному обороту">${rows}</ol>
      </section>`;
    }).join("");
    const note = qs("#results-note");
    if (note) note.innerHTML = `Показан разброс ТОП-5 франшизных офисов. ${escapeHtml(content.notes?.results || "")}`;
  }

  function configureTabs() {
    const tabs = qsa('[role="tab"]');
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
        const map = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index - 1 + tabs.length) % tabs.length, Home: 0, End: tabs.length - 1 };
        if (!(event.key in map)) return;
        event.preventDefault();
        activate(tabs[map[event.key]], true);
      });
    });
  }

  function renderCases() {
    const root = qs("#multi-office-cases");
    if (!root || !Array.isArray(content.multiOfficeCases)) return;
    root.innerHTML = content.multiOfficeCases.map((item) => `
      <article class="case"><p class="kicker">${escapeHtml(item.eyebrow)}</p><h3>${escapeHtml(item.headline)}</h3>
        <dl><div><dt>2025</dt><dd>${escapeHtml(item.year2025)}</dd></div><div><dt>I полугодие 2026</dt><dd>${escapeHtml(item.h1_2026)}</dd></div></dl>
        <p class="case-note">совокупный комиссионный оборот ${escapeHtml(item.offices)} офисов</p></article>`).join("");
  }

  function renderSplit() {
    const root = qs("#partner-split");
    const split = content.partnerServicesSplit || {};
    if (!root) return;
    const parts = [
      { value: Number(split.agent) || 0, label: "агенту", cls: "agent" },
      { value: Number(split.owner) || 0, label: "собственнику офиса", cls: "owner" },
      { value: Number(split.centralOffice) || 0, label: "центральному офису", cls: "central" }
    ];
    root.innerHTML = `<p class="dim dim-total"><span>100% = комиссия от партнёрской услуги</span></p>
      <div class="split-row">${parts.map((part) => `<div class="split-part split-${part.cls}" style="flex-grow:${part.value}"><p class="dim"><span>${part.value}%</span></p><div class="split-bar"></div><p class="split-label">${escapeHtml(part.label)}</p></div>`).join("")}</div>`;
    const list = qs("#service-list");
    if (list && Array.isArray(content.partnerServices)) list.innerHTML = content.partnerServices.map((s) => `<li>${escapeHtml(s)}</li>`).join("");
  }

  function renderLaunch() {
    const root = qs("#launch-steps");
    if (root && Array.isArray(content.launchSteps)) {
      root.innerHTML = content.launchSteps.map((item, index) => `<li><span>${pad(index + 1)}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text)}</p></li>`).join("");
    }
    const req = qs("#requirements");
    if (req && Array.isArray(content.requirements)) {
      req.innerHTML = content.requirements.map((item) => `<div><dt>${escapeHtml(item.title)}</dt><dd>${escapeHtml(item.text)}</dd></div>`).join("");
    }
  }

  function renderConditions() {
    const root = qs("#conditions-grid");
    if (root && Array.isArray(content.conditions)) {
      root.innerHTML = content.conditions.map((item) => `<div><dt>${escapeHtml(item.label)}</dt><dd><strong>${escapeHtml(item.value)}</strong><span>${escapeHtml(item.note)}</span></dd></div>`).join("");
    }
    const note = qs("#price-note");
    if (note) note.textContent = clean(content.priceNote);
  }

  function renderCities() {
    const root = qs("#city-list");
    if (root && Array.isArray(content.cities)) root.innerHTML = content.cities.map((city) => `<li>${escapeHtml(city)}</li>`).join("");
  }

  function renderStoriesAndTeam() {
    const stories = (content.stories || []).filter((s) => clean(s.name) && clean(s.quote));
    const storySection = qs("#stories");
    if (storySection && stories.length) {
      storySection.hidden = false;
      qs("#stories-list").innerHTML = stories.map((s) => `<article class="story">${clean(s.photo) ? `<img src="${escapeHtml(s.photo)}" alt="${escapeHtml(s.name)}" loading="lazy">` : ""}<blockquote>${escapeHtml(s.quote)}</blockquote><p><strong>${escapeHtml(s.name)}</strong> · ${escapeHtml(s.city)}${clean(s.since) ? ` · в сети с ${escapeHtml(s.since)}` : ""}</p>${clean(s.path) ? `<p class="story-path">${escapeHtml(s.path)}</p>` : ""}</article>`).join("");
    }
    const team = (content.team || []).filter((p) => clean(p.name) && clean(p.role));
    const people = qs("#team-people");
    if (people && team.length) {
      people.hidden = false;
      people.innerHTML = `<p class="kicker">С вами будут работать</p>` + team.map((p) => `<div class="person">${clean(p.photo) ? `<img src="${escapeHtml(p.photo)}" alt="" loading="lazy">` : ""}<div><strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.role)}${clean(p.stage) ? ` · ${escapeHtml(p.stage)}` : ""}</span>${clean(p.contact) ? `<span class="person-contact">${escapeHtml(p.contact)}</span>` : ""}</div></div>`).join("");
    }
    const after = qs("#after-request");
    if (after && Array.isArray(content.afterRequest)) {
      after.innerHTML = content.afterRequest.map((s, i) => `<li><span>${pad(i + 1)}</span><div><strong>${escapeHtml(s.title)}</strong><p>${escapeHtml(s.text)}</p></div></li>`).join("");
    }
  }

  /* ---------------------------------------------------------------- CTA, PDF, contacts */
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
      if (!path) { link.hidden = true; link.removeAttribute("href"); return; }
      link.hidden = false;
      link.href = path;
      link.setAttribute("download", "");
    });
  }
  const normalizeTelegram = (value) => {
    const raw = clean(value);
    if (!raw) return "";
    return /^https:\/\/t\.me\//i.test(raw) ? raw : `https://t.me/${raw.replace(/^@/, "").replace(/[^a-z0-9_]/gi, "")}`;
  };
  const normalizeWhatsApp = (value) => {
    const raw = clean(value);
    if (!raw) return "";
    if (/^https:\/\/wa\.me\//i.test(raw)) return raw;
    const number = raw.replace(/\D/g, "");
    return number ? `https://wa.me/${number}` : "";
  };
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
    if (telegram) actions.push({ label: "Написать в Telegram", href: telegram, external: true });
    if (whatsapp) actions.push({ label: "Написать в WhatsApp", href: whatsapp, external: true });
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) actions.push({ label: `Написать на ${email}`, href: `mailto:${email}` });
    actionsRoot.innerHTML = actions.map((action, index) => `<a class="button ${index ? "button-line" : "button-red"}" href="${escapeHtml(action.href)}"${action.external ? ' target="_blank" rel="noopener"' : ""}>${escapeHtml(action.label)}</a>`).join("");
    const endpoint = clean(contacts.formEndpoint);
    if (/^https:\/\//i.test(endpoint)) {
      formWrap.hidden = false;
      formWrap.innerHTML = `<form class="contact-form" action="${escapeHtml(endpoint)}" method="post">
        <label for="contact-name">Имя</label><input id="contact-name" name="name" type="text" autocomplete="name" required>
        <label for="contact-city">Город</label><input id="contact-city" name="city" type="text" autocomplete="address-level2" required>
        <label for="contact-phone">Телефон</label><input id="contact-phone" name="phone" type="tel" autocomplete="tel" required>
        <button class="button button-red" type="submit">Отправить заявку</button></form>`;
    }
  }
  function renderSocialLinks() {
    const root = qs("#social-links");
    if (!root) return;
    const socials = content.socialLinks || {};
    const labels = { vk: "VK", youtube: "YouTube", rutube: "RuTube", dzen: "Дзен" };
    root.innerHTML = Object.entries(socials).filter(([, url]) => /^https:\/\//i.test(clean(url)))
      .map(([key, url]) => `<a href="${escapeHtml(url)}" target="_blank" rel="noopener">${escapeHtml(labels[key] || key)}</a>`).join("");
  }

  /* ---------------------------------------------------------------- chrome */
  function configureMenu() {
    const toggle = qs(".menu-toggle");
    const menu = qs("#mobile-menu");
    if (!toggle || !menu) return;
    const close = () => { toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Открыть меню"); menu.hidden = true; document.body.classList.remove("menu-open"); };
    const open = () => { toggle.setAttribute("aria-expanded", "true"); toggle.setAttribute("aria-label", "Закрыть меню"); menu.hidden = false; document.body.classList.add("menu-open"); qs("a", menu)?.focus(); };
    toggle.addEventListener("click", () => (toggle.getAttribute("aria-expanded") === "true" ? close() : open()));
    qsa("a", menu).forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !menu.hidden) { close(); toggle.focus(); } });
    window.addEventListener("resize", () => { if (window.innerWidth > 960 && !menu.hidden) close(); });
  }
  function configureScrollChrome() {
    const header = qs("[data-header]");
    const sticky = qs(".sticky-cta");
    const hero = qs("#top");
    const contact = qs("#contact");
    const update = () => {
      header?.classList.toggle("is-scrolled", window.scrollY > 8);
      if (sticky && hero && contact) {
        const mobile = window.innerWidth <= 700;
        const passed = hero.getBoundingClientRect().bottom < 0;
        const reached = contact.getBoundingClientRect().top < window.innerHeight * 0.8;
        sticky.classList.toggle("is-visible", mobile && passed && !reached);
      }
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }
  function configureActiveNav() {
    if (!("IntersectionObserver" in window)) return;
    const links = qsa(".desktop-nav a");
    const map = new Map(links.map((link) => [link.getAttribute("href").slice(1), link]));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) links.forEach((link) => link.classList.toggle("is-active", link === map.get(entry.target.id)));
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    [...map.keys()].map((id) => document.getElementById(id)).filter(Boolean).forEach((s) => observer.observe(s));
  }
  function configureInView() {
    const targets = qsa(".density, .rank, .royalty, .timeline, .split");
    if (!("IntersectionObserver" in window) || reducedMotion) { targets.forEach((t) => t.classList.add("in-view")); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("in-view"); observer.unobserve(entry.target); } });
    }, { threshold: 0.25 });
    targets.forEach((t) => observer.observe(t));
  }

  // На телефоне блок «Откуда берутся клиенты» свёрнут, чтобы не удлинять страницу.
  function configureModelRoles() {
    const roles = qs(".model-roles");
    if (roles && window.matchMedia("(max-width: 700px)").matches) roles.open = false;
  }

  function initialize() {
    renderCtaLabels(); renderPdfLinks();
    renderFacts("#hero-facts", content.heroFacts, "fact");
    renderFacts("#network-metrics", content.networkMetrics, "metric");
    renderMembership();
    renderSystemSteps(); renderIsos(); configureSystemScroll();
    renderDensity(); renderCities();
    renderSplit(); renderPerformance(); configureTabs(); renderCases();
    renderLaunch(); renderConditions(); renderStoriesAndTeam();
    renderContacts(); renderSocialLinks(); renderNotes();
    configureModelRoles(); configureMenu(); configureScrollChrome(); configureActiveNav(); configureInView();
    requestAnimationFrame(() => doc.classList.add("is-loaded"));
    let lastSmall = null;
    window.addEventListener("resize", () => {
      const small = (qs("#system-iso")?.clientWidth || 0) < 560;
      if (small !== lastSmall) { lastSmall = small; renderIsos(); }
      applySystemState();
    });
    desktopScene.addEventListener?.("change", applySystemState);
    const year = qs("#current-year");
    if (year) year.textContent = String(new Date().getFullYear());
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
