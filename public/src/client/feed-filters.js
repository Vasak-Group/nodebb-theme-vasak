"use strict";

/**
 * Vasak Feed Filters
 * ==================
 * Filtros visuales en el feed: All / Images / Videos / Popular.
 * Filtra los posts ya cargados en el DOM sin hacer nuevas requests.
 * El filtro activo se persiste en localStorage.
 */
define("forum/vasak-feed-filters", [], function () {
	var Filters = {};
	var STORAGE_KEY = "vasak:feed-filter";
	var ACTIVE_FILTER = "all";

	Filters.init = function () {
		if (!$(".feed").length) return;

		// Restaurar filtro guardado
		try {
			ACTIVE_FILTER = localStorage.getItem(STORAGE_KEY) || "all";
		} catch (e) {}

		injectFilterBar();

		$(window).on("action:posts.loaded", function () {
			applyFilter(ACTIVE_FILTER);
		});
	};

	function injectFilterBar() {
		if ($(".vasak-feed-filter-bar").length) return;

		var $bar = $(
			'<div class="vasak-feed-filter-bar" role="group" aria-label="Filtrar posts">' +
				'<button class="vasak-filter-btn" data-filter="all">Todo</button>' +
				'<button class="vasak-filter-btn" data-filter="images"><i class="fa fa-image" aria-hidden="true"></i> Imágenes</button>' +
				'<button class="vasak-filter-btn" data-filter="videos"><i class="fa fa-play-circle" aria-hidden="true"></i> Videos</button>' +
				'<button class="vasak-filter-btn" data-filter="popular"><i class="fa fa-fire" aria-hidden="true"></i> Popular</button>' +
				"</div>",
		);

		// Marcar el filtro activo restaurado
		$bar.find('[data-filter="' + ACTIVE_FILTER + '"]').addClass("active");

		$bar.on("click", ".vasak-filter-btn", function () {
			$bar.find(".vasak-filter-btn").removeClass("active");
			$(this).addClass("active");
			ACTIVE_FILTER = $(this).attr("data-filter");
			try {
				localStorage.setItem(STORAGE_KEY, ACTIVE_FILTER);
			} catch (e) {}
			applyFilter(ACTIVE_FILTER);
		});

		$('[component="posts"]').before($bar);

		// Aplicar filtro restaurado a los posts ya en el DOM
		applyFilter(ACTIVE_FILTER);
	}

	function applyFilter(filter) {
		$('[component="post"]').each(function () {
			var $post = $(this);
			var show = true;

			if (filter === "images") {
				show =
					$post.find("img:not(.avatar):not(.emoji)").length > 0 ||
					$post.find(".feed-image-section").length > 0;
			} else if (filter === "videos") {
				show =
					$post.find("video, .vasak-feed-video").length > 0 ||
					$post.find('a[href*=".mp4"]').length > 0;
			} else if (filter === "popular") {
				var votes =
					parseInt($post.find('[component="upvote-count"]').text(), 10) || 0;
				show = votes >= 5;
			}

			$post.toggleClass("vasak-filter-hidden", !show);
		});
	}

	return Filters;
});
