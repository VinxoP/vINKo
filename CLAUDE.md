# vINKo System — Contexto del proyecto

## Producto

**VK0** — Sistema de tatuaje con cartucho de tinta controlado. En desarrollo pre-lanzamiento, con patente internacional en trámite. El objetivo actual de la web es generar interés y captar leads para la lista de espera; el enfoque en Kickstarter se deja para más adelante.

**Fundador:** Vicente Pina Beti  
**Contacto:** info@vinkosolutions.com  
**Dominio:** vinkosolutions.com

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5 + CSS3 + Vanilla JS (sin frameworks) |
| Hosting | GitHub Pages (`vinxop.github.io/vINKo`) con dominio custom `vinkosolutions.com` via CNAME |
| Backend API | Cloudflare Worker — `https://vinko-leads.vicentepinab.workers.dev/lead` |
| Email marketing | Brevo (alertas, automatizaciones de email a leads) |
| Almacenamiento leads | CSV (`leads.csv`) en el Worker |
| Fuentes | Google Fonts — Lato |
| Animaciones | Canvas scroll-scrub custom + visor 360° en `main.js` (sin librerías) |
| Servidor local | Node.js + Express (`server.js`, puerto 8787) — solo para desarrollo |

---

## Estructura de páginas

Todas las páginas existen en versión **ES** (base) y **EN** (prefijo `en-`):

| ES | EN | Propósito |
|----|----|-----------|
| `index.html` | `en.html` | Home — vídeo promo, problema, el nuevo estándar, despiece con scroll, explorador de piezas, visor 360°, kit, audiencias, piloto, FAQ y formulario |
| `vk0.html` | `en-vk0.html` | Producto — visor 360°, explorador de piezas, sistema, kit y beneficios |
| `system.html` | `en-system.html` | El nuevo estándar — comparativa Antes/Con VK0, montaje con scroll, visión y beneficios |
| `piloto.html` | `en-pilot.html` | Programa piloto (probar el prototipo) + formulario `#solicitud` |
| `faq.html` | `en-faq.html` | Preguntas frecuentes |
| `lista.html` | `en-lista.html` | Formulario lista de espera |
| `sobre-mi.html` | `en-sobre-mi.html` | Historia del fundador + hoja de ruta (`#roadmap`) |
| `privacy.html` | `privacy-en.html` | Política de privacidad (GDPR) |
| `cookies.html` | `cookies-en.html` | Política de cookies |

Redirecciones (páginas antiguas → nuevas): `problema.html`, `idea.html`, `beneficios.html`, `roadmap.html`, `founder-council.html` (→ `piloto.html`).

Archivos legacy/deprecated: `en_antiguo.html`, `index_antiguo.html`, `index_antiguo_antiguo.html`, `styles_antiguo.css`, `styles.css` (diseño anterior) — no tocar.

### Assets del rediseño (`assets/v2/`)

Generados a partir de los renders del prototipo 2 (`07_Imagenes_y_Renders/RENDERS/VK0_prototipo2/FINAL`):

| Carpeta | Contenido |
|---------|-----------|
| `explode/d/`, `explode/m/` | 100 fotogramas WebP del despiece (0001 = montado, 0100 = despiezado), fondo aplanado a `#b2b2b2` |
| `spin/{angulo,recta,tumbada}/` | 72 fotogramas WebP 4:3 por vista para el visor 360° |
| `spin-m/{angulo,recta}/` | Versión móvil del visor 360° (renders verticales `movil_giro_*`, 1080×1400). La vista «tumbada» no tiene versión móvil y se oculta en móvil |
| `video/` | Promo sin logotipo final (web 1280×720 desde `web_promo_unatoma`; móvil 720×1280 desde `movil_promo_unatoma`) y maletín (solo web) |
| `img/` | Fijas, pósters, `og-vk0.jpg` y marca VINKO en blanco |

Las posiciones de los puntos del explorador (en % sobre el fotograma despiezado) están en el atributo `style` de cada `.hotspot`.

---

## JavaScript — `main.js`

Vanilla JS sin dependencias (AOS eliminado). Bloques:

