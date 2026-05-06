"use strict";

/**
 * Vasak User Card
 * ===============
 * Popover con info del usuario al hacer hover sobre su avatar o nombre.
 * Muestra: avatar, displayname, bio, stats (posts, reputación), botón follow.
 *
 * Se activa en:
 *  - Avatares en posts (.avatar-tooltip, [component="user/picture"])
 *  - Links de autor en posts (.post-author-name, .author-link)
 *  - Avatares en el feed
 */
define("forum/vasak-user-card", ["api"], function (api) {
	var UserCard = {};

	var HOVER_DELAY = 400; // ms antes de mostrar
	var HIDE_DELAY = 200; // ms antes de ocultar (permite mover el mouse al card)
	var hoverTimer = null;
	var hideTimer = null;
	var $currentCard = null;
	var currentSlug = null;
	var cache = {}; // cache de datos de usuario

	UserCard.init = function () {
		// Delegación — cubre elementos dinámicos
		$(document).on(
			"mouseenter.vasak-card",
			".avatar-tooltip[href*='/user/'], .post-author-name[href*='/user/'], .author-link[href*='/user/'], a[href*='/user/'] .avatar",
			onEnter,
		);
		$(document).on(
			"mouseleave.vasak-card",
			".avatar-tooltip, .post-author-name, .author-link, a[href*='/user/'] .avatar",
			onLeave,
		);
	};

	function onEnter() {
		var $el = $(this);
		var slug = extractSlug($el);
		if (!slug) return;

		clearTimeout(hideTimer);
		hoverTimer = setTimeout(function () {
			showCard(slug, $el);
		}, HOVER_DELAY);
	}

	function onLeave() {
		clearTimeout(hoverTimer);
		hideTimer = setTimeout(function () {
			// Solo ocultar si el mouse no está sobre el card
			if ($currentCard && !$currentCard.is(":hover")) {
				hideCard();
			}
		}, HIDE_DELAY);
	}

	function extractSlug($el) {
		var href = $el.attr("href") || $el.closest("a").attr("href") || "";
		var match = href.match(/\/user\/([^/?#]+)/);
		return match ? match[1] : null;
	}

	function showCard(slug, $anchor) {
		if (currentSlug === slug && $currentCard && $currentCard.length) return;

		currentSlug = slug;
		hideCard(true); // ocultar card anterior sin animación

		// Mostrar skeleton mientras carga
		$currentCard = buildSkeleton();
		positionCard($currentCard, $anchor);
		$("body").append($currentCard);
		requestAnimationFrame(function () {
			$currentCard.addClass("vasak-user-card-visible");
		});

		// Hover en el card mismo — mantenerlo visible
		$currentCard
			.on("mouseenter.vasak-card", function () {
				clearTimeout(hideTimer);
			})
			.on("mouseleave.vasak-card", function () {
				hideTimer = setTimeout(hideCard, HIDE_DELAY);
			});

		// Cargar datos (con caché)
		loadUser(slug)
			.then(function (user) {
				if (currentSlug !== slug || !$currentCard) return;
				renderCard($currentCard, user, slug);
			})
			.catch(function () {
				if ($currentCard) hideCard();
			});
	}

	function hideCard(immediate) {
		if (!$currentCard) return;
		if (immediate) {
			$currentCard.remove();
		} else {
			var $c = $currentCard;
			$c.removeClass("vasak-user-card-visible");
			setTimeout(function () {
				$c.remove();
			}, 250);
		}
		$currentCard = null;
		currentSlug = null;
	}

	function loadUser(slug) {
		if (cache[slug]) return Promise.resolve(cache[slug]);
		return api.get("/api/user/" + slug).then(function (data) {
			cache[slug] = data;
			return data;
		});
	}

	function buildSkeleton() {
		return $(
			'<div class="vasak-user-card">' +
				'<div class="vasak-user-card-skeleton">' +
				'<div class="vasak-uc-avatar-sk"></div>' +
				'<div class="vasak-uc-lines">' +
				'<div class="vasak-uc-line vasak-uc-line-lg"></div>' +
				'<div class="vasak-uc-line vasak-uc-line-sm"></div>' +
				"</div>" +
				"</div>" +
				"</div>",
		);
	}

	function renderCard($card, user, slug) {
		var base = config.relative_path || "";
		var avatar = user.picture
			? '<img src="' +
				user.picture +
				'" class="vasak-uc-avatar" loading="lazy" alt="">'
			: '<span class="vasak-uc-avatar vasak-uc-avatar-icon" style="background:' +
				(user["icon:bgColor"] || "#dd7878") +
				'">' +
				(user["icon:text"] || (user.username || "?")[0].toUpperCase()) +
				"</span>";

		var bio = user.aboutme
			? '<p class="vasak-uc-bio">' +
				escapeHtml(user.aboutme.substring(0, 100)) +
				(user.aboutme.length > 100 ? "…" : "") +
				"</p>"
			: "";

		var isCurrentUser =
			typeof app !== "undefined" &&
			app.user &&
			String(app.user.uid) === String(user.uid);
		var followBtn =
			!isCurrentUser && config.loggedIn
				? '<button class="vasak-uc-follow btn btn-sm btn-primary" data-userslug="' +
					slug +
					'">Seguir</button>'
				: "";

		$card.html(
			'<div class="vasak-uc-header">' +
				'<a href="' +
				base +
				"/user/" +
				slug +
				'">' +
				avatar +
				"</a>" +
				'<div class="vasak-uc-info">' +
				'<a class="vasak-uc-name" href="' +
				base +
				"/user/" +
				slug +
				'">' +
				escapeHtml(user.displayname || user.username) +
				"</a>" +
				'<span class="vasak-uc-username">@' +
				escapeHtml(user.username) +
				"</span>" +
				"</div>" +
				followBtn +
				"</div>" +
				bio +
				'<div class="vasak-uc-stats">' +
				'<div class="vasak-uc-stat"><span class="vasak-uc-stat-val">' +
				(user.postcount || 0) +
				'</span><span class="vasak-uc-stat-lbl">Posts</span></div>' +
				'<div class="vasak-uc-stat"><span class="vasak-uc-stat-val">' +
				(user.reputation || 0) +
				'</span><span class="vasak-uc-stat-lbl">Reputación</span></div>' +
				'<div class="vasak-uc-stat"><span class="vasak-uc-stat-val">' +
				(user.followerCount || 0) +
				'</span><span class="vasak-uc-stat-lbl">Seguidores</span></div>' +
				"</div>",
		);

		// Follow button handler
		$card.find(".vasak-uc-follow").on("click", function () {
			var $btn = $(this);
			$btn.prop("disabled", true).text("...");
			fetch(base + "/api/v3/users/" + slug + "/follow", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					"x-csrf-token": config.csrf_token,
				},
				credentials: "same-origin",
				body: JSON.stringify({}),
			})
				.then(function (r) {
					if (r.ok) $btn.text("Siguiendo").addClass("vasak-uc-following");
					else throw new Error();
				})
				.catch(function () {
					$btn.prop("disabled", false).text("Seguir");
				});
		});
	}

	function positionCard($card, $anchor) {
		// Posicionar debajo del anchor, ajustar si se sale de la pantalla
		$card.css({ position: "fixed", top: 0, left: 0, visibility: "hidden" });
		$("body").append($card);

		var anchorRect = $anchor[0].getBoundingClientRect();
		var cardW = $card.outerWidth() || 280;
		var cardH = $card.outerHeight() || 200;
		var vw = window.innerWidth;
		var vh = window.innerHeight;

		var top = anchorRect.bottom + 8;
		var left = anchorRect.left;

		// Ajustar si se sale por la derecha
		if (left + cardW > vw - 16) left = vw - cardW - 16;
		// Ajustar si se sale por abajo
		if (top + cardH > vh - 16) top = anchorRect.top - cardH - 8;

		$card.css({ top: top + "px", left: left + "px", visibility: "" });
		$card.detach(); // se re-agrega en showCard
	}

	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	return UserCard;
});
