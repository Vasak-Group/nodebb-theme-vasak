"use strict";

/**
 * Vasak Feed Enhancements
 * =======================
 * Loaded only on the feed page (/feed).
 * Handles: composer prompt card, category filter navigation,
 * share handlers, mobile dropdown fix.
 */
define("forum/vasak-feed", [], function () {
	var FeedEnhancements = {};

	FeedEnhancements.init = function () {
		initFeedComposerPromptHandler();
		initFeedCategoryFilter();
		initShareHandlers();
		fixMobileFeedCategoryDropdown();

		// Reactions on feed posts
		require(["forum/vasak-reactions"], function (Reactions) {
			Reactions.init();
		});

		$(window).on("action:posts.loaded action:ajaxify.end", function () {
			initFeedComposerPromptHandler();
			initFeedCategoryFilter();
			initShareHandlers();
			fixMobileFeedCategoryDropdown();
		});
	};

	// ── Composer Prompt Card ───────────────────────────────────────────────

	function initFeedComposerPromptHandler() {
		if (!$(".feed").length) return;
		if ($(".composer-prompt-card").length) return;

		var $controlsRow =
			$(".feed .d-flex.justify-content-between.py-2.mb-0").first() ||
			$(".feed .d-flex.justify-content-between.py-2.mb-1").first() ||
			$(".feed .d-flex.justify-content-between.py-2.mb-2").first();

		if (!$controlsRow || !$controlsRow.length) return;

		var isLoggedIn = typeof app !== "undefined" && app.user && app.user.uid;
		var avatarHtml = "";

		if (isLoggedIn) {
			var $headerAvatar = $(
				'[component="header/avatar"] img, [component="header/avatar"] [component="avatar/picture"]',
			).first();
			if ($headerAvatar.length) {
				avatarHtml =
					'<img src="' +
					$headerAvatar.attr("src") +
					'" alt="Avatar" class="avatar avatar-rounded" />';
			} else {
				var $headerIcon = $(
					'[component="header/avatar"] [component="avatar/icon"]',
				).first();
				avatarHtml = $headerIcon.length
					? $headerIcon.clone().addClass("avatar avatar-rounded").get(0)
							.outerHTML
					: '<div class="avatar avatar-rounded avatar-placeholder"><i class="fa fa-user"></i></div>';
			}
		} else {
			avatarHtml =
				'<div class="avatar avatar-rounded avatar-placeholder"><i class="fa fa-user"></i></div>';
		}

		var cardHtml =
			'<div class="composer-prompt-card' +
			(isLoggedIn ? "" : " composer-prompt-guest") +
			'">' +
			'<div class="composer-prompt-inner">' +
			'<div class="composer-prompt-avatar">' +
			avatarHtml +
			"</div>" +
			'<button class="composer-prompt-input" type="button" id="composer-prompt-btn">' +
			'<span class="composer-prompt-placeholder">' +
			(isLoggedIn
				? "Start a discussion..."
				: "Sign in to start a discussion...") +
			"</span>" +
			"</button>" +
			"</div>" +
			"</div>";

		$controlsRow.before(cardHtml);

		$(".composer-prompt-card").on(
			"click",
			".composer-prompt-input, .composer-prompt-action",
			function (e) {
				e.preventDefault();
				if (!isLoggedIn) {
					window.location.href = config.relative_path + "/login";
					return;
				}
				var $btn = $("#new_topic");
				if ($btn.length) $btn.trigger("click");
			},
		);
	}

	// ── Category Filter Navigation ─────────────────────────────────────────

	function initFeedCategoryFilter() {
		if (!$(".feed").length) return;

		var $dropdown = $('.feed-category-filter [component="category/dropdown"]');
		if (!$dropdown.length || $dropdown.attr("data-filter-initialized")) return;
		$dropdown.attr("data-filter-initialized", "true");

		$dropdown.on(
			"click",
			'[component="category/list"] [data-cid]',
			function (e) {
				e.preventDefault();
				e.stopPropagation();

				var cid = $(this).attr("data-cid");
				var params = utils.params();

				if (cid === "all") {
					delete params.cid;
				} else {
					params.cid = cid;
				}
				delete params.page;

				var url = "/feed";
				if (Object.keys(params).length) {
					url += "?" + $.param(params);
				}

				$dropdown.find(".dropdown-toggle").dropdown("hide");
				ajaxify.go(url);
			},
		);
	}

	// ── Share Handlers ─────────────────────────────────────────────────────

	function initShareHandlers() {
		if (!$(".feed").length) return;

		require(["share"], function (share) {
			var pageTitle =
				$('meta[property="og:title"]').attr("content") ||
				document.title ||
				"Vasak Community";
			share.addShareHandlers(pageTitle);
		});
	}

	// ── Mobile Feed Category Dropdown Fix ─────────────────────────────────

	function fixMobileFeedCategoryDropdown() {
		if (!$(".feed").length) return;

		var $filter = $('.feed-category-filter [component="category/dropdown"]');
		if (!$filter.length) return;

		var $btn = $filter.find(".dropdown-toggle");
		var $menu = $filter.find(".dropdown-menu");
		if (!$btn.length || !$menu.length) return;

		if (window.innerWidth <= 767) {
			$btn.attr("data-bs-display", "static");
		}

		$filter
			.off("shown.bs.dropdown.vasakMobileFix")
			.on("shown.bs.dropdown.vasakMobileFix", function () {
				if (window.innerWidth > 767) return;

				requestAnimationFrame(function () {
					$menu.css({
						position: "absolute",
						top: "100%",
						right: "0",
						left: "auto",
						bottom: "auto",
						transform: "none",
						margin: "4px 0 0 0",
						inset: "auto",
					});
					$menu.removeAttr("data-popper-placement");
				});
			});
	}

	return FeedEnhancements;
});
