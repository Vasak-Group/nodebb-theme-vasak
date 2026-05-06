/**
 * Vasak Community Theme - Client-side JavaScript
 * Handles theme-specific interactions and behaviors
 */

(function () {
	"use strict";

	var carouselCounter = 0;

	// Patch search module to fix category filter
	$(window).on("action:ajaxify.end", function (ev, data) {
		if (data.url && data.url.startsWith("search")) {
			patchSearchCategoryFilter();
		}
	});

	// Theme initialization
	$(document).ready(function () {
		console.log("Vasak Community Theme initialized");

		// Patch search if we're already on the search page
		if (window.location.pathname.includes("/search")) {
			setTimeout(patchSearchCategoryFilter, 500);
		}

		// Initialize sidebar toggle handler
		initSidebarToggle();

		// Auto-expand sidebar on desktop (Reddit-style default)
		initSidebarAutoExpand();

		// Initialize image carousels for posts with multiple images
		initPostImageCarousels();

		// Fix bookmark alert - only show when bookmark is meaningfully ahead
		fixBookmarkAlert();

		// Initialize parent post click navigation with smooth scroll
		initParentPostNavigation();

		// Initialize post hover actions (show actions only on directly hovered post)
		initPostHoverActions();

		// Initialize click handler for composer prompt card (rendered server-side in feed.tpl)
		initFeedComposerPromptHandler();

		// Initialize voting handlers for category/topics listing pages
		initTopicListVoting();

		// Initialize immediate category filter navigation on feed page
		initFeedCategoryFilter();

		// Fix mobile category dropdown positioning on feed page
		fixMobileFeedCategoryDropdown();

		// Fix mobile category dropdown positioning in composer
		fixMobileComposerCategoryDropdown();

		// Fix notification dropdown inline styles
		fixNotificationDropdown();

		// Initialize share button handlers
		initShareHandlers();

		// Initialize lazy loading for all images
		initLazyLoading();

		// Initialize skeleton screens for AJAX-loaded content
		initSkeletonScreens();

		// Initialize dark mode toggle
		initDarkMode();

		// Re-initialize carousels when new posts are loaded (infinite scroll, etc.)
		// Also handle post edits by clearing the processed flag
		$(window).on(
			"action:posts.loaded action:topic.loaded action:ajaxify.end",
			function () {
				initPostImageCarousels();
				initParentPostNavigation();
				fixMobileFeedCategoryDropdown();
				fixMobileComposerCategoryDropdown();
				fixNotificationDropdown();
				initPostHoverActions();
				initFeedComposerPromptHandler();
				initTopicListVoting();
				initFeedCategoryFilter();
				initShareHandlers();
				// Re-apply lazy loading to any new images loaded via AJAX
				setTimeout(initLazyLoading, 150);
			},
		);

		// Handle post edits - need to re-process the edited post
		$(window).on("action:posts.edited", function (ev, data) {
			if (data && data.post && data.post.pid) {
				// Find the edited post and remove the processed flag so it gets re-scanned
				var $post = $('[data-pid="' + data.post.pid + '"]');
				var $content = $post.find('[component="post/content"]');
				$content.removeAttr("data-carousel-processed");
				// Remove any existing carousel in this post
				$content.find(".post-image-carousel").remove();
				// Re-initialize
				initPostImageCarousels();
			}
		});

		// Handle composer events - fix category dropdown on mobile when composer is shown
		$(window).on(
			"action:composer.loaded action:composer.enhanced",
			function () {
				fixMobileComposerCategoryDropdown();
			},
		);
	});

	/**
	 * Convert multiple images in post content to Bootstrap carousels
	 */
	function initPostImageCarousels() {
		// Find all post content areas that haven't been processed
		$('[component="post/content"]:not([data-carousel-processed])').each(
			function () {
				var $content = $(this);
				$content.attr("data-carousel-processed", "true");

				// Find all images in post content - including those in links (lightbox) and paragraphs
				var $images = $content.find("img").filter(function () {
					var $img = $(this);

					// Exclude images already in a carousel
					if ($img.closest(".carousel, .post-image-carousel").length) {
						return false;
					}

					// Exclude emojis and small icons by class
					if (
						$img.hasClass("emoji") ||
						$img.hasClass("emoji-img") ||
						$img.hasClass("icon") ||
						$img.hasClass("not-responsive")
					) {
						return false;
					}

					// Check the image source to determine if it's a content image
					var src = $img.attr("src") || "";

					// Include images from uploads folder or with image extensions
					var isContentImage =
						src.indexOf("/assets/uploads/") !== -1 ||
						src.indexOf("/files/") !== -1 ||
						src.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);

					if (!isContentImage) {
						return false;
					}

					// Exclude tiny images by checking width/height attributes if present
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

				// Only create carousel if 2+ images
				if ($images.length >= 2) {
					createCarousel($content, $images);
					console.log(
						"Vasak: Found " + $images.length + " images, creating carousel",
					);
				} else if ($images.length > 0) {
					console.log(
						"Vasak: Found " +
							$images.length +
							" image(s), not enough for carousel",
					);
				}
			},
		);
	}

	/**
	 * Create a Bootstrap 5 carousel from a set of images
	 */
	function createCarousel($content, $images) {
		var carouselId = "post-carousel-" + ++carouselCounter;

		// Build carousel HTML
		var carouselHtml =
			'<div id="' +
			carouselId +
			'" class="carousel slide post-image-carousel" data-bs-ride="false">';

		// Indicators (dots)
		carouselHtml += '<div class="carousel-indicators">';
		$images.each(function (index) {
			var activeClass = index === 0 ? "active" : "";
			var ariaCurrent = index === 0 ? 'aria-current="true"' : "";
			carouselHtml +=
				'<button type="button" data-bs-target="#' +
				carouselId +
				'" data-bs-slide-to="' +
				index +
				'" class="' +
				activeClass +
				'" ' +
				ariaCurrent +
				' aria-label="Slide ' +
				(index + 1) +
				'"></button>';
		});
		carouselHtml += "</div>";

		// Carousel inner (slides)
		carouselHtml += '<div class="carousel-inner">';
		$images.each(function (index) {
			var $img = $(this);
			var src = $img.attr("src");
			var alt = $img.attr("alt") || "Image " + (index + 1);
			var activeClass = index === 0 ? "active" : "";
			// First slide loads eagerly (visible), rest load lazily
			var loadingAttr = index === 0 ? "eager" : "lazy";
			carouselHtml += '<div class="carousel-item ' + activeClass + '">';
			carouselHtml +=
				'<img src="' +
				src +
				'" class="d-block w-100" alt="' +
				alt +
				'" loading="' +
				loadingAttr +
				'">';
			carouselHtml += "</div>";
		});
		carouselHtml += "</div>";

		// Navigation arrows
		carouselHtml +=
			'<button class="carousel-control-prev" type="button" data-bs-target="#' +
			carouselId +
			'" data-bs-slide="prev">';
		carouselHtml +=
			'<span class="carousel-control-prev-icon" aria-hidden="true"></span>';
		carouselHtml += '<span class="visually-hidden">Previous</span>';
		carouselHtml += "</button>";
		carouselHtml +=
			'<button class="carousel-control-next" type="button" data-bs-target="#' +
			carouselId +
			'" data-bs-slide="next">';
		carouselHtml +=
			'<span class="carousel-control-next-icon" aria-hidden="true"></span>';
		carouselHtml += '<span class="visually-hidden">Next</span>';
		carouselHtml += "</button>";

		carouselHtml += "</div>";

		// Find the topmost element to insert carousel before
		// Images can be in: <p><img></p>, <p><a><img></a></p>, <a><img></a>, or just <img>
		var $firstImg = $images.first();
		var $insertBefore = $firstImg;

		// Walk up to find the direct child of $content
		while (
			$insertBefore.parent().length &&
			!$insertBefore.parent().is($content)
		) {
			$insertBefore = $insertBefore.parent();
		}

		// Insert carousel before the first image's container
		$insertBefore.before(carouselHtml);

		// Collect elements to remove (images and their empty containers)
		var elementsToRemove = [];
		$images.each(function () {
			var $img = $(this);
			var $element = $img;

			// Walk up to find the direct child of $content
			while ($element.parent().length && !$element.parent().is($content)) {
				$element = $element.parent();
			}

			// Mark for removal if not already marked
			if (elementsToRemove.indexOf($element[0]) === -1) {
				elementsToRemove.push($element[0]);
			}
		});

		// Remove the original image containers
		$(elementsToRemove).remove();

		// Initialize Bootstrap carousel
		var carouselEl = document.getElementById(carouselId);
		if (carouselEl && typeof bootstrap !== "undefined") {
			new bootstrap.Carousel(carouselEl, {
				interval: false, // Don't auto-slide
				touch: true,
				wrap: true,
			});
		}

		console.log("Vasak: Created carousel with " + $images.length + " images");
	}

	/**
	 * Initialize sidebar toggle click handler
	 * Custom handler needed because Harmony's handler targets .sidebar but Vasak uses .sidebar-left
	 */
	function initSidebarToggle() {
		var $toggle = $('[component="sidebar/toggle"]');
		if (!$toggle.length) {
			console.log("Vasak: Sidebar toggle element not found");
			return;
		}

		// Remove any existing handlers to avoid duplicates, then add our handler
		$toggle.off("click.vasak").on("click.vasak", function (e) {
			e.preventDefault();
			e.stopPropagation();

			var $sidebar = $(".sidebar-left");
			$sidebar.toggleClass("open");

			console.log("Vasak: Sidebar toggled, open:", $sidebar.hasClass("open"));

			// Save preference if user is logged in
			if (typeof app !== "undefined" && app.user && app.user.uid) {
				require(["api"], function (api) {
					api
						.put("/users/" + app.user.uid + "/settings", {
							settings: {
								openSidebars: $sidebar.hasClass("open") ? "on" : "off",
							},
						})
						.catch(function (err) {
							console.warn("Vasak: Could not save sidebar preference", err);
						});
				});
			}

			$(window).trigger("action:sidebar.toggle");
		});

		console.log("Vasak: Sidebar toggle initialized");
	}

	/**
	 * Auto-expand sidebar on desktop (Reddit-style default)
	 * The sidebar will be expanded by default on desktop, but users can still toggle it.
	 * Their preference is saved and respected on subsequent visits.
	 */
	function initSidebarAutoExpand() {
		// Only run on desktop (min-width: 992px)
		if ($(window).width() < 992) {
			return;
		}

		var $sidebar = $(".sidebar-left");
		if (!$sidebar.length) {
			return;
		}

		// Check if user has a saved preference (via config.theme.openSidebars)
		// If they've explicitly closed the sidebar before, respect that
		var hasUserPreference =
			typeof config !== "undefined" &&
			config.theme &&
			typeof config.theme.openSidebars !== "undefined";

		// If sidebar is not already open and user hasn't explicitly closed it, expand it
		if (!$sidebar.hasClass("open")) {
			// If no user preference set, auto-expand (first-time visitors)
			// If user preference is 'on', also expand
			if (
				!hasUserPreference ||
				config.theme.openSidebars === "on" ||
				config.theme.openSidebars === true
			) {
				$sidebar.addClass("open");
				$(window).trigger("action:sidebar.toggle");
				console.log("Vasak: Auto-expanded sidebar (Reddit-style default)");
			}
		}
	}

	/**
	 * Fix the bookmark alert bug - NodeBB shows "Click here to return to last read post"
	 * even when the bookmark position isn't meaningfully ahead of the current position.
	 *
	 * The bug: NodeBB checks if bookmark exists and postcount > threshold, but doesn't
	 * check if the bookmark is actually ahead of where the user currently is.
	 *
	 * This fix removes the bookmark alert if:
	 * 1. The bookmark is at position 1 or 2 (meaningless to "return" to the start)
	 * 2. The bookmark is at or behind the current post index
	 */
	function fixBookmarkAlert() {
		$(window).on("action:topic.loaded", function () {
			// Small delay to let NodeBB's handleBookmark run first
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

					// Remove bookmark alert if:
					// 1. No meaningful bookmark (position 1 or 2 - essentially the start)
					// 2. Bookmark is at or behind current position (nothing to "return" to)
					// 3. Bookmark is only 1-2 posts ahead (not worth showing notification)
					var shouldRemoveAlert =
						bookmarkInt <= 2 ||
						bookmarkInt <= postIndexInt ||
						bookmarkInt - postIndexInt <= 2;

					if (shouldRemoveAlert) {
						alerts.remove("bookmark");
						console.log(
							"Vasak: Removed unnecessary bookmark alert (bookmark: " +
								bookmarkInt +
								", current: " +
								postIndexInt +
								")",
						);
					}
				});
			}, 100);
		});
	}

	/**
	 * Initialize parent post click navigation with smooth scroll
	 * Clicking the "Replying to" component scrolls to the parent post
	 */
	function initParentPostNavigation() {
		// Use event delegation on the topic container
		$('[component="topic"]')
			.off("click.vasak-parent")
			.on("click.vasak-parent", '[component="post/parent"]', function (e) {
				// Don't navigate if clicking on a link (username, etc.)
				if ($(e.target).closest("a").length) {
					return;
				}

				e.preventDefault();
				e.stopPropagation();

				var parentPid = $(this).attr("data-parent-pid");
				if (!parentPid) {
					return;
				}

				// Find the parent post element
				var $parentPost = $(
					'[component="topic"] > [component="post"][data-pid="' +
						parentPid +
						'"]',
				);

				if ($parentPost.length) {
					// Post is on the current page - smooth scroll to it
					smoothScrollToPost($parentPost);
				} else {
					// Post is on a different page - navigate via URL
					window.location.href = config.relative_path + "/post/" + parentPid;
				}
			});
	}

	/**
	 * Smooth scroll to a post element with highlight effect
	 */
	function smoothScrollToPost($postElement) {
		if (!$postElement.length) {
			return;
		}

		// Calculate scroll position (with offset for header)
		var headerHeight = $("header").outerHeight() || 60;
		var scrollTop = $postElement.offset().top - headerHeight - 20;

		// Smooth scroll
		$("html, body").animate(
			{
				scrollTop: scrollTop,
			},
			400,
			"swing",
			function () {
				// Add highlight effect after scroll completes
				highlightPost($postElement);
			},
		);
	}

	/**
	 * Briefly highlight a post to draw attention
	 */
	function highlightPost($postElement) {
		var $container = $postElement.find(".post-container-parent");
		if (!$container.length) {
			$container = $postElement;
		}

		// Add highlight class
		$container.addClass("post-highlight-flash");

		// Remove after animation
		setTimeout(function () {
			$container.removeClass("post-highlight-flash");
		}, 1500);
	}

	/**
	 * Initialize post hover actions
	 * Adds 'post-hovered' class only to the directly hovered post container
	 * This prevents CSS hover from bubbling up to parent posts
	 */
	function initPostHoverActions() {
		// Use event delegation for all post containers
		$(document).off(
			"mouseenter.vasak-hover mouseleave.vasak-hover",
			".post-container-parent",
		);

		$(document).on(
			"mouseenter.vasak-hover",
			".post-container-parent",
			function (e) {
				// Stop propagation to prevent parent containers from getting the event
				e.stopPropagation();
				// Remove class from all other containers first
				$(".post-container-parent.post-hovered").removeClass("post-hovered");
				// Add class only to this specific container
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

	/**
	 * Initialize LinkedIn-style composer prompt card on feed page
	 * Injects the card HTML and sets up click handlers
	 * The original "New Topic" button is hidden via CSS to prevent flicker
	 */
	function initFeedComposerPromptHandler() {
		// Only run on feed page
		if (!$(".feed").length) {
			return;
		}

		// Don't re-inject if already present
		if ($(".composer-prompt-card").length) {
			return;
		}

		// Find the existing controls row (contains New Topic button)
		// Try mb-0, mb-1 and mb-2 for compatibility
		var $controlsRow = $(
			".feed .d-flex.justify-content-between.py-2.mb-0",
		).first();
		if (!$controlsRow.length) {
			$controlsRow = $(
				".feed .d-flex.justify-content-between.py-2.mb-1",
			).first();
		}
		if (!$controlsRow.length) {
			$controlsRow = $(
				".feed .d-flex.justify-content-between.py-2.mb-2",
			).first();
		}
		if (!$controlsRow.length) {
			return;
		}

		// Get user info for avatar - clone from header avatar which is already correctly rendered
		var isLoggedIn = false;
		var avatarHtml = "";

		if (typeof app !== "undefined" && app.user && app.user.uid) {
			isLoggedIn = true;
			// Clone the avatar from the header - it's already correctly rendered by NodeBB
			var $headerAvatar = $(
				'[component="header/avatar"] img, [component="header/avatar"] [component="avatar/picture"]',
			).first();
			if ($headerAvatar.length) {
				avatarHtml =
					'<img src="' +
					$headerAvatar.attr("src") +
					'" alt="Avatar" class="avatar avatar-rounded" />';
			} else {
				// Fallback to icon-based avatar from header
				var $headerIcon = $(
					'[component="header/avatar"] [component="avatar/icon"]',
				).first();
				if ($headerIcon.length) {
					avatarHtml = $headerIcon
						.clone()
						.addClass("avatar avatar-rounded")
						.get(0).outerHTML;
				} else {
					// Last resort: use placeholder
					avatarHtml =
						'<div class="avatar avatar-rounded avatar-placeholder"><i class="fa fa-user"></i></div>';
				}
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

		// Insert the card before the controls row
		$controlsRow.before(cardHtml);

		// Bind click handler to open composer
		$(".composer-prompt-card").on(
			"click",
			".composer-prompt-input, .composer-prompt-action",
			function (e) {
				e.preventDefault();

				if (!isLoggedIn) {
					// Redirect to login
					window.location.href = config.relative_path + "/login";
					return;
				}

				// Trigger the original New Topic button click
				var $newTopicBtn = $("#new_topic");
				if ($newTopicBtn.length) {
					$newTopicBtn.trigger("click");
				}
			},
		);
	}

	/**
	 * Initialize voting handlers for topic listing pages (category, recent, etc.)
	 * NodeBB's native voting only works on topic detail pages, so we add custom handlers here
	 */
	function initTopicListVoting() {
		// Only run on pages with topic listings (not on topic detail page)
		if ($('[component="topic"]').length) {
			// We're on a topic detail page, NodeBB handles voting natively
			return;
		}

		// Find vote columns that haven't been initialized
		$(".vote-column:not([data-vote-initialized])").each(function () {
			var $voteColumn = $(this);
			$voteColumn.attr("data-vote-initialized", "true");

			var pid = $voteColumn.attr("data-pid");
			if (!pid) return;

			var $upvoteBtn = $voteColumn.find('[component="post/upvote"]');
			var $downvoteBtn = $voteColumn.find('[component="post/downvote"]');
			var $voteCount = $voteColumn.find('[component="post/vote-count"]');

			// Upvote click handler
			$upvoteBtn.on("click", function (e) {
				e.preventDefault();
				e.stopPropagation();

				if (!config.loggedIn) {
					window.location.href = config.relative_path + "/login";
					return;
				}

				var isUpvoted = $upvoteBtn.hasClass("upvoted");
				var method = isUpvoted ? "del" : "put";

				$.ajax({
					url: config.relative_path + "/api/v3/posts/" + pid + "/vote",
					method: method,
					data: JSON.stringify({ delta: 1 }),
					contentType: "application/json",
					headers: {
						"x-csrf-token": config.csrf_token,
					},
					success: function (response) {
						// Toggle upvoted state
						$upvoteBtn.toggleClass("upvoted");
						// Remove downvoted if it was set
						$downvoteBtn.removeClass("downvoted");

						// Update vote count - handle various response structures
						var votes = null;
						if (response) {
							if (response.response && response.response.post) {
								votes = response.response.post.votes;
							} else if (
								response.response &&
								response.response.votes !== undefined
							) {
								votes = response.response.votes;
							} else if (response.post && response.post.votes !== undefined) {
								votes = response.post.votes;
							} else if (response.votes !== undefined) {
								votes = response.votes;
							}
						}

						if (votes !== null) {
							$voteCount.text(votes);
							$voteCount.attr("data-votes", votes);
							$voteCount.attr("title", votes);
						} else {
							// Fallback: manually calculate from current state
							var currentVotes =
								parseInt($voteCount.attr("data-votes") || $voteCount.text()) ||
								0;
							var wasUpvoted = !$upvoteBtn.hasClass("upvoted"); // toggled already
							votes = wasUpvoted ? currentVotes - 1 : currentVotes + 1;
							$voteCount.text(votes);
							$voteCount.attr("data-votes", votes);
							$voteCount.attr("title", votes);
						}
					},
					error: function (xhr) {
						var msg =
							xhr.responseJSON &&
							xhr.responseJSON.status &&
							xhr.responseJSON.status.message;
						if (msg) {
							alert(msg);
						}
					},
				});
			});

			// Downvote click handler
			$downvoteBtn.on("click", function (e) {
				e.preventDefault();
				e.stopPropagation();

				if (!config.loggedIn) {
					window.location.href = config.relative_path + "/login";
					return;
				}

				var isDownvoted = $downvoteBtn.hasClass("downvoted");
				var method = isDownvoted ? "del" : "put";

				$.ajax({
					url: config.relative_path + "/api/v3/posts/" + pid + "/vote",
					method: method,
					data: JSON.stringify({ delta: -1 }),
					contentType: "application/json",
					headers: {
						"x-csrf-token": config.csrf_token,
					},
					success: function (response) {
						// Toggle downvoted state
						$downvoteBtn.toggleClass("downvoted");
						// Remove upvoted if it was set
						$upvoteBtn.removeClass("upvoted");

						// Update vote count - handle various response structures
						var votes = null;
						if (response) {
							if (response.response && response.response.post) {
								votes = response.response.post.votes;
							} else if (
								response.response &&
								response.response.votes !== undefined
							) {
								votes = response.response.votes;
							} else if (response.post && response.post.votes !== undefined) {
								votes = response.post.votes;
							} else if (response.votes !== undefined) {
								votes = response.votes;
							}
						}

						if (votes !== null) {
							$voteCount.text(votes);
							$voteCount.attr("data-votes", votes);
							$voteCount.attr("title", votes);
						} else {
							// Fallback: manually calculate from current state
							var currentVotes =
								parseInt($voteCount.attr("data-votes") || $voteCount.text()) ||
								0;
							var wasDownvoted = !$downvoteBtn.hasClass("downvoted"); // toggled already
							votes = wasDownvoted ? currentVotes + 1 : currentVotes - 1;
							$voteCount.text(votes);
							$voteCount.attr("data-votes", votes);
							$voteCount.attr("title", votes);
						}
					},
					error: function (xhr) {
						var msg =
							xhr.responseJSON &&
							xhr.responseJSON.status &&
							xhr.responseJSON.status.message;
						if (msg) {
							alert(msg);
						}
					},
				});
			});
		});
	}

	/**
	 * Patch search page category filter to:
	 * 1. Remove "Watched categories" from dropdown
	 * 2. Auto-apply category filter on selection (no additional click needed)
	 */
	function patchSearchCategoryFilter() {
		var $categoryFilter = $(
			'[component="search/filters"] [component="category/filter"]',
		);
		if (!$categoryFilter.length || $categoryFilter.attr("data-vasak-patched")) {
			return;
		}
		$categoryFilter.attr("data-vasak-patched", "true");

		console.log("Vasak: Patching search category filter");

		// Function to remove "Watched categories" from the dropdown
		function removeWatchedCategories() {
			// Method 1: Remove by data-cid="watched"
			var $watchedItem = $categoryFilter.find(
				'[component="category/list"] li[data-cid="watched"]',
			);
			if ($watchedItem.length) {
				$watchedItem.remove();
				console.log('Vasak: Removed "Watched categories" by data-cid');
				return true;
			}

			// Method 2: Remove by text content (fallback)
			$categoryFilter.find('[component="category/list"] li').each(function () {
				var $li = $(this);
				var text = $li.text().toLowerCase().trim();
				if (text.includes("watched") && text.includes("categor")) {
					$li.remove();
					console.log('Vasak: Removed "Watched categories" by text match');
					return false; // break the loop
				}
			});
		}

		// Remove immediately
		removeWatchedCategories();

		// Also remove when dropdown opens (in case categories are loaded dynamically)
		$categoryFilter.on("shown.bs.dropdown", function () {
			setTimeout(removeWatchedCategories, 100);
		});

		// Add immediate search trigger on category selection
		$categoryFilter.on(
			"click",
			'[component="category/list"] [data-cid]',
			function (e) {
				var $item = $(this);
				var cid = $item.attr("data-cid");

				// Let the original handler update the selection state first
				setTimeout(function () {
					// Trigger the search by closing the dropdown (which triggers the existing onHidden handler)
					$categoryFilter.find(".dropdown-toggle").dropdown("hide");
					console.log("Vasak: Auto-triggering search for category:", cid);
				}, 50);
			},
		);
	}

	/**
	 * Fix mobile category dropdown positioning on feed page
	 * Aggressively overrides Popper.js positioning on mobile to prevent bottom-left corner issue
	 */
	function fixMobileFeedCategoryDropdown() {
		console.log(
			"Vasak: fixMobileFeedCategoryDropdown called, window width:",
			window.innerWidth,
		);

		// Only run on feed page
		if (!$(".feed").length) {
			console.log("Vasak: Not on feed page, exiting");
			return;
		}

		console.log("Vasak: On feed page, looking for category filter");

		var $categoryFilter = $(
			'.feed-category-filter [component="category/dropdown"]',
		);
		if (!$categoryFilter.length) {
			console.log("Vasak: Category filter not found");
			return;
		}

		console.log("Vasak: Category filter found, setting up mobile fix");

		// Find the dropdown button and menu
		var $dropdownButton = $categoryFilter.find(".dropdown-toggle");
		var $dropdownMenu = $categoryFilter.find(".dropdown-menu");

		if (!$dropdownButton.length || !$dropdownMenu.length) {
			console.log("Vasak: Dropdown button or menu not found");
			return;
		}

		// Disable Popper immediately on mobile to prevent animation from bottom-left
		if (window.innerWidth <= 767) {
			$dropdownButton.attr("data-bs-display", "static");
			console.log("Vasak: Disabled Popper positioning on mobile");
		}

		// Always bind the event, but check window width when it fires
		$categoryFilter
			.off("shown.bs.dropdown.vasakMobileFix")
			.on("shown.bs.dropdown.vasakMobileFix", function () {
				console.log(
					"Vasak: Dropdown shown event fired, window width:",
					window.innerWidth,
				);

				// Only apply fix on mobile
				if (window.innerWidth > 767) {
					console.log("Vasak: Not mobile, skipping positioning fix");
					return;
				}

				console.log("Vasak: Applying mobile positioning fix");

				// Use requestAnimationFrame to ensure we override after Popper runs
				requestAnimationFrame(function () {
					$dropdownMenu.css({
						position: "absolute",
						top: "100%",
						right: "0",
						left: "auto",
						bottom: "auto",
						transform: "none",
						margin: "4px 0 0 0",
						inset: "auto",
					});

					// Also remove Popper attributes
					$dropdownMenu.removeAttr("data-popper-placement");

					console.log("Vasak: Mobile positioning applied successfully");
				});
			});

		console.log("Vasak: Mobile fix event listener attached");
	}

	/**
	 * Fix mobile category dropdown positioning in composer
	 * Aggressively overrides Popper.js positioning on mobile to prevent bottom-left corner issue
	 */
	function fixMobileComposerCategoryDropdown() {
		console.log(
			"Vasak: fixMobileComposerCategoryDropdown called, window width:",
			window.innerWidth,
		);

		// Find the composer category selector
		var $categorySelector = $('.composer [component="category-selector"]');
		if (!$categorySelector.length) {
			console.log("Vasak: Composer category selector not found");
			return;
		}

		console.log(
			"Vasak: Composer category selector found, setting up mobile fix",
		);

		// Find the dropdown button and menu
		var $dropdownButton = $categorySelector.find(".dropdown-toggle");
		var $dropdownMenu = $categorySelector.find(".dropdown-menu");

		if (!$dropdownButton.length || !$dropdownMenu.length) {
			console.log("Vasak: Composer dropdown button or menu not found");
			return;
		}

		// Disable Popper immediately on mobile to prevent animation from bottom-left
		if (window.innerWidth <= 767) {
			$dropdownButton.attr("data-bs-display", "static");
			console.log("Vasak: Disabled Popper positioning on mobile for composer");
		}

		// Always bind the event, but check window width when it fires
		$categorySelector
			.off("shown.bs.dropdown.vasakComposerMobileFix")
			.on("shown.bs.dropdown.vasakComposerMobileFix", function () {
				console.log(
					"Vasak: Composer dropdown shown event fired, window width:",
					window.innerWidth,
				);

				// Only apply fix on mobile
				if (window.innerWidth > 767) {
					console.log("Vasak: Not mobile, skipping composer positioning fix");
					return;
				}

				console.log("Vasak: Applying mobile positioning fix for composer");

				// Use requestAnimationFrame to ensure we override after Popper runs
				requestAnimationFrame(function () {
					$dropdownMenu.css({
						position: "absolute",
						top: "100%",
						left: "0",
						right: "auto",
						bottom: "auto",
						transform: "none",
						margin: "4px 0 0 0",
						inset: "auto",
					});

					// Also remove Popper attributes
					$dropdownMenu.removeAttr("data-popper-placement");

					console.log(
						"Vasak: Composer mobile positioning applied successfully",
					);
				});
			});

		console.log("Vasak: Composer mobile fix event listener attached");
	}

	/**
	 * Fix notification dropdown width and text styling
	 * Removes Popper inline width styles and applies proper text wrapping
	 */
	function fixNotificationDropdown() {
		console.log("Vasak: fixNotificationDropdown called");

		// Find the notification component
		var $notificationComponent = $('[component="notifications"]');
		if (!$notificationComponent.length) {
			console.log("Vasak: Notification component not found");
			return;
		}

		console.log("Vasak: Notification component found, setting up fix");

		// Listen for when dropdown is shown
		$notificationComponent
			.off("shown.bs.dropdown.vasakNotificationFix")
			.on("shown.bs.dropdown.vasakNotificationFix", function () {
				console.log("Vasak: Notification dropdown shown");

				// Use requestAnimationFrame to ensure we override after Popper runs
				requestAnimationFrame(function () {
					var $dropdownMenu = $notificationComponent.find(
						".notifications-dropdown",
					);

					if ($dropdownMenu.length) {
						// Remove width-related inline styles from dropdown
						var currentStyle = $dropdownMenu.attr("style") || "";
						var newStyle = currentStyle
							.replace(/min-width:\s*[^;]+;?/gi, "")
							.replace(/max-width:\s*[^;]+;?/gi, "")
							.replace(/width:\s*[^;]+;?/gi, "");
						$dropdownMenu.attr("style", newStyle);

						// Apply styling to notification items (.unread and .read are the actual classes)
						$dropdownMenu.find(".unread, .read").css({
							padding: "8px",
						});

						// Style the notification link text
						$dropdownMenu.find('a[component="notifications/item/link"]').css({
							"font-size": "12px",
							"line-height": "1.5",
							"word-wrap": "break-word",
							"overflow-wrap": "break-word",
							"word-break": "break-word",
							"white-space": "normal",
							"text-overflow": "clip",
							display: "block",
						});

						// Style strong tags within notifications
						$dropdownMenu
							.find('a[component="notifications/item/link"] strong')
							.css({
								"font-size": "12px",
								"font-weight": "600",
							});

						// Style timestamps
						$dropdownMenu.find(".text-xs.text-muted").css({
							"font-size": "11px",
						});

						console.log("Vasak: Notification dropdown styling applied");
					}
				});
			});

		console.log("Vasak: Notification dropdown fix event listener attached");
	}

	/**
	 * Initialize immediate category filter navigation on feed page
	 * When a category is selected, navigate immediately instead of waiting for dropdown close
	 */
	function initFeedCategoryFilter() {
		// Only run on feed page
		if (!$(".feed").length) {
			return;
		}

		var $categoryDropdown = $(
			'.feed-category-filter [component="category/dropdown"]',
		);
		if (
			!$categoryDropdown.length ||
			$categoryDropdown.attr("data-filter-initialized")
		) {
			return;
		}
		$categoryDropdown.attr("data-filter-initialized", "true");

		// Handle category selection - navigate immediately
		$categoryDropdown.on(
			"click",
			'[component="category/list"] [data-cid]',
			function (e) {
				e.preventDefault();
				e.stopPropagation();

				var $item = $(this);
				var cid = $item.attr("data-cid");
				var currentParams = utils.params();

				// Build the new URL
				if (cid === "all") {
					delete currentParams.cid;
				} else {
					currentParams.cid = cid;
				}

				// Remove page parameter to start from first page
				delete currentParams.page;

				var url = "/feed";
				if (Object.keys(currentParams).length) {
					url += "?" + $.param(currentParams);
				}

				// Close the dropdown
				$categoryDropdown.find(".dropdown-toggle").dropdown("hide");

				// Navigate to the filtered feed
				ajaxify.go(url);
			},
		);
	}

	/**
	 * Initialize share button handlers on feed page
	 * Ensures share buttons work on initial load and after ajaxify navigation
	 */
	function initShareHandlers() {
		// Only run on feed page
		if (!$(".feed").length) {
			return;
		}

		// Check if share module is available
		require(["share"], function (share) {
			// Get page title from meta tag or default
			var pageTitle =
				$('meta[property="og:title"]').attr("content") ||
				document.title ||
				"Vasak Community";

			// Initialize share handlers for all share buttons on the page
			share.addShareHandlers(pageTitle);
		});
	}

	// ========================================
	// LAZY LOADING IMPLEMENTATION
	// ========================================
	// Implements native lazy loading + IntersectionObserver fallback
	// for all images across the entire site

	/**
	 * Initialize lazy loading for all images
	 * Runs on page load and after AJAX navigation
	 */
	function initLazyLoading() {
		addNativeLazyLoading();
		if ("IntersectionObserver" in window) {
			initIntersectionObserver();
		}
	}

	/**
	 * Add native loading="lazy" attribute to all images
	 * Primary mechanism — supported in all modern browsers
	 */
	function addNativeLazyLoading() {
		$("img").each(function () {
			var $img = $(this);

			// Skip if already has a loading attribute set
			if ($img.attr("loading")) {
				return;
			}

			// Skip emojis, icons and non-responsive images
			if (
				$img.hasClass("emoji") ||
				$img.hasClass("emoji-img") ||
				$img.hasClass("icon") ||
				$img.hasClass("not-responsive")
			) {
				return;
			}

			// Skip avatars — they are small and often above the fold
			if (
				$img.hasClass("avatar") ||
				$img.hasClass("avatar-rounded") ||
				$img.closest('[component="user/picture"]').length ||
				$img.closest('[component="header/avatar"]').length
			) {
				return;
			}

			// Logos in sidebar load eagerly (above the fold)
			if ($img.closest(".vasak-sidebar-logo").length) {
				$img.attr("loading", "eager");
				return;
			}

			// Everything else gets lazy loading
			$img.attr("loading", "lazy");
		});
	}

	/**
	 * IntersectionObserver for images with data-src (manual lazy loading)
	 * Fallback for dynamically injected images
	 */
	function initIntersectionObserver() {
		if (!window.vasakImageObserver) {
			window.vasakImageObserver = new IntersectionObserver(
				function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting) {
							var img = entry.target;
							var dataSrc = img.getAttribute("data-src");
							if (dataSrc) {
								img.src = dataSrc;
								img.removeAttribute("data-src");
							}
							img.addEventListener("load", function () {
								img.classList.add("loaded");
							});
							if (img.complete) {
								img.classList.add("loaded");
							}
							window.vasakImageObserver.unobserve(img);
						}
					});
				},
				{ rootMargin: "200px 0px", threshold: 0.01 },
			);
		}
		document.querySelectorAll("img[data-src]").forEach(function (img) {
			window.vasakImageObserver.observe(img);
		});
	}

	// Mark lazy images as loaded when they finish loading (for CSS fade-in)
	$(document).on("load", 'img[loading="lazy"]', function () {
		$(this).addClass("loaded");
	});

	// Handle images already complete when the script runs
	$(document).ready(function () {
		$('img[loading="lazy"]').each(function () {
			if (this.complete && this.naturalWidth > 0) {
				$(this).addClass("loaded");
			}
		});
	});

	// ========================================
	// SKELETON SCREENS
	// ========================================
	// Shows shimmer placeholders while AJAX content loads.
	// Skeletons are injected before the request fires and
	// removed (with a fade-out) once real content arrives.

	/**
	 * Build the HTML for N feed-post skeleton cards
	 */
	function buildFeedSkeletons(count) {
		var items = "";
		for (var i = 0; i < count; i++) {
			items +=
				'<li class="skeleton-feed-post">' +
				'<div class="skeleton-feed-content">' +
				'<div class="skeleton-title"></div>' +
				'<div class="skeleton-meta">' +
				'<span class="skeleton-avatar"></span>' +
				'<span class="skeleton-author"></span>' +
				'<span class="skeleton-time"></span>' +
				"</div>" +
				'<div class="skeleton-content">' +
				'<span class="skeleton-line"></span>' +
				'<span class="skeleton-line"></span>' +
				'<span class="skeleton-line"></span>' +
				"</div>" +
				"</div>" +
				'<div class="skeleton-feed-actions">' +
				'<span class="skeleton-action"></span>' +
				'<span class="skeleton-action"></span>' +
				'<span class="skeleton-action"></span>' +
				"</div>" +
				"</li>";
		}
		return '<ul class="vasak-skeleton-list list-unstyled">' + items + "</ul>";
	}

	/**
	 * Build the HTML for N topic-card skeleton items
	 */
	function buildTopicSkeletons(count) {
		var items = "";
		for (var i = 0; i < count; i++) {
			items +=
				'<li class="skeleton-topic-card mb-2">' +
				'<div class="skeleton-vote-col">' +
				'<span class="skeleton-vote-btn"></span>' +
				'<span class="skeleton-vote-count"></span>' +
				'<span class="skeleton-vote-btn"></span>' +
				"</div>" +
				'<div class="skeleton-topic-content">' +
				'<div class="skeleton-topic-meta">' +
				'<span class="skeleton-badge"></span>' +
				'<span class="skeleton-meta-text"></span>' +
				"</div>" +
				'<span class="skeleton-topic-title"></span>' +
				'<div class="skeleton-topic-actions">' +
				'<span class="skeleton-action-btn"></span>' +
				'<span class="skeleton-action-btn"></span>' +
				"</div>" +
				"</div>" +
				"</li>";
		}
		return '<ul class="vasak-skeleton-list list-unstyled">' + items + "</ul>";
	}

	/**
	 * Build the HTML for N notification skeleton items
	 */
	function buildNotificationSkeletons(count) {
		var items = "";
		for (var i = 0; i < count; i++) {
			items +=
				'<div class="skeleton-notification">' +
				'<span class="skeleton-notif-avatar"></span>' +
				'<div class="skeleton-notif-body">' +
				'<span class="skeleton-notif-line"></span>' +
				'<span class="skeleton-notif-line"></span>' +
				'<span class="skeleton-notif-time"></span>' +
				"</div>" +
				'<span class="skeleton-notif-dot"></span>' +
				"</div>";
		}
		return items;
	}

	/**
	 * Build the HTML for N post-item skeletons (account/posts page)
	 */
	function buildPostItemSkeletons(count) {
		var items = "";
		for (var i = 0; i < count; i++) {
			items +=
				'<li class="skeleton-post-item">' +
				'<span class="skeleton-post-title"></span>' +
				'<div class="skeleton-post-meta">' +
				'<span class="skeleton-avatar"></span>' +
				'<span class="skeleton-author"></span>' +
				'<span class="skeleton-time"></span>' +
				"</div>" +
				'<div class="skeleton-post-content">' +
				'<span class="skeleton-line"></span>' +
				'<span class="skeleton-line"></span>' +
				"</div>" +
				'<div class="skeleton-post-tags">' +
				'<span class="skeleton-tag"></span>' +
				'<span class="skeleton-tag"></span>' +
				"</div>" +
				"</li>";
		}
		return '<ul class="vasak-skeleton-list list-unstyled">' + items + "</ul>";
	}

	/**
	 * Remove a skeleton container with a smooth fade-out
	 */
	function removeSkeleton($skeleton) {
		if (!$skeleton || !$skeleton.length) return;
		$skeleton.addClass("vasak-skeleton-hiding");
		setTimeout(function () {
			$skeleton.remove();
		}, 220);
	}

	/**
	 * Main skeleton initializer — hooks into NodeBB's AJAX lifecycle
	 */
	function initSkeletonScreens() {
		// ── INFINITE SCROLL – FEED ─────────────────────────────────
		// NodeBB fires action:posts.loading before fetching more posts
		$(window).on("action:posts.loading", function () {
			var $postsList = $('[component="posts"]');
			if (!$postsList.length) return;
			if (!$(".feed").length) return;
			if ($postsList.next(".vasak-skeleton-list").length) return;
			$postsList.after(buildFeedSkeletons(3));
		});

		$(window).on("action:posts.loaded", function () {
			removeSkeleton($('[component="posts"]').next(".vasak-skeleton-list"));
		});

		// ── INFINITE SCROLL – TOPICS ───────────────────────────────
		$(window).on("action:topics.loading", function () {
			var $topicsList = $('[component="category"]');
			if (!$topicsList.length) return;
			if ($topicsList.next(".vasak-skeleton-list").length) return;
			$topicsList.after(buildTopicSkeletons(4));
		});

		$(window).on("action:topics.loaded", function () {
			removeSkeleton($('[component="category"]').next(".vasak-skeleton-list"));
		});

		// ── NOTIFICATIONS DROPDOWN ─────────────────────────────────
		$(document).on(
			"show.bs.dropdown",
			'[component="notifications"]',
			function () {
				var $list = $(this).find('[component="notifications/list"]');
				if (!$list.length) return;

				var hasRealContent =
					$list.find("[data-nid]").length > 0 ||
					$list.find(".no-notifs").length > 0;

				if (!hasRealContent && !$list.find(".skeleton-notification").length) {
					$list.html(buildNotificationSkeletons(4));
				}
			},
		);

		// ── AJAXIFY NAVIGATION – category / list pages ─────────────
		// Inject topic skeletons into #content while the new page loads
		$(window).on("action:ajaxify.start", function (ev, data) {
			var url = String(data.url || "");
			var isCategory = url.startsWith("category/");
			var isListPage =
				url === "recent" ||
				url === "unread" ||
				url === "popular" ||
				url === "top" ||
				url.startsWith("recent?") ||
				url.startsWith("unread?") ||
				url.startsWith("popular?") ||
				url.startsWith("top?");

			if (!isCategory && !isListPage) return;

			var $content = $("#content");
			if (!$content.length) return;
			if ($content.find('[component="category/topic"]').length) return;
			if ($content.find(".vasak-skeleton-list").length) return;

			$content.append(buildTopicSkeletons(5));
		});

		// Remove navigation skeletons when new page content is ready
		$(window).on("action:ajaxify.end", function () {
			removeSkeleton($("#content > .vasak-skeleton-list"));
		});
	}
	// ========================================
	// DARK MODE TOGGLE
	// ========================================
	// Adds/removes .dark on <html>.
	// Persists choice in localStorage.
	// Respects prefers-color-scheme on first visit.

	function initDarkMode() {
		var STORAGE_KEY = "vasak:theme";
		var $html = $("html");

		// ── Determine initial state ──────────────────────────────
		var saved = localStorage.getItem(STORAGE_KEY);
		var prefersDark =
			window.matchMedia &&
			window.matchMedia("(prefers-color-scheme: dark)").matches;

		// Priority: saved preference > OS preference
		var isDark = saved !== null ? saved === "dark" : prefersDark;

		// Apply immediately (before paint) to avoid flash
		applyTheme(isDark, false);

		// ── Button click ─────────────────────────────────────────
		$(document).on("click", "#vasak-dark-toggle", function () {
			isDark = !$html.hasClass("dark");
			applyTheme(isDark, true);
		});

		// Re-bind after SPA navigation (button is re-rendered)
		$(window).on("action:ajaxify.end", function () {
			// State is already on <html>, just ensure button icon is correct
			syncToggleIcon($html.hasClass("dark"));
		});

		// ── OS preference change ─────────────────────────────────
		if (window.matchMedia) {
			window
				.matchMedia("(prefers-color-scheme: dark)")
				.addEventListener("change", function (e) {
					// Only follow OS if user hasn't made a manual choice
					if (localStorage.getItem(STORAGE_KEY) === null) {
						applyTheme(e.matches, false);
					}
				});
		}

		function applyTheme(dark, save) {
			if (dark) {
				$html.addClass("dark").removeClass("light");
			} else {
				$html.removeClass("dark").addClass("light");
			}

			syncToggleIcon(dark);

			if (save) {
				localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
			}
		}

		function syncToggleIcon(dark) {
			var $btn = $("#vasak-dark-toggle");
			if (!$btn.length) return;
			$btn.attr("aria-pressed", dark ? "true" : "false");
			$btn.attr("title", dark ? "Switch to light mode" : "Switch to dark mode");
			$btn.attr("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
		}
	}

})();
