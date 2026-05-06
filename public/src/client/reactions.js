"use strict";

/**
 * Vasak Reactions
 * ===============
 * Sistema de reacciones rápidas en posts.
 *
 * ARQUITECTURA:
 *
 * - 👍 Like     → usa el upvote nativo de NodeBB (/api/v3/posts/{pid}/vote)
 *                 Se sincroniza con el estado de upvote existente.
 *
 * - ❤️😂😮😢   → persistencia en localStorage por "pid:uid"
 *                 No requiere backend adicional.
 *                 Se muestran a todos los usuarios del mismo navegador
 *                 (comportamiento esperado para una comunidad pequeña/media).
 *
 * STORAGE KEY: "vasak:reactions:{pid}" → { "❤️": [uid1, uid2], "😂": [uid3] }
 *
 * NOTA: Para persistencia real cross-device se necesitaría un plugin
 * de NodeBB con su propia tabla en la DB. Esta implementación es
 * completamente funcional sin backend adicional.
 */
define("forum/vasak-reactions", ["api", "alerts"], function (api, alerts) {
	var Reactions = {};

	// ── Configuración ──────────────────────────────────────────────────────

	// Reacciones disponibles: [emoji, label, key]
	var REACTIONS = [
		{ emoji: "👍", label: "Like", key: "like", useUpvote: true },
		{ emoji: "❤️", label: "Love", key: "love", useUpvote: false },
		{ emoji: "😂", label: "Haha", key: "haha", useUpvote: false },
		{ emoji: "😮", label: "Wow", key: "wow", useUpvote: false },
		{ emoji: "😢", label: "Sad", key: "sad", useUpvote: false },
	];

	var STORAGE_PREFIX = "vasak:reactions:";
	var ATTR_INITIALIZED = "data-reactions-init";

	// ── Init ───────────────────────────────────────────────────────────────

	Reactions.init = function () {
		// Inyectar reacciones en posts existentes
		initPostReactions();

		// Re-inyectar cuando se cargan nuevos posts
		$(window).on(
			"action:posts.loaded action:topic.loaded action:ajaxify.end",
			function () {
				setTimeout(initPostReactions, 100);
			},
		);

		// Cerrar picker al hacer click fuera
		$(document).on("click.vasak-reactions", function (e) {
			if (
				!$(e.target).closest(".vasak-reaction-picker, .vasak-reaction-trigger")
					.length
			) {
				closeAllPickers();
			}
		});

		// Cerrar picker con Escape
		$(document).on("keydown.vasak-reactions", function (e) {
			if (e.key === "Escape") closeAllPickers();
		});
	};

	// ── Inyección en posts ─────────────────────────────────────────────────

	function initPostReactions() {
		// Posts en topic page
		$('[component="post"]:not([' + ATTR_INITIALIZED + "])").each(function () {
			var $post = $(this);
			var pid = $post.attr("data-pid");
			if (!pid) return;

			$post.attr(ATTR_INITIALIZED, "true");

			// Buscar el footer del post
			var $footer = $post.find('[component="post/footer"]');
			if ($footer.length) {
				injectReactionsBar($footer, pid, "topic");
			}
		});

		// Posts en feed
		$('.feed li[component="post"]:not([' + ATTR_INITIALIZED + "])").each(
			function () {
				var $post = $(this);
				var pid = $post.attr("data-pid");
				if (!pid) return;

				$post.attr(ATTR_INITIALIZED, "true");

				// En el feed, inyectar en la action bar
				var $actionBar = $post.find(".feed-action-bar");
				if ($actionBar.length) {
					injectFeedReactions($actionBar, pid);
				}
			},
		);
	}

	// ── Inyección en topic posts ───────────────────────────────────────────

	function injectReactionsBar($footer, pid) {
		if ($footer.find(".vasak-reactions-bar").length) return;

		var uid = getCurrentUid();
		var stored = loadReactions(pid);
		var upvoted = isUpvoted(pid);

		// Construir barra de reacciones
		var $bar = $('<div class="vasak-reactions-bar"></div>');
		var $wrapper = $('<div class="vasak-reactions-wrapper"></div>');

		// Mostrar reacciones que ya tienen conteo
		REACTIONS.forEach(function (r) {
			var users = stored[r.key] || [];
			var count = r.useUpvote ? getUpvoteCount(pid) : users.length;
			var isActive = r.useUpvote ? upvoted : users.indexOf(uid) !== -1;

			if (count > 0) {
				$wrapper.append(buildReactionBtn(r, count, isActive, pid, uid));
			}
		});

		// Botón "+" para abrir picker
		var $trigger = buildTrigger(pid, uid, $wrapper);
		$wrapper.append($trigger);

		$bar.append($wrapper);
		$footer.append($bar);
	}

	// ── Inyección en feed ──────────────────────────────────────────────────

	function injectFeedReactions($actionBar, pid) {
		if ($actionBar.find(".vasak-reactions-wrapper").length) return;

		var uid = getCurrentUid();
		var stored = loadReactions(pid);

		// En el feed solo mostramos el trigger y las reacciones activas
		var $wrapper = $('<div class="vasak-reactions-wrapper"></div>');

		// Reacciones con conteo
		REACTIONS.forEach(function (r) {
			var users = stored[r.key] || [];
			var count = r.useUpvote ? getUpvoteCount(pid) : users.length;
			var isActive = r.useUpvote ? isUpvoted(pid) : users.indexOf(uid) !== -1;

			if (count > 0) {
				$wrapper.append(buildReactionBtn(r, count, isActive, pid, uid));
			}
		});

		// Trigger
		var $trigger = buildTrigger(pid, uid, $wrapper);
		$wrapper.append($trigger);

		// Insertar antes del primer botón de la action bar
		$actionBar.prepend($wrapper);
	}

	// ── Builders ──────────────────────────────────────────────────────────

	function buildReactionBtn(reaction, count, isActive, pid, uid) {
		var tooltip = buildTooltip(reaction, pid);
		var $btn = $(
			'<button class="vasak-reaction-btn' +
				(isActive ? " vasak-reaction-active" : "") +
				'"' +
				' data-reaction="' +
				reaction.key +
				'"' +
				' data-pid="' +
				pid +
				'"' +
				' aria-label="' +
				reaction.label +
				": " +
				count +
				' reactions"' +
				(tooltip ? ' data-tooltip="' + tooltip + '"' : "") +
				' type="button">' +
				'<span class="vasak-reaction-emoji" aria-hidden="true">' +
				reaction.emoji +
				"</span>" +
				'<span class="vasak-reaction-count">' +
				count +
				"</span>" +
				"</button>",
		);

		$btn.on("click", function (e) {
			e.preventDefault();
			e.stopPropagation();
			handleReactionClick(
				reaction,
				pid,
				uid,
				$btn,
				$(this).closest(".vasak-reactions-wrapper"),
			);
		});

		return $btn;
	}

	function buildTrigger(pid, uid, $wrapper) {
		var $trigger = $(
			'<button class="vasak-reaction-trigger" type="button" ' +
				'aria-label="Add reaction" title="Add reaction">' +
				'<i class="fa fa-smile-o" aria-hidden="true"></i>' +
				"</button>",
		);

		$trigger.on("click", function (e) {
			e.preventDefault();
			e.stopPropagation();
			togglePicker(pid, uid, $trigger, $wrapper);
		});

		return $trigger;
	}

	function buildTooltip(reaction, pid) {
		var stored = loadReactions(pid);
		var users = stored[reaction.key] || [];
		if (!users.length) return "";

		// Mostrar hasta 3 nombres + "and X others"
		var names = users.slice(0, 3).map(function (u) {
			return typeof u === "object" ? u.username : "User " + u;
		});
		var extra = users.length - names.length;
		var text = names.join(", ");
		if (extra > 0) text += " and " + extra + " more";
		return text + " reacted with " + reaction.emoji;
	}

	// ── Picker ────────────────────────────────────────────────────────────

	function togglePicker(pid, uid, $trigger, $wrapper) {
		// Cerrar cualquier picker abierto
		var existingPicker = $wrapper.find(".vasak-reaction-picker");
		if (existingPicker.length) {
			existingPicker.remove();
			return;
		}

		closeAllPickers();

		var $picker = $(
			'<div class="vasak-reaction-picker" role="dialog" aria-label="Reactions"></div>',
		);

		REACTIONS.forEach(function (r) {
			var $opt = $(
				'<button class="vasak-picker-option" type="button" ' +
					'aria-label="' +
					r.label +
					'" title="' +
					r.label +
					'">' +
					r.emoji +
					"</button>",
			);

			$opt.on("click", function (e) {
				e.preventDefault();
				e.stopPropagation();
				$picker.remove();
				handleReactionClick(r, pid, uid, null, $wrapper);
			});

			$picker.append($opt);
		});

		// Posicionar: arriba por defecto, abajo si no hay espacio
		$wrapper.append($picker);

		var pickerRect = $picker[0].getBoundingClientRect();
		if (pickerRect.top < 0) {
			$picker.addClass("vasak-picker-below");
		}

		// Focus trap básico
		$picker.find(".vasak-picker-option").first().trigger("focus");
	}

	function closeAllPickers() {
		$(".vasak-reaction-picker").remove();
	}

	// ── Lógica de reacción ─────────────────────────────────────────────────

	function handleReactionClick(reaction, pid, uid, $existingBtn, $wrapper) {
		if (!config.loggedIn) {
			window.location.href = config.relative_path + "/login";
			return;
		}

		if (reaction.useUpvote) {
			// Usar el sistema de upvote nativo de NodeBB
			handleUpvoteReaction(pid, $existingBtn, $wrapper, reaction);
		} else {
			// Reacción local con localStorage
			handleLocalReaction(reaction, pid, uid, $existingBtn, $wrapper);
		}
	}

	function handleUpvoteReaction(pid, $existingBtn, $wrapper, reaction) {
		var isCurrentlyUpvoted = isUpvoted(pid);
		var method = isCurrentlyUpvoted ? "del" : "put";

		$.ajax({
			url: config.relative_path + "/api/v3/posts/" + pid + "/vote",
			method: method,
			data: JSON.stringify({ delta: 1 }),
			contentType: "application/json",
			headers: { "x-csrf-token": config.csrf_token },
			success: function (res) {
				var newCount = extractVotes(res);
				var nowUpvoted = !isCurrentlyUpvoted;

				// Actualizar el upvote nativo de NodeBB también
				var $nativeUpvote = $(
					'[data-pid="' + pid + '"] [component="post/upvote"]',
				);
				$nativeUpvote.toggleClass("upvoted", nowUpvoted);

				// Actualizar o crear el botón de reacción
				updateOrCreateReactionBtn(
					reaction,
					pid,
					newCount,
					nowUpvoted,
					$existingBtn,
					$wrapper,
				);
			},
			error: function (xhr) {
				var msg =
					(xhr.responseJSON &&
						xhr.responseJSON.status &&
						xhr.responseJSON.status.message) ||
					"No se pudo actualizar la reacción";
				alerts.error(msg);
				// Revertir estado visual si falló
				if ($existingBtn && $existingBtn.length) {
					$existingBtn.toggleClass(
						"vasak-reaction-active",
						!isCurrentlyUpvoted,
					);
				}
			},
		});
	}

	function handleLocalReaction(reaction, pid, uid, $existingBtn, $wrapper) {
		var stored = loadReactions(pid);
		var users = stored[reaction.key] || [];
		var idx = users.indexOf(uid);
		var isActive = idx !== -1;

		if (isActive) {
			// Quitar reacción
			users.splice(idx, 1);
		} else {
			// Agregar reacción
			users.push(uid);
		}

		stored[reaction.key] = users;
		saveReactions(pid, stored);

		var newCount = users.length;
		var nowActive = !isActive;

		updateOrCreateReactionBtn(
			reaction,
			pid,
			newCount,
			nowActive,
			$existingBtn,
			$wrapper,
		);
	}

	function updateOrCreateReactionBtn(
		reaction,
		pid,
		count,
		isActive,
		$existingBtn,
		$wrapper,
	) {
		var uid = getCurrentUid();

		if ($existingBtn && $existingBtn.length) {
			// Actualizar botón existente
			$existingBtn.find(".vasak-reaction-count").text(count);
			$existingBtn.toggleClass("vasak-reaction-active", isActive);

			if (isActive) {
				$existingBtn.addClass("vasak-reaction-just-added");
				setTimeout(function () {
					$existingBtn.removeClass("vasak-reaction-just-added");
				}, 500);
			}

			// Si el conteo llega a 0, remover el botón
			if (count <= 0) {
				$existingBtn.remove();
			}
		} else {
			// Crear nuevo botón si hay conteo > 0
			if (count > 0) {
				var $newBtn = buildReactionBtn(reaction, count, isActive, pid, uid);
				$newBtn.addClass("vasak-reaction-just-added");

				// Insertar antes del trigger
				var $trigger = $wrapper.find(".vasak-reaction-trigger");
				if ($trigger.length) {
					$trigger.before($newBtn);
				} else {
					$wrapper.append($newBtn);
				}

				setTimeout(function () {
					$newBtn.removeClass("vasak-reaction-just-added");
				}, 500);
			}
		}

		// Actualizar tooltip
		if ($existingBtn && $existingBtn.length) {
			var tooltip = buildTooltip(reaction, pid);
			if (tooltip) {
				$existingBtn.attr("data-tooltip", tooltip);
			} else {
				$existingBtn.removeAttr("data-tooltip");
			}
		}
	}

	// ── Storage ────────────────────────────────────────────────────────────

	function loadReactions(pid) {
		try {
			var raw = localStorage.getItem(STORAGE_PREFIX + pid);
			return raw ? JSON.parse(raw) : {};
		} catch (e) {
			return {};
		}
	}

	function saveReactions(pid, data) {
		try {
			localStorage.setItem(STORAGE_PREFIX + pid, JSON.stringify(data));
		} catch (e) {
			// localStorage lleno o bloqueado
		}
	}

	// ── Helpers ────────────────────────────────────────────────────────────

	function getCurrentUid() {
		return typeof app !== "undefined" && app.user && app.user.uid
			? String(app.user.uid)
			: "guest";
	}

	function isUpvoted(pid) {
		var $post = $('[data-pid="' + pid + '"]');
		return $post.find('[component="post/upvote"]').hasClass("upvoted");
	}

	function getUpvoteCount(pid) {
		var $post = $('[data-pid="' + pid + '"]');
		var $count = $post.find('[component="post/vote-count"]');
		return parseInt($count.attr("data-votes") || $count.text(), 10) || 0;
	}

	function extractVotes(res) {
		if (!res) return null;
		if (res.response && res.response.post) return res.response.post.votes;
		if (res.response && res.response.votes !== undefined)
			return res.response.votes;
		if (res.post && res.post.votes !== undefined) return res.post.votes;
		if (res.votes !== undefined) return res.votes;
		return null;
	}

	return Reactions;
});
