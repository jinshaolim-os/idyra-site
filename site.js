// idyra.ai: small progressive enhancements. Every page reads fully without this script.
// Text written here gets the build's typesetting of middle dots: each "·" in a span that styles.css gives a little room.
const setText = (element, text) => element.replaceChildren(...String(text).split('·').flatMap((part, i) => i ? [Object.assign(document.createElement('span'), { className: 'dot', textContent: '·' }), part] : [part]));
// After the load event and the browser's next frame. A fast load can fire before the page's first layout, and an arrival
// on a fragment (the header's "Explore" link is index.html#experience) jumps there only in that layout: until then the
// page still reports its top, and with smooth scrolling already on the jump would glide past the hero (2 Oct 2026: the
// hero clip loaded in 6 of 10 such arrivals). The second animation frame comes after that layout.
const afterLoadFrame = fn => {
  const go = () => requestAnimationFrame(() => requestAnimationFrame(fn));
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
};
(() => {
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // compare slider: as per plan (left) vs operation-ready (right); a range input drives it, so keys and touch work
  for (const c of $$('[data-compare]')) {
    const range = c.querySelector('input[type="range"]');
    const set = v => { c.style.setProperty('--pos', `${v}%`); range.setAttribute('aria-valuetext', `${v}% as per plan, ${100 - v}% fitted out`); };
    range.addEventListener('input', () => set(range.value));
    set(range.value);
  }

  // as-per-plan switches on stills: swap image, alt, provenance label and state line together
  for (const btn of $$('[data-toggle]')) {
    const fig = btn.closest('[data-still]');
    const img = fig.querySelector('img');
    const pill = fig.querySelector('[data-pill]');
    const state = fig.querySelector('[data-state]');
    const views = { op: JSON.parse(fig.dataset.op), plan: JSON.parse(fig.dataset.plan) };
    btn.addEventListener('click', () => {
      const on = btn.getAttribute('aria-checked') !== 'true';
      const v = on ? views.plan : views.op;
      btn.setAttribute('aria-checked', String(on));
      img.srcset = v.srcset; img.src = v.src; img.alt = v.alt;
      setText(pill.querySelector('.pill-t') || pill, v.label);
      if (state) setText(state, v.state);
    });
  }

  // the walk-in twin loads only when asked (about 1.5 MB); the page shows its label and notice above the frame
  for (const btn of $$('[data-twin-open]')) {
    btn.addEventListener('click', () => {
      const box = btn.closest('[data-twin]');
      const f = document.createElement('iframe');
      f.src = box.dataset.src;
      f.title = 'PT 49665 interactive to-scale model';
      f.setAttribute('allow', 'fullscreen');
      f.setAttribute('allowfullscreen', '');
      box.querySelector('.twin-cta').remove();
      box.appendChild(f);
      f.addEventListener('load', () => {
        const doc = f.contentDocument;
        if (!doc) return;
        const started = performance.now();
        const initialize = () => {
          const orbit = doc.getElementById('mode-orbit');
          const plan = doc.querySelector('.seg-b[data-state="a"]');
          const people = doc.querySelector('[data-id="people"]');
          // Shader warmup applies the model's default state after its controls exist.
          // Wait for completion so it cannot overwrite the opening or a queued shortcut.
          if (!f.contentWindow?.__factory?.ready || !orbit || !plan || !people) {
            if (performance.now() - started < 90000) setTimeout(initialize, 100);
            return;
          }
          // Operate the viewer's own controls; keep the sanitized model unchanged.
          orbit.click();
          plan.click();
          if (people.getAttribute('aria-pressed') === 'true') people.click();
          box.dataset.initialized = 'true';
          box.dispatchEvent(new CustomEvent('twin-ready'));
        };
        initialize();
      });
      // The demo shortcut already positions the page; focus must not start a competing scroll.
      f.focus({ preventScroll: true });
    });
  }

  // copy the WhatsApp number (the wa.me link is a convenience that may not open inside every viewer)
  for (const btn of $$('[data-copy]')) {
    const note = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', () => {
      const text = btn.dataset.copy;
      const done = ok => { if (note) note.textContent = ok ? `Copied ${text}` : `Select the number above and copy it: ${text}`; };
      try { navigator.clipboard.writeText(text).then(() => done(true), () => done(false)); } catch { done(false); }
    });
  }

  // vacancy cost: the visitor's own rent divided by 4.3 weeks; a comparison, not a promise of results
  for (const form of $$('[data-calc]')) {
    const input = form.querySelector('input');
    const out = form.querySelector('output');
    const fmt = n => 'RM' + Math.round(n).toLocaleString('en-MY');
    const run = () => {
      const rent = Number(String(input.value).replace(/[^\d.]/g, ''));
      out.textContent = rent > 0 ? fmt(rent / 4.3) : '—';
    };
    form.addEventListener('submit', e => { e.preventDefault(); run(); });
    input.addEventListener('input', run);
    run();
  }

  // quote-request builder: composes a WhatsApp message in the browser; nothing is sent until the visitor presses Send
  for (const form of $$('[data-brief]')) {
    const out = form.querySelector('[data-brief-out]');
    const send = form.querySelector('[data-brief-send]');
    const val = n => (form.querySelector(`input[name="${n}"]:checked`) || {}).value || '';
    const run = () => {
      const area = (form.querySelector('input[name="area"]').value || '').trim().slice(0, 80);
      const msg = [
        "Hi Idyra, I'd like a quote.",
        `I am: ${val('who')}`,
        `Property: ${val('what')}${area ? `, ${area}` : ''}`,
        `Gross floor area: ${val('size')}`,
        `Building-plan drawings: ${val('drawings')}`,
        `Interested in: ${val('want')}`,
      ].join('\n');
      out.textContent = msg;
      send.href = `https://wa.me/${form.dataset.wa}?text=${encodeURIComponent(msg)}`;
    };
    form.addEventListener('change', run);
    form.addEventListener('input', run);
    form.addEventListener('submit', e => e.preventDefault());
    run();
  }

  // language tabs (home summary in EN / BM / 中文)
  for (const tabs of $$('[data-langs]')) {
    const btns = $$('button', tabs);
    const panels = btns.map(b => document.getElementById(b.getAttribute('aria-controls')));
    const select = i => btns.forEach((x, j) => { x.setAttribute('aria-selected', String(i === j)); x.tabIndex = i === j ? 0 : -1; panels[j].hidden = i !== j; });
    btns.forEach((b, i) => {
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', e => {
        const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: btns.length - 1 }[e.key];
        if (n === undefined) return;
        e.preventDefault(); const k = (n + btns.length) % btns.length; select(k); btns[k].focus();
      });
    });
    select(0);
  }
})();

