"use strict";

define("forum/account/categories", [
	"forum/account/header",
	"alerts",
	"api",
], function (header, alerts, api) {
	const Categories = {};

	Categories.init = function () {
		header.init();

		ajaxify.data.categories.forEach(function (category) {
			handleIgnoreWatch(category.cid);
		});

		$('[component="category/watch/all"]')
			.find('[component="category/watching"], [component="category/tracking"]')
			.on("click", async (e) => {
				const cids = [];
				const state = e.currentTarget.getAttribute("data-state");
				const { uid } = ajaxify.data;
				$('[data-parent-cid="0"]').each(function (index, el) {
					cids.push($(el).attr("data-cid"));
				});

				let modified_cids = await Promise.all(
					cids.map(async (cid) =>
						api.put(`/categories/${cid}/watch`, { state, uid }),
					),
				);
				modified_cids = modified_cids
					.reduce((memo, cur) => memo.concat(cur.modified), [])
					.filter((cid, idx, arr) => arr.indexOf(cid) === idx);

				updateDropdowns(modified_cids, state);
			});
	};

	function handleIgnoreWatch(cid) {
		const category = $('[data-cid="' + cid + '"]');
		category.find('[component="category/watching"]').on("click", async (e) => {
			const isWatching = category
				.find('[component="category/watching/check"]')
				.hasClass("fa-check");
			const state = isWatching ? "tracking" : "watching";
			const { uid } = ajaxify.data;

			const { modified } = await api.put(`/categories/${cid}/watch`, {
				state,
				uid,
			});
			updateDropdowns(modified, state);
			alerts.success("[[category:" + state + ".message]]");
		});
	}

	function updateDropdowns(modified_cids, state) {
		modified_cids.forEach(function (cid) {
			const category = $('[data-cid="' + cid + '"]');
			const nowWatching = state === "watching";
			category
				.find('[component="category/watching/menu"]')
				.toggleClass("hidden", !nowWatching);
			category
				.find('[component="category/watching/check"]')
				.toggleClass("fa-check", nowWatching);
			category
				.find('[component="category/notwatching/menu"]')
				.toggleClass("hidden", nowWatching);
		});
	}

	return Categories;
});
