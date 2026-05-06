"use strict";

define("forum/world", [
	"topicList",
	"search",
	"sort",
	"hooks",
	"alerts",
	"api",
	"bootbox",
], function (topicList, search, sort, hooks, alerts, api, bootbox) {
	const World = {};

	World.init = function () {
		app.enterRoom("world");
		topicList.init("world");

		sort.handleSort("categoryTopicSort", "world");

		handleIgnoreWatch(-1);
		handleHelp();
		handleCategories();

		search.enableQuickSearch({
			searchElements: {
				inputEl: $('[component="category-search"]'),
				resultEl: $(".world .quick-search-container"),
			},
			searchOptions: {
				in: "categories",
			},
			dropdown: {
				maxWidth: "400px",
				maxHeight: "350px",
			},
			hideOnNoMatches: false,
		});

		hooks.fire("action:topics.loaded", { topics: ajaxify.data.topics });
		hooks.fire("action:category.loaded", { cid: ajaxify.data.cid });
	};

	function handleIgnoreWatch(cid) {
		$('[component="category/watching"]').on("click", function () {
			const isWatching = $('[component="category/watching/check"]').hasClass(
				"fa-check",
			);
			const state = isWatching ? "tracking" : "watching";

			api.put(`/categories/${cid}/watch`, { state }, (err) => {
				if (err) {
					return alerts.error(err);
				}

				const nowWatching = state === "watching";
				$('[component="category/watching/menu"]').toggleClass(
					"hidden",
					!nowWatching,
				);
				$('[component="category/watching/check"]').toggleClass(
					"fa-check",
					nowWatching,
				);
				$('[component="category/notwatching/menu"]').toggleClass(
					"hidden",
					nowWatching,
				);

				alerts.success("[[category:" + state + ".message]]");
			});
		});
	}

	function handleHelp() {
		const trigger = document.getElementById("world-help");
		if (!trigger) {
			return;
		}

		const content = [
			'<p class="lead">[[world:help.intro]]</p>',
			"<p>[[world:help.fediverse]]</p>",
			"<p>[[world:help.build]]</p>",
			"<p>[[world:help.federating]]</p>",
			"<p>[[world:help.next-generation]]</p>",
		];

		trigger.addEventListener("click", () => {
			bootbox.dialog({
				title: "[[world:help.title]]",
				message: content.join("\n"),
				size: "large",
			});
		});
	}

	function handleCategories() {
		// const optionsEl = document.getElementById('category-options');
		// const dropdownEl = optionsEl.querySelector('ul');
		const showEl = document.getElementById("show-categories");
		const hideEl = document.getElementById("hide-categories");
		const categoriesEl = document.querySelector(".categories-list");
		if (![showEl, hideEl, categoriesEl].every(Boolean)) {
			return;
		}

		const update = () => {
			showEl.classList.toggle("hidden", visibility);
			hideEl.classList.toggle("hidden", !visibility);
			categoriesEl.classList.toggle("hidden", !visibility);
			localStorage.setItem("world:show-categories", visibility);
		};

		let visibility = localStorage.getItem("world:show-categories");
		visibility = visibility ? visibility === "true" : true; // localStorage values are strings
		update();

		showEl.addEventListener("click", () => {
			visibility = true;
			update();
		});

		hideEl.addEventListener("click", () => {
			visibility = false;
			update();
		});
	}

	return World;
});