// v2 navigation, accessible demo/property tabs and lightweight scroll reveals.
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Keep every demo entry point in the opening screen, including the private-preview ribbon.
  const hero = document.querySelector('.v2-hero');
  if (hero) {
    const openingUi = [...document.querySelectorAll('.ribbon, .top, .experience-rail')];
    const fitOpening = () => hero.style.setProperty('--opening-ui-height', `${Math.ceil(openingUi.reduce((height, element) => height + element.getBoundingClientRect().height, 0))}px`);
    fitOpening();
    if ('ResizeObserver' in window) {
      const observer = new ResizeObserver(fitOpening);
      openingUi.forEach(element => observer.observe(element));
    } else window.addEventListener('resize', fitOpening);
  }
  // The concept row (800 px and below) and the packages' small tiles (599 px and below) are Tab stops only while they
  // scroll sideways; otherwise they are plain grids.
  for (const row of document.querySelectorAll('.concept-row, .dl-strip')) {
    const syncStop = () => { if (row.scrollWidth > row.clientWidth + 1) row.setAttribute('tabindex', '0'); else row.removeAttribute('tabindex'); };
    syncStop();
    if ('ResizeObserver' in window) new ResizeObserver(syncStop).observe(row);
    else window.addEventListener('resize', syncStop);
  }
  const menu = document.querySelector('[data-menu]');
  const nav = document.getElementById('main-nav');
  if (menu && nav) {
    const close = () => { menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open);
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { close(); menu.focus(); } });
    window.matchMedia('(min-width: 801px)').addEventListener('change', close);
    menu.closest('.top').classList.add('nav-ready');
  }
  function tabs(buttonAttr, panelAttr) {
    const buttons = [...document.querySelectorAll(`[${buttonAttr}]`)];
    const panels = [...document.querySelectorAll(`[${panelAttr}]`)];
    if (!buttons.length) return () => {};
    const select = value => {
      for (const button of buttons) {
        const active = button.getAttribute(buttonAttr) === value;
        button.setAttribute('aria-selected', String(active)); button.tabIndex = active ? 0 : -1;
      }
      for (const panel of panels) {
        panel.hidden = panel.getAttribute(panelAttr) !== value;
        if (panel.hidden) panel.querySelectorAll('video').forEach(video => video.pause());
      }
    };
    buttons.forEach((button, i) => {
      button.addEventListener('click', () => select(button.getAttribute(buttonAttr)));
      button.addEventListener('keydown', e => {
        const index = {ArrowRight:(i+1)%buttons.length, ArrowLeft:(i-1+buttons.length)%buttons.length, Home:0, End:buttons.length-1}[e.key];
        if (index === undefined) return;
        e.preventDefault(); select(buttons[index].getAttribute(buttonAttr)); buttons[index].focus();
      });
    });
    select(buttons[0].getAttribute(buttonAttr));
    return select;
  }
  const selectDemo = tabs('data-demo-tab', 'data-demo-panel');
  const selectProperty = tabs('data-property-select', 'data-property-panel');
  const jumpToDemo = value => {
    selectDemo(value);
    document.getElementById('experience')?.scrollIntoView({behavior:reduced.matches ? 'instant' : 'smooth', block:'start'});
  };
  for (const link of document.querySelectorAll('[data-open-demo]')) link.addEventListener('click', e => {
    e.preventDefault(); const value = link.dataset.openDemo;
    history.replaceState(null, '', `#demo-${value}`); jumpToDemo(value);
    document.getElementById(`tab-${value}`)?.focus({preventScroll:true});
  });
  const followHash = () => {
    const match = location.hash.match(/^#demo-(compare|twin|film)$/);
    if (match) selectDemo(match[1]);
    const property = location.hash.match(/^#property-(industrial|commercial|office)$/);
    if (property) selectProperty(property[1]);
  };
  followHash(); window.addEventListener('hashchange', followHash);
  if (!reduced.matches && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('reveal-pending'); entry.target.classList.add('reveal-ready'); observer.unobserve(entry.target); }
    }), {threshold:0.12});
    for (const element of document.querySelectorAll('[data-reveal]')) {
      // Never hide anything already in the visitor's viewport.
      if (element.getBoundingClientRect().top > innerHeight) { element.classList.add('reveal-pending'); observer.observe(element); }
    }
    reduced.addEventListener('change', e => { if (e.matches) { observer.disconnect(); document.querySelectorAll('.reveal-pending').forEach(x => x.classList.remove('reveal-pending')); } });
  }
})();

