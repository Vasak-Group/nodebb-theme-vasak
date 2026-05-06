"use strict";

/**
 * Vasak Share Enhanced
 * ====================
 * Sistema de compartir mejorado con:
 *
 *  1. Web Share API (navigator.share) — nativo en mobile
 *     Abre el sheet de compartir del sistema operativo.
 *     Fallback automático al modal si no está disponible.
 *
 *  2. Modal con redes sociales — desktop y fallback
 *     Twitter/X, LinkedIn, Facebook, WhatsApp, Telegram,
 *     Reddit, Email + copiar link al portapapeles.
 *
 *  3. Clipboard API — copia el link con feedback visual.
 *
 * ACTIVACIÓN:
 *  - Botones con [data-vasak-share] o [data-share-url]
 *  - Botón .share-btn en topics_list.tpl
 *  - Botón component="share/linkedin" en feed.tpl (reemplazado)
 *  - Cualquier elemento con data-action="share"
 */
define("vasak/share", [], function () {
	var Share = {};

	// ── Redes sociales ─────────────────────────────────────────────────────

	var NETWORKS = [
		{
			key: "twitter",
			label: "Twitter",
			icon: "fa-brands fa-x-twitter",
			url: function (u, t) {
				return (
					"https://twitter.com/intent/tweet?url=" + enc(u) + "&text=" + enc(t)
				);
			},
		},
		{
			key: "linkedin",
			label: "LinkedIn",
			icon: "fa-brands fa-linkedin",
			url: function (u) {
				return "https://www.linkedin.com/sharing/share-offsite/?url=" + enc(u);
			},
		},
		{
			key: "facebook",
			label: "Facebook",
			icon: "fa-brands fa-facebook",
			url: function (u) {
				return "https://www.facebook.com/sharer/sharer.php?u=" + enc(u);
			},
		},
		{
			key: "whatsapp",
			label: "WhatsApp",
			icon: "fa-brands fa-whatsapp",
			url: function (u, t) {
				return "https://wa.me/?text=" + enc(t + " " + u);
			},
		},
		{
			key: "telegram",
			label: "Telegram",
			icon: "fa-brands fa-telegram",
			url: function (u, t) {
				return "https://t.me/share/url?url=" + enc(u) + "&text=" + enc(t);
			},
		},
		{
			key: "reddit",
			label: "Reddit",
			icon: "fa-brands fa-reddit",
			url: function (u, t) {
				return "https://reddit.com/submit?url=" + enc(u) + "&title=" + enc(t);
			},
		},
		{
			key: "email",
			label: "Email",
			icon: "fa fa-envelope",
			url: function (u, t) {
				return "mailto:?subject=" + enc(t) + "&body=" + enc(u);
			},
		},
	];

	function enc(s) {
		return encodeURIComponent(s || "");
	}

	// ── Init ───────────────────────────────────────────────────────────────

	Share.init = function () {
		// Delegación de eventos — cubre todos los botones de share
		// incluyendo los que se inyectan dinámicamente
		$(document)
			.off("click.vasak-share")
			.on(
				"click.vasak-share",
				[
					"[data-vasak-share]",
					"[data-share-url]",
					".share-btn",
					'[component="share/linkedin"]',
					'[data-action="share"]',
				].join(", "),
				function (e) {
					e.preventDefault();
					e.stopPropagation();

					var $btn = $(this);
					var url = resolveUrl($btn);
					var title = resolveTitle($btn);

					Share.open(url, title);
				},
			);

		// Cerrar modal con Escape
		$(document).on("keydown.vasak-share", function (e) {
			if (e.key === "Escape") Share.close();
		});
	};

	// ── Abrir share ────────────────────────────────────────────────────────

	Share.open = function (url, title) {
		url = url || window.location.href;
		title = title || document.title;

		// Intentar Web Share API primero (mobile nativo)
		if (navigator.share && isMobile()) {
			navigator.share({ title: title, url: url }).catch(function (err) {
				// El usuario canceló — no es un error real
				if (err.name !== "AbortError") {
					// Fallback al modal si falla por otra razón
					openModal(url, title);
				}
			});
			return;
		}

		// Desktop o navegadores sin Web Share API → modal
		openModal(url, title);
	};

	// ── Modal ──────────────────────────────────────────────────────────────

	function openModal(url, title) {
		// Cerrar modal anterior si existe
		Share.close();

		var $overlay = buildModal(url, title);
		$("body").append($overlay);

		// Prevenir scroll del body
		$("body").addClass("vasak-share-open");

		// Focus en el primer botón de red
		setTimeout(function () {
			$overlay.find(".vasak-share-network").first().trigger("focus");
		}, 50);
	}

	Share.close = function () {
		var $overlay = $(".vasak-share-overlay");
		if (!$overlay.length) return;

		var $modal = $overlay.find(".vasak-share-modal");
		$modal.addClass("vasak-share-closing");

		setTimeout(function () {
			$overlay.remove();
			$("body").removeClass("vasak-share-open");
		}, 200);
	};

	// ── Builder del modal ──────────────────────────────────────────────────

	function buildModal(url, title) {
		var shortTitle = title.length > 60 ? title.substring(0, 57) + "…" : title;

		// Overlay
		var $overlay = $(
			'<div class="vasak-share-overlay" role="dialog" aria-modal="true" aria-label="Share"></div>',
		);

		// Modal
		var $modal = $('<div class="vasak-share-modal"></div>');

		// Header
		var $header = $(
			'<div class="vasak-share-header">' +
				'<div class="vasak-share-title-block">' +
				'<div class="vasak-share-label">Share</div>' +
				'<p class="vasak-share-post-title">' +
				escapeHtml(shortTitle) +
				"</p>" +
				"</div>" +
				'<button class="vasak-share-close" aria-label="Close">' +
				'<i class="fa fa-times" aria-hidden="true"></i>' +
				"</button>" +
				"</div>",
		);

		$header.find(".vasak-share-close").on("click", Share.close);

		// Redes sociales
		var $networks = $('<div class="vasak-share-networks"></div>');

		// Web Share API como primera opción si está disponible (pero no en mobile
		// donde ya lo usamos directamente — aquí es para desktop con soporte)
		if (navigator.share && !isMobile()) {
			var $native = buildNetworkBtn(
				{
					key: "native",
					label: "Share",
					icon: "fa fa-share-alt",
					url: function () {
						return null;
					}, // manejado especialmente
				},
				url,
				title,
			);
			$native.on("click.native", function (e) {
				e.preventDefault();
				e.stopPropagation();
				Share.close();
				navigator.share({ title: title, url: url }).catch(function () {});
			});
			$networks.append($native);
		}

		NETWORKS.forEach(function (network) {
			$networks.append(buildNetworkBtn(network, url, title));
		});

		// Sección copiar link
		var $copySection = $(
			'<div class="vasak-share-copy-section">' +
				'<div class="vasak-share-copy-label">Copy link</div>' +
				'<div class="vasak-share-copy-row">' +
				'<input class="vasak-share-url-input" type="text" readonly value="' +
				escapeAttr(url) +
				'" aria-label="Post URL">' +
				'<button class="vasak-share-copy-btn" type="button">' +
				'<i class="fa fa-copy" aria-hidden="true"></i>' +
				"<span>Copy</span>" +
				"</button>" +
				"</div>" +
				"</div>",
		);

		$copySection.find(".vasak-share-copy-btn").on("click", function () {
			copyToClipboard(url, $(this));
		});

		// Seleccionar todo al hacer click en el input
		$copySection.find(".vasak-share-url-input").on("click", function () {
			this.select();
		});

		$modal.append($header, $networks, $copySection);
		$overlay.append($modal);

		// Cerrar al hacer click en el overlay (fuera del modal)
		$overlay.on("click", function (e) {
			if ($(e.target).is($overlay)) Share.close();
		});

		return $overlay;
	}

	function buildNetworkBtn(network, url, title) {
		var $btn = $(
			'<a class="vasak-share-network" data-network="' +
				network.key +
				'" ' +
				'href="#" role="button" tabindex="0" ' +
				'aria-label="Share on ' +
				network.label +
				'">' +
				'<span class="vasak-share-network-icon">' +
				'<i class="' +
				network.icon +
				'" aria-hidden="true"></i>' +
				"</span>" +
				'<span class="vasak-share-network-label">' +
				network.label +
				"</span>" +
				"</a>",
		);

		$btn.on("click", function (e) {
			e.preventDefault();
			var shareUrl = network.url(url, title);
			if (!shareUrl) return;

			// Email abre en la misma pestaña, el resto en nueva
			if (network.key === "email") {
				window.location.href = shareUrl;
			} else {
				window.open(
					shareUrl,
					"_blank",
					"noopener,noreferrer,width=600,height=500",
				);
			}

			Share.close();
		});

		// Soporte de teclado
		$btn.on("keydown", function (e) {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				$btn.trigger("click");
			}
		});

		return $btn;
	}

	// ── Clipboard ──────────────────────────────────────────────────────────

	function copyToClipboard(text, $btn) {
		var $icon = $btn.find("i");
		var $label = $btn.find("span");

		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard
				.writeText(text)
				.then(function () {
					showCopySuccess($btn, $icon, $label);
				})
				.catch(function () {
					fallbackCopy(text, $btn, $icon, $label);
				});
		} else {
			fallbackCopy(text, $btn, $icon, $label);
		}
	}

	function fallbackCopy(text, $btn, $icon, $label) {
		// Fallback para navegadores sin Clipboard API
		var $temp = $("<textarea>").val(text).css({
			position: "fixed",
			top: "-9999px",
			left: "-9999px",
		});
		$("body").append($temp);
		$temp[0].select();
		try {
			document.execCommand("copy");
			showCopySuccess($btn, $icon, $label);
		} catch (e) {
			// No se pudo copiar — mostrar el URL seleccionado
		}
		$temp.remove();
	}

	function showCopySuccess($btn, $icon, $label) {
		$btn.addClass("vasak-copy-success");
		$icon.removeClass("fa-copy").addClass("fa-check");
		$label.text("Copied!");

		setTimeout(function () {
			$btn.removeClass("vasak-copy-success");
			$icon.removeClass("fa-check").addClass("fa-copy");
			$label.text("Copy");
		}, 2000);
	}

	// ── Resolvers ──────────────────────────────────────────────────────────

	function resolveUrl($btn) {
		// Prioridad: data-share-url > data-vasak-share > data-url > href > current URL
		var url =
			$btn.attr("data-share-url") ||
			$btn.attr("data-vasak-share") ||
			$btn.attr("data-url") ||
			$btn.attr("href");

		if (!url || url === "#") {
			// Intentar obtener la URL del post/topic más cercano
			var $post = $btn.closest("[data-pid]");
			var pid = $post.attr("data-pid");
			if (pid) {
				url = (config.relative_path || "") + "/post/" + pid;
			} else {
				var $topic = $btn.closest("[data-tid]");
				var tid = $topic.attr("data-tid");
				if (tid) {
					url = (config.relative_path || "") + "/topic/" + tid;
				} else {
					url = window.location.href;
				}
			}
		}

		// Convertir URLs relativas a absolutas
		if (url && url.charAt(0) === "/") {
			url = window.location.origin + url;
		}

		return url;
	}

	function resolveTitle($btn) {
		// Prioridad: data-share-title > título del post más cercano > document.title
		var title = $btn.attr("data-share-title");

		if (!title) {
			var $post = $btn.closest("[data-pid], [component='post'], .topic-card");
			title =
				$post.find(".topic-title a").first().text().trim() ||
				$post.find('[component="topic/title"]').first().text().trim() ||
				$post.find("h3").first().text().trim();
		}

		return title || document.title || "Vasak Community";
	}

	// ── Helpers ────────────────────────────────────────────────────────────

	function isMobile() {
		return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
			navigator.userAgent,
		);
	}

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	function escapeAttr(str) {
		return String(str).replace(/"/g, "&quot;");
	}

	return Share;
});
