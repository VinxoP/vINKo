// Year
document.getElementById("year").textContent = new Date().getFullYear();

// Local-only form behavior (no SaaS)
// This just shows a friendly confirmation.
// Later you can wire this to your own backend if you self-host.
const form = document.getElementById("earlyForm");
const note = document.getElementById("formNote");

const API_URL = "http://localhost:8787/lead";

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const json = await res.json();

    if (!json.ok) throw new Error(json.error || "Error desconocido");

    note.textContent = "¡Gracias! Te has unido a la lista early de vINKo.";
    form.reset();
  } catch (err) {
    note.textContent =
      "No se pudo enviar el formulario ahora mismo. " +
      "Inténtalo de nuevo en unos minutos.";
    console.error(err);
  }
});
