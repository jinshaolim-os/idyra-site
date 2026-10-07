// Idyra's prepared service FAQ, not a generative or live-chat backend.
// Build: copy this module + help.css; resolve help.json's {{site.json.keys}} into help-data.json.
// <script type="module" src="assets/help.js" data-help-data="assets/help-data.json"></script>
// data-help-data resolves against the document; without it, help-data.json is beside this module.
// Only that same-origin dataset is fetched, on first open. Typed text is never sent or persisted.

export function normalizeHelpQuestion(value) {
  return String(value ?? '').slice(0, 500).normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

/** Conservative topic lookup. Results identify published topics; they are not generated answers. */
export function matchHelpQuestion(question, topics = [], limit = 3) {
  const q = normalizeHelpQuestion(question);
  if (!q) return [];
  const contains = term => (` ${q} `).includes(` ${normalizeHelpQuestion(term)} `);
  // Never let an out-of-scope live-operations question turn into an apparent price offer.
  if (['cctv', 'iot', 'sensor', 'sensors', 'real time', 'realtime', 'live monitoring', 'pemantauan',
    'simulation', 'simulations', 'simulate', 'simulating', 'simulasi', 'worker tracking', 'workers tracking',
    'employee tracking', 'employees tracking', 'staff monitoring', 'staff tracking', 'tracking workers',
    'tracking employees', 'monitoring staff'].some(contains)) {
    return topics.some(t => t.id === 'limits') ? [{ id: 'limits', score: 100 }] : [];
  }
  const broadTerms = new Set(['plan twin', 'showroom', 'digital twin', 'package', 'packages', 'pakej']);
  return topics.map((topic, index) => {
    let score = 0;
    const seen = new Set();
    for (const [weight, terms] of [[4, topic.keywords?.strong || []], [1, topic.keywords?.normal || []]]) {
      for (const term of terms) {
        const key = normalizeHelpQuestion(term);
        if (!key || seen.has(key) || !contains(key)) continue;
        seen.add(key);
        score += broadTerms.has(key) ? 3 : weight + (weight > 1 && key.includes(' ') ? 2 : 0);
      }
    }
    return { id: topic.id, score, index };
  }).filter(t => t.score >= 3).sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(0, Math.min(3, limit))).map(({ id, score }) => ({ id, score }));
}

const language = value => /^(ms|bm)(?:-|$)/i.test(value || '') ? 'ms' : 'en';
const BOOT = {
  en: { title: 'Idyra Help', close: 'Close help', loading: 'Loading published answers…', error: "The answers couldn't be loaded. You can still contact our team.", retry: 'Try loading again', contact: 'Contact Idyra', whatsapp: 'Ask our team on WhatsApp', reply: 'Our team personally reviews enquiries and replies the same working day.' },
  ms: { title: 'Bantuan Idyra', close: 'Tutup bantuan', loading: 'Memuatkan jawapan yang diterbitkan…', error: 'Jawapan tidak dapat dimuatkan. Anda masih boleh menghubungi pasukan kami.', retry: 'Cuba muatkan semula', contact: 'Hubungi Idyra', whatsapp: 'Tanya pasukan kami di WhatsApp', reply: 'Pasukan kami menyemak sendiri pertanyaan dan membalas pada hari bekerja yang sama.' },
};

