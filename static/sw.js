/**
 * Vasak Community Theme — Service Worker
 * =======================================
 * Estrategia de caché por tipo de recurso:
 *
 *  STATIC ASSETS (CSS, JS, fonts, images del tema)
 *    → Cache-First: sirve desde caché, actualiza en background
 *
 *  PÁGINAS HTML / navegación SPA
 *    → Network-First: intenta red, cae a caché si offline
 *
 *  API NodeBB (/api/*, /api/v3/*)
 *    → Network-Only para escrituras (POST/PUT/DELETE)
 *    → Stale-While-Revalidate para lecturas GET no críticas
 *
 *  Todo lo demás
 *    → Network-First con fallback a caché
 *
 * Versioning: cambiar CACHE_VERSION fuerza limpieza de cachés viejas.
 */

"use strict";

// ── Versión ────────────────────────────────────────────────────────────────
// Incrementar cuando cambie el contenido de los assets cacheados.
const CACHE_VERSION = "v1";

// Nombres de caché por categoría
const CACHE_STATIC  = `vasak-static-${CACHE_VERSION}`;
const CACHE_PAGES   = `vasak-pages-${CACHE_VERSION}`;
const CACHE_IMAGES  = `vasak-images-${CACHE_VERSION}`;

// Todas las cachés que este SW gestiona (para limpiar versiones viejas)
const ALL_CACHES = [CACHE_STATIC, CACHE_PAGES, CACHE_IMAGES];

// ── Assets a pre-cachear en install ───────────────────────────────────────
// Solo assets que sabemos que existen y son estables.
// Los assets de NodeBB (client.css, nodebb.min.js) NO se pre-cachean
// porque sus URLs cambian con cada rebuild (query string con hash).
const PRECACHE_ASSETS = [
	// Logos del tema (rutas relativas al origen, no al SW)
	"/plugins/nodebb-theme-vasak/static/images/logo-icon.png",
	"/plugins/nodebb-theme-vasak/static/images/logo-full.png",
];

// ── Patrones de URL ────────────────────────────────────────────────────────
const PATTERNS = {
	// Assets estáticos del tema Vasak
	themeStatic: /\/plugins\/nodebb-theme-vasak\/static\//,

	// Assets compilados de NodeBB (CSS/JS con hash en query string)
	nodeBBAssets: /\/assets\/(client\.css|nodebb\.min\.js|vendor\.min\.js|stylesheet\.css)/,

	// Fuentes (Google Fonts, etc.)
	fonts: /\.(woff2?|ttf|eot|otf)(\?|$)/i,

	// Imágenes de uploads de usuarios — NO cachear (contenido dinámico)
	userUploads: /\/assets\/uploads\//,

	// API calls
	apiWrite: /^(POST|PUT|DELETE|PATCH)$/,
	apiRead:  /\/api\/(v3\/)?(?!admin)/,  // API de lectura, excluye admin

	// Páginas HTML (navegación)
	htmlPage: /text\/html/,
};

// ── INSTALL ────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_STATIC)
			.then((cache) => {
				// Pre-cachear solo los assets que existen con certeza
				// Usamos addAll con manejo de errores individual para no
				// bloquear la instalación si algún asset no existe aún
				return Promise.allSettled(
					PRECACHE_ASSETS.map((url) =>
						cache.add(url).catch((err) => {
							console.warn(`[SW] No se pudo pre-cachear ${url}:`, err.message);
						}),
					),
				);
			})
			.then(() => {
				// Activar inmediatamente sin esperar a que cierren las pestañas viejas
				return self.skipWaiting();
			}),
	);
});

// ── ACTIVATE ───────────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((name) => {
							// Eliminar cachés de versiones anteriores de este SW
							const isOurCache =
								name.startsWith("vasak-static-") ||
								name.startsWith("vasak-pages-") ||
								name.startsWith("vasak-images-");
							const isCurrentVersion = ALL_CACHES.includes(name);
							return isOurCache && !isCurrentVersion;
						})
						.map((name) => {
							console.log(`[SW] Eliminando caché vieja: ${name}`);
							return caches.delete(name);
						}),
				);
			})
			.then(() => {
				// Tomar control de todas las pestañas abiertas inmediatamente
				return self.clients.claim();
			}),
	);
});

