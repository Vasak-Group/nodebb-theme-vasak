"use strict";

/**
 * Vasak Topic Enhancements
 * ========================
 * Loaded only on topic pages (forum/topic).
 * Handles: image carousels, bookmark fix, parent post navigation,
 * post hover actions.
 */
define("forum/topic/vasak-enhancements", [
	"hooks",
	"forum/vasak-reactions",
	"forum/vasak-toc",
], function (hooks, Reactions, TOC) {
	var carouselCounter = 0;

	var TopicEnhancements = {};

	TopicEnhancements.init = function () {
		initPostImageCarousels();
		fixBookmarkAlert();
		initParentPostNavigation();
		initPostHoverActions();

		Reactions.init();
		TOC.init();

		// Re-run on new posts (quick reply, infinite scroll)
		$(window).on("action:posts.loaded action:topic.loaded", function () {
			initPostImageCarousels();
			initParentPostNavigation();
			initPostHoverActions();
		});

		// Re-process edited posts
		$(window).on("action:posts.edited", function (ev, data) {
			if (data && data.post && data.post.pid) {
				var $post = $('[data-pid="' + data.post.pid + '"]');
				var $content = $post.find('[component="post/content"]');
				$content.removeAttr("data-carousel-processed");
				$content.find(".post-image-carousel").remove();
				initPostImageCarousels();
			}
		});
	};

	// ── Image Carousels ────────────────────────────────────────────────────

	function initPostImageCarousels() {
		$('[component="post/content"]:not([data-carousel-processed])').each(
			function () {
				var $content = $(this);
				$content.attr("data-carousel-processed", "true");

				var $images = $content.find("img").filter(function () {
					var $img = $(this);

					if ($img.closest(".carousel, .post-image-carousel").length) {
						return false;
					}

					if (
						$img.hasClass("emoji") ||
						$img.hasClass("emoji-img") ||
						$img.hasClass("icon") ||
						$img.hasClass("not-responsive")
					) {
						return false;
					}

					var src = $img.attr("src") || "";
					var isContentImage =
						src.indexOf("/assets/uploads/") !== -1 ||
						src.indexOf("/files/") !== -1 ||
						src.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);

					if (!isContentImage) return false;

					var width = $img.attr("width");
					var height = $img.attr("height");
					if (
						(width && parseInt(width, 10) < 50) ||
						(height && parseInt(height, 10) < 50)
					) {
						return false;
					}

					return true;
				});

				if ($images.length >= 2) {
					createCarousel($content, $images);
				}
			},
		);
	}

	function createCarousel($content, $images) {
		var carouselId = "post-carousel-" + ++carouselCounter;

		var html =
			'<div id="' +
			carouselId +
			'" class="carousel slide post-image-carousel" data-bs-ride="false">';

		// Indicators
		html += '<div class="carousel-indicators">';
		$images.each(function (i) {
			var active = i === 0 ? "active" : "";
			var ariaCurrent = i === 0 ? 'aria-current="true"' : "";
			html +=
				'<button type="button" data-bs-target="#' +
				carouselId +
				'" data-bs-slide-to="' +
				i +
				'" class="' +
				active +
				'" ' +
				ariaCurrent +
				' aria-label="Slide ' +
				(i + 1) +
				'"></button>';
		});
		html += "</div>";

		// Slides
		html += '<div class="carousel-inner">';
		$images.each(function (i) {
			var $img = $(this);
			var src = $img.attr("src");
			var alt = $img.attr("alt") || "Image " + (i + 1);
			var active = i === 0 ? "active" : "";
			var loading = i === 0 ? "eager" : "lazy";
			html += '<div class="carousel-item ' + active + '">';
			html +=
				'<img src="' +
				src +
				'" class="d-block w-100" alt="' +
				alt +
				'" loading="' +
				loading +
				'">';
			html += "</div>";
		});
		html += "</div>";

		// Controls
		html +=
			'<button class="carousel-control-prev" type="button" data-bs-target="#' +
			carouselId +
			'" data-bs-slide="prev">' +
			'<span class="carousel-control-prev-icon" aria-hidden="true"></span>' +
			'<span class="visually-hidden">Previous</span></button>';
		html +=
			'<button class="carousel-control-next" type="button" data-bs-target="#' +
			carouselId +
			'" data-bs-slide="next">' +
			'<span class="carousel-control-next-icon" aria-hidden="true"></span>' +
			'<span class="visually-hidden">Next</span></button>';

		html += "</div>";

		// Find insertion point (direct child of $content)
		var $insertBefore = $images.first();
		while (
			$insertBefore.parent().length &&
			!$insertBefore.parent().is($content)
		) {
			$insertBefore = $insertBefore.parent();
		}
		$insertBefore.before(html);

		// Remove original images
		var toRemove = [];
		$images.each(function () {
			var $el = $(this);
			while ($el.parent().length && !$el.parent().is($content)) {
				$el = $el.parent();
			}
			if (toRemove.indexOf($el[0]) === -1) toRemove.push($el[0]);
		});
		$(toRemove).remove();

		// Bootstrap carousel init
		var el = document.getElementById(carouselId);
		if (el && typeof bootstrap !== "undefined") {
			new bootstrap.Carousel(el, { interval: false, touch: true, wrap: true });
		}
	}

	// ── Bookmark Alert Fix ─────────────────────────────────────────────────

	function fixBookmarkAlert() {
		$(window).on("action:topic.loaded", function () {
			setTimeout(function () {
				if (
					typeof ajaxify === "undefined" ||
					!ajaxify.data ||
					!ajaxify.data.template ||
					!ajaxify.data.template.topic
				) {
					return;
				}

				require(["storage", "alerts"], function (storage, alerts) {
					var tid = ajaxify.data.tid;
					var bookmark =
						ajaxify.data.bookmark ||
						storage.getItem("topic:" + tid + ":bookmark");
					var postIndex = ajaxify.data.postIndex || 1;
					var bookmarkInt = parseInt(bookmark, 10) || 0;
					var postIndexInt = parseInt(postIndex, 10) || 1;

					var shouldRemove =
						bookmarkInt <= 2 ||
						bookmarkInt <= postIndexInt ||
						bookmarkInt - postIndexInt <= 2;

					if (shouldRemove) {
						alerts.remove("bookmark");
					}
				});
			}, 100);
		});
	}

	// ── Parent Post Navigation ─────────────────────────────────────────────

	function initParentPostNavigation() {
		$('[component="topic"]')
			.off("click.vasak-parent")
			.on("click.vasak-parent", '[component="post/parent"]', function (e) {
				if ($(e.target).closest("a").length) return;

				e.preventDefault();
				e.stopPropagation();

				var parentPid = $(this).attr("data-parent-pid");
				if (!parentPid) return;

				var $parentPost = $(
					'[component="topic"] > [component="post"][data-pid="' +
						parentPid +
						'"]',
				);

				if ($parentPost.length) {
					smoothScrollToPost($parentPost);
				} else {
					window.location.href = config.relative_path + "/post/" + parentPid;
				}
			});
	}

	function smoothScrollToPost($el) {
		if (!$el.length) return;
		var headerHeight = $("header").outerHeight() || 60;
		var scrollTop = $el.offset().top - headerHeight - 20;

		$("html, body").animate(
			{ scrollTop: scrollTop },
			400,
			"swing",
			function () {
				highlightPost($el);
			},
		);
	}

	function highlightPost($el) {
		var $container = $el.find(".post-container-parent");
		if (!$container.length) $container = $el;
		$container.addClass("post-highlight-flash");
		setTimeout(function () {
			$container.removeClass("post-highlight-flash");
		}, 1500);
	}

	// ── Post Hover Actions ─────────────────────────────────────────────────

	function initPostHoverActions() {
		$(document).off(
			"mouseenter.vasak-hover mouseleave.vasak-hover",
			".post-container-parent",
		);

		$(document).on(
			"mouseenter.vasak-hover",
			".post-container-parent",
			function (e) {
				e.stopPropagation();
				$(".post-container-parent.post-hovered").removeClass("post-hovered");
				$(this).addClass("post-hovered");
			},
		);

		$(document).on(
			"mouseleave.vasak-hover",
			".post-container-parent",
			function (e) {
				e.stopPropagation();
				$(this).removeClass("post-hovered");
			},
		);
	}

	return TopicEnhancements;
});
