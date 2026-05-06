# Vasak Community Theme

Tema premium para NodeBB, construido sobre [Harmony](https://github.com/NodeBB/nodebb-theme-harmony). Diseñado para la comunidad Vasak con foco en performance, accesibilidad y una experiencia de usuario moderna.

---

## Índice

- [Características](#características)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Desarrollo](#desarrollo)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Sistema de diseño](#sistema-de-diseño)
- [Módulos JavaScript](#módulos-javascript)
- [Service Worker](#service-worker)
- [Dark Mode](#dark-mode)
- [Personalización](#personalización)
- [Despliegue](#despliegue)
- [Solución de problemas](#solución-de-problemas)

---

## Características

### Performance

| Feature | Descripción |
|---|---|
| **Lazy Loading** | `loading="lazy"` nativo + IntersectionObserver para imágenes dinámicas |
| **Skeleton Screens** | Placeholders shimmer para feed, topics, notificaciones y posts |
| **Critical CSS** | Estilos above-the-fold inyectados inline en el `<head>` (evita FOUC) |
| **Service Worker** | Cache-First para assets, Network-First para páginas, SWR para API |
| **Code Splitting** | Módulos AMD cargados bajo demanda por página |
| **Content Visibility** | `content-visibility: auto` + DOM recycling para listas de 200+ items |
| **Optimización de fuentes** | System font stack, `font-display: swap`, `size-adjust` cross-platform |
| **Debouncing** | Timer compartido en búsqueda: 350ms input, 400ms filtros, 300ms tags |

### Funcionalidad

| Feature | Descripción |
|---|---|
| **Dark Mode** | Toggle en sidebar, paleta Catppuccin Latte/Mocha, respeta `prefers-color-scheme` |
| **Infinite Scroll UX** | Barra de progreso tipo YouTube, back-to-top, estado "end of feed", retry en error |
| **Reacciones** | 👍❤️😂😮😢 en posts — upvote nativo de NodeBB + localStorage |
| **Compartir** | Web Share API en mobile, modal con 7 redes en desktop, clipboard con feedback |
| **Autosave** | Borrador del composer guardado cada 2s, recuperación automática, expira en 72h |
| **Autocompletado** | Sugerencias de topics en el header, historial de búsquedas, navegación por teclado |
| **Notificaciones Push** | Web Push API, banner opt-in no intrusivo, handler en Service Worker |
| **Menciones** | @usuario en el composer con dropdown de avatares y navegación por teclado |
| **Modo Lectura** | Vista limpia sin sidebar, tipografía optimizada, botón en sidebar del topic |
| **Filtros de Feed** | Filtrar posts por: Todo / Imágenes / Videos / Popular (≥5 votos) |
| **Estadísticas de Lectura** | Barra de progreso de lectura + tracking de tiempo en localStorage |
| **Carousels** | Múltiples imágenes en posts se convierten automáticamente en carousels Bootstrap |
| **Animaciones** | Sistema completo: page transitions, slide-up en cards, ripple en botones, spring easing |

### UI/UX

| Feature | Descripción |
|---|---|
| **Sidebar expandible** | Ancho 270px expandido / 64px colapsado, preferencia guardada por usuario |
| **Composer modal** | Centrado en desktop, full-screen en mobile, backdrop blur |
| **Feed estilo LinkedIn** | Tarjetas de posts con action bar, composer prompt, tabs For You / Following |
| **Topic cards Reddit** | Vote column, meta row, teaser, thumbnails, action bar |
| **Notificaciones** | Dropdown con skeleton, badge con pulse animation |
| **Login LinkedIn** | Pantalla de login con SSO, modo admin via `?admin=true` |

---

## Requisitos

- **NodeBB** `^4.0.0`
- **nodebb-theme-harmony** `^2` (peer dependency — se instala automáticamente)
- **Bun** `^1.0` (para desarrollo)

---

## Instalación

### Desde npm (recomendado para producción)

```bash
# En el directorio raíz de NodeBB
npm install @vasakgroup/nodebb-theme-vasak
./nodebb build
```

### Desde el repositorio (desarrollo)

```bash
# Clonar en la carpeta de plugins de NodeBB
cd /ruta/a/nodebb/node_modules
git clone https://github.com/vasak-group/nodebb-theme-vasak.git nodebb-theme-vasak
cd nodebb-theme-vasak
bun install
```

Luego en el ACP de NodeBB:
1. **Apariencia → Temas** → seleccionar "Vasak Community Theme"
2. Hacer clic en **Aplicar**
3. **Reconstruir** NodeBB

---

## Desarrollo

### Instalar dependencias

```bash
bun install
```

### Formatear código

```bash
# Verificar formato
bun run lint

# Aplicar formato automáticamente
bun run lint:fix
```

> El proyecto usa [Biome](https://biomejs.dev/) para formateo. La configuración está en `biome.json`.

### Compilar SCSS

NodeBB compila el SCSS automáticamente al hacer `./nodebb build`. Para desarrollo activo:

```bash
# En el directorio raíz de NodeBB
./nodebb dev
```

Los cambios en archivos `.scss` y `.tpl` se reflejan al recargar la página en modo dev.

### Flujo de trabajo recomendado

```bash
# 1. Editar archivos en scss/, templates/, public/
# 2. Reconstruir assets
./nodebb build tpl && ./nodebb build css

# 3. Para cambios en theme.js (server-side)
./nodebb build
```

---

## Estructura del proyecto

```
nodebb-theme-vasak/
│
├── scss/                          # Estilos SCSS
│   ├── overrides.scss             # Variables Bootstrap (compilado antes que Harmony)
│   ├── _tokens.scss               # CSS custom properties: paleta Catppuccin + dark mode
│   ├── _variables.scss            # SCSS bridge vars → apuntan a var(--use-*)
│   ├── _base.scss                 # Layout, tipografía base, dark mode global
│   ├── _typography.scss           # Sistema tipográfico: fluid type, @font-face, utilidades
│   ├── _header.scss               # Header sticky, search bar, autocomplete dropdown
│   ├── _buttons.scss              # Sistema de botones
│   ├── _forms.scss                # Inputs, dropdowns, modales, badges
│   ├── _cards.scss                # Topic cards estilo Reddit (vote column + content)
│   ├── _sidebar.scss              # Sidebar izquierdo, widgets
│   ├── _sidebar-user.scss         # Sección de usuario en sidebar
│   ├── _categories.scss           # Lista de categorías
│   ├── _feed.scss                 # Feed page, composer prompt, post cards
│   ├── _topic.scss                # Página de topic, posts, quick reply
│   ├── _composer.scss             # Modal del composer, autosave indicator
│   ├── _skeletons.scss            # Skeleton screens (shimmer placeholders)
│   ├── _animations.scss           # Keyframes, transiciones, micro-interactions
│   ├── _infinite-scroll.scss      # Progress bar, back-to-top, end state, load more
│   ├── _content-visibility.scss   # content-visibility: auto para listas largas
│   ├── _reactions.scss            # Sistema de reacciones en posts
│   ├── _share.scss                # Modal de compartir
│   ├── _push.scss                 # Banner de notificaciones push
│   ├── _extras.scss               # Reader mode, feed filters, reading progress
│   └── _a11y.scss                 # Accesibilidad: skip links, focus ring, sr-only
│
├── public/
│   ├── admin.js                   # Panel de administración del tema
│   └── src/client/
│       ├── search.js              # Búsqueda avanzada con debouncing
│       ├── category.js            # Página de categoría
│       ├── world.js               # Página world/categories
│       ├── topic-enhancements.js  # Carousels, bookmark fix, parent nav, hover actions
│       ├── feed-enhancements.js   # Composer prompt, category filter, share handlers
│       ├── list-enhancements.js   # Voting en topic lists
│       ├── infinite-scroll-ux.js  # Progress bar, back-to-top, end state, sentinel
│       ├── virtual-list.js        # content-visibility + DOM recycling
│       ├── reactions.js           # Reacciones rápidas en posts
│       ├── share-enhanced.js      # Web Share API + modal con redes sociales
│       ├── composer-autosave.js   # Autosave de borradores en localStorage
│       ├── search-autocomplete.js # Autocompletado en el header
│       ├── push-notifications.js  # Web Push API opt-in
│       ├── composer-mentions.js   # @menciones en el composer
│       ├── reader-mode.js         # Modo lectura limpia
│       ├── feed-filters.js        # Filtros visuales del feed
│       ├── reading-stats.js       # Progreso y estadísticas de lectura
│       └── accessibility.js       # Skip links, focus management, aria-labels
│       └── account/
│           └── categories.js      # Página de categorías del perfil
│
├── static/
│   ├── critical.css               # CSS above-the-fold (inyectado inline en <head>)
│   ├── sw.js                      # Service Worker
│   └── lib/
│       ├── theme.js               # JS cliente principal (IIFE global)
│       └── theme.css              # CSS compilado (generado por NodeBB)
│
├── templates/                     # Overrides de templates de Harmony
│   ├── feed.tpl                   # Página de feed
│   ├── topic.tpl                  # Página de topic
│   ├── login.tpl                  # Página de login (LinkedIn SSO)
│   └── partials/
│       ├── header/brand.tpl       # Header con search y notificaciones
│       ├── sidebar-left.tpl       # Sidebar con logo, nav, dark mode toggle
│       ├── topics_list.tpl        # Lista de topics estilo Reddit
│       ├── posts_list_item.tpl    # Item de post en listas
│       ├── notifications_list.tpl # Lista de notificaciones
│       └── topic/
│           ├── post.tpl           # Post individual en topic
│           └── sidebar.tpl        # Sidebar del topic
│
├── theme.js                       # Lógica server-side (hooks de NodeBB)
├── theme.scss                     # Entry point SCSS
├── theme.json                     # Metadata del tema
├── plugin.json                    # Manifest de NodeBB (hooks, módulos, scripts)
├── package.json                   # Configuración npm/bun
└── biome.json                     # Configuración de Biome (formatter)
```

---

## Sistema de diseño

### Paleta de colores (Catppuccin)

El tema usa la paleta [Catppuccin](https://catppuccin.com/) — Latte en modo claro, Mocha en modo oscuro.

```css
/* Modo claro (Latte) */
--use-primary:       #dd7878;   /* Catppuccin Red */
--use-ui-background: #eff1f5;   /* Catppuccin Base */
--use-ui-surface:    #ffffff;   /* Blanco para cards */
--use-text-main:     #4c4f69;   /* Catppuccin Text */

/* Modo oscuro (Mocha) */
--use-primary:       #eba0ac;   /* Catppuccin Flamingo */
--use-ui-background: #1e1e2e;   /* Mocha Base */
--use-ui-surface:    #313244;   /* Mocha Surface0 */
--use-text-main:     #cdd6f4;   /* Mocha Text */
```

Para cambiar la paleta, editar `scss/_tokens.scss`.

### Tokens de diseño

Todos los componentes consumen CSS custom properties. Los SCSS bridge variables en `_variables.scss` apuntan a ellas:

```scss
// En _variables.scss
$vsk-primary:   var(--use-primary);
$vsk-surface:   var(--use-ui-surface);
$vsk-text-main: var(--use-text-main);

// Spacing (estático — no cambia en dark mode)
$vsk-space-4: 16px;
$vsk-space-6: 24px;
```

### Tipografía

Sistema de fuentes nativo (cero requests de red):

```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text",
             "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif;
--font-mono: "SF Mono", "Cascadia Code", "Fira Code",
             "Consolas", "Liberation Mono", monospace;
```

Escala fluida con `clamp()`:

```css
--text-xs:   clamp(11px, 0.69rem + 0.1vw, 12px);
--text-sm:   clamp(12px, 0.75rem + 0.15vw, 13px);
--text-base: clamp(14px, 0.875rem + 0.2vw, 15px);
--text-xl:   clamp(18px, 1.1rem + 0.5vw, 22px);
```

---

## Módulos JavaScript

El JS del tema está dividido en módulos AMD que NodeBB carga bajo demanda:

| Módulo | Archivo | Se carga en |
|---|---|---|
| `forum/search` | `search.js` | Página `/search` |
| `forum/category` | `category.js` | Páginas de categoría |
| `forum/world` | `world.js` | Página `/categories` |
| `forum/topic/vasak-enhancements` | `topic-enhancements.js` | Páginas de topic |
| `forum/vasak-feed` | `feed-enhancements.js` | Página `/feed` |
| `forum/vasak-list` | `list-enhancements.js` | Listas de topics |
| `forum/vasak-scroll-ux` | `infinite-scroll-ux.js` | Global |
| `forum/vasak-virtual-list` | `virtual-list.js` | Global |
| `forum/vasak-reactions` | `reactions.js` | Topics + Feed |
| `forum/vasak-share` | `share-enhanced.js` | Global |
| `forum/vasak-autosave` | `composer-autosave.js` | Global |
| `forum/vasak-autocomplete` | `search-autocomplete.js` | Global |
| `forum/vasak-push` | `push-notifications.js` | Global |
| `forum/vasak-mentions` | `composer-mentions.js` | Global |
| `forum/vasak-reader` | `reader-mode.js` | Global |
| `forum/vasak-feed-filters` | `feed-filters.js` | Global |
| `forum/vasak-reading-stats` | `reading-stats.js` | Global |
| `forum/vasak-a11y` | `accessibility.js` | Global |

El core `static/lib/theme.js` solo contiene comportamientos globales (sidebar, dark mode, lazy loading, animaciones) y carga los módulos de página bajo demanda con `require()`.

---

## Service Worker

El SW se sirve desde `/vasak-sw.js` (raíz del origen) con el header `Service-Worker-Allowed: /`, lo que le permite interceptar todas las requests del sitio.

### Estrategias de caché

| Tipo de recurso | Estrategia | Caché |
|---|---|---|
| Assets del tema (`/plugins/@vasakgroup/nodebb-theme-vasak/`) | Cache-First | `vasak-static-v1` |
| Assets compilados NodeBB (`client.css`, `nodebb.min.js`) | Cache-First | `vasak-static-v1` |
| Fuentes (`.woff2`, `.ttf`) | Cache-First | `vasak-static-v1` |
| Imágenes | Cache-First | `vasak-images-v1` |
| Páginas HTML | Network-First | `vasak-pages-v1` |
| API GET (`/api/*`) | Stale-While-Revalidate | `vasak-pages-v1` |
| API escritura (POST/PUT/DELETE) | Network-Only | — |
| Uploads de usuarios | Network-Only | — |

### Actualizar la caché

Cambiar `CACHE_VERSION` en `static/sw.js`:

```js
const CACHE_VERSION = "v2"; // era "v1"
```

Al hacer deploy, el SW detecta la nueva versión, activa `SKIP_WAITING` y recarga la página automáticamente.

---

## Notificaciones Push

Las notificaciones push requieren VAPID keys. Generarlas con:

```bash
# Instalar web-push globalmente
bun add -g web-push

# Generar el par de claves
bunx web-push generate-vapid-keys
```

Configurar las variables de entorno en NodeBB:

```bash
# En el entorno donde corre NodeBB
export VAPID_PUBLIC_KEY="tu_clave_publica_aqui"
export VAPID_PRIVATE_KEY="tu_clave_privada_aqui"
```

O en el archivo de configuración de NodeBB (`config.json`):

```json
{
  "vapid_public_key": "tu_clave_publica_aqui",
  "vapid_private_key": "tu_clave_privada_aqui"
}
```

> Si `VAPID_PUBLIC_KEY` no está configurada, el endpoint `/vasak-push/vapid-public-key` devuelve 503 y el módulo de push se desactiva silenciosamente. El resto del tema funciona con normalidad.

---

## Dark Mode

El dark mode se activa añadiendo la clase `.dark` al elemento `<html>`. El JS en `static/lib/theme.js` gestiona:

1. **Preferencia guardada** en `localStorage` con la key `vasak:theme`
2. **Fallback al sistema** via `prefers-color-scheme: dark` si no hay preferencia guardada
3. **Toggle manual** con el botón en el sidebar (ícono luna/sol)

```js
// Activar dark mode programáticamente
document.documentElement.classList.add("dark");
localStorage.setItem("vasak:theme", "dark");

// Desactivar
document.documentElement.classList.remove("dark");
document.documentElement.classList.add("light");
localStorage.setItem("vasak:theme", "light");
```

---

## Personalización

### Cambiar colores de marca

Editar `scss/_tokens.scss`:

```scss
:root {
  --primary:      #dd7878;   // Color primario (modo claro)
  --primary-dark: #eba0ac;   // Color primario (modo oscuro)
}
```

### Agregar un componente nuevo

1. Crear `scss/_micomponente.scss`
2. Importar en `theme.scss`:
   ```scss
   @import "./scss/micomponente";
   ```
3. Reconstruir: `./nodebb build css`

### Agregar un módulo JS nuevo

1. Crear `public/src/client/mi-modulo.js` como módulo AMD:
   ```js
   define("forum/mi-modulo", [], function () {
     var MiModulo = {};
     MiModulo.init = function () { /* ... */ };
     return MiModulo;
   });
   ```
2. Registrar en `plugin.json`:
   ```json
   "modules": {
     "forum/mi-modulo": "public/src/client/mi-modulo.js"
   }
   ```
3. Cargar desde `static/lib/theme.js`:
   ```js
   require(["forum/mi-modulo"], function (mod) {
     mod.init();
   });
   ```

### Sobrescribir un template de Harmony

1. Copiar el template desde `node_modules/nodebb-theme-harmony/templates/`
2. Pegarlo en `templates/` manteniendo la misma ruta relativa
3. Hacer los cambios necesarios
4. Reconstruir: `./nodebb build tpl`

---

## Despliegue

### Opción 1: npm (recomendado)

```bash
# Publicar en npm
bun publish

# Instalar en NodeBB
npm install @vasakgroup/nodebb-theme-vasak
./nodebb build
```

### Opción 2: Subida directa al ACP

```bash
# Empaquetar (excluir node_modules y .git)
bun run pack  # o: npm pack
```

Luego en el ACP: **Extender → Instalar plugins → Subir plugin** → seleccionar el `.tgz`.

### Opción 3: Desde GitHub

En el ACP de NodeBB: **Extender → Instalar plugins** → ingresar `vasak-group/nodebb-theme-vasak`.

---

## Solución de problemas

### El tema no se aplica

1. Verificar que está activado en **Apariencia → Temas**
2. Reconstruir NodeBB: `./nodebb build`
3. Limpiar caché del navegador (`Ctrl+Shift+R`)

### Los estilos no se actualizan

```bash
# Reconstruir solo CSS
./nodebb build css

# Reconstruir todo
./nodebb build
```

### El Service Worker no se registra

El SW requiere HTTPS (o `localhost`). En desarrollo local con HTTP, el SW no se registra — esto es comportamiento esperado del navegador.

Para forzar el registro en desarrollo:
```
chrome://flags/#unsafely-treat-insecure-origin-as-secure
```

### Error de dependencias

```bash
bun install
```

### Resetear caché del Service Worker

Desde la consola del navegador:

```js
// Limpiar todas las cachés del tema
navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHE" });
```

O desde DevTools: **Application → Storage → Clear site data**.

---

## Contribuir

```bash
# Fork + clonar
git clone https://github.com/vasak-group/nodebb-theme-vasak.git
cd nodebb-theme-vasak
bun install

# Crear rama
git checkout -b feature/mi-mejora

# Formatear antes de commitear
bun run lint:fix

# Commit y PR
git add .
git commit -m "feat: descripción de la mejora"
git push origin feature/mi-mejora
```

---

## Licencia

MIT — libre para usar, modificar y distribuir.

---

**Construido con ❤️ para [Vasak Community](https://vasak.net.ar)**
