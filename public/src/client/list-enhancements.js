"use strict";

/**
 * Vasak List Enhancements
 * =======================
 * Loaded on category/topic-list pages (recent, unread, popular, top, category).
 * Handles: client-side voting on topic cards.
 */
define("vasak/list", [], function () {
	var ListEnhancements = {};

	ListEnhancements.init = function () {
		initTopicListVoting();

		$(window).on("action:topics.loaded action:ajaxify.end", function () {
			initTopicListVoting();
		});
	};

	// ── Topic List Voting ──────────────────────────────────────────────────
	// NodeBB's native voting only works on topic detail pages.
	// This adds vote handlers for the Reddit-style vote column in topic lists.

	function initTopicListVoting() {
		// Skip on topic detail pages (NodeBB handles voting natively there)
		if ($('[component="topic"]').length) return;

		$(".vote-column:not([data-vote-initialized])").each(function () {
			var $col = $(this);
			$col.attr("data-vote-initialized", "true");

			var pid = $col.attr("data-pid");
			if (!pid) return;

			var $upBtn = $col.find('[component="post/upvote"]');
			var $downBtn = $col.find('[component="post/downvote"]');
			var $count = $col.find('[component="post/vote-count"]');

			function vote(delta, $activeBtn, $otherBtn) {
				if (!config.loggedIn) {
					window.location.href = config.relative_path + "/login";
					return;
				}

				var isActive = $activeBtn.hasClass(delta > 0 ? "upvoted" : "downvoted");
				var method = isActive ? "del" : "put";

				$.ajax({
					url: config.relative_path + "/api/v3/posts/" + pid + "/vote",
					method: method,
					data: JSON.stringify({ delta: delta }),
					contentType: "application/json",
					headers: { "x-csrf-token": config.csrf_token },
					success: function (res) {
						$activeBtn.toggleClass(delta > 0 ? "upvoted" : "downvoted");
						$otherBtn.removeClass(delta > 0 ? "downvoted" : "upvoted");

						var votes = extractVotes(res);
						if (votes !== null) {
							$count.text(votes).attr("data-votes", votes).attr("title", votes);
						} else {
							var current =
								parseInt($count.attr("data-votes") || $count.text()) || 0;
							var wasActive = !$activeBtn.hasClass(
								delta > 0 ? "upvoted" : "downvoted",
							);
							votes = wasActive ? current - delta : current + delta;
							$count.text(votes).attr("data-votes", votes).attr("title", votes);
						}
					},
					error: function (xhr) {
						var msg =
							xhr.responseJSON &&
							xhr.responseJSON.status &&
							xhr.responseJSON.status.message;
						if (msg) alert(msg);
					},
				});
			}

			$upBtn.on("click", function (e) {
				e.preventDefault();
				e.stopPropagation();
				vote(1, $upBtn, $downBtn);
			});

			$downBtn.on("click", function (e) {
				e.preventDefault();
				e.stopPropagation();
				vote(-1, $downBtn, $upBtn);
			});
		});
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

	return ListEnhancements;
});
