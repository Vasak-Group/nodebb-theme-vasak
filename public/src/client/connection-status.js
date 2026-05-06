"use strict";

/**
 * Vasak Connection Status
 * =======================
 * Banner sutil que aparece cuando el usuario pierde/recupera la conexión.
 * Usa los eventos nativos online/offline del navegador.
 */
define("vasak/connection", [], function () {
	var Connection = {};

	var $banner = null;
	var hideTimer = null;

	Connection.init = function () {
		if (!("onLine" in navigator)) return;

		window.addEventListener("offline", function () {
			show(false);
		});
		window.addEventListener("online", function () {
			show(true);
		});

		// Si ya está offline al cargar
		if (!navigator.onLine) show(false);
	};

	function show(isOnline) {
		clearTimeout(hideTimer);

		if (!$banner) {
			$banner = $(
				'<div id="vasak-connection-banner" role="status" aria-live="polite"></div>',
			);
			$("body").append($banner);
		}

		$banner
			.removeClass("vasak-conn-online vasak-conn-offline")
			.addClass(isOnline ? "vasak-conn-online" : "vasak-conn-offline")
			.html(
				isOnline
					? '<i class="fa fa-wifi" aria-hidden="true"></i> Conexión restaurada'
					: '<i class="fa fa-exclamation-triangle" aria-hidden="true"></i> Sin conexión — mostrando contenido cacheado',
			)
			.addClass("vasak-conn-visible");

		// El banner de "online" se oculta solo después de 3s
		if (isOnline) {
			hideTimer = setTimeout(function () {
				if ($banner) $banner.removeClass("vasak-conn-visible");
			}, 3000);
		}
	}

	return Connection;
});
