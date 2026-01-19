document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("earlyForm");
  if (!form) {
    console.warn("No se encontró #earlyForm en esta página.");
    return;
  }

  const note = document.getElementById("formNote");
  const submitBtn = document.getElementById("submitBtn");
  const roleSelect = document.getElementById("roleSelect");
  const socialsWrap = document.getElementById("socialsWrap");
  const formFields = document.getElementById("formFields");
  const successPanel = document.getElementById("successPanel");

  if (!submitBtn || !roleSelect || !formFields || !successPanel) {
    console.warn("Faltan IDs del formulario. Revisa HTML.");
    return;
  }

  const API_URL = "https://vinko-leads.vicentepinab.workers.dev/lead";

  function toggleSocials() {
    const isArtist = roleSelect.value === "Artista";
    if (socialsWrap) {
      socialsWrap.classList.toggle("hidden", !isArtist);
      if (!isArtist) {
        const input = socialsWrap.querySelector("input[name='socials']");
        if (input) input.value = "";
      }
    }
  }

  function updateButtonState() {
    const isValid = form.checkValidity() && roleSelect.value !== "";
    submitBtn.classList.toggle("ready", isValid);
  }

  // Detectar cambios manuales
  form.addEventListener("input", updateButtonState);
  form.addEventListener("change", () => {
    toggleSocials();
    updateButtonState();
  });

  // Captura autofill tardío
  setTimeout(() => { toggleSocials(); updateButtonState(); }, 100);
  setTimeout(updateButtonState, 400);
  setTimeout(updateButtonState, 1000);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    updateButtonState();
    if (!form.checkValidity()) {
      if (note) note.textContent = "Por favor, revisa los campos obligatorios.";
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    data.lang = (document.documentElement.lang || "es").toUpperCase();


    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Error desconocido");

      formFields.classList.add("hidden");
      successPanel.classList.remove("hidden");
    } catch (err) {
      console.error(err);
      if (note) note.textContent = "No se ha podido enviar el formulario. Inténtalo de nuevo.";
    }
  });

  // Estado inicial
  toggleSocials();
  updateButtonState();
});

document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const headerRight = document.querySelector(".header-right");

  if (navToggle && headerRight) {
    navToggle.addEventListener("click", () => {
      const isOpen = headerRight.classList.toggle("is-open");
      navToggle.classList.toggle("is-open", isOpen);
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    headerRight.addEventListener("click", (e) => {
      const target = e.target;
      if (target.tagName === "A") {
        headerRight.classList.remove("is-open");
        navToggle.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }
});

// === VK0 scroll-scrub (cerrada -> abierta -> cerrada) a lo largo de TODA la página ===
(() => {
  const canvas = document.getElementById("vk0-seq");
  if (!canvas) return;

  const ctx = canvas.getContext("2d", { alpha: false });
  const totalFrames = parseInt(canvas.dataset.frames || "373", 10);

  const tplDesktop = canvas.dataset.desktop;
  const tplMobile  = canvas.dataset.mobile;

  const isMobile = () => window.matchMedia("(max-width: 720px)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  const frameUrl = (i) => {
    const tpl = isMobile() ? tplMobile : tplDesktop;
    const n = String(i).padStart(4, "0");
    return tpl.replace("%04d", n);
  };

  function resizeCanvas() {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawSmart(img) {
    const cw = canvas.clientWidth, ch = canvas.clientHeight;
    const iw = img.naturalWidth, ih = img.naturalHeight;

    const contain = isMobile(); // móvil: sin recorte
    const scale = contain ? Math.min(cw / iw, ch / ih) : Math.max(cw / iw, ch / ih);

    const dw = iw * scale, dh = ih * scale;
    const dx = (cw - dw) / 2, dy = (ch - dh) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  // Cache
  const imgs = new Array(totalFrames + 1);
  const loaded = new Array(totalFrames + 1).fill(false);

  function loadFrame(i) {
    if (i < 1 || i > totalFrames) return;
    if (imgs[i]) return;
    const img = new Image();
    img.decoding = "async";
    img.src = frameUrl(i);
    imgs[i] = img;
    img.onload = () => { loaded[i] = true; };
  }

  // Preload inicial (para que no aparezca negro)
  for (let i = 1; i <= Math.min(40, totalFrames); i++) loadFrame(i);

  function preloadWindow(center) {
    const r = isMobile() ? 22 : 32; // más radio porque vas a 50fps
    for (let i = center - r; i <= center + r; i++) loadFrame(i);
  }

  // Progreso dentro del hero pinned (usa altura de la sección)
  const hero = document.querySelector(".vk0-scroll-hero");
  function heroProgress() {
    if (!hero) return 0;
    const rect = hero.getBoundingClientRect();
    const scrollable = hero.offsetHeight - window.innerHeight;
    if (scrollable <= 1) return 0;
    return clamp((-rect.top) / scrollable, 0, 1);
  }

  // Suavizado “Apple”
  let current = 1;
  let target  = 1;
  let running = false;

  function tick() {
    running = true;
    current += (target - current) * 0.22; // sube a 0.28 si lo quieres más “directo”

    const idx = clamp(Math.round(current), 1, totalFrames);
    preloadWindow(idx);

    const img = imgs[idx];
    if (img && (img.complete || loaded[idx])) drawSmart(img);

    if (Math.abs(target - current) > 0.02) {
      requestAnimationFrame(tick);
    } else {
      current = target;
      running = false;
    }
  }

  function onScroll() {
    const p = heroProgress();
    target = 1 + p * (totalFrames - 1);
    if (!running) requestAnimationFrame(tick);
  }

  // Cambiar entre secuencia desktop/mobile al cambiar breakpoint
  const mq = window.matchMedia("(max-width: 720px)");
  mq.addEventListener("change", () => {
    for (let i = 1; i <= totalFrames; i++) { imgs[i] = null; loaded[i] = false; }
    for (let i = 1; i <= Math.min(40, totalFrames); i++) loadFrame(i);
    onScroll();
  });

  window.addEventListener("resize", () => { resizeCanvas(); onScroll(); });
  window.addEventListener("scroll", onScroll, { passive: true });

  resizeCanvas();
  loadFrame(1);

  const first = setInterval(() => {
    const img = imgs[1];
    if (img && img.complete) {
      drawSmart(img);
      clearInterval(first);
    }
  }, 30);

  onScroll();
})();
