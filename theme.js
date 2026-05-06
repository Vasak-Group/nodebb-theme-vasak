/**
 * Vasak Community Theme
 * Main theme configuration and initialization
 */

"use strict";

const meta = require.main.require("./src/meta");
const user = require.main.require("./src/user");
const _ = require.main.require("lodash");

const theme = {};

// Harmony's defaults - we override openSidebars to 'on'
const defaults = {
	enableQuickReply: "on",
	enableBreadcrumbs: "on",
	centerHeaderElements: "off",
	mobileTopicTeasers: "off",
	stickyToolbar: "on",
	topicSidebarTools: "on",
	topMobilebar: "off",
	autohideBottombar: "on",
	openSidebars: "on", // Vasak override: sidebar open by default
	chatModals: "off",
};

/**
 * Hook: static:app.load
 * Initialize routes for admin panel
 */
theme.init = async function (params) {
	const { router } = params;
	const routeHelpers = require.main.require("./src/routes/helpers");

	// Admin panel route - render using Harmony's admin template structure
	routeHelpers.setupAdminPageRoute(
		router,
		"/admin/plugins/vasak",
		[],
		(req, res) => {
			res.render("admin/plugins/vasak", {
				title: "Vasak Theme",
			});
		},
	);
};

/**
 * Load theme config - replaces Harmony's loadThemeConfig
 * Uses Vasak defaults (with openSidebars: 'on')
 */
async function loadThemeConfig(uid) {
	const [themeConfig, userConfig] = await Promise.all([
		meta.settings.get("harmony"),
		user.getSettings(uid),
	]);

	// 3-tier cascade: Vasak defaults -> theme settings -> user settings
	const config = {
		...defaults,
		...themeConfig,
		..._.pick(userConfig, Object.keys(defaults)),
	};

	// Convert 'on'/'off' strings to boolean
	config.enableQuickReply = config.enableQuickReply === "on";
	config.enableBreadcrumbs = config.enableBreadcrumbs === "on";
	config.centerHeaderElements = config.centerHeaderElements === "on";
	config.mobileTopicTeasers = config.mobileTopicTeasers === "on";
	config.stickyToolbar = config.stickyToolbar === "on";
	config.topicSidebarTools = config.topicSidebarTools === "on";
	config.autohideBottombar = config.autohideBottombar === "on";
	config.topMobilebar = config.topMobilebar === "on";
	config.openSidebars = config.openSidebars === "on";
	config.chatModals = config.chatModals === "on";

	return config;
}

/**
 * Hook: filter:config.get
 * Sets config.theme with Vasak specific defaults
 */
theme.getThemeConfig = async function (config) {
	config.theme = await loadThemeConfig(config.uid);
	config.openDraftsOnPageLoad = false;
	return config;
};

theme.defineWidgetAreas = async (areas) => {
	// Define widget areas like Harmony does
	const locations = ["header", "sidebar", "footer"];
	const templates = [
		"categories.tpl",
		"category.tpl",
		"topic.tpl",
		"users.tpl",
		"unread.tpl",
		"recent.tpl",
		"popular.tpl",
		"top.tpl",
		"tags.tpl",
		"tag.tpl",
		"login.tpl",
		"register.tpl",
		"world.tpl",
	];

	function capitalizeFirst(str) {
		return str.charAt(0).toUpperCase() + str.slice(1);
	}

	templates.forEach((template) => {
		locations.forEach((location) => {
			areas.push({
				name: `${capitalizeFirst(template.split(".")[0])} ${capitalizeFirst(location)}`,
				template: template,
				location: location,
			});
		});
	});

	// Additional widget areas
	areas = areas.concat([
		{
			name: "Main post header",
			template: "topic.tpl",
			location: "mainpost-header",
		},
		{
			name: "Main post footer",
			template: "topic.tpl",
			location: "mainpost-footer",
		},
		{
			name: "Sidebar Footer",
			template: "global",
			location: "sidebar-footer",
		},
		{
			name: "Brand Header",
			template: "global",
			location: "brand-header",
		},
		{
			name: "About me (before)",
			template: "account/profile.tpl",
			location: "profile-aboutme-before",
		},
		{
			name: "About me (after)",
			template: "account/profile.tpl",
			location: "profile-aboutme-after",
		},
	]);

	return areas;
};

theme.addAdminNavigation = (header) => {
	header.plugins.push({
		route: "/plugins/vasak",
		icon: "fa-paint-brush",
		name: "Vasak Theme",
	});

	return header;
};

module.exports = theme;
