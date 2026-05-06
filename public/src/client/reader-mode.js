"use strict";

/**
 * Vasak Reader Mode
 * =================
 * Vista de lectura limpia: oculta sidebar, header y elementos de UI,
 * deja solo el contenido del post con tipografía optimizada.
 * Activado con el botón en el sidebar del topic.
 */
define("vasak/reader", [], function () {
	var Reader = {};
	var STORAGE_KEY = "vasak:reader-mode";
	var isActive = false;

	Reader.init = function () {
		// Solo en páginas de topic
		if (!$('[component="topic"]').length) return;

		injectButton();
		// Restaurar estado si estaba activo
		if (localStorage.getItem(STORAGE_KEY) === "on") toggle(true);

		$(window).on("action:ajaxify.end", function () {
			if ($('[component="topic"]').length) {
				injectButton();
			} else {
				// Salir del reader mode al navegar fuera de un topic
				if (isActive) toggle(false);
			}
		});
	};

	function injectButton() {
		if ($("#vasak-reader-btn").length) return;

		var $btn = $(
			'<button id="vasak-reader-btn" class="btn btn-ghost btn-sm d-flex gap-2 align-items-center w-100 justify-content-start" type="button" title="Modo lectura">' +
				'<i class="fa fa-fw fa-book-open-reader" aria-hidden="true"></i>' +
				'<span class="fw-semibold text-nowrap">Modo lectura</span>' +
				"</button>",
		);

		$btn.on("click", function () {
			toggle();
		});

		// Insertar en el sidebar del topic, después del botón de watch
		var $sidebar = $(".topic-sidebar-actions");
		if ($sidebar.length) $sidebar.append($btn);
	}

	function toggle(force) {
		isActive = force !== undefined ? force : !isActive;
		$("html").toggleClass("vasak-reader-mode", isActive);
		$("#vasak-reader-btn").toggleClass("active", isActive);
		try {
			localStorage.setItem(STORAGE_KEY, isActive ? "on" : "off");
		} catch (e) {}
	}

	return Reader;
});
