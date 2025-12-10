// Year
document.getElementById("year").textContent = new Date().getFullYear();

const form = document.getElementById("earlyForm");
const note = document.getElementById("formNote");

const API_URL = "https://vinko-leads.vicentepinab.workers.dev/lead";

// --- 4) Mostrar redes solo si es ARTISTA ---
function toggleSocials() {
  const isArtist = roleSelect.value === "Artista";
  socialsWrap.classList.toggle("hidden", !isArtist);

  // Si deja de ser artista, vaciamos el campo para no enviar ruido
  if (!isArtist) {
    const input = socialsWrap.querySelector("input[name='socials']");
    if (input) input.value = "";
  }
}

// --- 5) Botón "listo" cuando obligatorios OK ---
function updateButtonState() {
  // checkValidity usa required/type/etc.
  const isValid = form.checkValidity() && roleSelect.value !== "";

  submitBtn.classList.toggle("ready", isValid);
}

// Listeners normales
form.addEventListener("input", updateButtonState);
form.addEventListener("change", () => {
  toggleSocials();
  updateButtonState();
});

// --- 2) Captura de autofill ---
// Muchos navegadores rellenan después de cargar, sin disparar input.
window.addEventListener("load", () => {
  toggleSocials();

  // Pequeños "rechecks" para atrapar autocompletado tardío
  setTimeout(updateButtonState, 100);
  setTimeout(updateButtonState, 400);
  setTimeout(updateButtonState, 1000);
});

// También al enfocar el formulario
form.addEventListener("focusin", () => {
  setTimeout(updateButtonState, 0);
});

// --- 6) Envío y reemplazo por mensaje grande ---
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Fuerza validación antes de enviar
  if (!form.checkValidity()) {
    note.textContent = "Por favor, revisa los campos obligatorios.";
    updateButtonState();
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

    // Oculta campos y muestra éxito
    formFields.classList.add("hidden");
    successPanel.classList.remove("hidden");

  } catch (err) {
    console.error(err);
    note.textContent = "No se ha podido enviar el formulario. Inténtalo de nuevo.";
  }
});