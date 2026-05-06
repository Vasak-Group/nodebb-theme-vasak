"use strict";

/**
 * Vasak Composer Mentions
 * =======================
 * Autocompletado de @menciones en el textarea del composer.
 *
 * FLUJO:
 *  - Al escribir "@" + 1 carácter → buscar usuarios via API
 *  - Mostrar dropdown con avatares y nombres
 *  - Seleccionar con click o teclado (↑↓ Enter Escape)
 *  - Insertar "@username " en el cursor
 */
define("forum/vasak-mentions", ["api"], function (api) {
	var Mentions = {};

	var DEBOUNCE_MS = 250;
	var MAX_RESULTS = 6;
	var TRIGGER_CHAR = "@";

	var searchTimer = null;
	var $textarea = null;
	var $dropdown = null;
	var activeIndex = -1;
	var triggerPos = -1; // posición del "@" en el textarea

	Mentions.init = function () {
		$(window).on(
			"action:composer.loaded action:composer.enhanced",
			function () {
				setTimeout(bindTextarea, 150);
			},
		);
	};

	function bindTextarea() {
		var $new = $(".composer .write");
		if (!$new.length || $new.is($textarea)) return;
		if ($textarea) $textarea.off(".vasak-mentions");

		$textarea = $new;
		$textarea.on(
			"input.vasak-mentions keydown.vasak-mentions",
			onTextareaEvent,
		);
		$textarea.on("blur.vasak-mentions", function () {
			setTimeout(closeDropdown, 200);
		});
	}

	function onTextareaEvent(e) {
		if (e.type === "keydown") {
			if (!$dropdown) return;
			if (e.key === "ArrowDown") {
				e.preventDefault();
				moveSelection(1);
				return;
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				moveSelection(-1);
				return;
			}
			if (e.key === "Enter") {
				e.preventDefault();
				selectActive();
				return;
			}
			if (e.key === "Escape") {
				closeDropdown();
				return;
			}
			if (e.key === "Tab") {
				closeDropdown();
				return;
			}
			return;
		}

		// input event
		var text = $textarea.val();
		var cursor = $textarea[0].selectionStart;
		var query = getMentionQuery(text, cursor);

		if (query === null) {
			closeDropdown();
			return;
		}

		clearTimeout(searchTimer);
		searchTimer = setTimeout(function () {
			fetchUsers(query);
		}, DEBOUNCE_MS);
	}

	// Extrae la query de mención: texto entre el último "@" y el cursor
	function getMentionQuery(text, cursor) {
		var before = text.slice(0, cursor);
		var match = before.match(/@(\w*)$/);
		if (!match) return null;
		triggerPos = before.lastIndexOf("@");
		return match[1]; // puede ser "" si acaban de escribir "@"
	}

	function fetchUsers(query) {
		if (query.length === 0) {
			// Mostrar usuarios recientes / populares sin query
			renderDropdown([]);
			return;
		}

		api
			.get("/api/users", { query: query, section: "users" })
			.then(function (data) {
				var users = (data.users || []).slice(0, MAX_RESULTS);
				renderDropdown(users);
			})
			.catch(function () {
				closeDropdown();
			});
	}

	function renderDropdown(users) {
		closeDropdown(true);
		if (!users.length) return;

		activeIndex = -1;
		$dropdown = $('<ul class="vasak-mentions-dropdown" role="listbox"></ul>');

		users.forEach(function (u, i) {
			var avatar = u.picture
				? '<img src="' +
					u.picture +
					'" class="vasak-mentions-avatar" loading="lazy" alt="">'
				: '<span class="vasak-mentions-avatar vasak-mentions-avatar-icon" style="background:' +
					(u["icon:bgColor"] || "#dd7878") +
					'">' +
					(u["icon:text"] || u.username[0].toUpperCase()) +
					"</span>";

			var $item = $(
				'<li class="vasak-mentions-item" role="option" id="vasak-mention-' +
					i +
					'" aria-selected="false">' +
					avatar +
					'<span class="vasak-mentions-name">' +
					escapeHtml(u.displayname || u.username) +
					"</span>" +
					'<span class="vasak-mentions-slug">@' +
					escapeHtml(u.username) +
					"</span>" +
					"</li>",
			);

			$item.on("mousedown", function (e) {
				e.preventDefault(); // evitar blur del textarea
				insertMention(u.username);
			});

			$dropdown.append($item);
		});

		// Posicionar debajo del cursor en el textarea
		var $container = $textarea.parent();
		$container.css("position", "relative").append($dropdown);
	}

	function moveSelection(dir) {
		if (!$dropdown) return;
		var $items = $dropdown.find(".vasak-mentions-item");
		$items
			.eq(activeIndex)
			.removeClass("vasak-mentions-active")
			.attr("aria-selected", "false");
		activeIndex = (activeIndex + dir + $items.length) % $items.length;
		$items
			.eq(activeIndex)
			.addClass("vasak-mentions-active")
			.attr("aria-selected", "true");
	}

	function selectActive() {
		if (!$dropdown || activeIndex < 0) return;
		var slug = $dropdown
			.find(".vasak-mentions-item")
			.eq(activeIndex)
			.find(".vasak-mentions-slug")
			.text()
			.replace("@", "");
		insertMention(slug);
	}

	function insertMention(username) {
		var text = $textarea.val();
		var cursor = $textarea[0].selectionStart;
		var before = text.slice(0, triggerPos);
		var after = text.slice(cursor);
		var insert = "@" + username + " ";

		$textarea.val(before + insert + after);
		var newPos = before.length + insert.length;
		$textarea[0].setSelectionRange(newPos, newPos);
		$textarea.trigger("input"); // notificar al autosave
		closeDropdown();
	}

	function closeDropdown(immediate) {
		if ($dropdown) {
			$dropdown.remove();
			$dropdown = null;
		}
		activeIndex = -1;
	}

	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	return Mentions;
});
