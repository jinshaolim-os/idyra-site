// Founder direction: English-only public experience. Legacy aliases preserve their destination.
// Translation catalogues remain in source; no browser language or saved choice switches the public UI.
(() => {
  document.documentElement.lang = 'en';
  const url = new URL(location.href);
  const previous = url.href;
  const demo = /\/assets\/demos\/(?:home|merchant|industrial)\/index\.html$/.test(url.pathname);
  url.pathname = url.pathname.replace(/\/ms-([^/]+\.html)$/, '/$1').replace(/\/privasi\.html$/, '/privacy.html');
  if (url.searchParams.has('lang') || demo) url.searchParams.set('lang', 'en');
  if (url.pathname.endsWith('/privacy.html') && url.hash === '#bm') url.hash = '#pv-en-h';
  try { localStorage.setItem('idyra.language', 'en'); } catch {}
  if (url.href !== previous) {
    if (demo) history.replaceState(history.state, '', url.href);
    else location.replace(url.href);
  }
})();
