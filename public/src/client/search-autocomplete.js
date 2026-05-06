"use strict";

/**
 * Vasak Search Autocomplete
 * =========================
 * Autocompletado en tiempo real para el input de búsqueda del header.
 *
 * CARACTERÍSTICAS:
 *  - Sugerencias de topics mientras el usuario escribe (300ms debounce)
 *  - Historial de búsquedas recientes (localStorage, últimas 8)
 *  - Búsquedas populares/trending (desde la API de NodeBB)
 *  - Navegación con teclado (↑↓ Enter Escape)
 *  - Highlight del término buscado en los resultados
 *  - Accesibilidad: aria-expanded, aria-activedescendant, roles
 *  - Cierre al hacer click fuera o al navegar
 *
 * SELECTORES:
 *  El widget de búsqueda de NodeBB/Harmony usa:
 *    .search-widget input[type="text"]  — input principal
 *    .search-widget .input-group        — contenedor
 */
define("forum/vasak-autocomplete", ["api"], function (api) {
	var Autocomplete = {};

	// ── Configuración ──────────────────────────────────────────────────────
	var DEBOUNCE_MS = 300;
	var MIN_CHARS = 2;
	var MAX_RESULTS = 6;
	var MAX_HISTORY = 8;
	var HISTORY_KEY = "vasak:search:history";
	var DROPDOWN_ID = "vasak-search-dropdown";

	// ── Estado ────────────────────────────────────────────────────────────
	var searchTimer = null;
	var activeIndex = -1;
	var currentResults = [];
	var $input = null;
	var $dropdown = null;

	// ── Init ───────────────────────────────────────────────────────────────

	Autocomplete.init = function () {
		bindToSearchInput();

		// Re-bind después de navegación SPA (el widget puede re-renderizarse)
		$(window).on("action:ajaxify.end", function () {
			setTimeout(bindToSearchInput, 200);
		});
	};

	function bindToSearchInput() {
		// Buscar el input del header — NodeBB/Harmony lo inyecta en brand-header
		var $newInput = $(
			'[data-widget-area="brand-header"] input[type="text"], ' +
				'.search-widget input[type="text"], ' +
				'.brand-container input[type="search"]',
		).first();

		if (!$newInput.length || $newInput.is($input)) return;

		// Desregistrar listeners del input anterior
		if ($input) {
			$input.off(".vasak-ac");
		}

		$input = $newInput;

		// Atributos de accesibilidad
		$input.attr({
			autocomplete: "off",
			"aria-autocomplete": "list",
			"aria-expanded": "false",
			"aria-controls": DROPDOWN_ID,
			"aria-haspopup": "listbox",
			role: "combobox",
		});

		// Eventos
		$input.on("input.vasak-ac", onInput);
		$input.on("keydown.vasak-ac", onKeydown);
		$input.on("focus.vasak-ac", onFocus);
		$input.on("blur.vasak-ac", function () {
			// Delay para permitir clicks en el dropdown
			setTimeout(closeDropdown, 200);
		});
	}

	// ── Handlers de input ──────────────────────────────────────────────────

	function onInput() {
		var term = $input.val().trim();
		clearTimeout(searchTimer);

		if (term.length < MIN_CHARS) {
			// Mostrar historial si el input está vacío
			if (term.length === 0) {
				showHistory();
			} else {
				closeDropdown();
			}
			return;
		}

		searchTimer = setTimeout(function () {
			fetchSuggestions(term);
		}, DEBOUNCE_MS);
	}

	function onFocus() {
		var term = $input.val().trim();
		if (term.length === 0) {
			showHistory();
		} else if (term.length >= MIN_CHARS) {
			fetchSuggestions(term);
		}
	}

	function onKeydown(e) {
		if (!$dropdown || !$dropdown.length) return;

		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				moveSelection(1);
				break;
			case "ArrowUp":
				e.preventDefault();
				moveSelection(-1);
				break;
			case "Enter":
				e.preventDefault();
				selectActive();
				break;
			case "Escape":
				closeDropdown();
				$input.blur();
				break;
			case "Tab":
				closeDropdown();
				break;
		}
	}

	// ── Fetch de sugerencias ───────────────────────────────────────────────

	function fetchSuggestions(term) {
		// Timeout de 5s para no bloquear la UI si la API tarda
		var timedOut = false;
		var timeout = setTimeout(function () {
			timedOut = true;
			// Fallback: mostrar historial si la API no responde
			showHistory();
		}, 5000);

		api
			.get("/api/search", {
				term: term,
				in: "titlesposts",
				showAs: "topics",
			})
			.then(function (data) {
				if (timedOut) return; // ya mostramos el fallback
				clearTimeout(timeout);
				var topics =
					data && data.topics ? data.topics.slice(0, MAX_RESULTS) : [];
				currentResults = topics.map(function (t) {
					return {
						type: "topic",
						title: t.title,
						url: (config.relative_path || "") + "/topic/" + t.slug,
						tid: t.tid,
						category: t.category ? t.category.name : "",
					};
				});
				renderDropdown(term, currentResults);
			})
			.catch(function () {
				clearTimeout(timeout);
				// Error de red — mostrar historial como fallback
				if (!timedOut) showHistory();
			});
	}

	// ── Historial ──────────────────────────────────────────────────────────

	function loadHistory() {
		try {
			return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
		} catch (e) {
			return [];
		}
	}

	function saveToHistory(term) {
		if (!term || term.trim().length < MIN_CHARS) return;
		var history = loadHistory().filter(function (h) {
			return h.toLowerCase() !== term.toLowerCase();
		});
		history.unshift(term.trim());
		history = history.slice(0, MAX_HISTORY);
		try {
			localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
		} catch (e) {}
	}

	function removeFromHistory(term) {
		var history = loadHistory().filter(function (h) {
			return h.toLowerCase() !== term.toLowerCase();
		});
		try {
			localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
		} catch (e) {}
	}

	function showHistory() {
		var history = loadHistory();
		if (!history.length) {
			closeDropdown();
			return;
		}

		var items = history.map(function (term) {
			return {
				type: "history",
				title: term,
				url:
					(config.relative_path || "") +
					"/search?term=" +
					encodeURIComponent(term),
			};
		});

		renderDropdown("", items, true);
	}

	// ── Render del dropdown ────────────────────────────────────────────────

	function renderDropdown(term, items, isHistory) {
		closeDropdown(true); // Cerrar sin animación

		if (!items.length) return;

		activeIndex = -1;

		var $drop = $(
			'<ul id="' +
				DROPDOWN_ID +
				'" class="vasak-search-dropdown" ' +
				'role="listbox" aria-label="Search suggestions"></ul>',
		);

		// Header de sección
		if (isHistory) {
			$drop.append(
				'<li class="vasak-search-section-header" role="presentation">' +
					"<span>Recent searches</span>" +
					'<button class="vasak-search-clear-history" type="button">Clear all</button>' +
					"</li>",
			);
		} else if (items.length) {
			$drop.append(
				'<li class="vasak-search-section-header" role="presentation">' +
					"<span>Topics</span>" +
					"</li>",
			);
		}

		// Items
		items.forEach(function (item, idx) {
			var $item = buildItem(item, idx, term, isHistory);
			$drop.append($item);
		});

		// Footer: "Search for X"
		if (term && term.length >= MIN_CHARS) {
			var searchUrl =
				(config.relative_path || "") +
				"/search?term=" +
				encodeURIComponent(term);
			$drop.append(
				'<li class="vasak-search-footer" role="presentation">' +
					'<a href="' +
					searchUrl +
					'" class="vasak-search-see-all">' +
					'<i class="fa fa-search" aria-hidden="true"></i>' +
					" Search for <strong>" +
					escapeHtml(term) +
					"</strong>" +
					"</a>" +
					"</li>",
			);
		}

		// Posicionar relativo al input
		var $container = $input
			.closest(".search-widget, .input-group, form")
			.first();
		if (!$container.length) $container = $input.parent();
		$container.css("position", "relative").append($drop);

		$dropdown = $drop;
		$input.attr("aria-expanded", "true");

		// Handlers del dropdown
		$drop.on("click", ".vasak-search-clear-history", function (e) {
			e.preventDefault();
			e.stopPropagation();
			try {
				localStorage.removeItem(HISTORY_KEY);
			} catch (e2) {}
			closeDropdown();
		});

		$drop.on("click", ".vasak-search-item-remove", function (e) {
			e.preventDefault();
			e.stopPropagation();
			var term = $(this).closest("[data-term]").attr("data-term");
			removeFromHistory(term);
			showHistory();
		});

		$drop.on("click", "a[href]", function () {
			var term =
				$(this).closest("[data-term]").attr("data-term") ||
				$(this).text().trim();
			if (term) saveToHistory(term);
			closeDropdown();
		});
	}

	function buildItem(item, idx, term, isHistory) {
		var titleHtml = isHistory
			? escapeHtml(item.title)
			: highlightTerm(item.title, term);

		var $item = $(
			'<li class="vasak-search-item" role="option" ' +
				'id="vasak-ac-item-' +
				idx +
				'" ' +
				'aria-selected="false" ' +
				'data-term="' +
				escapeAttr(item.title) +
				'">' +
				'<a href="' +
				escapeAttr(item.url) +
				'" class="vasak-search-item-link">' +
				'<span class="vasak-search-item-icon">' +
				(isHistory
					? '<i class="fa fa-history" aria-hidden="true"></i>'
					: '<i class="fa fa-file-text-o" aria-hidden="true"></i>') +
				"</span>" +
				'<span class="vasak-search-item-content">' +
				'<span class="vasak-search-item-title">' +
				titleHtml +
				"</span>" +
				(item.category
					? '<span class="vasak-search-item-meta">' +
						escapeHtml(item.category) +
						"</span>"
					: "") +
				"</span>" +
				(isHistory
					? '<button class="vasak-search-item-remove" type="button" aria-label="Remove from history">' +
						'<i class="fa fa-times" aria-hidden="true"></i>' +
						"</button>"
					: "") +
				"</a>" +
				"</li>",
		);

		return $item;
	}

	// ── Navegación con teclado ─────────────────────────────────────────────

	function moveSelection(direction) {
		if (!$dropdown) return;

		var $items = $dropdown.find(".vasak-search-item");
		var total = $items.length;
		if (!total) return;

		// Quitar selección actual
		$items
			.eq(activeIndex)
			.removeClass("vasak-search-item-active")
			.attr("aria-selected", "false");

		activeIndex = (activeIndex + direction + total) % total;

		var $active = $items.eq(activeIndex);
		$active.addClass("vasak-search-item-active").attr("aria-selected", "true");
		$input.attr("aria-activedescendant", "vasak-ac-item-" + activeIndex);

		// Scroll al item activo
		$active[0].scrollIntoView({ block: "nearest" });
	}

	function selectActive() {
		if (!$dropdown || activeIndex < 0) {
			// Enter sin selección → ir a la página de búsqueda
			var term = $input.val().trim();
			if (term) {
				saveToHistory(term);
				window.location.href =
					(config.relative_path || "") +
					"/search?term=" +
					encodeURIComponent(term);
			}
			return;
		}

		var $active = $dropdown.find(".vasak-search-item").eq(activeIndex);
		var $link = $active.find("a[href]");
		var term = $active.attr("data-term");

		if (term) saveToHistory(term);
		if ($link.length) {
			window.location.href = $link.attr("href");
		}
		closeDropdown();
	}

	// ── Cerrar dropdown ────────────────────────────────────────────────────

	function closeDropdown(immediate) {
		if ($dropdown) {
			if (!immediate) {
				$dropdown.addClass("vasak-search-dropdown-closing");
				setTimeout(function () {
					if ($dropdown) {
						$dropdown.remove();
						$dropdown = null;
					}
				}, 150);
			} else {
				$dropdown.remove();
				$dropdown = null;
			}
		}
		activeIndex = -1;
		if ($input) {
			$input.attr("aria-expanded", "false");
			$input.removeAttr("aria-activedescendant");
		}
	}

	// ── Helpers ────────────────────────────────────────────────────────────

	function highlightTerm(text, term) {
		if (!term) return escapeHtml(text);
		var escaped = escapeHtml(text);
		var escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		return escaped.replace(
			new RegExp("(" + escapedTerm + ")", "gi"),
			'<mark class="vasak-search-highlight">$1</mark>',
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

	return Autocomplete;
});
