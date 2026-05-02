# vINKo System — Contexto del proyecto

## Producto

**VK0** — Sistema de tatuaje con cartucho de tinta controlado. En desarrollo pre-lanzamiento, con patente internacional en trámite. El objetivo actual de la web es generar interés y captar leads para la lista de espera; el enfoque en Kickstarter se deja para más adelante.

**Fundador:** Vicente Pina Beti  
**Contacto:** updates@vinkosystem.com  
**Dominio:** vinkosystem.com

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JS (sin frameworks) |
| Hosting | GitHub Pages (`vinxop.github.io/vINKo`) con dominio custom `vinkosystem.com` via CNAME |
| Backend API | Cloudflare Worker — `https://vinko-leads.vicentepinab.workers.dev/lead` |
| Email marketing | Brevo (alertas, automatizaciones de email a leads) |
| Almacenamiento leads | CSV (`leads.csv`) en el Worker |
| Fuentes | Google Fonts — Lato |
| Animaciones | AOS 2.3.4 + Canvas scroll-scrub custom en `main.js` |
| Servidor local | Node.js + Express (`server.js`, puerto 8787) — solo para desarrollo |

---

## Estructura de páginas

Todas las páginas existen en versión **ES** (base) y **EN** (prefijo `en-`):

| ES | EN | Propósito |
|----|----|-----------|
| `index.html` | `en.html` | Home — scroll animado 4 pasos del VK0 |
| `vk0.html` | `en-vk0.html` | Producto — vista 360° scroll-scrub |
| `system.html` | `en-system.html` | Cómo funciona — animación 4 pasos |
| `faq.html` | `en-faq.html` | Preguntas frecuentes |
| `lista.html` | `en-lista.html` | Formulario lista de espera |
| `sobre-mi.html` | `en-sobre-mi.html` | Historia del fundador |
| `privacy.html` | `privacy-en.html` | Política de privacidad (GDPR) |
| `cookies.html` | `cookies-en.html` | Política de cookies |
| `founder-council.html` | — | Programa Founder Council (NDA/feedback) |

Archivos legacy/deprecated: `en_antiguo.html`, `index_antiguo.html`, `styles_antiguo.css` — no tocar.

---

## JavaScript — `main.js`

Cuatro bloques principales:

1. **Formulario lista de espera** — valida nombre/email, muestra campo "Socials" si rol = Artista, envía POST JSON al Worker, muestra panel de éxito.
2. **Menú móvil** — toggle hamburger con `aria-expanded`.
3. **Scroll-scrub Canvas** — animación de secuencias de frames (`/assets/vk0seq/`, `/assets/video-explicativo/`). Desktop/mobile con breakpoint en 720px. Easing tipo Apple (smoothstep 0.22). Esta animación es prioritaria — da elegancia al producto y debe conservarse.
4. **Language Router** — persiste idioma en `localStorage` (`vinko_lang`), redirige al equivalente correcto, reescribe todos los links internos en tiempo real.

`lang-router-snippet.js` — copia standalone del router, se usa en páginas que no cargan `main.js`.

---

## Backend — Cloudflare Worker

**Endpoint:** `POST https://vinko-leads.vicentepinab.workers.dev/lead`

**Campos recibidos:** `name`, `email`, `role`, `country`, `phone`, `message`, `socials`, `lang`

**Roles disponibles:** Artista, Estudio, Distribuidor, Inversor, Otro

**Rate limit:** 60 req / 10 min por IP

**CORS whitelist:** `localhost:8080`, `127.0.0.1:8080`, `vinxop.github.io`, `vinxop.github.io/vINKo`, `vinko.com`, `www.vinko.com`

**Almacenamiento:** CSV con campos `timestamp, name, email, role, country, message, source_ip, user_agent`

**Health check:** `GET /health → {ok: true}`

---

## Diseño

- **Paleta:** fondo oscuro (`#1d1d1d`, `#000`), accent cyan (`#9cf`), texto `#f6f7fb`
- **Tipografía:** Lato (pesos 100–900) via Google Fonts
- **CSS:** 100% custom con variables CSS, sin frameworks. Breakpoint principal: 720px
- **Tema:** `#0b0f14` (PWA + meta theme-color)
- Sin frameworks CSS — mantener esa filosofía

---

## SEO

- `sitemap.xml` — 11 URLs, prioridad 1.0 home / 0.8 resto, frecuencia semanal
- `robots.txt` — permite todos los bots, apunta al sitemap
- Schema.org: `Organization` + `WebSite` en el home
- Open Graph + Twitter Card en todas las páginas
- `hreflang` ES/EN en cada página
- PWA: `site.webmanifest` (display standalone)

---

## Idiomas

- **ES** — archivos base (`index.html`, `vk0.html`, etc.)
- **EN** — archivos con prefijo `en-` (`en.html`, `en-vk0.html`, etc.)
- Persistencia: `localStorage` key `vinko_lang`
- El router detecta el idioma actual del archivo y redirige si no coincide con la preferencia guardada

---

## Estado actual del proyecto (mayo 2026)

- La web está en proceso de rediseño completo, paso a paso
- **Objetivo principal:** generar interés y captar leads para la lista de espera
- **No mencionar Kickstarter** — ese enfoque se añadirá más adelante
- Las animaciones scroll-scrub del VK0 se conservan (son un activo visual clave)
- Se van a mejorar textos, tipografía y diseño visual global
- Se va a conectar Brevo para automatización de emails a los leads

---

## Servicios externos

| Servicio | Uso |
|----------|-----|
| Cloudflare | Worker API + CDN + protección |
| Brevo | Email marketing y automatizaciones a leads |
| GitHub Pages | Hosting estático |
| Google Fonts | Tipografía (Lato) |
| AOS (unpkg) | Animate On Scroll v2.3.4 |

---

## Redes sociales

- LinkedIn: https://www.linkedin.com/company/vinko-system
- Instagram: https://www.instagram.com/vinko.system
- TikTok: https://www.tiktok.com/@vinko.tech
