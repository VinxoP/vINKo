import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 8787;

// Ajusta esto a tu dominio real cuando lo tengas
// Mientras tanto puedes dejarlo en "*" para pruebas.
const ALLOWED_ORIGINS = [
  "http://localhost:8080",
  "http://127.0.0.1:8080",
  "https://vinxop.github.io",
  "https://vinxop.github.io/vINKo",
  "https://vinko.com",
  "https://www.vinko.com"
];

app.use(express.json({ limit: "100kb" }));

app.use(cors({
  origin: function (origin, callback) {
    // Permite llamadas sin origin (curl, tests)
    if (!origin) return callback(null, true);

    // Si estás probando y quieres permitir todo:
    // return callback(null, true);

    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error("CORS bloqueado para este origen: " + origin));
  }
}));

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 60, // 60 req / 10 min por IP
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_PATH = path.join(__dirname, "leads.csv");

// Escribe cabecera si no existe
function ensureCsvHeader() {
  if (!fs.existsSync(CSV_PATH)) {
    const header = "timestamp,name,email,role,country,message,source_ip,user_agent\n";
    fs.writeFileSync(CSV_PATH, header, "utf8");
  }
}

function sanitize(value = "") {
  // Evita saltos de línea y comas problemáticas en CSV
  const v = String(value).replace(/\r?\n|\r/g, " ").trim();
  // Escapado simple para CSV
  if (v.includes(",") || v.includes(`"`) ) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function isValidEmail(email = "") {
  // Validación sencilla (suficiente para leads)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/lead", (req, res) => {
  ensureCsvHeader();

  const {
    name = "",
    email = "",
    role = "",
    country = "",
    message = ""
  } = req.body || {};

  if (!name || name.length < 2) {
    return res.status(400).json({ ok: false, error: "Nombre inválido" });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "Email inválido" });
  }

  const timestamp = new Date().toISOString();
  const sourceIp =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "";
  const userAgent = req.headers["user-agent"] || "";

  const row = [
    sanitize(timestamp),
    sanitize(name),
    sanitize(email),
    sanitize(role),
    sanitize(country),
    sanitize(message),
    sanitize(sourceIp),
    sanitize(userAgent)
  ].join(",") + "\n";

  try {
    fs.appendFileSync(CSV_PATH, row, "utf8");
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ ok: false, error: "No se pudo escribir el CSV" });
  }
});

app.listen(PORT, () => {
  ensureCsvHeader();
  console.log(`vINKo leads backend escuchando en http://localhost:${PORT}`);
});
