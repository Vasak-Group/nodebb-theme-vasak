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
 * Initialize routes for admin panel + Service Worker route + Critical CSS
 */
theme.init = async function (params) {
	const { router } = params;
	const routeHelpers = require.main.require("./src/routes/helpers");
	const path = require("path");
	const fs = require("fs");

	// Admin panel route
	routeHelpers.setupAdminPageRoute(
		router,
		"/admin/plugins/vasak",
		[],
		(req, res) => {
			res.render("admin/plugins/vasak", { title: "Vasak Theme" });
		},
	);

	// ── Service Worker route ──────────────────────────────────────────────
	const swPath = path.join(__dirname, "static", "sw.js");

	router.get("/vasak-sw.js", (req, res) => {
		res.setHeader("Service-Worker-Allowed", "/");
		res.setHeader("Content-Type", "application/javascript; charset=utf-8");
		res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

		if (fs.existsSync(swPath)) {
			res.sendFile(swPath);
		} else {
			res.status(404).send("// Service Worker not found");
		}
	});

	// ── Critical CSS route ────────────────────────────────────────────────
	// Serve the critical CSS file so it can be read server-side for inlining.
	const criticalCssPath = path.join(__dirname, "static", "critical.css");

	router.get("/vasak-critical.css", (req, res) => {
		res.setHeader("Content-Type", "text/css; charset=utf-8");
		res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day

		if (fs.existsSync(criticalCssPath)) {
			res.sendFile(criticalCssPath);
		} else {
			res.status(404).send("/* Critical CSS not found */");
		}
	});
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

/**
 * Hook: filter:middleware.render
 * Injects critical CSS inline into every page's <head> via
 * NodeBB's res.locals.extraCSS mechanism.
 * Eliminates render-blocking for above-the-fold styles.
 */
theme.injectCriticalCSS = async function (data) {
	const path = require("path");
	const fs = require("fs");

	const criticalPath = path.join(__dirname, "static", "critical.css");

	try {
		const css = fs.readFileSync(criticalPath, "utf8");

		// Minify: strip comments and collapse whitespace
		const minified = css
			.replace(/\/\*[\s\S]*?\*\//g, "")
			.replace(/\s{2,}/g, " ")
			.replace(/\n/g, "")
			.trim();

		// NodeBB's filter:middleware.render passes { req, res, templateData }
		// We inject a <style> tag via templateData.extraCSS (Harmony/NodeBB convention)
		if (data.templateData) {
			data.templateData.vasak_critical_css = minified;
		}
	} catch (e) {
		// Non-fatal
	}

	return data;
};

/**
 * Hook: filter:scripts.get
 * Injects the critical CSS <style> block into the page <head>.
 * NodeBB calls this hook to collect extra <head> content.
 */
theme.addHeadContent = async function (scripts) {
	const path = require("path");
	const fs = require("fs");

	const criticalPath = path.join(__dirname, "static", "critical.css");

	try {
		const css = fs.readFileSync(criticalPath, "utf8");
		const minified = css
			.replace(/\/\*[\s\S]*?\*\//g, "")
			.replace(/\s{2,}/g, " ")
			.replace(/\n/g, "")
			.trim();

		// Prepend so it loads before any other scripts/styles
		scripts.unshift(`<style id="vasak-critical">${minified}</style>`);
	} catch (e) {
		// Non-fatal
	}

	return scripts;
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
