// idyra.ai: small progressive enhancements. Every page reads fully without this script.
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
      pill.textContent = v.label;
      if (state) state.textContent = v.state;
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
      f.focus();
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
