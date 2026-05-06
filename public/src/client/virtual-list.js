"use strict";

/**
 * Vasak Virtual List
 * ==================
 * Optimización de rendering para listas largas en NodeBB.
 *
 * ESTRATEGIA:
 *
 * 1. content-visibility: auto (CSS, en _content-visibility.scss)
 *    El navegador omite el rendering de elementos fuera del viewport.
 *    Cero JS, cero riesgo de romper handlers de NodeBB.
 *    Soporte: Chrome 85+, Edge 85+, Firefox 125+, Safari 18+
 *
 * 2. DOM Recycling suave (este módulo, solo para listas 200+ items)
 *    Para listas muy largas donde content-visibility no es suficiente,
 *    ocultamos items lejanos con visibility:hidden + height preservada.
 *    Esto mantiene el layout (scrollbar correcto) pero libera memoria
 *    de GPU y reduce el trabajo del compositor.
 *
 *    IMPORTANTE: No removemos elementos del DOM — eso rompería los
 *    handlers de NodeBB (voting, bookmarks, timeago, etc.).
 *    Solo cambiamos visibility, que es reversible y no afecta eventos.
 *
 * 3. Intersection Observer para activar/desactivar items
 *    Cada item se observa. Al salir del viewport + buffer, se oculta.
 *    Al entrar, se muestra. El buffer evita flashes al hacer scroll rápido.
 */
define("forum/vasak-virtual-list", [], function () {
	var VirtualList = {};

	// ── Configuración ──────────────────────────────────────────────────────
	var DOM_RECYCLE_THRESHOLD = 200; // items antes de activar DOM recycling
	var RECYCLE_BUFFER = "600px"; // buffer fuera del viewport antes de ocultar
	var RECYCLE_ATTR = "data-vasak-recycled";
	var MEASURE_INTERVAL = 5000; // ms entre mediciones de performance

	// ── Estado ────────────────────────────────────────────────────────────
	var recycleObserver = null;
	var perfObserver = null;
	var activeContainers = new WeakSet();

	// ── Init ───────────────────────────────────────────────────────────────

	VirtualList.init = function () {
		// Verificar soporte de content-visibility
		logContentVisibilitySupport();

		// Inicializar en la página actual
		initForCurrentPage();

		// Re-inicializar en navegación SPA
		$(window).on("action:ajaxify.end", function () {
			setTimeout(initForCurrentPage, 200);
		});

		// Re-evaluar cuando se cargan más items
		$(window).on("action:posts.loaded action:topics.loaded", function () {
			setTimeout(initForCurrentPage, 300);
		});
	};

	// ── Detección de página y activación ──────────────────────────────────

	function initForCurrentPage() {
		// Feed page
		var $feedList = $('[component="posts"]');
		if ($feedList.length && !activeContainers.has($feedList[0])) {
			initContainer($feedList, "li[component='post']");
		}

		// Category / list pages
		var $topicList = $('[component="category"]');
		if ($topicList.length && !activeContainers.has($topicList[0])) {
			initContainer($topicList, "li[component='category/topic']");
		}

		// Topic page (posts individuales)
		var $postList = $('[component="topic"]');
		if ($postList.length && !activeContainers.has($postList[0])) {
			initContainer($postList, "li[component='post']");
		}
	}

	function initContainer($container, itemSelector) {
		if (!$container.length) return;

		activeContainers.add($container[0]);

		var items = $container.find(itemSelector);
		var count = items.length;

		// Solo activar DOM recycling si hay suficientes items
		if (count >= DOM_RECYCLE_THRESHOLD) {
			activateDOMRecycling($container, itemSelector);
		}

		// Medir performance si está disponible
		if (window.PerformanceObserver) {
			measureLayoutShift($container[0]);
		}
	}

	// ── DOM Recycling ──────────────────────────────────────────────────────

	function activateDOMRecycling($container, itemSelector) {
		if (!("IntersectionObserver" in window)) return;

		// Desconectar observer anterior si existe
		if (recycleObserver) {
			recycleObserver.disconnect();
		}

		recycleObserver = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					var el = entry.target;

					if (entry.isIntersecting) {
						// Elemento entrando al viewport — mostrar
						showItem(el);
					} else {
						// Elemento saliendo del viewport — ocultar (solo si ya fue visible)
						// Usamos un pequeño delay para evitar ocultar items que acaban de entrar
						if (el.getAttribute(RECYCLE_ATTR) === "visible") {
							hideItem(el);
						}
					}
				});
			},
			{
				// Buffer generoso para pre-renderizar antes de que el usuario llegue
				rootMargin: RECYCLE_BUFFER,
				threshold: 0,
			},
		);

		// Observar todos los items excepto los primeros 3 (above the fold)
		var items = $container.find(itemSelector).toArray();
		items.forEach(function (el, index) {
			if (index < 3) {
				// Primeros items siempre visibles
				el.setAttribute(RECYCLE_ATTR, "visible");
				return;
			}
			recycleObserver.observe(el);
		});
	}

	function hideItem(el) {
		// Guardar altura actual para preservar el layout
		var currentHeight = el.offsetHeight;
		if (currentHeight > 0) {
			el.style.minHeight = currentHeight + "px";
		}

		// Ocultar contenido sin remover del DOM
		// visibility:hidden preserva el espacio y los event listeners
		el.style.visibility = "hidden";
		el.style.overflow = "hidden";
		el.setAttribute(RECYCLE_ATTR, "hidden");
	}

	function showItem(el) {
		// Restaurar visibilidad
		el.style.visibility = "";
		el.style.overflow = "";
		el.style.minHeight = "";
		el.setAttribute(RECYCLE_ATTR, "visible");
	}

	// ── Métricas de performance ────────────────────────────────────────────

	function logContentVisibilitySupport() {
		var supported = CSS.supports("content-visibility", "auto");
		if (!supported) {
			console.info(
				"[Vasak] content-visibility: auto no soportado en este navegador. " +
					"El DOM recycling JS está activo como fallback.",
			);
		}
	}

	function measureLayoutShift(containerEl) {
		if (!window.PerformanceObserver) return;

		// Medir Cumulative Layout Shift (CLS) en la lista
		try {
			var clsValue = 0;
			var clsEntries = [];

			var observer = new PerformanceObserver(function (list) {
				list.getEntries().forEach(function (entry) {
					// Solo contar shifts que no son causados por interacción del usuario
					if (!entry.hadRecentInput) {
						clsValue += entry.value;
						clsEntries.push(entry);
					}
				});
			});

			observer.observe({ type: "layout-shift", buffered: true });

			// Reportar después de un tiempo
			setTimeout(function () {
				observer.disconnect();
				if (clsValue > 0.1) {
					console.warn(
						"[Vasak] CLS alto detectado en lista: " +
							clsValue.toFixed(3) +
							". Considera ajustar contain-intrinsic-size en _content-visibility.scss",
					);
				}
			}, MEASURE_INTERVAL);
		} catch (e) {
			// PerformanceObserver puede fallar en algunos contextos
		}
	}

	// ── Cleanup ────────────────────────────────────────────────────────────

	VirtualList.destroy = function () {
		if (recycleObserver) {
			recycleObserver.disconnect();
			recycleObserver = null;
		}

		// Restaurar todos los items ocultos
		$("[" + RECYCLE_ATTR + "='hidden']").each(function () {
			showItem(this);
		});
	};

	// Limpiar al navegar a otra página
	$(window).on("action:ajaxify.start", function () {
		VirtualList.destroy();
		activeContainers = new WeakSet();
	});

	return VirtualList;
});
