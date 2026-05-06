"use strict";

/**
 * Vasak Prefetch
 * ==============
 * Prefetch inteligente: al hacer hover sobre un link de topic/categoría
 * por más de 200ms, inyecta <link rel="prefetch"> para que el navegador
 * descargue la página en background.
 *
 * Resultado: la navegación se siente instantánea porque el HTML ya está
 * en caché cuando el usuario hace click.
 *
 * Solo prefetchea links internos del foro (no externos).
 * Respeta Save-Data y conexiones lentas.
 */
define("forum/vasak-prefetch", [], function () {
	var Prefetch = {};

	var HOVER_DELAY = 200; // ms de hover antes de prefetchear
	var MAX_PREFETCH = 10; // máximo de páginas prefetcheadas por sesión
	var prefetched = new Set();
	var hoverTimer = null;

	Prefetch.init = function () {
		// No prefetchear en conexiones lentas o con Save-Data
		if (shouldSkip()) return;

		// Delegación de eventos — cubre links dinámicos
		$(document).on("mouseenter.vasak-prefetch", "a[href]", onLinkEnter);
		$(document).on("mouseleave.vasak-prefetch", "a[href]", onLinkLeave);

		// También en touch (touchstart con 300ms)
		$(document).on("touchstart.vasak-prefetch", "a[href]", function () {
			var href = resolveHref($(this));
			if (href) schedulePrefetch(href, 300);
		});
	};

	function onLinkEnter() {
		var href = resolveHref($(this));
		if (href) schedulePrefetch(href, HOVER_DELAY);
	}

	function onLinkLeave() {
		clearTimeout(hoverTimer);
	}

	function schedulePrefetch(href, delay) {
		clearTimeout(hoverTimer);
		hoverTimer = setTimeout(function () {
			doPrefetch(href);
		}, delay);
	}

	function doPrefetch(href) {
		if (prefetched.has(href)) return;
		if (prefetched.size >= MAX_PREFETCH) return;

		prefetched.add(href);

		// Usar <link rel="prefetch"> — el navegador lo descarga con baja prioridad
		var link = document.createElement("link");
		link.rel = "prefetch";
		link.href = href;
		link.as = "document";
		document.head.appendChild(link);
	}

	function resolveHref($a) {
		var href = $a.attr("href");
		if (
			!href ||
			href === "#" ||
			href.startsWith("mailto:") ||
			href.startsWith("javascript:")
		) {
			return null;
		}

		// Solo links internos
		try {
			var url = new URL(href, window.location.origin);
			if (url.origin !== window.location.origin) return null;

			// Solo prefetchear páginas de contenido (topic, category, feed, etc.)
			var path = url.pathname;
			var isContent =
				path.includes("/topic/") ||
				path.includes("/category/") ||
				path === "/feed" ||
				path === "/recent" ||
				path === "/unread" ||
				path === "/popular";

			return isContent ? url.href : null;
		} catch (e) {
			return null;
		}
	}

	function shouldSkip() {
		// Save-Data header
		if (navigator.connection && navigator.connection.saveData) return true;
		// Conexión lenta (2G/slow-2G)
		if (
			navigator.connection &&
			["slow-2g", "2g"].includes(navigator.connection.effectiveType)
		)
			return true;
		// No soporta prefetch
		if (
			!document.createElement("link").relList ||
			!document.createElement("link").relList.supports("prefetch")
		)
			return false;
		return false;
	}

	return Prefetch;
});
