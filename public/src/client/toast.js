"use strict";

/**
 * Vasak Toast System
 * ==================
 * Sistema centralizado de notificaciones toast.
 * Reemplaza los alerts.success/error de NodeBB con toasts
 * más integrados al diseño del tema.
 *
 * API:
 *   vasak.toast.show(message, type, duration)
 *   vasak.toast.success(message)
 *   vasak.toast.error(message)
 *   vasak.toast.info(message)
 *   vasak.toast.warning(message)
 *
 * Tipos: "success" | "error" | "info" | "warning"
 * Duración: ms (default 3500, error 6000)
 */
define("vasak/toast", [], function () {
	var Toast = {};

	var CONTAINER_ID = "vasak-toast-container";
	var ICONS = {
		success: "fa-check-circle",
		error: "fa-times-circle",
		info: "fa-info-circle",
		warning: "fa-exclamation-triangle",
	};
	var DURATIONS = {
		success: 3500,
		error: 6000,
		info: 4000,
		warning: 5000,
	};

	// ── API pública ────────────────────────────────────────────────────────

	Toast.show = function (message, type, duration) {
		type = type || "info";
		duration = duration || DURATIONS[type] || 3500;

		var $container = getContainer();
		var $toast = buildToast(message, type);

		$container.append($toast);

		// Animar entrada
		requestAnimationFrame(function () {
			$toast.addClass("vasak-toast-visible");
		});

		// Auto-dismiss
		var dismissTimer = setTimeout(function () {
			dismiss($toast);
		}, duration);

		// Click para cerrar
		$toast.find(".vasak-toast-close").on("click", function () {
			clearTimeout(dismissTimer);
			dismiss($toast);
		});

		// Pausar al hacer hover
		$toast
			.on("mouseenter", function () {
				clearTimeout(dismissTimer);
			})
			.on("mouseleave", function () {
				dismissTimer = setTimeout(function () {
					dismiss($toast);
				}, 1500);
			});

		return $toast;
	};

	Toast.success = function (msg) {
		return Toast.show(msg, "success");
	};
	Toast.error = function (msg) {
		return Toast.show(msg, "error");
	};
	Toast.info = function (msg) {
		return Toast.show(msg, "info");
	};
	Toast.warning = function (msg) {
		return Toast.show(msg, "warning");
	};

	// ── Internals ──────────────────────────────────────────────────────────

	function getContainer() {
		var $c = $("#" + CONTAINER_ID);
		if (!$c.length) {
			$c = $(
				'<div id="' +
					CONTAINER_ID +
					'" aria-live="polite" aria-atomic="false"></div>',
			);
			$("body").append($c);
		}
		return $c;
	}

	function buildToast(message, type) {
		var icon = ICONS[type] || ICONS.info;
		return $(
			'<div class="vasak-toast vasak-toast-' +
				type +
				'" role="alert">' +
				'<i class="fa ' +
				icon +
				' vasak-toast-icon" aria-hidden="true"></i>' +
				'<span class="vasak-toast-message">' +
				escapeHtml(message) +
				"</span>" +
				'<button class="vasak-toast-close" aria-label="Cerrar">×</button>' +
				"</div>",
		);
	}

	function dismiss($toast) {
		$toast.removeClass("vasak-toast-visible");
		setTimeout(function () {
			$toast.remove();
		}, 300);
	}

	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	return Toast;
});
