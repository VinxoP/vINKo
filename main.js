/* =========================================================
   vINKo System — main.js (rediseño 2026)
   Vanilla JS, sin dependencias.
   Bloques:
     1. Utilidades
     2. Header + menú móvil
     3. Reveal on scroll
     4. Vídeos (autoplay en vista)
     5. Carga de secuencias de fotogramas
     6. Scroll-scrub Canvas (despiece / montaje)
     7. Explorador de piezas (hotspots)
     8. Visor 360°
     9. Pestañas (comparativa)
    10. Formulario lista de espera / piloto
    11. Language Router
   ========================================================= */

(() => {
  'use strict';

  // ---------- 1. Utilidades ----------
  const root = document.documentElement;
  root.classList.remove('no-js');
  const LANG = (root.lang || 'es').slice(0, 2).toLowerCase();
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = () => window.matchMedia('(max-width: 720px)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smoothstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const pad4 = (n) => String(n).padStart(4, '0');
  const onReady = (fn) => (document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn());

  const whenNear = (el, cb, margin = '600px') => {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); cb(); }
    }, { rootMargin: margin });
    io.observe(el);
  };

  // Ajusta un canvas al tamaño CSS con DPR (máx. 2)
  const fitCanvas = (canvas) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    return { w, h, dpr };
  };

  // Dibuja una imagen tipo "contain" (o "cover") rellenando el fondo
  const drawFit = (ctx, img, w, h, { mode = 'contain', bg = null, offsetY = 0.5, zoom = 1 } = {}) => {
    if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); } else { ctx.clearRect(0, 0, w, h); }
    if (!img || !img.naturalWidth) return;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = (mode === 'cover' ? Math.max(w / iw, h / ih) : Math.min(w / iw, h / ih)) * zoom;
    const dw = iw * s, dh = ih * s;
    ctx.drawImage(img, (w - dw) / 2, (h - dh) * offsetY, dw, dh);
  };

  // ---------- 2. Header + menú móvil ----------
  onReady(() => {
    const header = $('.site-header');
    const toggle = $('.nav-toggle');
    const nav = $('#site-nav');

    if (header) {
      const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    if (toggle && nav) {
      const setOpen = (open) => {
        nav.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        header && header.classList.toggle('nav-open', open);
      };
      toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
      nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    }

    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  });

  // ---------- 3. Reveal on scroll ----------
  onReady(() => {
    const els = $$('[data-reveal]');
    if (!els.length) return;
    if (!('IntersectionObserver' in window) || reduceMotion) { els.forEach((el) => el.classList.add('is-in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach((el) => io.observe(el));
  });

  // ---------- 4. Vídeos: fuente según dispositivo + play solo en vista ----------
  onReady(() => {
    $$('video[data-autoplay]').forEach((video) => {
      const src = (isMobile() && video.dataset.srcMobile) ? video.dataset.srcMobile : video.dataset.src;
      const poster = (isMobile() && video.dataset.posterMobile) ? video.dataset.posterMobile : video.getAttribute('poster');
      if (poster) video.setAttribute('poster', poster);
      video.muted = true;
      video.playsInline = true;

      const toggleBtn = video.id ? $(`[data-video-toggle="${video.id}"]`) : null;
      let userPaused = reduceMotion;
      let loaded = false;
      const load = () => { if (!loaded && src) { video.src = src; loaded = true; } };
      const play = () => { load(); const p = video.play(); if (p && p.catch) p.catch(() => {}); };
      const syncBtn = () => toggleBtn && toggleBtn.classList.toggle('is-paused', video.paused);

      video.addEventListener('play', syncBtn);
      video.addEventListener('pause', syncBtn);
      syncBtn();

      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          if (video.paused) { userPaused = false; play(); } else { userPaused = true; video.pause(); }
        });
      }

      if (!('IntersectionObserver' in window)) { if (!userPaused) play(); return; }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { if (!userPaused) play(); else load(); }
          else if (!video.paused) video.pause();
        });
      }, { threshold: 0.2 });
      io.observe(video);
    });
  });

  // ---------- 5. Secuencias de fotogramas ----------
  const frameCache = new Map();
  class FrameSet {
    constructor(tpl, count) {
      this.tpl = tpl; this.count = count;
      this.imgs = new Array(count + 1);
      this.ready = new Array(count + 1).fill(false);
      this.started = false;
      this.listeners = [];
    }
    static get(tpl, count) {
      const key = `${tpl}|${count}`;
      if (!frameCache.has(key)) frameCache.set(key, new FrameSet(tpl, count));
      return frameCache.get(key);
    }
    url(i) { return this.tpl.replace('%04d', pad4(i)); }
    onLoad(fn) { this.listeners.push(fn); }
    loadOne(i) {
      if (this.imgs[i]) return;
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { this.ready[i] = true; this.listeners.forEach((fn) => fn(i)); };
      img.src = this.url(i);
      this.imgs[i] = img;
    }
    // Carga priorizando primero/último y luego un barrido grueso→fino
    loadAll(first = 1) {
      if (this.started) return;
      this.started = true;
      const order = [];
      const seen = new Set();
      const push = (i) => { if (i >= 1 && i <= this.count && !seen.has(i)) { seen.add(i); order.push(i); } };
      push(first); push(1); push(this.count);
      for (let step = 16; step >= 1; step = Math.floor(step / 2)) {
        for (let i = 1; i <= this.count; i += step) push(i);
        if (step === 1) break;
      }
      let idx = 0;
      const next = () => { if (idx < order.length) { const i = order[idx++]; this.loadOne(i); const img = this.imgs[i]; const done = () => next(); if (this.ready[i]) done(); else { img.addEventListener('load', done, { once: true }); img.addEventListener('error', done, { once: true }); } } };
      for (let k = 0; k < 6; k++) next();
    }
    nearest(i) {
      i = Math.round(clamp(i, 1, this.count));
      if (this.ready[i]) return this.imgs[i];
      for (let d = 1; d < this.count; d++) {
        if (i - d >= 1 && this.ready[i - d]) return this.imgs[i - d];
        if (i + d <= this.count && this.ready[i + d]) return this.imgs[i + d];
      }
      return null;
    }
  }

  // ---------- 6. Scroll-scrub Canvas ----------
  // Easing tipo Apple: interpolación suave hacia el fotograma objetivo (0.22)
  const EASE_FRAMES = 0.22;

  onReady(() => {
    $$('[data-scrub]').forEach((section) => {
      const canvas = $('canvas', section);
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: false });
      const count = parseInt(canvas.dataset.frames || '1', 10);
      const reverse = section.dataset.direction === 'reverse';
      const bg = canvas.dataset.bg || '#b2b2b2';
      const tpl = () => (isMobile() && canvas.dataset.srcMobile ? canvas.dataset.srcMobile : canvas.dataset.src);
      let frames = FrameSet.get(tpl(), count);
      const captions = $$('.scrub-caption', section).map((el) => ({
        el, from: parseFloat(el.dataset.from || '0'), to: parseFloat(el.dataset.to || '1'),
      }));
      const bar = $('.scrub-progress i', section);
      const head = $('.scrub-head', section);

      let current = reverse ? count : 1;
      let target = current;
      let progress = 0;
      let visible = false;
      let raf = 0;

      const readProgress = () => {
        const r = section.getBoundingClientRect();
        const scrollable = Math.max(1, r.height - window.innerHeight);
        return clamp(-r.top / scrollable);
      };

      const renderText = (p) => {
        const fade = 0.045;
        captions.forEach((c) => {
          const o = c.to >= 1 ? smoothstep(c.from, c.from + fade, p) : smoothstep(c.from, c.from + fade, p) * (1 - smoothstep(c.to - fade, c.to, p));
          c.el.style.opacity = o.toFixed(3);
          c.el.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px)`;
        });
        if (head) {
          const o = 1 - smoothstep(0.1, 0.2, p);
          head.style.opacity = o.toFixed(3);
          head.style.transform = `translateY(${(-(1 - o) * 20).toFixed(1)}px)`;
        }
        if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
      };

      const draw = () => {
        const { w, h } = fitCanvas(canvas);
        const img = frames.nearest(current);
        if (img) {
          drawFit(ctx, img, w, h, { bg, offsetY: isMobile() ? 0.44 : 0.5, zoom: isMobile() ? 1 : 1.04 });
          section.classList.add('is-ready');
        } else { ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); }
      };

      const tick = () => {
        raf = 0;
        progress = readProgress();
        target = reverse ? count - progress * (count - 1) : 1 + progress * (count - 1);
        const k = reduceMotion ? 1 : EASE_FRAMES;
        current += (target - current) * k;
        if (Math.abs(target - current) < 0.02) current = target;
        draw();
        renderText(progress);
        if (visible && Math.abs(target - current) > 0.02) raf = requestAnimationFrame(tick);
      };
      const request = () => { if (!raf) raf = requestAnimationFrame(tick); };

      frames.onLoad(() => request());
      whenNear(section, () => frames.loadAll(reverse ? count : 1), '800px');

      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          visible = entries.some((e) => e.isIntersecting);
          if (visible) request();
        }).observe(section);
      } else { visible = true; }

      window.addEventListener('scroll', request, { passive: true });
      let lastMobile = isMobile();
      window.addEventListener('resize', () => {
        if (isMobile() !== lastMobile) { lastMobile = isMobile(); frames = FrameSet.get(tpl(), count); frames.onLoad(() => request()); frames.loadAll(Math.round(current)); }
        request();
      }, { passive: true });
      renderText(0);
      request();
    });
  });

  // ---------- 7. Explorador de piezas ----------
  onReady(() => {
    $$('[data-explorer]').forEach((ex) => {
      const hotspots = $$('.hotspot', ex);
      const tabs = $$('.part-btn', ex);
      const panels = $$('.part-panel', ex);
      const order = tabs.map((t) => t.dataset.part);
      let active = null;

      const select = (id, { focusTab = false } = {}) => {
        if (!id || id === active) return;
        active = id;
        hotspots.forEach((h) => h.classList.toggle('is-active', h.dataset.part === id));
        tabs.forEach((t) => {
          const on = t.dataset.part === id;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          if (on) {
            if (focusTab) t.focus();
            // En móvil la lista es horizontal: asegurar que el chip activo se ve
            const list = t.parentElement;
            if (list && list.scrollWidth > list.clientWidth) list.scrollTo({ left: t.offsetLeft - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
          }
        });
        panels.forEach((p) => {
          const on = p.dataset.part === id;
          p.hidden = !on;
          if (on) { p.classList.remove('anim'); void p.offsetWidth; p.classList.add('anim'); }
        });
      };
      const step = (dir) => {
        const i = order.indexOf(active);
        select(order[(i + dir + order.length) % order.length]);
      };

      hotspots.forEach((h) => h.addEventListener('click', () => {
        select(h.dataset.part);
        const panel = panels.find((p) => p.dataset.part === h.dataset.part);
        if (panel && isMobile()) panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      }));
      tabs.forEach((t) => {
        t.addEventListener('click', () => select(t.dataset.part));
        t.addEventListener('keydown', (e) => {
          const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
          if (keys[e.key]) { e.preventDefault(); const i = order.indexOf(active); select(order[(i + keys[e.key] + order.length) % order.length], { focusTab: true }); }
        });
      });
      $$('[data-part-prev]', ex).forEach((b) => b.addEventListener('click', () => step(-1)));
      $$('[data-part-next]', ex).forEach((b) => b.addEventListener('click', () => step(1)));
      select(order[0]);

      // Montar / desmontar (anima la secuencia del despiece)
      const toggle = $('[data-explorer-toggle]', ex);
      const canvas = $('.explorer-stage canvas', ex);
      const still = $('.explorer-stage > img', ex);
      if (!toggle || !canvas) return;
      const ctx = canvas.getContext('2d');
      const count = parseInt(canvas.dataset.frames || '1', 10);
      const bg = canvas.dataset.bg || null;
      const frames = FrameSet.get(isMobile() && canvas.dataset.srcMobile ? canvas.dataset.srcMobile : canvas.dataset.src, count);
      let pos = count; // count = despiezado
      let goal = count;
      let raf = 0;
      const labels = { assemble: toggle.dataset.labelAssemble, explode: toggle.dataset.labelExplode };

      const draw = () => {
        const { w, h } = fitCanvas(canvas);
        drawFit(ctx, frames.nearest(pos), w, h, { bg });
      };
      const animate = () => {
        raf = 0;
        const speed = reduceMotion ? count : 1.35;
        pos += Math.sign(goal - pos) * Math.min(speed, Math.abs(goal - pos));
        draw();
        if (pos !== goal) raf = requestAnimationFrame(animate);
        else if (goal === count) { canvas.style.visibility = 'hidden'; if (still) still.style.visibility = 'visible'; }
      };
      frames.onLoad(() => { if (canvas.style.visibility === 'visible' && !raf) draw(); });

      toggle.addEventListener('click', () => {
        frames.loadAll(count);
        const assembling = goal === count;
        goal = assembling ? 1 : count;
        ex.classList.toggle('is-assembled', assembling);
        toggle.setAttribute('aria-pressed', assembling ? 'true' : 'false');
        const label = $('.label', toggle);
        if (label) label.textContent = assembling ? labels.explode : labels.assemble;
        canvas.style.visibility = 'visible';
        if (still) still.style.visibility = 'hidden';
        if (!raf) raf = requestAnimationFrame(animate);
      });
      window.addEventListener('resize', () => { if (canvas.style.visibility === 'visible') draw(); }, { passive: true });
      whenNear(ex, () => frames.loadAll(count), '200px');
    });
  });

  // ---------- 8. Visor 360° ----------
  onReady(() => {
    $$('[data-spin]').forEach((spin) => {
      const stage = $('.spin-stage', spin);
      const canvas = $('canvas', spin);
      const ctx = canvas.getContext('2d', { alpha: false });
      const viewBtns = $$('[data-spin-view]', spin);
      const range = $('.spin-range', spin);
      const playBtn = $('.spin-play', spin);
      const count = parseInt(spin.dataset.frames || '72', 10);
      let frames = null;
      let pos = 1;           // fotograma actual (float)
      let playing = !reduceMotion;
      let raf = 0;
      let last = 0;
      let visible = false;

      const draw = () => {
        if (!frames) return;
        const { w, h } = fitCanvas(canvas);
        const i = ((Math.round(pos) - 1) % count + count) % count + 1;
        drawFit(ctx, frames.nearest(i), w, h, { mode: 'cover', bg: '#8e8e90' });
        if (range) range.value = String(i);
      };
      // En móvil se usan los renders verticales (data-src-mobile); las vistas sin versión móvil se ocultan por CSS
      const srcFor = (btn) => (isMobile() && btn.dataset.srcMobile ? btn.dataset.srcMobile : btn.dataset.src);
      const setView = (btn) => {
        if (isMobile() && !btn.dataset.srcMobile) btn = viewBtns.find((b) => b.dataset.srcMobile) || btn;
        viewBtns.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
        frames = FrameSet.get(srcFor(btn), count);
        frames.onLoad(() => { if (!playing) draw(); });
        frames.loadAll(Math.round(pos));
        draw();
      };
      const setPlaying = (on) => {
        playing = on;
        playBtn && playBtn.classList.toggle('is-paused', !on);
        playBtn && playBtn.setAttribute('aria-label', on ? playBtn.dataset.labelPause : playBtn.dataset.labelPlay);
        if (on && !raf) raf = requestAnimationFrame(loop);
      };
      const stopByUser = () => { spin.classList.add('is-touched'); setPlaying(false); };

      const loop = (t) => {
        raf = 0;
        if (!playing || !visible) return;
        if (!last) last = t;
        const dt = Math.min(64, t - last); last = t;
        pos += dt / 55; // ~4 s por vuelta
        if (pos > count + 1) pos -= count;
        draw();
        raf = requestAnimationFrame(loop);
      };

      // Arrastre
      let dragging = false, startX = 0, startPos = 1;
      stage.addEventListener('pointerdown', (e) => {
        dragging = true; startX = e.clientX; startPos = pos; stopByUser();
        stage.classList.add('is-dragging');
        stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
      });
      stage.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const perFrame = stage.clientWidth / count * 1.1;
        pos = startPos - (e.clientX - startX) / perFrame;
        draw();
      });
      const end = () => { dragging = false; stage.classList.remove('is-dragging'); };
      stage.addEventListener('pointerup', end);
      stage.addEventListener('pointercancel', end);
      stage.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault(); stopByUser(); pos += e.key === 'ArrowRight' ? 2 : -2; draw();
        }
      });
      if (range) {
        range.max = String(count);
        range.addEventListener('input', () => { stopByUser(); pos = parseInt(range.value, 10); draw(); });
      }
      playBtn && playBtn.addEventListener('click', () => { spin.classList.add('is-touched'); setPlaying(!playing); });
      viewBtns.forEach((b) => b.addEventListener('click', () => setView(b)));

      whenNear(spin, () => {
        setView(viewBtns.find((b) => b.getAttribute('aria-pressed') === 'true') || viewBtns[0]);
        setPlaying(playing);
      }, '400px');
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          visible = entries.some((e) => e.isIntersecting);
          last = 0;
          if (visible && playing && !raf) raf = requestAnimationFrame(loop);
        }).observe(stage);
      } else { visible = true; }
      let lastMobile = isMobile();
      window.addEventListener('resize', () => {
        if (frames && isMobile() !== lastMobile) {
          lastMobile = isMobile();
          setView(viewBtns.find((b) => b.getAttribute('aria-pressed') === 'true') || viewBtns[0]);
        } else draw();
      }, { passive: true });
    });
  });

  // ---------- 9. Pestañas ----------
  onReady(() => {
    $$('[data-tabs]').forEach((group) => {
      const tabs = $$('[role="tab"]', group);
      const select = (tab) => {
        tabs.forEach((t) => {
          const on = t === tab;
          t.setAttribute('aria-selected', on ? 'true' : 'false');
          t.tabIndex = on ? 0 : -1;
          const panel = document.getElementById(t.getAttribute('aria-controls'));
          if (panel) panel.hidden = !on;
        });
      };
      tabs.forEach((t, i) => {
        t.addEventListener('click', () => select(t));
        t.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
            n.focus(); select(n);
          }
        });
      });
    });
  });

  // ---------- 10. Formulario lista de espera / piloto ----------
  onReady(() => {
    const form = document.getElementById('earlyForm');
    if (!form) return;

    const API_URL = 'https://vinko-leads.vicentepinab.workers.dev/lead';
    const T = {
      es: {
        invalid: 'Por favor, revisa los campos obligatorios.',
        error: 'No se ha podido enviar el formulario. Inténtalo de nuevo o escribe a info@vinkosolutions.com.',
        sending: 'Enviando…',
        interest: { piloto: 'Quiere probar el VK0', novedades: 'Quiere recibir novedades', empresa: 'Colaboración / empresa' },
        company: 'Empresa / estudio',
      },
      en: {
        invalid: 'Please check the required fields.',
        error: 'The form could not be sent. Please try again or email info@vinkosolutions.com.',
        sending: 'Sending…',
        interest: { piloto: 'Wants to test the VK0', novedades: 'Wants updates', empresa: 'Business / partnership' },
        company: 'Company / studio',
      },
    }[LANG === 'en' ? 'en' : 'es'];

    const note = document.getElementById('formNote');
    const submitBtn = document.getElementById('submitBtn');
    const roleSelect = document.getElementById('roleSelect');
    const socialsWrap = document.getElementById('socialsWrap');
    const companyWrap = document.getElementById('companyWrap');
    const formFields = document.getElementById('formFields');
    const successPanel = document.getElementById('successPanel');
    if (!submitBtn || !roleSelect || !formFields || !successPanel) return;

    // Preselección por URL: ?interes=piloto|novedades|empresa  (o ?interest=)
    const params = new URLSearchParams(window.location.search);
    const pre = params.get('interes') || params.get('interest');
    if (pre) {
      const radio = form.querySelector(`input[name="interest"][value="${pre}"]`);
      if (radio) radio.checked = true;
    }
    const preRole = params.get('rol') || params.get('role');
    if (preRole) {
      const opt = Array.from(roleSelect.options).find((o) => o.value.toLowerCase() === preRole.toLowerCase());
      if (opt) roleSelect.value = opt.value;
    }

    const toggleConditional = () => {
      const role = roleSelect.value;
      if (socialsWrap) {
        const isArtist = role === 'Artista';
        socialsWrap.classList.toggle('hidden', !isArtist);
        if (!isArtist) { const i = socialsWrap.querySelector('input'); if (i) i.value = ''; }
      }
      if (companyWrap) {
        const isBiz = ['Estudio', 'Distribuidor', 'Inversor'].includes(role);
        companyWrap.classList.toggle('hidden', !isBiz);
        if (!isBiz) { const i = companyWrap.querySelector('input'); if (i) i.value = ''; }
      }
    };
    const updateButtonState = () => {
      submitBtn.classList.toggle('ready', form.checkValidity() && roleSelect.value !== '');
    };

    form.addEventListener('input', updateButtonState);
    form.addEventListener('change', () => { toggleConditional(); updateButtonState(); });
    // Autofill tardío
    setTimeout(() => { toggleConditional(); updateButtonState(); }, 150);
    setTimeout(updateButtonState, 1000);

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      updateButtonState();
      if (!form.checkValidity()) { if (note) note.textContent = T.invalid; form.reportValidity && form.reportValidity(); return; }

      const data = Object.fromEntries(new FormData(form).entries());
      data.lang = LANG.toUpperCase();

      // Campos extra que el Worker no conoce → se integran en "message"
      const extras = [];
      if (data.interest && T.interest[data.interest]) extras.push(`[${T.interest[data.interest]}]`);
      if (data.company) extras.push(`[${T.company}: ${data.company}]`);
      delete data.interest; delete data.company;
      if (extras.length) data.message = `${extras.join(' ')} ${data.message || ''}`.trim();

      const original = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = T.sending;
      if (note) note.textContent = '';

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || 'Error');
        formFields.classList.add('hidden');
        successPanel.classList.remove('hidden');
        successPanel.focus && successPanel.focus();
      } catch (err) {
        console.error(err);
        if (note) note.textContent = T.error;
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = original;
      }
    });

    toggleConditional();
    updateButtonState();
  });

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

  onReady(() => {
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
