"use strict";

/**
 * Vasak Feed Filters
 * ==================
 * Filtros visuales en el feed: All / Images / Videos / Popular.
 * Filtra los posts ya cargados en el DOM sin hacer nuevas requests.
 */
define("forum/vasak-feed-filters", [], function () {
	var Filters = {};
	var ACTIVE_FILTER = "all";

	Filters.init = function () {
		if (!$(".feed").length) return;
		injectFilterBar();
		$(window).on("action:posts.loaded", function () {
			applyFilter(ACTIVE_FILTER);
		});
	};

	function injectFilterBar() {
		if ($(".vasak-feed-filter-bar").length) return;

		var $bar = $(
			'<div class="vasak-feed-filter-bar">' +
				'<button class="vasak-filter-btn active" data-filter="all">Todo</button>' +
				'<button class="vasak-filter-btn" data-filter="images"><i class="fa fa-image"></i> Imágenes</button>' +
				'<button class="vasak-filter-btn" data-filter="videos"><i class="fa fa-play-circle"></i> Videos</button>' +
				'<button class="vasak-filter-btn" data-filter="popular"><i class="fa fa-fire"></i> Popular</button>' +
				"</div>",
		);

		$bar.on("click", ".vasak-filter-btn", function () {
			$bar.find(".vasak-filter-btn").removeClass("active");
			$(this).addClass("active");
			ACTIVE_FILTER = $(this).attr("data-filter");
			applyFilter(ACTIVE_FILTER);
		});

		// Insertar antes de la lista de posts
		$('[component="posts"]').before($bar);
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
