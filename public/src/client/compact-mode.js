"use strict";

/**
 * Vasak Compact Mode
 * ==================
 * Toggle entre vista normal y compacta en el feed y listas de topics.
 * Vista compacta: solo título + meta, sin preview de contenido ni imágenes.
 * Estado persistido en localStorage.
 */
define("forum/vasak-compact", [], function () {
	var Compact = {};

	var STORAGE_KEY = "vasak:compact-mode";
	var isCompact = false;

	Compact.init = function () {
		try {
			isCompact = localStorage.getItem(STORAGE_KEY) === "true";
		} catch (e) {}

		applyMode(isCompact, false); // sin animación en la carga inicial
		injectToggle();

		$(window).on("action:ajaxify.end", function () {
			injectToggle();
			applyMode(isCompact, false);
		});
	};

	function injectToggle() {
		if ($(".vasak-compact-toggle").length) return;

		// Solo en feed y listas de topics
		var inFeed = $(".feed").length > 0;
		var inTopics = $('[component="category"]').length > 0;
		if (!inFeed && !inTopics) return;

		var $btn = $(
			'<button class="vasak-compact-toggle btn btn-ghost btn-sm" type="button" ' +
				'title="' +
				(isCompact ? "Vista normal" : "Vista compacta") +
				'" ' +
				'aria-label="' +
				(isCompact ? "Vista normal" : "Vista compacta") +
				'">' +
				'<i class="fa ' +
				(isCompact ? "fa-th-large" : "fa-list") +
				'" aria-hidden="true"></i>' +
				"</button>",
		);

		$btn.on("click", function () {
			isCompact = !isCompact;
			try {
				localStorage.setItem(STORAGE_KEY, isCompact ? "true" : "false");
			} catch (e) {}
			applyMode(isCompact, true);
			$btn
				.attr("title", isCompact ? "Vista normal" : "Vista compacta")
				.attr("aria-label", isCompact ? "Vista normal" : "Vista compacta")
				.find("i")
				.attr("class", "fa " + (isCompact ? "fa-th-large" : "fa-list"));
		});

		// Insertar en la barra de controles del feed o en el header de la lista
		var $target = $(
			".vasak-feed-filter-bar, .d-flex.justify-content-between.py-2",
		).first();
		if ($target.length) {
			$target.append($btn);
		}
	}

	function applyMode(compact, animate) {
		var $html = $("html");
		if (animate) {
			$html.addClass("vasak-compact-transitioning");
			setTimeout(function () {
				$html.removeClass("vasak-compact-transitioning");
			}, 300);
		}
		$html.toggleClass("vasak-compact-mode", compact);
	}

	return Compact;
});
