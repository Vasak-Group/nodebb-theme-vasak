"use strict";

/**
 * Vasak User Settings Panel
 * =========================
 * Modal de preferencias del tema accesible desde el sidebar.
 * Permite al usuario configurar:
 *   - Dark mode (light / dark / auto)
 *   - Tamaño de fuente (normal / grande)
 *   - Densidad del feed (normal / compacto)
 *   - Notificaciones push (activar / desactivar)
 *   - Keyboard shortcuts (activar / desactivar)
 *
 * Las preferencias se guardan en localStorage y se aplican inmediatamente.
 * No requiere recarga de página.
 */
define("vasak/settings", [], function () {
	var Settings = {};

	var STORAGE_KEY = "vasak:user-settings";
	var DEFAULTS = {
		theme: "auto", // "light" | "dark" | "auto"
		fontSize: "normal", // "normal" | "large"
		density: "normal", // "normal" | "compact"
		shortcuts: true,
	};

	var current = {};

	Settings.init = function () {
		current = loadSettings();
		applyAll(current);
		injectButton();

		$(window).on("action:ajaxify.end", function () {
			injectButton();
			applyAll(current);
		});
	};

	// ── Cargar / guardar ───────────────────────────────────────────────────

	function loadSettings() {
		try {
			var saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
			return Object.assign({}, DEFAULTS, saved);
		} catch (e) {
			return Object.assign({}, DEFAULTS);
		}
	}

	function saveSettings(settings) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
		} catch (e) {}
	}

	// ── Aplicar preferencias ───────────────────────────────────────────────

	function applyAll(s) {
		applyTheme(s.theme);
		applyFontSize(s.fontSize);
		applyDensity(s.density);
		applyShortcuts(s.shortcuts);
	}

	function applyTheme(value) {
		var $html = $("html");
		if (value === "dark") {
			$html.addClass("dark").removeClass("light");
		} else if (value === "light") {
			$html.removeClass("dark").addClass("light");
		} else {
			// auto: respetar preferencia del sistema
			$html.removeClass("dark light");
			var prefersDark =
				window.matchMedia &&
				window.matchMedia("(prefers-color-scheme: dark)").matches;
			if (prefersDark) $html.addClass("dark");
		}
		// Sincronizar con el toggle de dark mode existente
		try {
			localStorage.setItem("vasak:theme", value === "auto" ? "" : value);
		} catch (e) {}
	}

	function applyFontSize(value) {
		$("html").toggleClass("vasak-font-large", value === "large");
	}

	function applyDensity(value) {
		// Sincronizar con el módulo compact-mode
		$("html").toggleClass("vasak-compact-mode", value === "compact");
		try {
			localStorage.setItem(
				"vasak:compact-mode",
				value === "compact" ? "true" : "false",
			);
		} catch (e) {}
	}

	function applyShortcuts(value) {
		try {
			localStorage.setItem("vasak:shortcuts:enabled", value ? "true" : "false");
		} catch (e) {}
	}

	// ── Botón en sidebar ───────────────────────────────────────────────────

	function injectButton() {
		if ($("#vasak-settings-btn").length) return;

		var $btn = $(
			'<button id="vasak-settings-btn" ' +
				'class="nav-link d-flex gap-2 align-items-center p-2 pointer w-100 text-nowrap btn btn-ghost" ' +
				'type="button" aria-label="Preferencias del tema" title="Preferencias">' +
				'<i class="fa fa-fw fa-sliders" aria-hidden="true"></i>' +
				'<span class="nav-text visible-open fw-semibold small lh-1">Preferencias</span>' +
				"</button>",
		);

		$btn.on("click", openModal);

		// Insertar antes del dark mode toggle
		var $darkToggle = $(".dark-mode-toggle");
		if ($darkToggle.length) {
			$darkToggle.before('<div class="m-2">' + $btn[0].outerHTML + "</div>");
			// Re-bind porque outerHTML crea un nuevo elemento
			$("#vasak-settings-btn").on("click", openModal);
		}
	}

	// ── Modal ──────────────────────────────────────────────────────────────

	function openModal() {
		if ($("#vasak-settings-modal").length) return;

		var s = current;

		var $modal = $(
			'<div id="vasak-settings-modal" class="vasak-settings-modal" role="dialog" aria-modal="true" aria-label="Preferencias del tema">' +
				'<div class="vasak-settings-backdrop"></div>' +
				'<div class="vasak-settings-content">' +
				'<div class="vasak-settings-header">' +
				'<h2><i class="fa fa-sliders" aria-hidden="true"></i> Preferencias</h2>' +
				'<button class="vasak-settings-close" aria-label="Cerrar">×</button>' +
				"</div>" +
				'<div class="vasak-settings-body">' +
				// Tema
				'<div class="vasak-setting-group">' +
				'<label class="vasak-setting-label">Tema</label>' +
				'<div class="vasak-setting-options" data-setting="theme">' +
				optionBtn("theme", "light", "fa-sun", "Claro", s.theme === "light") +
				optionBtn("theme", "dark", "fa-moon", "Oscuro", s.theme === "dark") +
				optionBtn(
					"theme",
					"auto",
					"fa-circle-half-stroke",
					"Auto",
					s.theme === "auto",
				) +
				"</div>" +
				"</div>" +
				// Tamaño de fuente
				'<div class="vasak-setting-group">' +
				'<label class="vasak-setting-label">Tamaño de texto</label>' +
				'<div class="vasak-setting-options" data-setting="fontSize">' +
				optionBtn(
					"fontSize",
					"normal",
					"fa-font",
					"Normal",
					s.fontSize === "normal",
				) +
				optionBtn(
					"fontSize",
					"large",
					"fa-text-height",
					"Grande",
					s.fontSize === "large",
				) +
				"</div>" +
				"</div>" +
				// Densidad del feed
				'<div class="vasak-setting-group">' +
				'<label class="vasak-setting-label">Densidad del feed</label>' +
				'<div class="vasak-setting-options" data-setting="density">' +
				optionBtn(
					"density",
					"normal",
					"fa-th-large",
					"Normal",
					s.density === "normal",
				) +
				optionBtn(
					"density",
					"compact",
					"fa-list",
					"Compacto",
					s.density === "compact",
				) +
				"</div>" +
				"</div>" +
				// Toggles
				'<div class="vasak-setting-group">' +
				'<label class="vasak-setting-label">Funcionalidades</label>' +
				toggleRow(
					"shortcuts",
					"Atajos de teclado",
					"fa-keyboard",
					s.shortcuts,
				) +
				"</div>" +
				"</div>" +
				'<div class="vasak-settings-footer">' +
				'<button class="vasak-settings-reset btn btn-ghost btn-sm">Restablecer</button>' +
				'<button class="vasak-settings-save btn btn-primary btn-sm">Guardar</button>' +
				"</div>" +
				"</div>" +
				"</div>",
		);

		$("body").append($modal);
		requestAnimationFrame(function () {
			$modal.addClass("vasak-settings-visible");
		});

		// Cerrar
		$modal
			.find(".vasak-settings-backdrop, .vasak-settings-close")
			.on("click", closeModal);
		$(document).on("keydown.vasak-settings", function (e) {
			if (e.key === "Escape") closeModal();
		});

		// Seleccionar opción
		$modal.on("click", ".vasak-option-btn", function () {
			var $btn = $(this);
			var setting = $btn.closest("[data-setting]").attr("data-setting");
			var value = $btn.attr("data-value");
			$btn
				.closest("[data-setting]")
				.find(".vasak-option-btn")
				.removeClass("active");
			$btn.addClass("active");
			current[setting] = value;
			applyAll(current); // preview en tiempo real
		});

		// Toggle
		$modal.on("change", ".vasak-toggle-input", function () {
			var setting = $(this).attr("data-setting");
			current[setting] = this.checked;
			applyAll(current);
		});

		// Guardar
		$modal.find(".vasak-settings-save").on("click", function () {
			saveSettings(current);
			closeModal();
			if (typeof vasak !== "undefined" && vasak.toast) {
				vasak.toast.success("Preferencias guardadas");
			}
		});

		// Restablecer
		$modal.find(".vasak-settings-reset").on("click", function () {
			current = Object.assign({}, DEFAULTS);
			applyAll(current);
			saveSettings(current);
			closeModal();
			openModal(); // reabrir con valores por defecto
		});
	}

	function closeModal() {
		var $modal = $("#vasak-settings-modal");
		$modal.removeClass("vasak-settings-visible");
		$(document).off("keydown.vasak-settings");
		setTimeout(function () {
			$modal.remove();
		}, 250);
	}

	// ── Builders ──────────────────────────────────────────────────────────

	function optionBtn(setting, value, icon, label, active) {
		return (
			'<button class="vasak-option-btn' +
			(active ? " active" : "") +
			'" ' +
			'data-value="' +
			value +
			'" type="button">' +
			'<i class="fa fa-fw ' +
			icon +
			'" aria-hidden="true"></i>' +
			"<span>" +
			label +
			"</span>" +
			"</button>"
		);
	}

	function toggleRow(setting, label, icon, checked) {
		return (
			'<label class="vasak-toggle-row">' +
			'<i class="fa fa-fw ' +
			icon +
			'" aria-hidden="true"></i>' +
			'<span class="vasak-toggle-label">' +
			label +
			"</span>" +
			'<input type="checkbox" class="vasak-toggle-input" data-setting="' +
			setting +
			'"' +
			(checked ? " checked" : "") +
			">" +
			'<span class="vasak-toggle-track" aria-hidden="true"></span>' +
			"</label>"
		);
	}

	return Settings;
});