1. **Header + menú móvil** — `aria-expanded`, cierre con Escape.
2. **Reveal on scroll** — atributo `data-reveal` (IntersectionObserver).
3. **Vídeos** — `video[data-autoplay]` elige fuente desktop/móvil y solo reproduce en vista.
4. **Scroll-scrub Canvas** — `[data-scrub]` (despiece en home, montaje en system con `data-direction="reverse"`). Easing tipo Apple (0.22). Breakpoint 720px. Esta animación es prioritaria y debe conservarse.
5. **Explorador de piezas** — `[data-explorer]`: hotspots, pestañas, fichas y botón Montar/Desmontar.
6. **Visor 360°** — `[data-spin]`: arrastre, teclado, slider, 3 vistas.
7. **Pestañas** (`[data-tabs]`, comparativa).
8. **Formulario** — valida, muestra "Socials" (Artista) y "Empresa" (Estudio/Distribuidor/Inversor); el interés y la empresa se añaden al campo `message` porque el Worker no los conoce. Admite `?interes=piloto|novedades|empresa&rol=Artista`.
9. **Language Router** — persiste idioma en `localStorage` (`vinko_lang`), redirige al equivalente y reescribe links internos.

`lang-router-snippet.js` — copia standalone del router, se usa en páginas que no cargan `main.js`.

---

## Backend — Cloudflare Worker

**Endpoint:** `POST https://vinko-leads.vicentepinab.workers.dev/lead`

**Campos recibidos:** `name`, `email`, `role`, `country`, `phone`, `message`, `socials`, `lang`

**Roles disponibles:** Artista, Estudio, Distribuidor, Inversor, Otro

**Rate limit:** 60 req / 10 min por IP

**CORS whitelist:** `localhost:8080`, `127.0.0.1:8080`, `vinxop.github.io`, `vinxop.github.io/vINKo`, `vinko.com`, `www.vinko.com`

> Comprobado 2026-09-25: el Worker real acepta `vinkosystem.com` y `vinxop.github.io`, pero **no** `vinkosolutions.com` ni `www.vinkosolutions.com`. Hay que añadirlos en el código del Worker (panel de Cloudflare) para que el formulario funcione en el dominio nuevo.

**Almacenamiento:** CSV con campos `timestamp, name, email, role, country, message, source_ip, user_agent`

**Health check:** `GET /health → {ok: true}`

---

## Diseño

- **Paleta:** fondo oscuro (`#07090c`), accent cyan (`#9cf`), texto `#f3f5f9`, secciones "estudio" en `#b2b2b2` (fondo de los renders)
- **Tipografía:** Lato (pesos 100–900) via Google Fonts
- **CSS:** `site.css` 100% custom con variables CSS, sin frameworks. Breakpoint principal: 720px
- **Tema:** `#0b0f14` (PWA + meta theme-color)
- Sin frameworks CSS — mantener esa filosofía

---

## SEO

- `sitemap.xml` — 14 URLs con alternates hreflang ES/EN
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

### Mensaje de la web (septiembre 2026)

- **Idea central:** Vinko Solutions ha diseñado y fabricado la máquina de tatuaje de nueva generación y la ha elevado a un **nuevo estándar**: la tinta en su propio cartucho, cero desperdicio, sin contaminación cruzada, menos carga de trabajo, más higiene y eficiencia. Al alcance de todos los artistas del tatuaje del mundo.
- **Cartucho:** hoy llega **vacío** y el artista lo llena con la tinta que prefiera. Tubo desechable: uno nuevo en cada sesión. **Visión de futuro:** que las marcas de tinta vendan sus tintas ya envasadas en cartuchos para VK0 (tinta regulada desde el origen) — usar como argumento para empresas, nunca como algo que ya existe.
- **No mencionar la patente** en la web.
- **Sin detalles técnicos ni funcionales** (nada de motor/excéntrica, voltaje, frecuencia, circuitos, cómo se mueve la tinta por dentro, firmware). Solo beneficios básicos.
- **Excepción — fichas del explorador de piezas** (`PARTS`): 6 piezas con los títulos y textos dados por Vicente (Cartucho, Tubo desechable, Cuerpo de la máquina, Motor, Cuerpo delantero, Grip). Incluyen batería recargable, pantalla TFT y stroke fijo de 2,5 a 4,5 mm. No añadir más datos técnicos por cuenta propia.
- Hablar de «el VK0» más que de «el prototipo».
- **Contaminación cruzada — matiz:** hoy los artistas ya cambian vasos y tinta en cada cliente; el problema no es que se contamine entre clientes, sino que por higiene se tira la tinta sobrante (desperdicio). No decir que hoy hay contaminación entre clientes.
- Decir «vaso/vasos» de tinta (o «cup» en inglés), nunca «vasito»: no suena profesional.

---

## Servicios externos

| Servicio | Uso |
|----------|-----|
| Cloudflare | Worker API + CDN + protección |
| Brevo | Email marketing y automatizaciones a leads |
| GitHub Pages | Hosting estático |
| Google Fonts | Tipografía (Lato) |

---

## Redes sociales

- LinkedIn: https://www.linkedin.com/company/vinko-solutions
- Instagram: https://www.instagram.com/vinko.solutions
- TikTok: https://www.tiktok.com/@vinko.solutions
