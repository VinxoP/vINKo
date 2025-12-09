// Year
document.getElementById("year").textContent = new Date().getFullYear();

// Local-only form behavior (no SaaS)
// This just shows a friendly confirmation.
// Later you can wire this to your own backend if you self-host.
const form = document.getElementById("earlyForm");
const note = document.getElementById("formNote");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = Object.fromEntries(new FormData(form).entries());
  console.log("Early list submission (local):", data);

  note.textContent =
    "¡Gracias! Registro guardado localmente en la consola del navegador. " +
    "Si quieres, puedo darte un backend mínimo en Node o Python para guardar los leads en un CSV en tu PC.";

  form.reset();
});
