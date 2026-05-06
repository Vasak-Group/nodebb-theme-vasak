"use strict";

/**
 * Vasak Topic TOC
 * ===============
 * Genera una tabla de contenidos en el sidebar del topic
 * basada en los headings (h1-h3) del primer post.
 * Solo se activa si el primer post tiene 3+ headings.
 *
 * Incluye:
 *  - Scroll suave al hacer click en un item
 *  - Highlight del heading activo al hacer scroll (IntersectionObserver)
 *  - Colapsable con toggle
 */
define("vasak/toc", [], function () {
	var TOC = {};

	var MIN_HEADINGS = 3;
	var observer = null;

	TOC.init = function () {
		if (!$('[component="topic"]').length) return;

		buildTOC();

		// Reconstruir si se cargan más posts
		$(window).on("action:posts.loaded.toc", buildTOC);
	};

	function buildTOC() {
		// Solo del primer post (el post principal del topic)
		var $firstPost = $(
			'[component="post"]:first-child [component="post/content"]',
		);
		if (!$firstPost.length) return;

		var $headings = $firstPost.find("h1, h2, h3").filter(function () {
			return $(this).text().trim().length > 0;
		});

		if ($headings.length < MIN_HEADINGS) return;
		if ($("#vasak-toc").length) return; // ya existe

		// Asignar IDs a los headings para anclar
		$headings.each(function (i) {
			if (!$(this).attr("id")) {
				$(this).attr("id", "vasak-heading-" + i);
			}
		});

		// Construir el HTML del TOC
		var items = $headings
			.map(function (i, el) {
				var $el = $(el);
				var level = parseInt(el.tagName.replace("H", ""), 10);
				var id = $el.attr("id");
				var text = $el.text().trim();
				return (
					'<li class="vasak-toc-item vasak-toc-h' +
					level +
					'">' +
					'<a href="#' +
					id +
					'" class="vasak-toc-link" data-target="' +
					id +
					'">' +
					escapeHtml(text) +
					"</a>" +
					"</li>"
				);
			})
			.get()
			.join("");

		var $toc = $(
			'<div id="vasak-toc" class="vasak-toc">' +
				'<button class="vasak-toc-toggle" aria-expanded="true" aria-controls="vasak-toc-list">' +
				"<span>Contenido</span>" +
				'<i class="fa fa-chevron-up vasak-toc-chevron" aria-hidden="true"></i>' +
				"</button>" +
				'<ul id="vasak-toc-list" class="vasak-toc-list list-unstyled">' +
				items +
				"</ul>" +
				"</div>",
		);

		// Insertar en el sidebar del topic
		var $sidebar = $(".topic-sidebar");
		if ($sidebar.length) {
			$sidebar.prepend($toc);
		} else {
			// Fallback: antes del primer post
			$('[component="topic"]').before($toc);
		}

		// Toggle collapse
		$toc.find(".vasak-toc-toggle").on("click", function () {
			var $btn = $(this);
			var $list = $("#vasak-toc-list");
			var open = $btn.attr("aria-expanded") === "true";
			$btn.attr("aria-expanded", !open);
			$list.toggleClass("vasak-toc-collapsed", open);
			$toc
				.find(".vasak-toc-chevron")
				.toggleClass("fa-chevron-up fa-chevron-down");
		});

		// Scroll suave al hacer click
		$toc.on("click", ".vasak-toc-link", function (e) {
			e.preventDefault();
			var targetId = $(this).attr("data-target");
			var $target = $("#" + targetId);
			if (!$target.length) return;

			var headerH = $(".brand-container").outerHeight() || 56;
			var top = $target.offset().top - headerH - 16;
			$("html, body").animate({ scrollTop: top }, 300);
		});

		// Highlight del heading activo con IntersectionObserver
		initScrollSpy($headings);
	}

	function initScrollSpy($headings) {
		if (observer) observer.disconnect();

		observer = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					var id = entry.target.id;
					var $link = $('[data-target="' + id + '"]');
					$link.toggleClass("vasak-toc-active", entry.isIntersecting);
				});
			},
			{ rootMargin: "-10% 0px -80% 0px", threshold: 0 },
		);

		$headings.each(function () {
			if (this.id) observer.observe(this);
		});
	}

	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	}

	return TOC;
});
