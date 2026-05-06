"use strict";

/**
 * Vasak Accessibility
 * ===================
 * Mejoras de accesibilidad (A11y) para el tema:
 *
 *  - Skip links: "Saltar al contenido" y "Saltar a la navegación"
 *  - Focus management en navegación SPA (mover foco a #content)
 *  - Anunciar cambios de página a lectores de pantalla (aria-live)
 *  - Mejorar aria-labels en botones sin texto visible
 *  - Trap de foco en modales (composer, share modal)
 */
define("vasak/a11y", [], function () {
	var A11y = {};

	A11y.init = function () {
		injectSkipLinks();
		injectLiveRegion();
		improveButtonLabels();
		manageFocusOnNavigation();

		// Re-aplicar en navegación SPA
		$(window).on("action:ajaxify.end", function () {
			improveButtonLabels();
		});
	};

	// ── Skip links ─────────────────────────────────────────────────────────

	function injectSkipLinks() {
		if ($("#vasak-skip-links").length) return;

		var $links = $(
			'<div id="vasak-skip-links">' +
				'<a href="#content" class="vasak-skip-link">Saltar al contenido</a>' +
				'<a href="#main-nav" class="vasak-skip-link">Saltar a la navegación</a>' +
				"</div>",
		);

		$("body").prepend($links);

		// Asegurar que #content tenga tabindex para recibir foco
		if (!$("#content").attr("tabindex")) {
			$("#content").attr("tabindex", "-1");
		}
	}

	// ── Live region para anuncios ──────────────────────────────────────────

	function injectLiveRegion() {
		if ($("#vasak-live-region").length) return;

		$("body").append(
			'<div id="vasak-live-region" aria-live="polite" aria-atomic="true" class="sr-only"></div>',
		);
	}

	function announce(message) {
		var $region = $("#vasak-live-region");
		$region.text(""); // reset para que el cambio sea detectado
		setTimeout(function () {
			$region.text(message);
		}, 50);
	}

	// ── Focus management en SPA ────────────────────────────────────────────

	function manageFocusOnNavigation() {
		$(window).on("action:ajaxify.end", function () {
			// Mover foco al contenido principal después de navegar
			setTimeout(function () {
				var $content = $("#content");
				if ($content.length) {
					$content.attr("tabindex", "-1").trigger("focus");
					// Anunciar el nuevo título de página
					var title = document.title.split(" | ")[0];
					announce("Navegaste a: " + title);
				}
			}, 100);
		});
	}

	// ── Mejorar aria-labels ────────────────────────────────────────────────

	function improveButtonLabels() {
		// Botones de vote sin texto visible
		$('[component="post/upvote"]:not([aria-label])').attr(
			"aria-label",
			"Votar a favor",
		);
		$('[component="post/downvote"]:not([aria-label])').attr(
			"aria-label",
			"Votar en contra",
		);
		$('[component="post/bookmark"]:not([aria-label])').attr(
			"aria-label",
			"Guardar post",
		);
		$('[component="post/reply"]:not([aria-label])').attr(
			"aria-label",
			"Responder",
		);
		$('[component="post/quote"]:not([aria-label])').attr("aria-label", "Citar");

		// Botones de vote en topic list
		$(".vote-btn.vote-up:not([aria-label])").attr(
			"aria-label",
			"Votar a favor",
		);
		$(".vote-btn.vote-down:not([aria-label])").attr(
			"aria-label",
			"Votar en contra",
		);

		// Imágenes sin alt
		$("img:not([alt])").attr("alt", "");

		// Links sin texto visible (solo ícono)
		$("a:not([aria-label])").each(function () {
			var $a = $(this);
			if ($a.text().trim() === "" && $a.find("img").length === 0) {
				var title = $a.attr("title");
				if (title) $a.attr("aria-label", title);
			}
		});

		// Timeago elements
		$(".timeago:not([aria-label])").each(function () {
			var title = $(this).attr("title");
			if (title) $(this).attr("aria-label", title);
		});
	}

	return A11y;
});
