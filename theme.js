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

	// ── Push Notifications routes ─────────────────────────────────────────
	// Almacenamiento en memoria para subscripciones.
	// En producción reemplazar con persistencia en DB via NodeBB hooks.
	const pushSubscriptions = new Map();

	// Exponer la VAPID public key al cliente
	router.get("/vasak-push/vapid-public-key", (req, res) => {
		const publicKey = process.env.VAPID_PUBLIC_KEY || "";
		if (!publicKey) {
			return res.status(503).json({ error: "Push not configured" });
		}
		res.json({ publicKey });
	});

	// Guardar suscripción
	router.post("/vasak-push/subscribe", (req, res) => {
		const { subscription, uid } = req.body || {};
		if (!subscription || !subscription.endpoint) {
			return res.status(400).json({ error: "Invalid subscription" });
		}
		pushSubscriptions.set(subscription.endpoint, {
			subscription,
			uid,
			ts: Date.now(),
		});
		res.json({ success: true });
	});

	// Eliminar suscripción
	router.post("/vasak-push/unsubscribe", (req, res) => {
		const { endpoint } = req.body || {};
		if (endpoint) pushSubscriptions.delete(endpoint);
		res.json({ success: true });
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
 * Injects into templateData:
 *   - vasak_critical_css: minified critical CSS string (inlined via template)
 *   - vasak_head_html: resource hints HTML string (inlined via template)
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

		if (data.templateData) {
			data.templateData.vasak_critical_css = minified;

			// Resource hints — injected here, not via filter:scripts.get,
			// to avoid Cloudflare Rocket Loader treating HTML tags as scripts.
			data.templateData.vasak_head_html = [
				'<link rel="dns-prefetch" href="//cdnjs.cloudflare.com">',
				'<link rel="dns-prefetch" href="//use.fontawesome.com">',
			].join("\n");
		}
	} catch (e) {
		// Non-fatal
	}

	return data;
};

/**
 * Hook: filter:scripts.get
 * NodeBB uses this array for JS scripts only.
 * We do NOT inject HTML tags here — Cloudflare Rocket Loader would
 * URL-encode them and try to load them as scripts.
 * Resource hints and critical CSS are handled via filter:middleware.render
 * writing directly to templateData instead.
 */
theme.addHeadContent = async function (scripts) {
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