// ── FETCH ──────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
	const { request } = event;
	const url = new URL(request.url);

	// ── 1. Ignorar requests que no son GET o no son del mismo origen ────────
	if (request.method !== "GET") {
		return; // Dejar pasar sin interceptar (escrituras siempre a la red)
	}

	if (url.origin !== self.location.origin) {
		return; // No cachear recursos de terceros (CDNs, etc.)
	}

	// ── 2. Ignorar uploads de usuarios (contenido dinámico) ─────────────────
	if (PATTERNS.userUploads.test(url.pathname)) {
		return;
	}

	// ── 3. API calls de lectura → Stale-While-Revalidate ────────────────────
	if (PATTERNS.apiRead.test(url.pathname)) {
		event.respondWith(staleWhileRevalidate(request, CACHE_PAGES));
		return;
	}

	// ── 4. Assets estáticos del tema → Cache-First ──────────────────────────
	if (PATTERNS.themeStatic.test(url.pathname)) {
		event.respondWith(cacheFirst(request, CACHE_STATIC));
		return;
	}

	// ── 5. Assets compilados de NodeBB (CSS/JS) → Cache-First ───────────────
	// NodeBB versiona estos archivos con ?v=hash en el query string,
	// así que una URL diferente = asset diferente = siempre fresco.
	if (PATTERNS.nodeBBAssets.test(url.pathname)) {
		event.respondWith(cacheFirst(request, CACHE_STATIC));
		return;
	}

	// ── 6. Fuentes → Cache-First (muy estables) ──────────────────────────────
	if (PATTERNS.fonts.test(url.pathname)) {
		event.respondWith(cacheFirst(request, CACHE_STATIC));
		return;
	}

	// ── 7. Imágenes genéricas → Cache-First con límite de tamaño ────────────
	if (/\.(png|jpg|jpeg|gif|webp|svg|ico)(\?|$)/i.test(url.pathname)) {
		event.respondWith(cacheFirst(request, CACHE_IMAGES));
		return;
	}

	// ── 8. Páginas HTML / navegación → Network-First ────────────────────────
	if (request.headers.get("accept")?.includes("text/html")) {
		event.respondWith(networkFirst(request, CACHE_PAGES));
		return;
	}

	// ── 9. Todo lo demás → Network-First ────────────────────────────────────
	event.respondWith(networkFirst(request, CACHE_PAGES));
});

// ── ESTRATEGIAS DE CACHÉ ───────────────────────────────────────────────────

/**
 * Cache-First
 * Sirve desde caché si existe. Si no, va a la red y guarda la respuesta.
 * Ideal para assets estáticos con URLs versionadas.
 */
async function cacheFirst(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);

	if (cached) {
		return cached;
	}

	try {
		const response = await fetch(request);
		// Solo cachear respuestas válidas (no errores, no opaque responses de terceros)
		if (response.ok && response.status === 200) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (err) {
		console.warn("[SW] Cache-First: red no disponible para", request.url);
		// Sin fallback para assets — el navegador mostrará el error nativo
		throw err;
	}
}

/**
 * Network-First
 * Intenta la red primero. Si falla (offline), sirve desde caché.
 * Ideal para páginas HTML donde el contenido fresco es prioritario.
 */
async function networkFirst(request, cacheName) {
	const cache = await caches.open(cacheName);

	try {
		const response = await fetch(request);
		if (response.ok) {
			cache.put(request, response.clone());
		}
		return response;
	} catch (err) {
		const cached = await cache.match(request);
		if (cached) {
			console.log("[SW] Network-First: sirviendo desde caché (offline)", request.url);
			return cached;
		}
		throw err;
	}
}

/**
 * Stale-While-Revalidate
 * Sirve desde caché inmediatamente (si existe) y actualiza en background.
 * Si no hay caché, va a la red y guarda.
 * Ideal para API calls de lectura donde la velocidad importa más que la frescura.
 */
async function staleWhileRevalidate(request, cacheName) {
	const cache = await caches.open(cacheName);
	const cached = await cache.match(request);

	// Lanzar fetch en background siempre (para mantener caché actualizada)
	const fetchPromise = fetch(request)
		.then((response) => {
			if (response.ok) {
				cache.put(request, response.clone());
			}
			return response;
		})
		.catch(() => null); // Silenciar errores de red en background

	// Servir caché inmediatamente si existe, sino esperar la red
	return cached || fetchPromise;
}

// ── MENSAJES DESDE EL CLIENTE ──────────────────────────────────────────────
self.addEventListener("message", (event) => {
	if (!event.data) return;

	switch (event.data.type) {
		// Forzar actualización del SW (llamado desde theme.js al hacer deploy)
		case "SKIP_WAITING":
			self.skipWaiting();
			break;

		// Limpiar todas las cachés (útil para debug o al cambiar de versión)
		case "CLEAR_CACHE":
			event.waitUntil(
				Promise.all(ALL_CACHES.map((name) => caches.delete(name))).then(() => {
					event.ports[0]?.postMessage({ success: true });
				}),
			);
			break;

		// Reportar estado de las cachés
		case "GET_CACHE_STATUS":
			event.waitUntil(
				Promise.all(
					ALL_CACHES.map(async (name) => {
						const cache = await caches.open(name);
						const keys = await cache.keys();
						return { name, count: keys.length };
					}),
				).then((status) => {
					event.ports[0]?.postMessage({ caches: status });
				}),
			);
			break;
	}
});
