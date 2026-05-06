"use strict";

/**
 * Vasak Push Notifications
 * ========================
 * Implementa Web Push API para notificaciones nativas del navegador.
 *
 * FLUJO:
 *  1. Al cargar, verificar si el usuario ya tiene permiso/suscripción
 *  2. Si no tiene suscripción activa, mostrar banner de opt-in (no intrusivo)
 *  3. Al aceptar: pedir permiso → suscribir al SW → enviar subscription al servidor
 *  4. El servidor guarda la subscription y puede enviar notificaciones via Web Push
 *
 * REQUISITOS:
 *  - HTTPS (o localhost)
 *  - Service Worker registrado (ya lo hace initServiceWorker en theme.js)
 *  - VAPID keys configuradas en el servidor (ver theme.js)
 *
 * STORAGE:
 *  - "vasak:push:dismissed" → timestamp de cuando el usuario cerró el banner
 *  - "vasak:push:subscribed" → "true" si ya está suscrito
 */
define("forum/vasak-push", [], function () {
	var Push = {};

	// ── Configuración ──────────────────────────────────────────────────────
	var DISMISS_COOLDOWN = 7 * 24 * 60 * 60 * 1000; // 7 días antes de volver a mostrar
	var BANNER_DELAY = 3000; // ms después de cargar antes de mostrar el banner
	var API_BASE = (config.relative_path || "") + "/vasak-push";

	// ── Init ───────────────────────────────────────────────────────────────

	Push.init = function () {
		// Verificar soporte
		if (!isPushSupported()) return;

		// Solo para usuarios logueados
		if (!config.loggedIn) return;

		// Verificar estado actual
		checkAndPrompt();
	};

	// ── Verificación de estado ─────────────────────────────────────────────

	function checkAndPrompt() {
		var permission = Notification.permission;

		if (permission === "granted") {
			// Ya tiene permiso — verificar que la suscripción sigue activa
			ensureSubscription();
			return;
		}

		if (permission === "denied") {
			// El usuario bloqueó explícitamente — no molestar
			return;
		}

		// permission === "default" — no ha decidido aún
		// Verificar si ya descartó el banner recientemente
		if (wasDismissedRecently()) return;

		// Mostrar banner después de un delay para no interrumpir la carga
		setTimeout(showBanner, BANNER_DELAY);
	}

	function wasDismissedRecently() {
		try {
			var ts = parseInt(localStorage.getItem("vasak:push:dismissed"), 10);
			return ts && Date.now() - ts < DISMISS_COOLDOWN;
		} catch (e) {
			return false;
		}
	}

	// ── Banner de opt-in ───────────────────────────────────────────────────

	function showBanner() {
		// No mostrar si ya hay un banner
		if (document.getElementById("vasak-push-banner")) return;

		var $banner = $(
			'<div id="vasak-push-banner" class="vasak-push-banner" role="alert" aria-live="polite">' +
				'<div class="vasak-push-banner-content">' +
				'<div class="vasak-push-banner-icon">' +
				'<i class="fa fa-bell" aria-hidden="true"></i>' +
				"</div>" +
				'<div class="vasak-push-banner-text">' +
				"<strong>Activar notificaciones</strong>" +
				"<span>Recibí alertas cuando alguien responde tus posts</span>" +
				"</div>" +
				"</div>" +
				'<div class="vasak-push-banner-actions">' +
				'<button class="vasak-push-accept btn btn-sm btn-primary" type="button">Activar</button>' +
				'<button class="vasak-push-dismiss btn btn-sm btn-ghost" type="button">Ahora no</button>' +
				"</div>" +
				"</div>",
		);

		$("body").append($banner);

		// Animar entrada
		requestAnimationFrame(function () {
			$banner.addClass("vasak-push-banner-visible");
		});

		// Handlers
		$banner.find(".vasak-push-accept").on("click", function () {
			hideBanner();
			requestPermissionAndSubscribe();
		});

		$banner.find(".vasak-push-dismiss").on("click", function () {
			hideBanner();
			try {
				localStorage.setItem("vasak:push:dismissed", Date.now().toString());
			} catch (e) {}
		});

		// Auto-ocultar después de 15s si no interactúa
		setTimeout(function () {
			if (document.getElementById("vasak-push-banner")) {
				hideBanner();
			}
		}, 15000);
	}

	function hideBanner() {
		var $banner = $("#vasak-push-banner");
		if (!$banner.length) return;

		$banner.removeClass("vasak-push-banner-visible");
		setTimeout(function () {
			$banner.remove();
		}, 300);
	}

	// ── Solicitar permiso y suscribir ──────────────────────────────────────

	function requestPermissionAndSubscribe() {
		Notification.requestPermission().then(function (permission) {
			if (permission === "granted") {
				subscribe();
			}
			// Si deniega, no hacer nada — el navegador ya lo recuerda
		});
	}

	function ensureSubscription() {
		navigator.serviceWorker.ready.then(function (registration) {
			registration.pushManager.getSubscription().then(function (sub) {
				if (!sub) {
					// Tenemos permiso pero no suscripción — re-suscribir
					subscribe();
				}
				// Si ya tiene suscripción, todo bien
			});
		});
	}

	// ── Suscripción ────────────────────────────────────────────────────────

	function subscribe() {
		// Obtener la VAPID public key del servidor
		fetch(API_BASE + "/vapid-public-key")
			.then(function (r) {
				return r.json();
			})
			.then(function (data) {
				if (!data.publicKey) throw new Error("No VAPID key");

				return navigator.serviceWorker.ready.then(function (registration) {
					return registration.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: urlBase64ToUint8Array(data.publicKey),
					});
				});
			})
			.then(function (subscription) {
				// Enviar la suscripción al servidor
				return sendSubscriptionToServer(subscription);
			})
			.then(function () {
				try {
					localStorage.setItem("vasak:push:subscribed", "true");
				} catch (e) {}
				showSuccessToast();
			})
			.catch(function (err) {
				// VAPID no configurado o error de red — silencioso
				console.info("[Vasak Push] No disponible:", err.message);
			});
	}

	function sendSubscriptionToServer(subscription) {
		return fetch(API_BASE + "/subscribe", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-csrf-token": config.csrf_token,
			},
			credentials: "same-origin",
			body: JSON.stringify({
				subscription: subscription.toJSON(),
				uid: app.user ? app.user.uid : null,
			}),
		}).then(function (r) {
			if (!r.ok) throw new Error("Server error " + r.status);
			return r.json();
		});
	}

	// ── Desuscribir ────────────────────────────────────────────────────────

	Push.unsubscribe = function () {
		navigator.serviceWorker.ready.then(function (registration) {
			registration.pushManager.getSubscription().then(function (sub) {
				if (!sub) return;

				sub.unsubscribe().then(function () {
					// Notificar al servidor
					fetch(API_BASE + "/unsubscribe", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							"x-csrf-token": config.csrf_token,
						},
						credentials: "same-origin",
						body: JSON.stringify({ endpoint: sub.endpoint }),
					}).catch(function () {});

					try {
						localStorage.removeItem("vasak:push:subscribed");
					} catch (e) {}
				});
			});
		});
	};

	// ── Toast de confirmación ──────────────────────────────────────────────

	function showSuccessToast() {
		var $toast = $(
			'<div class="vasak-push-toast" role="status" aria-live="polite">' +
				'<i class="fa fa-check-circle" aria-hidden="true"></i>' +
				"<span>Notificaciones activadas</span>" +
				"</div>",
		);

		$("body").append($toast);
		requestAnimationFrame(function () {
			$toast.addClass("vasak-push-toast-visible");
		});

		setTimeout(function () {
			$toast.removeClass("vasak-push-toast-visible");
			setTimeout(function () {
				$toast.remove();
			}, 300);
		}, 3000);
	}

	// ── Helpers ────────────────────────────────────────────────────────────

	function isPushSupported() {
		return (
			("serviceWorker" in navigator &&
				"PushManager" in window &&
				"Notification" in window &&
				location.protocol === "https:") ||
			location.hostname === "localhost"
		);
	}

	/**
	 * Convierte una VAPID public key de base64url a Uint8Array
	 * (requerido por pushManager.subscribe)
	 */
	function urlBase64ToUint8Array(base64String) {
		var padding = "=".repeat((4 - (base64String.length % 4)) % 4);
		var base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
		var rawData = window.atob(base64);
		var output = new Uint8Array(rawData.length);
		for (var i = 0; i < rawData.length; i++) {
			output[i] = rawData.charCodeAt(i);
		}
		return output;
	}

	return Push;
});
