"use strict";

/**
 * Vasak Keyboard Shortcuts
 * ========================
 * Atajos de teclado para power users.
 *
 * ATAJOS:
 *   ?        → Mostrar/ocultar cheatsheet
 *   /        → Enfocar la búsqueda del header
 *   n        → Abrir el composer (nueva discusión)
 *   r        → Responder al post activo (en topic)
 *   j / k    → Navegar entre posts/topics (abajo/arriba)
 *   g h      → Ir al home (feed)
 *   g s      → Ir a búsqueda
 *   Escape   → Cerrar modales/dropdowns
 *
 * Los atajos se desactivan cuando el foco está en un input/textarea.
 */
define("forum/vasak-shortcuts", [], function () {
	var Shortcuts = {};

	var STORAGE_KEY = "vasak:shortcuts:enabled";
	var enabled = true;
	var cheatsheetVisible = false;
	var gBuffer = false; // para secuencias tipo "g h"

	Shortcuts.init = function () {
		try {
			enabled = localStorage.getItem(STORAGE_KEY) !== "false";
		} catch (e) {}

		document.addEventListener("keydown", onKeydown);
		injectCheatsheet();
	};

	// ── Handler principal ──────────────────────────────────────────────────

	function onKeydown(e) {
		if (!enabled) return;

		// No activar si el foco está en un campo de texto
		var tag = document.activeElement && document.activeElement.tagName;
		if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
		if (document.activeElement && document.activeElement.isContentEditable)
			return;

		// No activar con modificadores (Ctrl, Alt, Meta)
		if (e.ctrlKey || e.altKey || e.metaKey) return;

		var key = e.key;

		// ── Secuencias "g + X" ─────────────────────────────────────────────
		if (gBuffer) {
			gBuffer = false;
			if (key === "h") {
				e.preventDefault();
				ajaxify.go("feed");
				return;
			}
			if (key === "s") {
				e.preventDefault();
				ajaxify.go("search");
				return;
			}
			if (key === "r") {
				e.preventDefault();
				ajaxify.go("recent");
				return;
			}
			if (key === "u") {
				e.preventDefault();
				ajaxify.go("unread");
				return;
			}
			return;
		}

		switch (key) {
			case "?":
				e.preventDefault();
				toggleCheatsheet();
				break;

			case "/":
				e.preventDefault();
				focusSearch();
				break;

			case "n":
				e.preventDefault();
				openComposer();
				break;

			case "r":
				// Solo en páginas de topic
				if ($('[component="topic"]').length) {
					e.preventDefault();
					clickReply();
				}
				break;

			case "j":
				e.preventDefault();
				navigatePosts(1);
				break;

			case "k":
				e.preventDefault();
				navigatePosts(-1);
				break;

			case "g":
				gBuffer = true;
				// Limpiar el buffer si no viene una segunda tecla en 1s
				setTimeout(function () {
					gBuffer = false;
				}, 1000);
				break;

			case "Escape":
				closeModals();
				break;
		}
	}

	// ── Acciones ───────────────────────────────────────────────────────────

	function focusSearch() {
		var $input = $(
			'[data-widget-area="brand-header"] input[type="text"], ' +
				'.search-widget input[type="text"]',
		).first();
		if ($input.length) {
			$input.trigger("focus").select();
		}
	}

	function openComposer() {
		var $btn = $("#new_topic");
		if ($btn.length) {
			$btn.trigger("click");
		} else {
			// Fallback: navegar al composer via URL
			var cid =
				typeof ajaxify !== "undefined" && ajaxify.data && ajaxify.data.cid;
			if (cid) {
				ajaxify.go("compose?cid=" + cid);
			}
		}
	}

	function clickReply() {
		$('[component="topic/reply"]').first().trigger("click");
	}

	var currentPostIndex = -1;

	function navigatePosts(direction) {
		var $posts = $('[component="category/topic"], [component="post"]');
		if (!$posts.length) return;

		currentPostIndex = Math.max(
			0,
			Math.min($posts.length - 1, currentPostIndex + direction),
		);

		var $target = $posts.eq(currentPostIndex);
		if (!$target.length) return;

		// Scroll suave al post
		var headerH = $(".brand-container").outerHeight() || 56;
		var top = $target.offset().top - headerH - 16;
		$("html, body").animate({ scrollTop: top }, 200);

		// Highlight visual
		$posts.removeClass("vasak-shortcut-focused");
		$target.addClass("vasak-shortcut-focused");
	}

	function closeModals() {
		// Cerrar dropdowns de Bootstrap
		$(".dropdown-menu.show").each(function () {
			$(this).closest(".dropdown").find(".dropdown-toggle").dropdown("hide");
		});
		// Cerrar modales de Vasak
		$(".vasak-share-overlay").remove();
		$("body").removeClass("vasak-share-open");
		// Cerrar cheatsheet
		if (cheatsheetVisible) toggleCheatsheet();
	}

	// ── Cheatsheet ─────────────────────────────────────────────────────────

	function injectCheatsheet() {
		if (document.getElementById("vasak-shortcuts-modal")) return;

		var shortcuts = [
			["?", "Mostrar/ocultar esta ayuda"],
			["/", "Enfocar búsqueda"],
			["n", "Nueva discusión"],
			["r", "Responder (en topic)"],
			["j / k", "Navegar posts (abajo/arriba)"],
			["g h", "Ir al feed"],
			["g s", "Ir a búsqueda"],
			["g r", "Ir a recientes"],
			["g u", "Ir a no leídos"],
			["Esc", "Cerrar modales"],
		];

		var rows = shortcuts
			.map(function (s) {
				return "<tr><td><kbd>" + s[0] + "</kbd></td><td>" + s[1] + "</td></tr>";
			})
			.join("");

		var $modal = $(
			'<div id="vasak-shortcuts-modal" class="vasak-shortcuts-modal" role="dialog" aria-modal="true" aria-label="Atajos de teclado" hidden>' +
				'<div class="vasak-shortcuts-backdrop"></div>' +
				'<div class="vasak-shortcuts-content">' +
				'<div class="vasak-shortcuts-header">' +
				"<h2>Atajos de teclado</h2>" +
				'<button class="vasak-shortcuts-close" aria-label="Cerrar">×</button>' +
				"</div>" +
				'<table class="vasak-shortcuts-table"><tbody>' +
				rows +
				"</tbody></table>" +
				'<p class="vasak-shortcuts-footer">Activar/desactivar: <kbd>?</kbd></p>' +
				"</div>" +
				"</div>",
		);

		$modal
			.find(".vasak-shortcuts-backdrop, .vasak-shortcuts-close")
			.on("click", toggleCheatsheet);
		$("body").append($modal);
	}

	function toggleCheatsheet() {
		cheatsheetVisible = !cheatsheetVisible;
		var $modal = $("#vasak-shortcuts-modal");
		if (cheatsheetVisible) {
			$modal.removeAttr("hidden").addClass("vasak-shortcuts-visible");
			$modal.find(".vasak-shortcuts-close").trigger("focus");
		} else {
			$modal.removeClass("vasak-shortcuts-visible");
			setTimeout(function () {
				$modal.attr("hidden", "");
			}, 200);
		}
	}

	return Shortcuts;
});
