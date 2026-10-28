// idyra.ai: small progressive enhancements. Every page reads fully without this script.
// Text written here gets the build's typesetting of middle dots: each "·" in a span that styles.css gives a little room.
const isBM = document.documentElement.lang === 'ms';
const uiBM = {
  'As per plan':'Mengikut pelan', 'Operation-ready: logistics':'Cadangan operasi: logistik',
  'Operation-ready: light manufacturing':'Cadangan operasi: pembuatan ringan',
  'Rendered from building-plan drawings':'Dirender berdasarkan lukisan pelan bangunan',
  'Rendered from building-plan drawings · fit-out illustrative':'Dirender berdasarkan lukisan pelan bangunan · susun atur sebagai ilustrasi',
  'Model state updated. Drag to explore this view.':'Paparan model dikemas kini. Seret untuk meneroka paparan ini.',
  'Walk-in mode is ready. Use the movement controls inside the viewer.':'Mod berjalan sedia digunakan. Gunakan kawalan pergerakan dalam pemapar.',
  'Measured · Tap two points on the model. Model measurement, not a survey.':'Ukuran · Ketik dua titik pada model. Ukuran model, bukan ukur tanah.',
  'Not specified yet':'Belum dinyatakan', 'Owner or landlord':'Pemilik atau tuan tanah',
  'Business owner or operator':'Pemilik atau pengendali perniagaan', 'Homeowner':'Pemilik rumah',
  'Registered estate agent':'Ejen harta tanah berdaftar', 'Developer or park operator':'Pemaju atau pengendali taman perindustrian',
  'Other':'Lain-lain', 'Not sure yet':'Belum pasti', 'Factory or warehouse':'Kilang atau gudang',
  'Shop or office':'Kedai atau pejabat', 'Industrial park':'Taman perindustrian',
  'Cafe or restaurant':'Kafe atau restoran', 'Home':'Rumah',
  'Up to 25,000 sq ft':'Sehingga 25,000 kaki persegi', '25,001–80,000 sq ft':'25,001–80,000 kaki persegi',
  'Over 80,000 sq ft':'Melebihi 80,000 kaki persegi', 'Not sure':'Tidak pasti', 'Yes, as a PDF':'Ya, dalam format PDF',
  'On paper':'Di atas kertas', 'Not yet':'Belum ada',
  'Explain the property to prospects':'Terangkan hartanah kepada bakal pelanggan',
  'Discuss a possible layout with my team':'Bincangkan cadangan susun atur dengan pasukan saya',
  'Create a company or project presentation':'Sediakan pembentangan syarikat atau projek',
  'Explore ideas for my home':'Teroka idea untuk rumah saya',
  'Prefer to discuss':'Ingin berbincang dahulu',
  'As soon as possible, please confirm feasibility':'Secepat mungkin, sila sahkan kebolehlaksanaan',
  'Within the next month':'Dalam bulan hadapan', 'Exploring options, no fixed date':'Meninjau pilihan, belum ada tarikh tetap',
  'Interactive 3D model':'Model 3D interaktif', 'Still images':'Imej pegun',
  'Presentation video':'Video persembahan', 'Illustrative layout options':'Pilihan susun atur ilustratif',
  'Please recommend suitable options':'Mohon cadangkan pilihan yang sesuai',
  'Not sure / prefer to discuss':'Belum pasti / bincang dahulu',
  'Please check the budget amount':'Sila semak jumlah bajet',
  'My indicative budget, not a quotation':'Anggaran bajet saya, bukan sebut harga',
  'Message preview updated':'Pratonton mesej dikemas kini'
};
const uiText = text => isBM ? (uiBM[text] || text) : text;
const setText = (element, text) => element.replaceChildren(...String(uiText(text)).split('·').flatMap((part, i) => i ? [Object.assign(document.createElement('span'), { className: 'dot', textContent: '·' }), part] : [part]));
// After the load event and the browser's next frame. A fast load can fire before the page's first layout, and an arrival
// on a fragment (the header's "Explore" link is index.html#experience) jumps there only in that layout: until then the
// page still reports its top, and with smooth scrolling already on the jump would glide past the hero (2 Oct 2026: the
// hero clip loaded in 6 of 10 such arrivals). The second animation frame comes after that layout.
const afterLoadFrame = fn => {
  const go = () => requestAnimationFrame(() => requestAnimationFrame(fn));
  if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
};
// Homepage proof images wait for the hero and stylesheets, rather than relying on the browser's
// lazy-load distance. Restore responsive sources after load and layout; the normal lazy-loading
// policy still decides which offscreen images to fetch. No-JS visitors use the original noscript images.
(() => {
  const images = [...document.querySelectorAll('img[data-deferred-image]')];
  if (!images.length) return;
  afterLoadFrame(() => {
    for (const image of images) {
      // A control may have resolved or changed the pending view before this callback.
      if (!image.hasAttribute('data-deferred-image')) continue;
      if (image.dataset.deferredSrcset) image.srcset = image.dataset.deferredSrcset;
      if (image.dataset.deferredSrc) image.src = image.dataset.deferredSrc;
      image.hidden = false;
      image.removeAttribute('data-deferred-image');
      delete image.dataset.deferredSrc;
      delete image.dataset.deferredSrcset;
    }
  });
})();
(() => {
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  // compare slider: as per plan (left) vs operation-ready (right); a range input drives it, so keys and touch work
  for (const c of $$('[data-compare]')) {
    const range = c.querySelector('input[type="range"]');
    const set = v => { c.style.setProperty('--pos', `${v}%`); range.setAttribute('aria-valuetext', isBM ? `${v}% mengikut pelan, ${100 - v}% dengan cadangan susun atur` : `${v}% as per plan, ${100 - v}% fitted out`); };
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
      if (img.hasAttribute('data-deferred-image')) {
        // Keep initial network priority, but activate the visitor's latest selection after load.
        img.dataset.deferredSrcset = v.srcset;
        img.dataset.deferredSrc = v.src;
      } else {
        img.srcset = v.srcset;
        img.src = v.src;
      }
      img.alt = v.alt;
      if (pill) setText(pill.querySelector('.pill-t') || pill, v.label);
      if (state) setText(state, v.state);
    });
  }

  // the walk-in twin loads only when asked (about 1.5 MB); the page shows its label and notice above the frame
  for (const btn of $$('[data-twin-open]')) {
    btn.addEventListener('click', () => {
      const box = btn.closest('[data-twin]');
      const f = document.createElement('iframe');
      f.src = box.dataset.src;
      f.title = isBM ? 'Model interaktif berskala Demonstration project' : 'Demonstration project interactive to-scale model';
      f.setAttribute('allow', 'fullscreen');
      f.setAttribute('allowfullscreen', '');
      box.querySelector('.twin-cta').remove();
      box.appendChild(f);
      f.addEventListener('load', () => {
        const doc = f.contentDocument;
        if (!doc) return;
        // Curated entries open inside the viewer itself, with its state-aware
        // camera and lens. Legacy embeds still start outside, as per plan.
        const initialState = ['a', 'b', 'c'].includes(box.dataset.initialState) ? box.dataset.initialState : 'a';
        const initialViews = { a: ['shell'], b: ['aisle'], c: ['assembly'] };
        const initialView = initialViews[initialState].includes(box.dataset.initialView) ? box.dataset.initialView : null;
        const started = performance.now();
        const initialize = () => {
          const orbit = doc.getElementById('mode-orbit');
          const openingState = doc.querySelector(`.seg-b[data-state="${initialState}"]`);
          const people = doc.querySelector('[data-id="people"]');
          // Shader warmup applies the model's default state after its controls exist.
          // Wait for completion so it cannot overwrite the opening or a queued shortcut.
          if (!f.contentWindow?.__factory?.ready || !orbit || !openingState || !people) {
            if (performance.now() - started < 90000) setTimeout(initialize, 100);
            return;
          }
          const runtime = f.contentWindow.__factory;
          // openingView is the viewer's validated, actually applied URL opening,
          // not an arbitrary URL value. Resetting Orbit here would discard its
          // first-person pose and aspect-aware lens. Unknown/mismatched openings
          // retain the safe legacy initialization through the viewer's controls.
          const curatedOpening = initialView && runtime.openingView === initialView && runtime.state === initialState;
          if (!curatedOpening) {
            orbit.click();
            openingState.click();
          }
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
    const preferred = isBM ? panels.findIndex(panel => panel?.lang === 'ms') : 0;
    select(preferred < 0 ? 0 : preferred);
  }
})();

// v2 navigation, accessible demo/property tabs and lightweight scroll reveals.
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  // Language/help controls change the sticky header's height, including after module mount.
  const header = document.querySelector('.top');
  if (header) {
    const syncHeaderHeight = () => document.documentElement.style.setProperty('--site-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
    syncHeaderHeight();
    if ('ResizeObserver' in window) new ResizeObserver(syncHeaderHeight).observe(header);
    else window.addEventListener('resize', syncHeaderHeight);
  }
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
  for (const link of document.querySelectorAll('[data-open-demo], [data-demo-entry]')) link.addEventListener('click', e => {
    e.preventDefault(); const value = link.dataset.openDemo || link.dataset.demoEntry;
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
    note.textContent = isBM ? 'Membuka model 3D…' : 'Opening the 3D model…';
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
    for (const t of toggles) { t.toggleAttribute('data-paused', paused); t.querySelector('[data-motion-label]').textContent = isBM ? (paused ? 'Mainkan animasi' : 'Jeda animasi') : (paused ? 'Play motion' : 'Pause motion'); }
    updateAll();
  });
  reduced.addEventListener('change', updateAll);
  // Preferences can change while the page is open: low data (where supported) and Save-Data stop the clips as reduced
  // motion does. Leaving the page pauses them; a page restored from the back/forward cache checks again.
  lowData.addEventListener?.('change', updateAll);
  navigator.connection?.addEventListener?.('change', updateAll);
  window.addEventListener('pagehide', () => { for (const figure of figures) { const video = figure.querySelector('video'); if (!video.paused) video.pause(); } });
  window.addEventListener('pageshow', event => { if (event.persisted) updateAll(); });
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

// The mobile help row can grow the header after the browser's first fragment jump. Align that arrival once after
// load and fonts, using the rendered header height rather than waiting for ResizeObserver. Never pull a visitor back
// after they start interacting or choose another fragment. Smooth scrolling starts only after this instant correction.
(() => {
  const initialHash = location.hash;
  let interrupted = false;
  const interrupt = () => { interrupted = true; };
  const inputEvents = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
  if (initialHash) inputEvents.forEach(type => addEventListener(type, interrupt, { passive: true, once: true }));
  afterLoadFrame(async () => {
    if (initialHash) {
      await (document.fonts?.ready || Promise.resolve());
      await new Promise(resolve => requestAnimationFrame(resolve));
      if (!interrupted && location.hash === initialHash) {
        let target;
        try { target = document.getElementById(decodeURIComponent(initialHash.slice(1)));
          // A demo arrival should include its controls, rather than tuck the tabs behind the sticky header.
          if (/^#demo-(compare|twin|film)$/.test(initialHash)) target = document.querySelector('.demo-toolbar') || target; } catch { /* malformed fragment */ }
        if (target) {
          const header = document.querySelector('.top');
          if (header) document.documentElement.style.setProperty('--site-header-height', `${Math.ceil(header.getBoundingClientRect().height)}px`);
          target.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      }
      inputEvents.forEach(type => removeEventListener(type, interrupt));
    }
    document.documentElement.classList.add('smooth-scroll');
  });
})();

// Category viewers load on explicit request; no background WebGL instances.
for (const button of document.querySelectorAll('[data-category-open]')) {
 button.addEventListener('click',()=>{
  const box=button.closest('[data-category-demo]');
  if(box.querySelector('iframe')) return;
  const src=new URL(button.dataset.categoryOpen,document.baseURI);
  src.searchParams.set('lang',document.documentElement.lang==='ms'?'ms':'en');
  const frame=document.createElement('iframe');frame.src=src.href;
  frame.title=document.documentElement.lang==='ms'?'Demo konsep 3D interaktif':'Interactive original 3D concept demo';
  frame.setAttribute('allow','fullscreen');frame.setAttribute('loading','lazy');
  box.replaceChildren(frame);frame.focus();
 });
}

// Preserve links shared before the sales homepage moved its working demo to Industrial.
if (document.body.dataset.page === 'index' && /^#demo-(compare|twin|film)$/.test(location.hash)) {
  const target = document.documentElement.lang === 'ms' ? 'ms-industrial.html' : 'industrial.html';
  location.replace(target + location.search + location.hash);
}
// A direct link to a technical process stage still opens that stage after the details are collapsed.
function revealLinkedProcess() {
  if (!location.hash) return;
  let id;
  try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
  const element = document.getElementById(id);
  const detail = element?.closest('details.process-detail');
  if (detail && !detail.open) {
    detail.open = true;
    requestAnimationFrame(() => element.scrollIntoView({block:'start',behavior:'instant'}));
  }
}
revealLinkedProcess();
window.addEventListener('hashchange', revealLinkedProcess);

// Idyra Signal media rails (26 Oct 2026; playback rules from root's prelaunch review, 27 Oct). A card is poster-first:
// its muted film has no source until it is chosen to play. At most one preview plays at a time: the card the visitor
// last started with its play control, else the card they hover or focus, else the most visible card once it fills
// most of its box. Nothing plays in a hidden tab or off screen, however it started; a preview the visitor started
// resumes when it comes back into view, and one they paused stays paused; after a pause, scrolling no longer starts
// previews (hover and focus still do). Reduced motion and Save-Data stop every automatic start (hover, focus and
// scrolling), also when either changes while the page is open; the play control still works. Every card shows that control.
(() => {
  const cards = [...document.querySelectorAll('[data-sg-film]')];
  if (cards.length) {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const lowData = window.matchMedia('(prefers-reduced-data: reduce)');
    const saveData = () => !!(navigator.connection && navigator.connection.saveData) || lowData.matches;
    const tabVisible = () => document.visibilityState !== 'hidden';
    let measured = false, quiet = false; // measured: visibility data exists; quiet: the visitor paused a preview
    const autoAllowed = () => measured && !reduced.matches && !saveData() && tabVisible();
    const label = playing => isBM ? (playing ? 'Jeda pratonton' : 'Mainkan pratonton senyap') : (playing ? 'Pause the preview' : 'Play the muted preview');
    const videoOf = card => card.querySelector(':scope > .sg-media > video[data-sg-src], :scope > .sg-project-media > video[data-sg-src], :scope > .sg-banner-media > video[data-sg-src]') || card.querySelector('video[data-sg-src]');
    const state = new Map(cards.map(card => [card, { hover: false, ratio: 0, manual: null, manualAt: 0 }]));
    let clock = 0;
    const setPlaying = (card, playing) => {
      card.classList.toggle('is-playing', playing);
      const button = card.querySelector('[data-sg-play]');
      if (button) { button.setAttribute('aria-pressed', String(playing)); button.setAttribute('aria-label', label(playing)); }
    };
    const choose = () => {
      if (!tabVisible()) return null;
      const visible = cards.filter(card => state.get(card).ratio > 0 && videoOf(card));
      const started = visible.filter(card => state.get(card).manual === true).sort((a, b) => state.get(b).manualAt - state.get(a).manualAt)[0];
      if (started) return started;
      if (!autoAllowed()) return null;
      const hovered = visible.find(card => state.get(card).hover && state.get(card).manual !== false);
      if (hovered) return hovered;
      if (quiet) return null;
      let best = null, bestRatio = .6;
      for (const card of visible) { const s = state.get(card); if (s.manual !== false && s.ratio > bestRatio) { best = card; bestRatio = s.ratio; } }
      return best;
    };
    const apply = () => {
      const active = choose();
      for (const card of cards) {
        const video = videoOf(card);
        if (!video) continue;
        if (card === active) {
          if (!video.getAttribute('src')) video.src = video.dataset.sgSrc;
          const playing = video.play();
          if (playing) playing.catch(() => setPlaying(card, false));
        } else {
          if (!video.paused) video.pause();
          setPlaying(card, false);
        }
      }
    };
    for (const card of cards) {
      const video = videoOf(card), button = card.querySelector('[data-sg-play]'), s = state.get(card);
      if (!video) continue;
      video.addEventListener('playing', () => { if (choose() === card) setPlaying(card, true); else video.pause(); });
      video.addEventListener('pause', () => setPlaying(card, false));
      card.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { s.hover = true; apply(); } });
      card.addEventListener('pointerleave', () => { s.hover = false; apply(); });
      card.addEventListener('focusin', () => { s.hover = true; apply(); });
      card.addEventListener('focusout', e => { if (!card.contains(e.relatedTarget)) { s.hover = false; apply(); } });
      if (button) {
        button.hidden = false; button.setAttribute('aria-label', label(false));
        button.addEventListener('click', () => {
          s.manual = !card.classList.contains('is-playing'); s.manualAt = ++clock;
          if (s.manual) { for (const other of cards) if (other !== card && state.get(other).manual === true) state.get(other).manual = null; }
          else quiet = true;
          apply();
        });
      }
    }
    reduced.addEventListener('change', apply);
    lowData.addEventListener?.('change', apply);
    navigator.connection?.addEventListener?.('change', apply);
    document.addEventListener('visibilitychange', apply);
    window.addEventListener('pagehide', () => { for (const card of cards) { const video = videoOf(card); if (video && !video.paused) video.pause(); } });
    window.addEventListener('pageshow', event => { if (event.persisted) apply(); });
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => {
        for (const entry of entries) state.get(entry.target).ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
        apply();
      }, { threshold: [0, .01, .25, .5, .6, .75, .9, 1] });
      afterLoadFrame(() => { measured = true; cards.forEach(card => observer.observe(card)); });
    } else for (const s of state.values()) s.ratio = 1; // without visibility data, only the play control starts a preview
  }
  // Films with their own controls (studio, process and industrial films) never auto-start; once a visitor plays one,
  // it still pauses when it leaves the screen or the tab is hidden. The visitor resumes it.
  const controlled = [...document.querySelectorAll('video[controls]')];
  if (controlled.length) {
    const pauseAll = () => { if (document.visibilityState === 'hidden') controlled.forEach(video => { if (!video.paused) video.pause(); }); };
    document.addEventListener('visibilitychange', pauseAll);
    if ('IntersectionObserver' in window) {
      const off = new IntersectionObserver(entries => entries.forEach(entry => { if (!entry.isIntersecting && !entry.target.paused) entry.target.pause(); }), { threshold: 0 });
      controlled.forEach(video => off.observe(video));
    }
  }
  // Mobile hero carousel dots: one per card, following the snapped card.
  for (const dots of document.querySelectorAll('[data-sg-dots-for]')) {
    const rail = document.getElementById(dots.dataset.sgDotsFor);
    if (!rail) continue;
    const items = [...rail.children];
    dots.replaceChildren(...items.map(() => document.createElement('span')));
    const sync = () => {
      const index = Math.round(rail.scrollLeft / Math.max(1, items[0]?.getBoundingClientRect().width + 12));
      [...dots.children].forEach((dot, i) => dot.classList.toggle('is-active', i === Math.min(index, items.length - 1)));
    };
    sync(); rail.addEventListener('scroll', sync, { passive: true }); window.addEventListener('resize', sync);
  }
  // Active state for the current route in the top bar and the mobile tab bar.
  const path = typeof location === 'object' && typeof location?.pathname === 'string' ? location.pathname : '';
  const here = path.split('/').pop().replace(/^ms-/, '') || 'index.html';
  for (const a of document.querySelectorAll('.nav a, .sg-tabbar a')) {
    const target = (a.getAttribute('href') || '').split(/[?#]/)[0].replace(/^ms-/, '');
    if (target && target === here) a.setAttribute('aria-current', 'page');
  }
  // Sub-tab bars on inner pages: the tab whose section is in view is the active one.
  const tabs = [...document.querySelectorAll('.jump a[href^="#"], .project-nav a[href^="#"], .sp-route a[href^="#"]')];
  if (tabs.length && 'IntersectionObserver' in window) {
    const targets = tabs.map(a => document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)))).filter(Boolean);
    const setActive = id => tabs.forEach(a => { if (a.getAttribute('href') === `#${id}`) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    if (targets[0]) setActive(targets[0].id);
    const spy = new IntersectionObserver(entries => { const hit = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]; if (hit) setActive(hit.target.id); }, { rootMargin: '-40% 0px -50% 0px' });
    targets.forEach(t => spy.observe(t));
    tabs.forEach(a => a.addEventListener('click', () => setActive(a.getAttribute('href').slice(1))));
  }
  // Live budget estimator: every state is authored in the HTML; this only chooses which to show.
  for (const est of document.querySelectorAll('[data-estimator]')) {
    const chips = [...est.querySelectorAll('[data-area]')], range = est.querySelector('[data-area-range]');
    const num = est.querySelector('[data-area-num]'), units = [...est.querySelectorAll('[data-area-unit]')], unitToggle = est.querySelector('[data-unit-toggle]');
    const types = [...est.querySelectorAll('input[name$="-type"]')], pkgs = [...est.querySelectorAll('input[name$="-pkg"]')];
    const reason = est.querySelector('[data-est-reason]'), showroom = pkgs.find(i => i.value === 'showroom');
    let area = 10000, unit = 'sqft';
    const fmt = n => n.toLocaleString('en-MY');
    const readout = () => {
      const value = unit === 'm2' ? Math.round(area * 0.092903) : area;
      if (num) num.textContent = fmt(value);
      for (const u of units) u.hidden = u.dataset.areaUnit !== unit;
      if (range) range.setAttribute('aria-valuetext', `${fmt(value)} ${unit === 'm2' ? 'm²' : 'sq ft'}`);
    };
    const render = () => {
      const type = types.find(i => i.checked)?.value || 'industrial';
      const commercial = type === 'commercial';
      if (showroom) { showroom.disabled = commercial; if (commercial && showroom.checked) { showroom.checked = false; pkgs.find(i => i.value === 'plan-twin').checked = true; } }
      if (reason) reason.hidden = !commercial;
      const pkg = pkgs.find(i => i.checked)?.value || 'plan-twin';
      const band = pkg === 'plan-twin' ? (area <= 25000 ? 'plan-twin-25k' : 'plan-twin-over') : (area <= 25000 ? 'showroom-25k' : area <= 80000 ? 'showroom-80k' : 'showroom-over');
      for (const el of est.querySelectorAll('[data-est-band]')) el.hidden = el.dataset.estBand !== band;
      for (const el of est.querySelectorAll('[data-est-includes]')) el.hidden = el.dataset.estIncludes !== pkg;
      for (const chip of chips) chip.setAttribute('aria-pressed', String(Number(chip.dataset.area) === area));
      readout();
    };
    for (const chip of chips) chip.addEventListener('click', () => { area = Number(chip.dataset.area); if (range) range.value = String(area); render(); });
    if (range) range.addEventListener('input', () => { area = Number(range.value); render(); });
    if (unitToggle) unitToggle.addEventListener('click', () => { unit = unit === 'sqft' ? 'm2' : 'sqft'; unitToggle.setAttribute('aria-pressed', String(unit === 'm2')); for (const w of unitToggle.querySelectorAll('[data-when-unit]')) w.hidden = w.dataset.whenUnit !== unit; readout(); });
    for (const input of [...types, ...pkgs]) input.addEventListener('change', render);
    render();
  }
  // The four-step process line draws itself once seen (CSS keeps it complete with reduced motion).
  const steps = document.querySelector('[data-sg-steps]');
  if (steps && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { steps.classList.add('is-seen'); io.disconnect(); } }), { threshold: .3 });
    io.observe(steps);
  } else if (steps) steps.classList.add('is-seen');
})();
