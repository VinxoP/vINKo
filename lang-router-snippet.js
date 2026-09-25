/* Vinko language routing & persistence (copia standalone del bloque 11 de main.js)
   Usar solo en páginas que NO cargan main.js. Mantener sincronizado con main.js. */
(function () {
  'use strict';
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const LANG = (document.documentElement.lang || 'es').slice(0, 2).toLowerCase();
  // ---------- 11. Language Router ----------
  // Persiste el idioma en localStorage (vinko_lang), redirige al equivalente
  // y reescribe los links internos. Copia standalone en lang-router-snippet.js
  const LANG_KEY = 'vinko_lang';
  const ES_TO_EN = {
    'index.html': 'en.html',
    'vk0.html': 'en-vk0.html',
    'system.html': 'en-system.html',
    'piloto.html': 'en-pilot.html',
    'faq.html': 'en-faq.html',
    'lista.html': 'en-lista.html',
    'sobre-mi.html': 'en-sobre-mi.html',
    'privacy.html': 'privacy-en.html',
    'cookies.html': 'cookies-en.html',
  };
  const EN_TO_ES = Object.fromEntries(Object.entries(ES_TO_EN).map(([es, en]) => [en, es]));
  const isExternal = (href) => /^(https?:)?\/\//i.test(href);
  const isSpecial = (href) => /^(mailto:|tel:|sms:|javascript:)/i.test(href);
  const getFile = () => { const f = window.location.pathname.split('/').pop(); return f && f.length ? f : 'index.html'; };
  const langFromFile = (file) => (file === 'en.html' || file.startsWith('en-') || file.endsWith('-en.html')) ? 'en' : 'es';
  const getLang = () => { try { return localStorage.getItem(LANG_KEY) || null; } catch { return null; } };
  const setLang = (l) => { try { localStorage.setItem(LANG_KEY, l); } catch { /* sin storage */ } };
  const mapToLang = (file, lang) => (lang === 'en' ? (ES_TO_EN[file] || (EN_TO_ES[file] ? file : null)) : (EN_TO_ES[file] || (ES_TO_EN[file] ? file : null)));

  (function enforceLanguage() {
    const file = getFile();
    const current = langFromFile(file);
    const stored = getLang();
    if (!stored) { setLang(current); return; }
    if (stored !== current) {
      const target = mapToLang(file, stored);
      if (target && target !== file) window.location.replace(target + window.location.search + window.location.hash);
    }
  })();

  document.addEventListener('DOMContentLoaded', () => {
    const lang = getLang() || LANG;
    $$('a[href]').forEach((a) => {
      const raw = a.getAttribute('href');
      if (!raw || raw.startsWith('#') || isExternal(raw) || isSpecial(raw) || a.hasAttribute('data-lang')) return;
      const m = raw.match(/^([^?#]*)(\?[^#]*)?(#.*)?$/);
      const path = m[1];
      if (path.startsWith('/')) return;
      const mapped = mapToLang(path || getFile(), lang);
      if (mapped && path && mapped !== path) a.setAttribute('href', mapped + (m[2] || '') + (m[3] || ''));
    });

    $$('a[data-lang]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const desired = link.dataset.lang;
        e.preventDefault();
        setLang(desired);
        const target = mapToLang(getFile(), desired) || (desired === 'en' ? 'en.html' : 'index.html');
        window.location.href = target + window.location.hash;
      });
    });
  });
})();
