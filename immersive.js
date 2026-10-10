// idyra.ai immersive layer (redesign, 10 Oct 2026). Progressive enhancement only: every figure reads without it.
// - Space stages: a range input moves the wipe between the concept drawing and the concept image; pointer drag on the
//   frame drives the same input, so keyboard, touch and mouse share one control.
// - Space selector: accessible tabs (arrow keys, Home/End) between the three category stages.
// - Plan lift: animates a fictional floor plan into its isometric massing model once, when it scrolls into view. With
//   reduced motion the finished model the build drew stays as it is and the controls move instantly.
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isBM = document.documentElement.lang === 'ms';

  // ---------- space stages ----------
  for (const stage of document.querySelectorAll('[data-im-stage]')) {
    const frame = stage.querySelector('.im-stage-frame');
    const range = stage.querySelector('.im-wipe');
    if (!frame || !range) continue;
    const left = stage.querySelector('.im-stage-tag--l')?.textContent.trim() || 'Drawing';
    const right = stage.querySelector('.im-stage-tag--r')?.textContent.trim() || 'Space';
    const set = value => {
      const v = Math.max(0, Math.min(100, Math.round(Number(value))));
      range.value = String(v);
      frame.style.setProperty('--wipe', `${v}%`);
      range.setAttribute('aria-valuetext', `${v}% ${left}, ${100 - v}% ${right}`);
    };
    range.addEventListener('input', () => set(range.value));
    let dragging = false;
    const fromPointer = event => {
      const box = frame.getBoundingClientRect();
      set(((event.clientX - box.left) / box.width) * 100);
    };
    frame.addEventListener('pointerdown', event => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      dragging = true; frame.setPointerCapture?.(event.pointerId); fromPointer(event);
    });
    frame.addEventListener('pointermove', event => { if (dragging) fromPointer(event); });
    const stop = () => { dragging = false; };
    frame.addEventListener('pointerup', stop); frame.addEventListener('pointercancel', stop);
    set(range.value);
    stage.classList.add('is-ready');
  }

  // ---------- accessible tabs (shared by the space selector and the plan-lift set) ----------
  function tabs(list, attr, onSelect) {
    const buttons = [...list.querySelectorAll(`[${attr}]`)];
    if (!buttons.length) return;
    list.hidden = false;
    const select = (button, focus) => {
      for (const b of buttons) { const on = b === button; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; }
      onSelect(button.getAttribute(attr));
      if (focus) button.focus();
    };
    buttons.forEach((button, i) => {
      button.addEventListener('click', () => select(button, false));
      button.addEventListener('keydown', event => {
        const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: buttons.length - 1 }[event.key];
        if (next === undefined) return;
        event.preventDefault();
        select(buttons[(next + buttons.length) % buttons.length], true);
      });
    });
  }
  for (const selector of document.querySelectorAll('[data-im-selector]')) {
    const list = selector.querySelector('.im-tabs');
    const panels = [...selector.querySelectorAll('[data-im-panel]')];
    if (list) tabs(list, 'data-im-tab', value => { for (const panel of panels) panel.hidden = panel.dataset.imPanel !== value; });
  }

  // ---------- plan lift ----------
  const NS = 'http://www.w3.org/2000/svg';
  const FACES = [
    { k: 'top', i: [4, 5, 6, 7], n: [0, 1, 0] }, { k: 'n', i: [0, 1, 5, 4], n: [0, 0, -1] }, { k: 'e', i: [1, 2, 6, 5], n: [1, 0, 0] },
    { k: 's', i: [2, 3, 7, 6], n: [0, 0, 1] }, { k: 'w', i: [3, 0, 4, 7], n: [-1, 0, 0] },
  ];
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  function model(scene) {
    const [W, D] = scene.size;
    const hMax = Math.max(...scene.walls.map(w => w.h), ...(scene.blocks || []).map(b => (b.y || 0) + b.h));
    const isoW = (W + D) * Math.SQRT1_2, isoH = (W + D) * Math.SQRT1_2 * Math.tan(Math.PI / 6) + hMax * 0.82;
    const solids = [];
    for (const w of scene.walls) {
      const [ax, az] = w.a, [bx, bz] = w.b, L = Math.hypot(bx - ax, bz - az) || 1, nx = -(bz - az) / L * w.t / 2, nz = (bx - ax) / L * w.t / 2;
      const p = [[ax - nx, az - nz], [bx - nx, bz - nz], [bx + nx, bz + nz], [ax + nx, az + nz]];
      solids.push({ c: [...p.map(q => [q[0], 0, q[1]]), ...p.map(q => [q[0], w.h, q[1]])], tone: w.tone || 'wall' });
    }
    for (const b of scene.blocks || []) {
      const y0 = b.y || 0, y1 = y0 + b.h, x0 = b.x, z0 = b.z, x1 = b.x + b.w, z1 = b.z + b.d;
      solids.push({ c: [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], tone: b.tone || 'fit' });
    }
    return { W, D, cx: W / 2, cz: D / 2, solids, scale: 0.9 * Math.min(900 / Math.max(W, isoW), 640 / Math.max(D, isoH)), hMid: Math.max(...scene.walls.map(w => w.h)) / 2 };
  }
  function draw(group, m, t) {
    const e = ease(t), th = e * Math.PI / 4, cs = Math.cos(th), sn = Math.sin(th), sq = 1 - e * (1 - Math.tan(Math.PI / 6));
    const P = (x, y, z) => {
      const X = x - m.cx, Z = z - m.cz, rx = X * cs - Z * sn, rz = X * sn + Z * cs;
      return [rx * m.scale, (rz * sq - y * e * 0.82 + m.hMid * e * 0.82) * m.scale, rz];
    };
    const pts = arr => arr.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const floor = [[0, 0, 0], [m.W, 0, 0], [m.W, 0, m.D], [0, 0, m.D]].map(c => P(...c));
    const list = [];
    for (const s of m.solids) for (const f of FACES) {
      if (f.n[1] !== 1 && !(e > 0.02 && f.n[0] * sn + f.n[2] * cs > 0.02)) continue;
      const q = f.i.map(i => P(...s.c[i]));
      list.push({ q, cls: `pl-face pl-${s.tone} pl-${f.k}`, depth: q.reduce((a, p) => a + p[2], 0) / 4 + (f.k === 'top' ? 0.001 : 0) + s.c[4][1] * 0.001 });
    }
    list.sort((a, b) => a.depth - b.depth);
    const nodes = [];
    const poly = (cls, points) => { const el = document.createElementNS(NS, 'polygon'); el.setAttribute('class', cls); el.setAttribute('points', points); nodes.push(el); };
    poly('pl-shadow', pts(floor.map(p => [p[0] + 10 * e, p[1] + 14 * e])));
    poly('pl-floor', pts(floor));
    for (const f of list) poly(f.cls, pts(f.q));
    group.replaceChildren(...nodes);
  }
  for (const figure of document.querySelectorAll('[data-planlift]')) {
    let scenes;
    try { scenes = JSON.parse(figure.dataset.scenes); } catch { continue; }
    const svg = figure.querySelector('svg'), group = svg?.querySelector('g');
    const controls = figure.querySelector('.pl-controls'), range = controls?.querySelector('input[type="range"]');
    if (!group || !controls || !range) continue;
    const buttons = [...controls.querySelectorAll('[data-pl-go]')];
    let current = figure.dataset.start, m = model(scenes[current]), t = 1, frame = 0;
    const set = value => {
      t = Math.max(0, Math.min(1, value));
      draw(group, m, t);
      range.value = String(Math.round(t * 100));
      range.setAttribute('aria-valuetext', isBM ? (t < 0.5 ? 'Pelan lantai' : 'Model 3D') : (t < 0.5 ? 'Floor plan' : '3D model'));
      for (const b of buttons) b.setAttribute('aria-pressed', String((b.dataset.plGo === '1') === (t >= 0.5)));
    };
    const play = to => {
      cancelAnimationFrame(frame);
      if (reduced.matches) return set(to);
      const from = t, start = performance.now(), ms = 1600 * Math.abs(to - from) + 200;
      const step = now => { const k = Math.min(1, (now - start) / ms); set(from + (to - from) * k); if (k < 1) frame = requestAnimationFrame(step); };
      frame = requestAnimationFrame(step);
    };
    controls.hidden = false;
    range.addEventListener('input', () => { cancelAnimationFrame(frame); set(range.value / 100); });
    for (const b of buttons) b.addEventListener('click', () => play(Number(b.dataset.plGo)));
    const list = figure.querySelector('.pl-tabs');
    if (list) tabs(list, 'data-pl-scene', value => {
      if (!scenes[value]) return;
      current = value; m = model(scenes[value]);
      const label = figure.querySelector(`[data-pl-scene="${value}"]`)?.dataset.label;
      if (label) svg.setAttribute('aria-label', label);
      set(t);
    });
    set(1);
    if (!reduced.matches && 'IntersectionObserver' in window) {
      // Show the plan first, then lift it once the diagram is properly in view.
      if (figure.getBoundingClientRect().top > innerHeight * 0.6) {
        set(0);
        const io = new IntersectionObserver(entries => {
          if (entries.some(entry => entry.isIntersecting)) { io.disconnect(); setTimeout(() => play(1), 250); }
        }, { threshold: 0.45 });
        io.observe(figure);
      }
    }
  }
})();

