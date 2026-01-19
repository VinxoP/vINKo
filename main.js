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
  const video = document.getElementById("vk0-bg-video");
  if (!video) return;

  let duration = 0;
  let targetTime = 0;
  let smoothedTime = 0;
  let running = false;
  let lastScrollY = -1;
  let settleFrames = 0;

  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const triangleWave = (p) => (p <= 0.5 ? p * 2 : (1 - p) * 2);

  function pageProgress(){
    const doc = document.documentElement;
    const maxScroll = (doc.scrollHeight - window.innerHeight) || 1;
    return clamp01(window.scrollY / maxScroll);
  }

  function updateTarget(){
    const p = pageProgress();        // 0..1
    const tri = triangleWave(p);     // 0..1..0
    targetTime = tri * duration;     // 0..dur..0
  }

  function loop(){
    if (!running) return;

    // suavizado (cuanto mayor, más rápido responde; 0.10–0.18 suele ir bien)
    smoothedTime += (targetTime - smoothedTime) * 0.14;

    // evita micro-jitter cuando ya está casi clavado
    if (Math.abs(targetTime - smoothedTime) < 0.015) {
      smoothedTime = targetTime;
      settleFrames++;
    } else {
      settleFrames = 0;
    }

    // aplicar tiempo
    try { video.currentTime = smoothedTime; } catch(e) {}

    // si no hay scroll nuevo y ya está estable, paramos el loop para no gastar CPU
    const y = window.scrollY;
    if (y === lastScrollY && settleFrames > 12) {
      running = false;
      return;
    }
    lastScrollY = y;

    requestAnimationFrame(loop);
  }

  function kick(){
    if (!duration) return;
    updateTarget();
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  }

  video.addEventListener("loadedmetadata", async () => {
    duration = video.duration || 0;
    smoothedTime = 0;
    targetTime = 0;

    // “calienta” el vídeo (mejora en Safari)
    try { await video.play(); video.pause(); } catch(e) {}

    kick();
  });

  window.addEventListener("scroll", kick, { passive: true });
  window.addEventListener("resize", kick);
  window.addEventListener("touchmove", kick, { passive: true });
})();

