"use strict";

/**
 * Vasak Topic Search
 * ==================
 * Búsqueda dentro de los posts de un topic.
 * Usa la API de NodeBB con filtro tid.
 * Resalta los matches en el DOM.
 * Se activa con el botón en el sidebar del topic o con Ctrl+F (en topic).
 */
define("vasak/topic-search", ["api"], function (api) {
	var TopicSearch = {};

	var DEBOUNCE_MS = 350;
	var searchTimer = null;
	var $panel = null;
	var isOpen = false;

	TopicSearch.init = function () {
		if (!$('[component="topic"]').length) return;

		injectButton();
		injectPanel();

		// Ctrl+F en topic abre el panel en lugar del find del navegador
		$(document).on("keydown.vasak-topic-search", function (e) {
			if (
				(e.ctrlKey || e.metaKey) &&
				e.key === "f" &&
				$('[component="topic"]').length
			) {
				e.preventDefault();
				togglePanel();
			}
		});
	};

	function injectButton() {
		if ($("#vasak-topic-search-btn").length) return;

		var $btn = $(
			'<button id="vasak-topic-search-btn" class="btn btn-ghost btn-sm d-flex gap-2 align-items-center w-100 justify-content-start" type="button">' +
				'<i class="fa fa-fw fa-search" aria-hidden="true"></i>' +
				'<span class="fw-semibold text-nowrap">Buscar en topic</span>' +
				"</button>",
		);

		$btn.on("click", togglePanel);

		var $sidebar = $(".topic-sidebar-actions");
		if ($sidebar.length) $sidebar.append($btn);
	}

	function injectPanel() {
		if ($("#vasak-topic-search-panel").length) return;

		$panel = $(
			'<div id="vasak-topic-search-panel" class="vasak-topic-search-panel" hidden>' +
				'<div class="vasak-ts-header">' +
				'<div class="vasak-ts-input-wrap">' +
				'<i class="fa fa-search vasak-ts-icon" aria-hidden="true"></i>' +
				'<input type="search" class="vasak-ts-input" placeholder="Buscar en este topic…" aria-label="Buscar en topic">' +
				'<span class="vasak-ts-count"></span>' +
				"</div>" +
				'<div class="vasak-ts-nav">' +
				'<button class="vasak-ts-prev btn btn-ghost btn-sm" aria-label="Anterior"><i class="fa fa-chevron-up"></i></button>' +
				'<button class="vasak-ts-next btn btn-ghost btn-sm" aria-label="Siguiente"><i class="fa fa-chevron-down"></i></button>' +
				'<button class="vasak-ts-close btn btn-ghost btn-sm" aria-label="Cerrar"><i class="fa fa-times"></i></button>' +
				"</div>" +
				"</div>" +
				'<ul class="vasak-ts-results list-unstyled"></ul>' +
				"</div>",
		);

		// Insertar antes del contenido del topic
		$('[component="topic"]').before($panel);

		// Handlers
		$panel.find(".vasak-ts-input").on("input", function () {
			clearTimeout(searchTimer);
			var term = $(this).val().trim();
			searchTimer = setTimeout(function () {
				doSearch(term);
			}, DEBOUNCE_MS);
		});

		$panel.find(".vasak-ts-close").on("click", closePanel);
		$panel.find(".vasak-ts-prev").on("click", function () {
			navigateResults(-1);
		});
		$panel.find(".vasak-ts-next").on("click", function () {
			navigateResults(1);
		});

		// Escape cierra
		$panel.find(".vasak-ts-input").on("keydown", function (e) {
			if (e.key === "Escape") closePanel();
			if (e.key === "Enter") navigateResults(1);
		});
	}

	function togglePanel() {
		isOpen ? closePanel() : openPanel();
	}

	function openPanel() {
		if (!$panel) return;
		isOpen = true;
		$panel.removeAttr("hidden").addClass("vasak-ts-visible");
		$panel.find(".vasak-ts-input").trigger("focus");
	}

	function closePanel() {
		if (!$panel) return;
		isOpen = false;
		$panel.removeClass("vasak-ts-visible");
		setTimeout(function () {
			$panel.attr("hidden", "");
		}, 200);
		clearHighlights();
		$panel.find(".vasak-ts-results").empty();
		$panel.find(".vasak-ts-count").text("");
	}

	var results = [];
	var resultIdx = -1;

	function doSearch(term) {
		clearHighlights();
		results = [];
		resultIdx = -1;
		$panel.find(".vasak-ts-results").empty();
		$panel.find(".vasak-ts-count").text("");

		if (!term || term.length < 2) return;

		var tid =
			typeof ajaxify !== "undefined" && ajaxify.data ? ajaxify.data.tid : null;
		if (!tid) return;

		api
			.get("/api/search", { term: term, in: "posts", tid: tid })
			.then(function (data) {
				var posts = (data && data.posts) || [];
				results = posts.slice(0, 20);
				renderResults(results, term);
				if (results.length) navigateResults(1);
			})
			.catch(function () {
				$panel.find(".vasak-ts-count").text("Error al buscar");
			});
	}

	function renderResults(posts, term) {
		var $list = $panel.find(".vasak-ts-results");
		var $count = $panel.find(".vasak-ts-count");

		$count.text(
			posts.length
				? posts.length + " resultado" + (posts.length !== 1 ? "s" : "")
				: "Sin resultados",
		);

		posts.forEach(function (post, i) {
			var snippet = (post.content || "")
				.replace(/<[^>]+>/g, "")
				.substring(0, 120);
			var $item = $(
				'<li class="vasak-ts-result" data-index="' +
					i +
					'">' +
					'<a href="' +
					(config.relative_path || "") +
					"/post/" +
					post.pid +
					'">' +
					'<span class="vasak-ts-result-author">' +
					escapeHtml(post.user ? post.user.displayname : "Usuario") +
					"</span>" +
					'<span class="vasak-ts-result-snippet">' +
					highlightText(escapeHtml(snippet), term) +
					"</span>" +
					"</a>" +
					"</li>",
			);
			$item.on("click", function (e) {
				e.preventDefault();
				resultIdx = i;
				scrollToResult(post.pid);
			});
			$list.append($item);
		});
	}

	function navigateResults(dir) {
		if (!results.length) return;
		resultIdx = (resultIdx + dir + results.length) % results.length;
		var post = results[resultIdx];
		if (post) scrollToResult(post.pid);

		// Highlight item activo en la lista
		$panel.find(".vasak-ts-result").removeClass("vasak-ts-result-active");
		$panel
			.find('.vasak-ts-result[data-index="' + resultIdx + '"]')
			.addClass("vasak-ts-result-active");
	}

	function scrollToResult(pid) {
		var $post = $('[data-pid="' + pid + '"]');
		if (!$post.length) return;

		var headerH = $(".brand-container").outerHeight() || 56;
		var panelH = $panel.outerHeight() || 0;
		var top = $post.offset().top - headerH - panelH - 16;

		$("html, body").animate({ scrollTop: top }, 250);
		$post.addClass("vasak-ts-post-highlight");
		setTimeout(function () {
			$post.removeClass("vasak-ts-post-highlight");
		}, 2000);
	}

	function clearHighlights() {
		$(".vasak-ts-post-highlight").removeClass("vasak-ts-post-highlight");
	}

	function highlightText(text, term) {
		var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		return text.replace(
			new RegExp("(" + escaped + ")", "gi"),
			"<mark>$1</mark>",
		);
	}

	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	return TopicSearch;
});