// The floating help launcher steps aside while an opened 3D demo is on screen, so it never covers the demo's own
// controls (its corner position otherwise sits over a demo's bottom-right buttons). It returns, unchanged, once the demo
// leaves the view. The mobile header copy of the launcher is untouched; the hidden one leaves the tab order too.
(() => {
  const boxes = [...document.querySelectorAll('[data-category-demo], [data-twin]')];
  if (!boxes.length || !('IntersectionObserver' in window)) return;
  const visible = new Set();
  const sync = () => document.documentElement.classList.toggle('im-demo-in-view', [...visible].some(box => box.querySelector('iframe')));
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) { if (entry.isIntersecting) visible.add(entry.target); else visible.delete(entry.target); }
    sync();
  }, { threshold: [0, 0.01] });
  boxes.forEach(box => io.observe(box));
  // A demo opens on request: re-check once its frame has been inserted.
  document.addEventListener('click', event => { if (event.target.closest('[data-category-open], [data-twin-open]')) requestAnimationFrame(() => requestAnimationFrame(sync)); });
})();

// Concept gallery: category filters (buttons with aria-pressed) and an enlarge dialog. Each card is a plain link to the
// full-size image, so it works without this script; with it, the link opens a native <dialog> with the picture, title and
// caption, closed by Escape, the close button or a click on the backdrop. Focus returns to the card that opened it.
(() => {
  for (const gallery of document.querySelectorAll('[data-im-gallery]')) {
    const cards = [...gallery.querySelectorAll('.im-card')];
    for (const button of gallery.querySelectorAll('.im-filter')) button.addEventListener('click', () => {
      const value = button.dataset.filter;
      for (const b of gallery.querySelectorAll('.im-filter')) b.setAttribute('aria-pressed', String(b === button));
      for (const card of cards) card.hidden = value !== 'all' && card.dataset.category !== value;
    });
  }
  const links = [...document.querySelectorAll('[data-enlarge]')];
  if (!links.length || typeof HTMLDialogElement !== 'function') return;
  const dialog = document.createElement('dialog');
  dialog.className = 'im-lightbox';
  dialog.setAttribute('aria-labelledby', 'im-lightbox-title');
  dialog.innerHTML = '<div class="im-lightbox-in"><button type="button" class="im-lightbox-close"><span aria-hidden="true">×</span></button><img alt="" decoding="async"><div class="im-lightbox-copy"><strong id="im-lightbox-title"></strong><p></p><span class="fine"></span></div></div>';
  dialog.querySelector('.im-lightbox-close').setAttribute('aria-label', document.documentElement.lang === 'ms' ? 'Tutup' : 'Close');
  document.body.appendChild(dialog);
  const img = dialog.querySelector('img'), title = dialog.querySelector('strong'), caption = dialog.querySelector('p'), note = dialog.querySelector('.fine');
  note.textContent = document.documentElement.lang === 'ms' ? 'Konsep AI · ruang rekaan' : 'AI concept · fictional space';
  let opener = null;
  const open = link => {
    opener = link;
    img.src = link.getAttribute('href'); img.alt = link.dataset.caption || '';
    title.textContent = link.dataset.title || ''; caption.textContent = link.dataset.caption || '';
    dialog.showModal();
    dialog.querySelector('.im-lightbox-close').focus();
  };
  for (const link of links) link.addEventListener('click', event => { if (event.metaKey || event.ctrlKey || event.shiftKey) return; event.preventDefault(); open(link); });
  dialog.querySelector('.im-lightbox-close').addEventListener('click', () => dialog.close());
  // Keep a complete Tab cycle inside the modal, including browsers that focus the document after its only button.
  dialog.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const stops = [...dialog.querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(el => !el.disabled && el.getClientRects().length);
    const first = stops[0], last = stops.at(-1);
    if (first && (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
      event.preventDefault(); (event.shiftKey ? last : first).focus();
    }
  });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => { img.removeAttribute('src'); opener?.focus(); });
})();

// Optional film filters progressively enhance a complete, readable no-JavaScript collection.
for (const library of document.querySelectorAll('[data-industrial-film-library]')) {
  const buttons = [...library.querySelectorAll('[data-industrial-film-filter]')];
  const cards = [...library.querySelectorAll('[data-industrial-film]')];
  const count = library.querySelector('[data-industrial-film-count]');
  if (buttons.length) library.querySelector('.if-filter-row').hidden = false;
  for (const button of buttons) button.addEventListener('click', () => {
    const selected = button.dataset.industrialFilmFilter;
    for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
    for (const card of cards) {
      card.hidden = selected !== 'all' && card.dataset.industrialFilmKind !== selected;
      if (card.hidden) for (const video of card.querySelectorAll('video')) video.pause();
    }
    if (count) count.textContent = String(cards.filter(card => !card.hidden).length);
  });
}
