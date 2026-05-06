"use strict";

define("admin/plugins/vasak", ["settings"], function (Settings) {
	var ACP = {};

	ACP.init = function () {
		// Load settings from 'harmony' key for compatibility with parent theme
		Settings.load("harmony", $(".vasak-settings"));

		$("#save").on("click", function () {
			// Save to 'harmony' key for compatibility
			Settings.save("harmony", $(".vasak-settings"));
		});
	};

	return ACP;
});