// Shortcuts operate the real controls in the same-origin, sanitized twin.
(() => {
  const panel = document.getElementById('demo-twin');
  if (!panel) return;
  const box = panel.querySelector('[data-twin]');
  const note = panel.querySelector('[data-twin-status]');
  let pending = null;
  const run = () => {
    if (!pending) return;
    const doc = box.querySelector('iframe')?.contentDocument;
    const selector = pending.state ? `.seg-b[data-state="${pending.state}"]` : pending.intent === 'walk' ? '#mode-walk' : '[data-id="measure"]';
    const control = doc?.querySelector(selector);
    if (!control || box.dataset.initialized !== 'true') return false;
    if (pending.intent !== 'measure' || control.getAttribute('aria-pressed') !== 'true') control.click();
    setText(note, pending.state ? 'Model state updated. Drag to explore this view.' : pending.intent === 'walk' ? 'Walk-in mode is ready. Use the movement controls inside the viewer.' : 'Measured · Tap two points on the model. Model measurement, not a survey.');
    pending = null; return true;
  };
  box.addEventListener('twin-ready', run);
  for (const button of document.querySelectorAll('[data-twin-state], [data-twin-intent]')) button.addEventListener('click', () => {
    pending = {state:button.dataset.twinState, intent:button.dataset.twinIntent};
    note.textContent = 'Opening the 3D model…';
    if (!box.querySelector('iframe')) box.querySelector('[data-twin-open]').click();
    else run();
  });
})();