function mountHelp() {
  if (document.getElementById('idyra-help')) return;
  const script = document.querySelector('script[data-help-data]');
  const dataURL = script?.getAttribute('data-help-data')
    ? new URL(script.getAttribute('data-help-data'), document.baseURI)
    : new URL('help-data.json', import.meta.url);
  const el = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  };
  const button = (cls, text) => { const b = el('button', cls, text); b.type = 'button'; return b; };
  let lang = language(document.documentElement.lang), data = null, loading = null, failed = false;
  let selected = null, related = [], statusKey = '', previousFocus = null;
  const text = key => data?.ui?.[lang]?.[key] || BOOT[lang][key] || '';
  // Translate the unit, not the number: both delivery values still come from site.json at build time.
  const localText = value => lang === 'ms' ? String(value).replace(/\bworking days\b/gi, 'hari bekerja') : String(value);
  const root = el('div', 'idyra-help'); root.id = 'idyra-help';
  const launcher = button('idyra-help-launcher');
  launcher.setAttribute('aria-haspopup', 'dialog'); launcher.setAttribute('aria-controls', 'idyra-help-panel'); launcher.setAttribute('aria-expanded', 'false');
  const mark = el('span', 'idyra-help-mark', '?'); mark.setAttribute('aria-hidden', 'true');
  const launchLabel = el('span'); launcher.append(mark, launchLabel);
  const panel = el('dialog', 'idyra-help-panel'); panel.id = 'idyra-help-panel';
  panel.setAttribute('aria-labelledby', 'idyra-help-title'); panel.setAttribute('aria-modal', 'true');
  const header = el('div', 'idyra-help-header');
  const title = el('h2'); title.id = 'idyra-help-title';
  const close = button('idyra-help-close', '×'); header.append(title, close);
  const body = el('div', 'idyra-help-body');
  const intro = el('p', 'idyra-help-intro');
  const status = el('p', 'idyra-help-status'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const retry = button('idyra-help-retry'); retry.hidden = true;
  const contents = el('div'); contents.hidden = true;
  const topicsTitle = el('h3', 'idyra-help-label'); topicsTitle.id = 'idyra-help-topics-title';
  const topicButtons = el('div', 'idyra-help-topics'); topicButtons.setAttribute('role', 'group'); topicButtons.setAttribute('aria-labelledby', topicsTitle.id);
  const form = el('form', 'idyra-help-form');
  const questionLabel = el('label', 'idyra-help-label'); questionLabel.htmlFor = 'idyra-help-question';
  const question = el('input', 'idyra-help-question'); question.id = 'idyra-help-question'; question.type = 'text'; question.maxLength = 300;
  question.autocomplete = 'off'; question.setAttribute('aria-describedby', 'idyra-help-privacy');
  const ask = el('button', 'idyra-help-ask'); ask.type = 'submit';
  const privacy = el('p', 'idyra-help-note'); privacy.id = 'idyra-help-privacy';
  form.append(questionLabel, question, ask, privacy);
  const answer = el('section', 'idyra-help-answer'); answer.hidden = true; answer.setAttribute('aria-labelledby', 'idyra-help-answer-title');
  const answerTitle = el('h3'); answerTitle.id = 'idyra-help-answer-title'; answerTitle.tabIndex = -1;
  const answerBody = el('div');
  const source = el('a', 'idyra-help-source');
  answer.append(answerTitle, answerBody, source);
  const relatedBox = el('div', 'idyra-help-related'); relatedBox.hidden = true;
  const relatedTitle = el('p', 'idyra-help-label');
  const relatedButtons = el('div', 'idyra-help-topics'); relatedBox.append(relatedTitle, relatedButtons);
  contents.append(form, answer, relatedBox, topicsTitle, topicButtons);
  body.append(intro, status, retry, contents);
  const footer = el('div', 'idyra-help-footer');
  const wa = el('a', 'idyra-help-wa'); wa.target = '_blank'; wa.rel = 'noopener noreferrer';
  const reply = el('p', 'idyra-help-reply');
  const handoffNote = el('p', 'idyra-help-note');
  footer.append(wa, reply, handoffNote);
  panel.append(header, body, footer); root.append(launcher, panel); document.body.append(root);

  // On phones/tablets the launcher occupies its own header row, so it cannot cover demo or page controls.
  // Only the button moves: the modal stays under body, outside the sticky header's stacking/clipping context.
  const mobileLauncher = matchMedia('(max-width: 800px)');
  function placeLauncher() {
    const top = document.querySelector('.top');
    const inHeader = mobileLauncher.matches && !!top;
    const target = inHeader ? top : root;
    const hadFocus = document.activeElement === launcher;
    launcher.classList.toggle('idyra-help-launcher--header', inHeader);
    if (launcher.parentElement !== target) {
      const row = inHeader && top.querySelector('.top-in');
      if (row) row.insertAdjacentElement('afterend', launcher);
      else if (inHeader) top.append(launcher);
      else root.insertBefore(launcher, panel);
      if (hadFocus && !panel.open) launcher.focus({ preventScroll: true });
    }
  }
  placeLauncher();
  mobileLauncher.addEventListener('change', placeLauncher);

  const safeLocalLink = value => {
    if (typeof value !== 'string' || !value.trim()) return null;
    try { const u = new URL(value, document.baseURI); return u.origin === location.origin && /^https?:$/.test(u.protocol) ? u.href : null; }
    catch { return null; }
  };
  function handoff() {
    if (data) return `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(data.handoff[lang])}`;
    // If the dataset fails, reuse only the number from a reviewed existing page link, never visitor text.
    const existing = [...document.querySelectorAll('a[href]')].find(a => /^https:\/\/wa\.me\/\d{8,15}(?:\?|$)/.test(a.href));
    if (existing) return `https://wa.me/${new URL(existing.href).pathname.slice(1)}`;
    return lang === 'ms' ? 'ms-contact.html' : 'contact.html';
  }
  function topicButton(topic) {
    const b = button('idyra-help-topic', topic[lang].title);
    b.dataset.helpTopic = topic.id;
    b.setAttribute('aria-pressed', String(selected === topic.id));
    b.addEventListener('click', () => { selected = topic.id; related = []; statusKey = ''; render(); answerTitle.focus({ preventScroll: true }); answer.scrollIntoView({ block: 'nearest' }); });
    return b;
  }
  function render() {
    root.lang = panel.lang = launcher.lang = lang;
    launchLabel.textContent = title.textContent = text('title');
    close.setAttribute('aria-label', text('close'));
    intro.textContent = text('intro'); intro.hidden = !data;
    status.textContent = failed ? text('error') : loading ? text('loading') : text(statusKey);
    status.hidden = !status.textContent;
    retry.textContent = text('retry'); retry.hidden = !failed;
    wa.href = handoff(); wa.textContent = text(/^https:\/\/wa\.me\//.test(wa.href) ? 'whatsapp' : 'contact');
    reply.textContent = text('reply');
    handoffNote.textContent = data ? text('handoffNote') : ''; handoffNote.hidden = !data;
    contents.hidden = !data;
    if (!data) return;
    topicsTitle.textContent = text('topics');
    questionLabel.textContent = text('question'); question.placeholder = text('placeholder');
    ask.textContent = text('ask'); privacy.textContent = text('privacy');
    const activeTopic = document.activeElement?.dataset?.helpTopic;
    topicButtons.replaceChildren(...data.topics.map(topicButton));
    const topic = data.topics.find(t => t.id === selected);
    answer.hidden = !topic;
    if (topic) {
      answerTitle.textContent = topic[lang].title;
      answerBody.replaceChildren(...topic[lang].answer.map(line => el('p', '', localText(line))));
      const url = safeLocalLink(topic[lang].href); source.hidden = !url;
      if (url) source.href = url;
      source.textContent = text('readMore');
    } else { answerTitle.textContent = ''; answerBody.replaceChildren(); source.removeAttribute('href'); }
    const others = related.filter(id => id !== selected).map(id => data.topics.find(t => t.id === id)).filter(Boolean);
    relatedBox.hidden = !others.length;
    relatedTitle.textContent = text('suggested'); relatedButtons.replaceChildren(...others.map(topicButton));
    if (activeTopic) [...topicButtons.children, ...relatedButtons.children].find(b => b.dataset.helpTopic === activeTopic)?.focus({ preventScroll: true });
  }
  function validate(value) {
    if (value?.schemaVersion !== 1 || !/^\d{8,15}$/.test(value.whatsappNumber || '') || !Array.isArray(value.topics) || !value.topics.length || /\{\{[^}]*\}\}/.test(JSON.stringify(value))) throw new Error('Invalid help data');
    const keys = ['title', 'intro', 'topics', 'question', 'placeholder', 'ask', 'privacy', 'suggested', 'matched', 'noMatch', 'empty', 'readMore', 'whatsapp', 'reply', 'handoffNote', 'close', 'loading', 'error', 'retry', 'contact'];
    const ids = new Set();
    for (const l of ['en', 'ms']) {
      if (typeof value.handoff?.[l] !== 'string' || !keys.every(k => typeof value.ui?.[l]?.[k] === 'string')) throw new Error('Missing translation');
      for (const topic of value.topics) if (typeof topic[l]?.title !== 'string' || !Array.isArray(topic[l]?.answer) || !topic[l].answer.every(p => typeof p === 'string') || !safeLocalLink(topic[l]?.href)) throw new Error('Invalid topic');
    }
    for (const topic of value.topics) {
      if (!/^[a-z-]+$/.test(topic.id) || ids.has(topic.id)) throw new Error('Invalid topic id');
      ids.add(topic.id);
      for (const k of ['strong', 'normal']) if (!Array.isArray(topic.keywords?.[k]) || !topic.keywords[k].every(t => typeof t === 'string')) throw new Error('Invalid topic keywords');
    }
    return value;
  }
  async function load() {
    if (data || loading) return loading;
    failed = false;
    loading = (async () => {
      const abort = new AbortController(), timeout = setTimeout(() => abort.abort(), 10000);
      try {
        if (dataURL.origin !== location.origin || !/^https?:$/.test(dataURL.protocol)) throw new Error('Help data must be same-origin');
        const result = await fetch(dataURL.href, { credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'error', signal: abort.signal });
        if (!result.ok) throw new Error('Help data unavailable');
        data = validate(await result.json());
      } catch { failed = true; }
      finally { clearTimeout(timeout); }
    })();
    render();
    await loading; loading = null; render();
    if (panel.open && data && (document.activeElement === close || document.activeElement === panel || document.activeElement === retry)) question.focus({ preventScroll: true });
  }
  function open() {
    if (panel.open) return;
    previousFocus = document.activeElement;
    if (typeof panel.showModal !== 'function') { location.href = lang === 'ms' ? 'ms-contact.html' : 'contact.html'; return; }
    panel.showModal(); launcher.setAttribute('aria-expanded', 'true');
    (data ? question : close).focus({ preventScroll: true }); load();
  }
  function shut() { if (panel.open) panel.close(); }
  panel.addEventListener('close', () => {
    launcher.setAttribute('aria-expanded', 'false'); question.value = ''; selected = null; related = []; statusKey = ''; render();
    (previousFocus?.isConnected ? previousFocus : launcher).focus({ preventScroll: true });
  });
  panel.addEventListener('cancel', e => { e.preventDefault(); shut(); });
  panel.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); shut(); return; }
    if (e.key !== 'Tab') return;
    const nodes = [...panel.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), [tabindex="0"]')].filter(n => n.getClientRects().length);
    const first = nodes[0], last = nodes[nodes.length - 1];
    const outside = document.activeElement === panel || !panel.contains(document.activeElement);
    if (!first) { e.preventDefault(); panel.focus(); }
    else if (e.shiftKey && (document.activeElement === first || outside)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || outside)) { e.preventDefault(); first.focus(); }
  });
  panel.addEventListener('pointerdown', e => {
    if (e.target !== panel) return;
    const r = panel.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) shut();
  });
  launcher.addEventListener('click', open); close.addEventListener('click', shut); retry.addEventListener('click', load);
  form.addEventListener('submit', e => {
    e.preventDefault(); if (!data) return;
    const matches = matchHelpQuestion(question.value, data.topics);
    selected = matches[0]?.id || null; related = matches.map(m => m.id);
    statusKey = !question.value.trim() ? 'empty' : selected ? 'matched' : 'noMatch';
    render();
    if (selected) { answerTitle.focus({ preventScroll: true }); answer.scrollIntoView({ block: 'nearest' }); }
  });
  function changeLanguage(value) { lang = language(value); render(); }
  new MutationObserver(() => changeLanguage(document.documentElement.lang)).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  // Capture also hears document-dispatched events even when callers leave bubbles:false (the default).
  window.addEventListener('idyra:language', e => changeLanguage(typeof e.detail === 'string' ? e.detail : e.detail?.lang || e.detail?.language || document.documentElement.lang), { capture: true });
  render();
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountHelp, { once: true });
  else mountHelp();
}
