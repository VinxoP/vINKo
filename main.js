const form = document.getElementById("earlyForm");
const note = document.getElementById("formNote");
const submitBtn = document.getElementById("submitBtn");
const roleSelect = document.getElementById("roleSelect");
const socialsWrap = document.getElementById("socialsWrap");
const formFields = document.getElementById("formFields");
const successPanel = document.getElementById("successPanel");

// Worker real:
const API_URL = "https://vinko-leads.vicentepinab.workers.dev/lead";

// 4) Mostrar redes solo si es ARTISTA
function toggleSocials() {
  const isArtist = roleSelect.value === "Artista";
  socialsWrap.classList.toggle("hidden", !isArtist);

  if (!isArtist) {
    const input = socialsWrap.querySelector("input[name='socials']");
    if (input) input.value = "";
  }
}

// 5) Botón cambia cuando obligatorios OK
function updateButtonState() {
  // checkValidity funciona con required/type/minlength
  const isValid = form.checkValidity() && roleSelect.value !== "";
  submitBtn.classList.toggle("ready", isValid);
}

// Detectar cambios manuales
form.addEventListener("input", updateButtonState);
form.addEventListener("change", () => {
  toggleSocials();
  updateButtonState();
});

// 2) Capturar autofill
window.addEventListener("load", () => {
  toggleSocials();
  setTimeout(updateButtonState, 100);
  setTimeout(updateButtonState, 400);
  setTimeout(updateButtonState, 1000);
});

form.addEventListener("focusin", () => {
  setTimeout(updateButtonState, 0);
});

// 6) Envío y reemplazo visual
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  updateButtonState();
  if (!form.checkValidity()) {
    note.textContent = "Por favor, revisa los campos obligatorios.";
    return;
  }

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error || "Error desconocido");

    // Oculta el bloque de inputs y muestra el éxito dentro del mismo recuadro
    formFields.classList.add("hidden");
    successPanel.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    note.textContent = "No se ha podido enviar el formulario. Inténtalo de nuevo.";
  }
});
