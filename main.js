// Year
document.getElementById("year").textContent = new Date().getFullYear();

const form = document.getElementById("earlyForm");
const note = document.getElementById("formNote");

const API_URL = "https://vinko-leads.vicentepinab.workers.dev/lead";

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
    console.log("Worker response:", json);

    if (!json.ok) throw new Error(json.error || "Error");

    note.textContent = "¡Gracias! Te has unido a la lista early de vINKo.";
    form.reset();
  } catch (err) {
    console.error("Submit error:", err);
    note.textContent = "No se pudo enviar. Revisa consola del navegador.";
  }
});