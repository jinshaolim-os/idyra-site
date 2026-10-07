// Language preference only. No analytics, geolocation or network lookup.
(() => {
  const links = [...document.querySelectorAll('[data-site-language]')];
  if (!links.length) return;
  const current = document.documentElement.lang === 'ms' ? 'ms' : 'en';
  const key = 'idyra.language';
  const valid = value => ['en', 'ms'].includes(value) ? value : null;
  const remember = value => { try { localStorage.setItem(key, value); } catch {} };
  const url = new URL(location.href);
  const explicit = valid(url.searchParams.get('lang'));
  let saved = null;
  try { saved = valid(localStorage.getItem(key)); } catch {}
  // A direct BM page or explicit language link takes priority over a saved preference.
  const preferred = explicit || (current === 'ms' ? 'ms' : saved) || (/^ms\b/i.test(navigator.language || '') ? 'ms' : 'en');
  if (explicit || current === 'ms') remember(preferred);
  const targetFor = lang => {
    const link = links.find(link => link.dataset.siteLanguage === lang);
    if (!link) return null;
    const target = new URL(link.href);
    for (const [name, value] of url.searchParams) if (name !== 'lang') target.searchParams.set(name, value);
    target.hash = url.hash;
    return target;
  };
  for (const link of links) {
    const target = targetFor(link.dataset.siteLanguage);
    if (target) link.href = target.href;
    link.addEventListener('click', () => remember(link.dataset.siteLanguage));
  }
  if (preferred !== current) {
    const target = targetFor(preferred);
    if (target && target.origin === location.origin) location.replace(target.href);
  }
})();