// AI-animated clips. The labelled render is the first paint and the fallback: a clip loads only after the page has loaded,
// plays muted and looped only while it is on screen, and never with reduced motion or Save-Data. Its "AI-animated" label
// and caption replace the render's only once it is actually playing; "Pause motion" stops every clip.
(() => {
  const figures = [...document.querySelectorAll('[data-ambient]')];
  if (!figures.length || !('IntersectionObserver' in window)) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const lowData = window.matchMedia('(prefers-reduced-data: reduce)');
  const saveData = () => !!(navigator.connection && navigator.connection.saveData) || lowData.matches;
  const toggles = [...document.querySelectorAll('[data-motion-toggle]')];
  const onScreen = new Set();
  let paused = false;
  const allowed = () => !reduced.matches && !saveData() && !paused && document.visibilityState !== 'hidden';
  const showClip = figure => {
    if (figure.classList.contains('is-clip')) return;
    figure.classList.add('is-clip');
    const scope = figure.closest('[data-ambient-scope]') || figure;
    for (const element of scope.querySelectorAll('[data-when]')) element.hidden = element.dataset.when !== 'clip';
    for (const toggle of figure.querySelectorAll('[data-motion-toggle]')) toggle.hidden = false;
  };
  const update = figure => {
    const video = figure.querySelector('video');
    if (allowed() && onScreen.has(figure)) {
      if (!video.getAttribute('src')) {
        // A portrait box (the hero on a phone) plays its square crop, which lines up with the render under the same
        // cover fit; otherwise the 1280x720 version when the box needs no more than about 1536 device pixels across
        // (phones, 1x desktops), else the 1920x1080 file.
        const tall = video.dataset.tallSrc && figure.clientWidth < figure.clientHeight;
        const need = Math.max(figure.clientWidth, figure.clientHeight * 16 / 9) * (window.devicePixelRatio || 1);
        video.src = tall ? video.dataset.tallSrc : (video.dataset.smallSrc && need <= 1536 ? video.dataset.smallSrc : video.dataset.wideSrc);
      }
      const playing = video.play();
      if (playing) playing.catch(() => {});
    } else if (!video.paused) video.pause();
  };
  const updateAll = () => figures.forEach(update);
  for (const figure of figures) figure.querySelector('video').addEventListener('playing', () => showClip(figure));
  for (const toggle of toggles) toggle.addEventListener('click', () => {
    paused = !paused;
    for (const t of toggles) { t.toggleAttribute('data-paused', paused); t.querySelector('[data-motion-label]').textContent = paused ? 'Play motion' : 'Pause motion'; }
    updateAll();
  });
  reduced.addEventListener('change', updateAll);
  document.addEventListener('visibilitychange', updateAll);
  const start = () => {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio >= 0.25) onScreen.add(entry.target); else onScreen.delete(entry.target);
      update(entry.target);
    }), { threshold: [0, 0.25, 0.5] });
    figures.forEach(figure => observer.observe(figure));
  };
  afterLoadFrame(start);
})();

// Posters (review of 1 Oct 2026): a film's or the presenter's poster is set from data-poster only after the page has
// loaded and about one screen before the video scrolls into view, so no poster competes with the stylesheet or the
// labelled hero render. A video in a hidden demo tab is watched through its section, so its poster is ready before the
// visitor opens the tab. Visitors without JavaScript get the <noscript> poster under the video.
(() => {
  const videos = [...document.querySelectorAll('video[data-poster]')];
  if (!videos.length) return;
  const set = video => { if (!video.getAttribute('poster')) video.poster = video.dataset.poster; };
  const start = () => {
    if (!('IntersectionObserver' in window)) return videos.forEach(set);
    const watch = new Map(videos.map(video => [video, video.closest('[data-demo-panel]')?.closest('section') || video]));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      for (const [video, target] of watch) if (target === entry.target) { set(video); watch.delete(video); }
      observer.unobserve(entry.target);
    }), { rootMargin: '100% 0px' });
    new Set(watch.values()).forEach(target => observer.observe(target));
  };
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start, { once: true });
})();

// Smooth in-page scrolling starts only after load and the first frame (afterLoadFrame): an arrival on a fragment (the
// header's "Explore" link is index.html#experience) jumps there first, so the clip observer, which starts at the same
// time, never sees the hero on the way.
afterLoadFrame(() => document.documentElement.classList.add('smooth-scroll'));
