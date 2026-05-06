"use strict";

/**
 * Vasak Reading Stats
 * ===================
 * Trackea tiempo de lectura y profundidad de scroll en topics.
 * Muestra un indicador de progreso de lectura en la parte superior.
 * Los datos se guardan en localStorage (sin enviar al servidor).
 */
define("vasak/reading-stats", [], function () {
	var Stats = {};

	var startTime = null;
	var maxScroll = 0;
	var $progressBar = null;
	var rafId = null;

	Stats.init = function () {
		if (!$('[component="topic"]').length) return;

		startTime = Date.now();
		maxScroll = 0;

		injectProgressBar();
		bindScroll();

		// Guardar al salir
		$(window).on("action:ajaxify.start.reading-stats", saveStats);
		$(window).on("beforeunload.reading-stats", saveStats);
	};

	function injectProgressBar() {
		if ($("#vasak-reading-progress").length) return;

		$progressBar = $(
			'<div id="vasak-reading-progress" aria-hidden="true"></div>',
		);
		$("body").append($progressBar);
	}

	function bindScroll() {
		$(window)
			.off("scroll.reading-stats")
			.on("scroll.reading-stats", function () {
				if (rafId) return;
				rafId = requestAnimationFrame(function () {
					rafId = null;
					updateProgress();
				});
			});
	}

	function updateProgress() {
		var $content = $('[component="topic"]');
		if (!$content.length) return;

		var contentTop = $content.offset().top;
		var contentHeight = $content.outerHeight();
		var scrolled = window.scrollY + window.innerHeight - contentTop;
		var pct = Math.min(100, Math.max(0, (scrolled / contentHeight) * 100));

		maxScroll = Math.max(maxScroll, pct);

		if ($progressBar) {
			$progressBar.css("width", pct + "%");
			$progressBar.toggleClass("vasak-reading-complete", pct >= 95);
		}
	}

	function saveStats() {
		if (!startTime) return;

		var tid =
			typeof ajaxify !== "undefined" && ajaxify.data ? ajaxify.data.tid : null;
		if (!tid) return;

		var elapsed = Math.round((Date.now() - startTime) / 1000);
		var key = "vasak:read:" + tid;

		try {
			var prev = JSON.parse(localStorage.getItem(key) || "{}");
			localStorage.setItem(
				key,
				JSON.stringify({
					tid: tid,
					timeRead: (prev.timeRead || 0) + elapsed,
					maxScroll: Math.max(prev.maxScroll || 0, maxScroll),
					lastRead: Date.now(),
				}),
			);
		} catch (e) {}

		// Limpiar
		startTime = null;
		$(window).off(
			"scroll.reading-stats beforeunload.reading-stats action:ajaxify.start.reading-stats",
		);
		if ($progressBar) {
			$progressBar.remove();
			$progressBar = null;
		}
	}

	return Stats;
});
