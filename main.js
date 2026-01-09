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