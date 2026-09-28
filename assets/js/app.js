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
  // Клетки перед офисом: их блоки рисуются «в разрезе», чтобы офис оставался виден.
  const FRONT = new Set(["2,1", "2,2", "1,2"]);
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
    const line = (a, b, stroke = INK, sw = 1) => {
      const [x1, y1] = p(...a), [x2, y2] = p(...b);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${sw}"></line>`;
    };
    const text = (x, y, z, s, size, color, dy = 0, anchor = "middle") => {
      const [a, b] = p(x, y, z);
      return `<text x="${a.toFixed(1)}" y="${(b + dy).toFixed(1)}" text-anchor="${anchor}" class="iso-text" font-size="${size}" fill="${color}">${escapeHtml(s)}</text>`;
    };
    return { p, poly, box, line, text, S };
  }

  // Офис рисуется в собственных координатах клетки: dx, dy от 0 до L, z — высота.
  // Детали с data-need появляются, когда подключён модуль с этим индексом ("final" — в финале).
  function officeSvg(I, lit) {
    const X = 1 + G, Y = 1 + G, L = 1 - 2 * G, hw = 0.42;
    const draw = 'pathLength="1" class="draw"';
    const at = (dx, dy, z = 0) => [X + dx, Y + dy, z];
    const wy = (a, b, z0, z1, fill, stroke = INK, sw = 1) => I.poly([at(a, 0, z0), at(b, 0, z0), at(b, 0, z1), at(a, 0, z1)], fill, stroke, sw);
    const wx = (a, b, z0, z1, fill, stroke = INK, sw = 1) => I.poly([at(0, a, z0), at(0, b, z0), at(0, b, z1), at(0, a, z1)], fill, stroke, sw);
    const part = (need, svg) => `<g class="office-part" data-need="${need}">${svg}</g>`;
    const base = [];
    const floor = [];
    // Пол и две стены.
    base.push(I.poly([at(0, 0), at(L, 0), at(L, L), at(0, L)], lit ? "#FFF3F2" : WHITE, RED, 2, draw));
    base.push(I.poly([at(0, 0), at(L, 0), at(L, 0, hw), at(0, 0, hw)], "#F7F4EF", RED, 2, draw));
    base.push(I.poly([at(0, 0), at(0, L), at(0, L, hw), at(0, 0, hw)], "#EFEBE4", RED, 2, draw));
    // Окно, дверь и вывеска.
    base.push(wy(0.56, 0.8, 0.12, 0.32, "#E4EBEF"));
    base.push(part("final", wy(0.56, 0.8, 0.12, 0.32, "#FFE7A3")));
    base.push(I.line(at(0.68, 0, 0.12), at(0.68, 0, 0.32), INK, 0.8));
    base.push(wx(0.56, 0.78, 0, 0.3, "#E2DDD4"));
    base.push(part("final", wy(0.04, 0.5, 0.29, 0.405, WHITE, RED, 1.2)));
    const [sx, sy] = I.p(X + 0.07, Y, 0.305);
    base.push(`<text class="office-sign" transform="matrix(0.866 0.5 0 1 ${sx.toFixed(1)} ${sy.toFixed(1)})" font-size="${(I.S * 0.085).toFixed(1)}" fill="${RED}">DОМИАН</text>`);
    // 1 · Новостройки: постер с домом.
    base.push(part(1, wy(0.06, 0.24, 0.07, 0.25, WHITE) +
      wy(0.1, 0.2, 0.09, 0.16, TONES[0].right, INK, 0.8) +
      I.poly([at(0.085, 0, 0.16), at(0.215, 0, 0.16), at(0.15, 0, 0.22)], TONES[0].ink, INK, 0.8)));
    // 4 · Центр управления: доска со столбиками.
    base.push(part(4, wy(0.28, 0.5, 0.07, 0.25, WHITE) +
      wy(0.31, 0.35, 0.09, 0.14, TONES[1].ink, "none", 0) +
      wy(0.37, 0.41, 0.09, 0.18, TONES[1].ink, "none", 0) +
      wy(0.43, 0.47, 0.09, 0.22, TONES[1].ink, "none", 0)));
    // 7 · Обучение: флипчарт у левой стены.
    const fx = 0.07;
    floor.push([0.3, part(7,
      I.line(at(fx, 0.22, 0.1), at(fx, 0.2, 0), INK, 1) + I.line(at(fx, 0.38, 0.1), at(fx, 0.4, 0), INK, 1) +
      I.poly([at(fx, 0.2, 0.1), at(fx, 0.4, 0.1), at(fx, 0.4, 0.31), at(fx, 0.2, 0.31)], WHITE, INK, 1) +
      `<polyline points="${[[0.23, 0.14], [0.28, 0.19], [0.32, 0.17], [0.37, 0.26]].map(([y, z]) => I.p(X + fx, Y + y, z).map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${TONES[2].ink}" stroke-width="1.4"></polyline>`)]);
    // Столы агентов: экран тёмный, с CRM светлый; агенты — с модулем найма.
    [[0.13, 0.12], [0.44, 0.12], [0.44, 0.38]].forEach(([dx, dy]) => {
      const mon = (fill) => I.poly([at(dx + 0.04, dy + 0.03, 0.08), at(dx + 0.18, dy + 0.03, 0.08), at(dx + 0.18, dy + 0.03, 0.18), at(dx + 0.04, dy + 0.03, 0.18)], fill, INK, 0.9);
      floor.push([dx + dy, I.box(X + dx, Y + dy, X + dx + 0.22, Y + dy + 0.14, 0.08, WHITE, "#E6E2DA", "#DAD5CB", INK, 1) + mon("#2A2B30") +
        part(0, mon("#EEF4F6") + I.line(at(dx + 0.06, dy + 0.03, 0.15), at(dx + 0.14, dy + 0.03, 0.15), TONES[0].ink, 1.4) + I.line(at(dx + 0.06, dy + 0.03, 0.115), at(dx + 0.12, dy + 0.03, 0.115), TONES[0].ink, 1.4))]);
      floor.push([dx + dy + 0.3, part(6, figure(I, X + dx + 0.27, Y + dy + 0.08, 0, TONES[2].top))]);
    });
    // Ресепшн: красная стойка; на ней документы (2) и телефон (5), рядом коробка с ключом (3).
    floor.push([1.3, I.box(X + 0.5, Y + 0.58, X + 0.8, Y + 0.72, 0.11, "#E4474D", RED, "#A8070D", INK, 1) +
      part(2, I.poly([at(0.54, 0.6, 0.11), at(0.65, 0.6, 0.11), at(0.65, 0.69, 0.11), at(0.54, 0.69, 0.11)], WHITE, INK, 0.9) +
        `<circle cx="${I.p(X + 0.6, Y + 0.645, 0.11)[0].toFixed(1)}" cy="${I.p(X + 0.6, Y + 0.645, 0.11)[1].toFixed(1)}" r="${(I.S * 0.018).toFixed(1)}" fill="${RED}"></circle>`) +
      part(5, boxZ(I, X + 0.7, Y + 0.6, X + 0.76, Y + 0.67, 0.11, 0.035, "#3A3C42", "#2A2B30", "#1E1F23"))]);
    floor.push([1.08, part(3, boxZ(I, X + 0.38, Y + 0.6, X + 0.46, Y + 0.7, 0, 0.07, TONES[0].top, TONES[0].left, TONES[0].right) +
      keySvg(I, X + 0.42, Y + 0.65, 0.07, INK))]);
    // Финал: клиент у двери.
    floor.push([0.8, part("final", figure(I, X + 0.1, Y + 0.7, 0, "#CFC9BE"))]);
    floor.sort((a, b) => a[0] - b[0]);
    return `<g class="iso-office">${base.join("")}${floor.map((f) => f[1]).join("")}</g>`;
  }

  function boxZ(I, x0, y0, x1, y1, z, h, top, left, right, stroke = INK, sw = 1) {
    return I.poly([[x1, y0, z], [x1, y1, z], [x1, y1, z + h], [x1, y0, z + h]], right, stroke, sw) +
      I.poly([[x0, y1, z], [x1, y1, z], [x1, y1, z + h], [x0, y1, z + h]], left, stroke, sw) +
      I.poly([[x0, y0, z + h], [x1, y0, z + h], [x1, y1, z + h], [x0, y1, z + h]], top, stroke, sw);
  }

  // Геометрическая фигурка без лица: корпус и голова.
  function figure(I, x, y, z, fill) {
    const [hx, hy] = I.p(x, y, z + 0.19);
    return boxZ(I, x - 0.03, y - 0.03, x + 0.03, y + 0.03, z, 0.13, fill, fill, fill, INK, 1) +
      `<circle cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="${(I.S * 0.036).toFixed(1)}" fill="${fill}" stroke="${INK}" stroke-width="1"></circle>`;
  }

  function keySvg(I, x, y, z, stroke) {
    const [a, b] = I.p(x - 0.02, y, z);
    const [c, d] = I.p(x + 0.05, y, z);
    return `<circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="${(I.S * 0.018).toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="1.4"></circle>` +
      `<line x1="${a.toFixed(1)}" y1="${b.toFixed(1)}" x2="${c.toFixed(1)}" y2="${d.toFixed(1)}" stroke="${stroke}" stroke-width="1.4"></line>`;
  }

  // Предмет на верхней грани модуля: рисуется в тоне направления, занимает заднюю часть грани.
  function moduleIcon(I, icon, cx, cy, z, tone) {
    const ink = tone.ink;
    const py = (x0, x1, z0, z1, fill, stroke = ink, sw = 1) => I.poly([[x0, cy, z0], [x1, cy, z0], [x1, cy, z1], [x0, cy, z1]], fill, stroke, sw);
    const ln = (a, b, sw = 1.4) => I.line(a, b, ink, sw);
    const dot = (x, y, zz, r, fill, stroke = ink) => { const [a, b] = I.p(x, y, zz); return `<circle cx="${a.toFixed(1)}" cy="${b.toFixed(1)}" r="${(I.S * r).toFixed(1)}" fill="${fill}" stroke="${stroke}" stroke-width="1.4"></circle>`; };
    switch (icon) {
      case "crm":
        return ln([cx, cy, z], [cx, cy, z + 0.05]) + py(cx - 0.15, cx + 0.15, z + 0.05, z + 0.26, WHITE) +
          py(cx - 0.11, cx + 0.03, z + 0.17, z + 0.21, tone.right, "none", 0) + py(cx - 0.11, cx + 0.09, z + 0.09, z + 0.13, tone.top, ink, 0.8);
      case "newbuild":
        return boxZ(I, cx - 0.08, cy - 0.08, cx + 0.08, cy + 0.08, z, 0.34, WHITE, tone.top, tone.right, ink, 1) +
          ln([cx + 0.08, cy - 0.05, z + 0.12], [cx + 0.08, cy + 0.05, z + 0.12], 1) + ln([cx + 0.08, cy - 0.05, z + 0.22], [cx + 0.08, cy + 0.05, z + 0.22], 1);
      case "legal":
        return I.poly([[cx - 0.13, cy - 0.15, z], [cx + 0.13, cy - 0.15, z], [cx + 0.13, cy + 0.15, z], [cx - 0.13, cy + 0.15, z]], WHITE, ink, 1) +
          ln([cx - 0.08, cy - 0.1, z], [cx + 0.08, cy - 0.1, z], 1) + ln([cx - 0.08, cy - 0.04, z], [cx + 0.05, cy - 0.04, z], 1) +
          dot(cx + 0.04, cy + 0.07, z, 0.035, "none");
      case "partners":
        return boxZ(I, cx - 0.1, cy - 0.1, cx + 0.1, cy + 0.1, z, 0.13, WHITE, tone.top, tone.right, ink, 1) + keySvg(I, cx, cy, z + 0.13, ink);
      case "dashboard":
        return py(cx - 0.15, cx + 0.15, z + 0.02, z + 0.27, WHITE) +
          py(cx - 0.11, cx - 0.05, z + 0.05, z + 0.12, ink, "none", 0) + py(cx - 0.03, cx + 0.03, z + 0.05, z + 0.17, ink, "none", 0) + py(cx + 0.05, cx + 0.11, z + 0.05, z + 0.23, ink, "none", 0);
      case "franchise":
        return I.poly([[cx - 0.14, cy, z + 0.1], [cx - 0.06, cy, z + 0.1], [cx - 0.15, cy, z + 0.02]], WHITE, ink, 1) +
          py(cx - 0.15, cx + 0.14, z + 0.1, z + 0.27, WHITE) + ln([cx - 0.1, cy, z + 0.21], [cx + 0.08, cy, z + 0.21], 1.2) + ln([cx - 0.1, cy, z + 0.15], [cx + 0.03, cy, z + 0.15], 1.2);
      case "hiring":
        return figure(I, cx - 0.07, cy + 0.05, z, tone.top) + figure(I, cx + 0.07, cy - 0.05, z, tone.top);
      case "training":
        return ln([cx - 0.09, cy, z + 0.1], [cx - 0.12, cy, z]) + ln([cx + 0.09, cy, z + 0.1], [cx + 0.12, cy, z]) +
          py(cx - 0.13, cx + 0.13, z + 0.1, z + 0.32, WHITE) +
          `<polyline points="${[[-0.09, 0.14], [-0.03, 0.2], [0.02, 0.17], [0.09, 0.27]].map(([dx, dz]) => I.p(cx + dx, cy, z + dz).map((v) => v.toFixed(1)).join(",")).join(" ")}" fill="none" stroke="${ink}" stroke-width="1.4"></polyline>`;
      default:
        return "";
    }
  }

  // Финал системы: модули собираются в трёхэтажное здание. Этаж = направление.
  // Первый этаж — ваш офис со стеклянным фасадом (живой офис виден внутри), выше — управление и команда.
  function buildingSvg(I, labels) {
    const X0 = 0.8, X1 = 2.2, Y0 = 0.8, Y1 = 2.2;
    const floors = [[0, 0.72], [0.72, 1.22], [1.22, 1.72]];
    const contours = Array.isArray(content.contours) ? content.contours : [];
    const modules = Array.isArray(content.modules) ? content.modules : [];
    const faceR = (z0, z1, fill, extra = "") => I.poly([[X1, Y0, z0], [X1, Y1, z0], [X1, Y1, z1], [X1, Y0, z1]], fill, INK, 1.2, extra);
    const faceL = (z0, z1, fill, extra = "") => I.poly([[X0, Y1, z0], [X1, Y1, z0], [X1, Y1, z1], [X0, Y1, z1]], fill, INK, 1.2, extra);
    const mullions = (z0, z1, step, sw = 0.8) => {
      let o = "";
      for (let t = X0 + step; t < X1 - 0.01; t += step) o += I.line([t, Y1, z0], [t, Y1, z1], INK, sw);
      for (let t = Y0 + step; t < Y1 - 0.01; t += step) o += I.line([X1, t, z0], [X1, t, z1], INK, sw);
      return o;
    };
    const part = (d, svg) => `<g class="bld-part" style="--d:${d}ms">${svg}</g>`;
    let o = "";
    // Первый этаж: стекло, красная полоса с вывеской, вход.
    const [g0, g1] = floors[0];
    o += part(0,
      faceR(g0, g1, "#EEF3F4", 'fill-opacity=".16"') + faceL(g0, g1, "#EEF3F4", 'fill-opacity=".16"') + mullions(g0, 0.6, 0.35, 0.6) +
      faceR(0.6, g1, RED) + faceL(0.6, g1, RED) +
      I.poly([[1.72, Y1, 0], [1.98, Y1, 0], [1.98, Y1, 0.36], [1.72, Y1, 0.36]], "#2A2B30", INK, 1, 'fill-opacity=".35"'));
    const [sx, sy] = I.p(X0 + 0.18, Y1, 0.63);
    o += part(0, `<text class="office-sign" transform="matrix(0.866 0.5 0 1 ${sx.toFixed(1)} ${sy.toFixed(1)})" font-size="${(I.S * 0.085).toFixed(1)}" fill="${WHITE}">DОМИАН</text>`);
    // 2-й и 3-й этажи: плиты в тоне направления с полосой остекления.
    [1, 2].forEach((k) => {
      const [z0, z1] = floors[k];
      const t = TONES[k];
      o += part(180 * k,
        faceR(z0, z1, t.right) + faceL(z0, z1, t.left) +
        faceR(z0 + 0.15, z1 - 0.13, "#EEF3F4") + faceL(z0 + 0.15, z1 - 0.13, "#EEF3F4") + mullions(z0 + 0.15, z1 - 0.13, 0.35));
    });
    // Крыша, парапет и вентиляция.
    const top = floors[2][1];
    o += part(540,
      I.poly([[X0, Y0, top], [X1, Y0, top], [X1, Y1, top], [X0, Y1, top]], "#E9E6DF", INK, 1.2) +
      I.poly([[X0 + 0.08, Y0 + 0.08, top], [X1 - 0.08, Y0 + 0.08, top], [X1 - 0.08, Y1 - 0.08, top], [X0 + 0.08, Y1 - 0.08, top]], "none", INK2, 0.8) +
      boxZ(I, 1.0, 1.0, 1.3, 1.22, top, 0.12, WHITE, "#E2DED6", "#D6D1C7") +
      boxZ(I, 1.5, 1.0, 1.72, 1.18, top, 0.09, WHITE, "#E2DED6", "#D6D1C7"));
    // Выноски этажей справа: этаж, направление, номера модулей.
    const full = labels === "full";
    floors.forEach(([z0, z1], k) => {
      const [ax, ay] = I.p(X1, Y0 + 0.3, (z0 + z1) / 2);
      const nums = modules.map((m, i) => (m.contour === k ? pad(i + 1) : "")).filter(Boolean).join(" · ");
      const tx = full ? 560 : ax + 34;
      let tag;
      if (full) {
        tag = `<text x="${tx}" y="${(ay - 12).toFixed(1)}" class="iso-text" font-size="11" fill="${INK2}">ЭТАЖ ${k + 1}</text>` +
          `<text x="${tx}" y="${(ay + 3).toFixed(1)}" class="iso-text" font-size="12" fill="${TONES[k].ink}">${escapeHtml((contours[k] || "").toUpperCase())}</text>` +
          `<text x="${tx}" y="${(ay + 18).toFixed(1)}" class="iso-text" font-size="11" fill="${INK}">${nums}</text>`;
      } else {
        tag = `<rect x="${tx}" y="${(ay - 24).toFixed(1)}" width="48" height="44" fill="${WHITE}" stroke="${TONES[k].ink}" stroke-width="2"></rect>` +
          `<text x="${tx + 24}" y="${(ay + 8).toFixed(1)}" text-anchor="middle" class="iso-text" font-size="26" fill="${TONES[k].ink}">${k + 1}</text>`;
      }
      o += part(180 * k + 300, `<circle cx="${ax.toFixed(1)}" cy="${ay.toFixed(1)}" r="${full ? 2.5 : 5}" fill="${INK}"></circle>` +
        `<line x1="${ax.toFixed(1)}" y1="${ay.toFixed(1)}" x2="${(tx - 6).toFixed(1)}" y2="${ay.toFixed(1)}" stroke="${INK}" stroke-width="${full ? 1 : 2}"></line>` + tag);
    });
    return `<g class="iso-building">${o}</g>`;
  }

  function buildIso(options) {
    const { width = 720, height = 580, S = 120, ox = 360, oy = 140, labels = "full", contourLabels = true, grid = true, legend = false, lit = false, slotNumbers = true } = options;
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
    let labelLayer = "";
    cells.forEach(({ i, j, n }) => {
      if (n === -1) { body += officeSvg(I, lit); return; }
      const x0 = i + G, y0 = j + G, x1 = i + 1 - G, y1 = j + 1 - G;
      const name = modules[n]?.short || "";
      const tone = TONES[modules[n]?.contour ?? 0] || TONES[0];
      // Предмет — в задней части грани, подпись — в передней, чтобы не перекрывались.
      const cut = FRONT.has(`${i},${j}`) ? " is-cut" : "";
      const icon = (h) => moduleIcon(I, modules[n]?.icon, i + 0.36, j + 0.36, h, tone);
      // Подпись — флажок: древко с передней части грани и табличка с номером и названием.
      const label = (h) => {
        const full = labels === "full";
        const size = full ? 12 : 24;
        const txt = full ? `${pad(n + 1)} ${name}` : pad(n + 1);
        // Флажок смотрит наружу от офиса: левые блоки — влево, правые — вправо.
        const side = i - j < 0 ? -1 : 1;
        const center = i === 0 && j === 0;
        const [bx, by] = center ? I.p(i + 0.5, j + 0.5, h) : side < 0 ? I.p(x0 + 0.14, y1 - 0.14, h) : I.p(x1 - 0.14, y0 + 0.14, h);
        const pole = full ? 34 : 58;
        const w = Math.round(txt.length * size * 0.62 + size * 1.1);
        const hgt = Math.round(size * 1.75);
        const top = by - pole;
        return `<line class="flag-pole" x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${bx.toFixed(1)}" y2="${(top - hgt).toFixed(1)}" stroke="${INK}" stroke-width="${full ? 1 : 2}"></line>` +
          `<circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="${full ? 2 : 4}" fill="${INK}"></circle>` +
          `<rect class="flag" x="${(side < 0 ? bx - w : bx).toFixed(1)}" y="${(top - hgt).toFixed(1)}" width="${w}" height="${hgt}" fill="${WHITE}" stroke="${tone.ink}" stroke-width="${full ? 1 : 2}"></rect>` +
          `<text x="${(side < 0 ? bx - w + size * 0.55 : bx + size * 0.55).toFixed(1)}" y="${(top - hgt * 0.32).toFixed(1)}" class="iso-text" font-size="${size}" fill="${INK}">${escapeHtml(txt)}</text>`;
      };
      body += `<g class="iso-slot" data-i="${n}">${I.poly([[x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0]], "none", "#A9A49A", 1.2, 'stroke-dasharray="5 5" pathLength="1" class="draw-dash"')}${slotNumbers ? I.text(i + 0.5, j + 0.5, 0, pad(n + 1), fs, INK2, 5) : ""}</g>`;
      const [sx0, sy0] = I.p(i + 0.5, j + 0.5, 0);
      const [cx0, cy0] = I.p(1.5, 1.5, 0.7);
      const gather = `--gx:${(cx0 - sx0).toFixed(1)}px;--gy:${(cy0 - sy0).toFixed(1)}px`;
      body += `<g class="iso-tile" style="${gather}" data-i="${n}" data-sx="${sx0.toFixed(1)}" data-sy="${sy0.toFixed(1)}" data-tone="${tone.ink}"><g class="iso-shell${cut}">${I.box(x0, y0, x1, y1, 0.16, tone.top, tone.left, tone.right)}</g>${icon(0.16)}</g>`;
      // Подписи — отдельным верхним слоем, чтобы стены офиса не перекрывали их на низких плитках.
      labelLayer += `<g class="iso-tile iso-label" style="${gather}" data-i="${n}">${label(0.16)}</g>`;
    });
    // Импульс: маркер бежит по полу от текущего модуля к офису. Координаты — в data-атрибутах плиток.
    const pulseSize = labels === "full" ? 10 : 22;
    const [tx, ty] = I.p(1.5, 1.5, 0);
    const pulse = `<g class="iso-pulse" data-tx="${tx.toFixed(1)}" data-ty="${ty.toFixed(1)}"><line class="pulse-path" x1="0" y1="0" x2="0" y2="0"></line><rect class="pulse-dot" x="${-pulseSize / 2}" y="${-pulseSize / 2}" width="${pulseSize}" height="${pulseSize}"></rect></g>`;
    let legendSvg = "";
    if (legend) {
      const lx = I.p(0, 3)[0] + 30, ly = I.p(3, 3)[1] + 30;
      legendSvg = `<rect x="${lx}" y="${ly - 11}" width="16" height="12" fill="none" stroke="${RED}" stroke-width="2"></rect>` +
        `<text x="${lx + 26}" y="${ly}" class="iso-text" font-size="${labels === "full" ? 15 : 24}" fill="${RED}">ВАШ ОФИС</text>`;
    }
    return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" focusable="false">${floor}${body}${buildingSvg(I, labels)}${labelLayer}${pulse}${legendSvg}</svg>`;
  }

  function setIsoState(root, built, current, final) {
    if (!root) return;
    qsa(".iso-tile", root).forEach((g) => {
      const i = Number(g.dataset.i);
      g.classList.toggle("is-on", i < built || final);
      g.classList.toggle("is-current", i === current && !final);
      g.classList.toggle("is-gather", final);
    });
    qsa(".iso-slot", root).forEach((g) => g.classList.toggle("is-off", Number(g.dataset.i) < built || final));
    qsa(".office-part", root).forEach((g) => {
      const need = g.dataset.need;
      g.classList.toggle("is-on", need === "final" ? final : Number(need) < built || final);
    });
    root.classList.toggle("is-final", final);
  }

  function renderIsos() {
    const small = (el) => (el?.clientWidth || 0) < 560;
    const hero = qs("#hero-iso");
    if (hero) {
      // Первый экран: только офис и три зоны направлений; модули раскрываются в блоке «Система».
      hero.innerHTML = buildIso({ labels: small(hero) ? "num" : "full", contourLabels: !small(hero), slotNumbers: false });
      setIsoState(hero, 0, -1, false);
    }
    const system = qs("#system-iso");
    if (system) {
      system.innerHTML = buildIso({ labels: small(system) ? "num" : "full", contourLabels: !small(system), lit: true });
      applySystemState();
    }
    const fin = qs("#final-iso");
    if (fin) {
      // Финальный офис: все детали, клиент у двери, предметы на модулях; импульсов нет.
      fin.innerHTML = buildIso({ labels: "num", contourLabels: false, grid: false, legend: false, lit: true, height: 540 });
      qs(".iso-pulse", fin)?.remove();
      setIsoState(fin, 8, -1, true);
    }
  }

  /* ---------------------------------------------------------------- system scene */
  // До подключения наблюдателя схема в финальном состоянии: если что-то не загрузится, ничего не останется скрытым.
  let systemState = { built: 8, current: -1, final: true };
  let lastCurrent = -1;

  function playPulse(root, index) {
    const tile = root && qs(`.iso-tile[data-i="${index}"]`, root);
    const pulse = root && qs(".iso-pulse", root);
    if (!tile || !pulse) return;
    const sx = Number(tile.dataset.sx), sy = Number(tile.dataset.sy);
    const tx = Number(pulse.dataset.tx), ty = Number(pulse.dataset.ty);
    const path = qs(".pulse-path", pulse), dot = qs(".pulse-dot", pulse);
    path.setAttribute("x1", sx); path.setAttribute("y1", sy); path.setAttribute("x2", tx); path.setAttribute("y2", ty);
    path.style.stroke = tile.dataset.tone;
    dot.setAttribute("transform", `translate(${sx} ${sy})`);
    dot.style.fill = tile.dataset.tone;
    dot.style.setProperty("--dx", `${tx - sx}px`);
    dot.style.setProperty("--dy", `${ty - sy}px`);
    pulse.classList.remove("is-playing");
    pulse.getBoundingClientRect();
    pulse.classList.add("is-playing");
    dot.addEventListener("animationend", () => pulse.classList.remove("is-playing"), { once: true });
  }
  function applySystemState() {
    const root = qs("#system-iso");
    const s = !reducedMotion ? systemState : { built: 8, current: -1, final: true };
    setIsoState(root, s.built, s.current, s.final);
    // Импульс только при движении вперёд к новому модулю; при прокрутке назад — нет.
    if (!reducedMotion && !s.final && s.current > lastCurrent) playPulse(root, s.current);
    lastCurrent = s.final ? 8 : s.current;
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
        ? `<div><dt>Доказательство</dt><dd><figure class="artifact"><img src="${escapeHtml(m.artifact.src)}" alt="${escapeHtml(m.artifact.alt)}" loading="lazy" decoding="async"><figcaption>${escapeHtml(m.artifact.caption)}</figcaption></figure></dd></div>`
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
    if (!steps.length || !("IntersectionObserver" in window) || reducedMotion) { systemState = { built: 8, current: -1, final: true }; applySystemState(); return; }
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

  function initialize() {
    renderCtaLabels(); renderPdfLinks();
    renderFacts("#hero-facts", content.heroFacts, "fact");
    renderFacts("#network-metrics", content.networkMetrics, "metric");
    renderMembership();
    renderSystemSteps(); renderIsos(); configureSystemScroll();
    renderCities();
    renderSplit(); renderPerformance(); configureTabs(); renderCases();
    renderLaunch(); renderConditions(); renderStoriesAndTeam();
    renderContacts(); renderSocialLinks(); renderNotes();
    configureMenu(); configureScrollChrome(); configureActiveNav(); configureInView();
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
