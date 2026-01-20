/* vINKo language routing & persistence
   - Paste this at the END of main.js (recommended)
   - Or save as lang.js and include it on every page BEFORE main.js.
*/
(function () {
  'use strict';

  const LANG_KEY = 'vinko_lang';

  // Spanish -> English page mapping (add more as you translate more pages)
  const ES_TO_EN = {
    'index.html': 'en.html',
    'vk0.html': 'en-vk0.html',
    'system.html': 'en-system.html',
    'faq.html': 'en-faq.html',
    'lista.html': 'en-lista.html',

    // legacy / typos used in some footers
    'vINKoSystem.html': 'en-system.html',

    // optional (create these files when ready)
    'sobre-mi.html': 'en-sobre-mi.html',
  };

  const EN_TO_ES = Object.fromEntries(
    Object.entries(ES_TO_EN)
      .filter(([, en]) => en && en.endsWith('.html'))
      .map(([es, en]) => [en, es])
  );

  const isExternal = (href) => /^(https?:)?\/\//i.test(href);
  const isSpecial = (href) => /^(mailto:|tel:|sms:)/i.test(href);

  const getFile = () => {
    const p = window.location.pathname;
    const file = p.split('/').pop();
    return file && file.length ? file : 'index.html';
  };

  const langFromFile = (file) => (file === 'en.html' || file.startsWith('en-')) ? 'en' : 'es';

  const getLang = () => {
    try { return localStorage.getItem(LANG_KEY) || null; } catch { return null; }
  };

  const setLang = (lang) => {
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
  };

  const mapToLang = (file, lang) => {
    if (lang === 'en') return ES_TO_EN[file] || (file === 'index.html' ? 'en.html' : null);
    return EN_TO_ES[file] || (file === 'en.html' ? 'index.html' : null);
  };

  // 1) Persist language + redirect if user is on the wrong-language page
  (function enforceLanguage() {
    const file = getFile();
    const currentLang = langFromFile(file);
    const stored = getLang();

    if (!stored) {
      setLang(currentLang);
      return;
    }

    if (stored !== currentLang) {
      const target = mapToLang(file, stored);
      if (target) {
        const qs = window.location.search || '';
        const hash = window.location.hash || '';
        // Keep query/hash
        window.location.replace(target + qs + hash);
      }
    }
  })();

  // Helpers to rewrite hrefs while preserving ?query and #hash
  const splitHref = (href) => {
    const [beforeHash, hashPart] = href.split('#');
    const hash = hashPart ? '#' + hashPart : '';
    const [pathPart, queryPart] = beforeHash.split('?');
    const query = queryPart ? '?' + queryPart : '';
    return { path: pathPart, query, hash };
  };

  const rewriteInternalLinks = () => {
    const lang = getLang() || 'es';

    document.querySelectorAll('a[href]').forEach(a => {
      const raw = a.getAttribute('href');
      if (!raw) return;
      if (raw.startsWith('#')) return;
      if (isExternal(raw) || isSpecial(raw)) return;

      const { path, query, hash } = splitHref(raw);

      // Ignore root-absolute routes like /privacy.html (you can add EN versions later)
      if (path.startsWith('/')) return;

      const base = path || 'index.html';
      const mapped = mapToLang(base, lang);
      if (!mapped) return;

      const next = mapped + query + hash;
      if (next !== raw) a.setAttribute('href', next);
    });
  };

  const setupLangSwitch = () => {
    document.querySelectorAll('.lang-switch a.lang').forEach(link => {
      link.addEventListener('click', (e) => {
        const codeEl = link.querySelector('.code');
        const code = (codeEl ? codeEl.textContent : link.textContent || '').trim().toLowerCase();
        const desired = code === 'en' ? 'en' : (code === 'es' ? 'es' : null);
        if (!desired) return;

        e.preventDefault();
        setLang(desired);

        const file = getFile();
        const target = mapToLang(file, desired) || (desired === 'en' ? 'en.html' : 'index.html');
        const hash = window.location.hash || '';
        window.location.href = target + hash;
      }, { passive: false });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    rewriteInternalLinks();
    setupLangSwitch();
  });
})();
