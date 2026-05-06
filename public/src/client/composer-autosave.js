"use strict";

/**
 * Vasak Composer Autosave
 * =======================
 * Guarda automáticamente el borrador del composer en localStorage.
 *
 * CARACTERÍSTICAS:
 *  - Autosave cada 2s de inactividad (debounced)
 *  - Indicador visual: "Saving…" → "Saved" → timestamp
 *  - Recuperación automática al abrir el composer
 *  - Banner de recuperación con opción de descartar
 *  - Múltiples borradores por cid (categoría)
 *  - Limpieza automática al enviar o descartar
 *  - Borradores expiran a las 72h
 *
 * STORAGE KEY: "vasak:draft:{cid}:{tid|new}" → { title, content, cid, tid, ts }
 */
define("forum/vasak-autosave", ["alerts", "forum/vasak-storage"], function (
	alerts,
	VasakStorage,
) {
	var Autosave = {};

	// ── Configuración ──────────────────────────────────────────────────────
	var SAVE_DELAY = 2000; // ms de inactividad antes de guardar
	var EXPIRY_MS = 72 * 60 * 60 * 1000; // 72 horas
	var STORAGE_KEY = "vasak:draft:";
	var MIN_CONTENT = 3; // chars mínimos para guardar

	// ── Estado ────────────────────────────────────────────────────────────
	var saveTimer = null;
	var currentKey = null;
	var isSaving = false;
	var $indicator = null;

	// ── Init ───────────────────────────────────────────────────────────────

	Autosave.init = function () {
		// Cuando el composer se abre
		$(window).on(
			"action:composer.loaded action:composer.enhanced",
			function () {
				setTimeout(onComposerOpen, 150);
			},
		);

		// Cuando el composer se cierra (submit o discard)
		$(window).on("action:composer.submit", function () {
			clearDraft(currentKey);
			hideIndicator();
		});

		$(window).on("action:composer.discard", function () {
			clearDraft(currentKey);
			hideIndicator();
		});

		// Limpiar al navegar
		$(window).on("action:ajaxify.start", function () {
			clearTimeout(saveTimer);
		});
	};

	// ── Apertura del composer ──────────────────────────────────────────────

	function onComposerOpen() {
		var $composer = $(".composer");
		if (!$composer.length) return;

		// Calcular la key del borrador
		currentKey = buildKey();

		// Inyectar el indicador de estado
		injectIndicator($composer);

		// Intentar recuperar borrador
		var draft = loadDraft(currentKey);
		if (draft && hasMeaningfulContent(draft)) {
			offerRestore(draft, $composer);
		}

		// Escuchar cambios en el textarea y el título
		bindInputListeners($composer);
	}

	// ── Key del borrador ───────────────────────────────────────────────────

	function buildKey() {
		var cid = "";
		var tid = "";

		// Intentar obtener cid del selector de categoría
		var $catSelector = $(".composer [component='category-selector']");
		if ($catSelector.length) {
			cid = $catSelector.find("[data-cid]").first().attr("data-cid") || "0";
		}

		// Intentar obtener tid si es una respuesta
		if (typeof ajaxify !== "undefined" && ajaxify.data) {
			tid = ajaxify.data.tid || "new";
		} else {
			tid = "new";
		}

		return STORAGE_KEY + cid + ":" + tid;
	}

	// ── Listeners de input ─────────────────────────────────────────────────

	function bindInputListeners($composer) {
		// Desregistrar listeners anteriores
		$composer.off("input.vasak-autosave keyup.vasak-autosave");

		$composer.on(
			"input.vasak-autosave keyup.vasak-autosave",
			".write, .title, textarea",
			function () {
				clearTimeout(saveTimer);
				showIndicatorSaving();

				saveTimer = setTimeout(function () {
					saveDraft($composer);
				}, SAVE_DELAY);
			},
		);

		// Guardar inmediatamente al cambiar de categoría
		$composer.on(
			"change.vasak-autosave",
			"[component='category-selector'] select",
			function () {
				currentKey = buildKey();
				saveDraft($composer);
			},
		);
	}

	// ── Guardar borrador ───────────────────────────────────────────────────

	function saveDraft($composer) {
		var title = $composer.find(".title").val() || "";
		var content = $composer.find(".write").val() || "";

		// No guardar si no hay contenido mínimo
		if (!hasMeaningfulContent({ title: title, content: content })) {
			showIndicatorEmpty();
			return;
		}

		var draft = {
			title: title,
			content: content,
			key: currentKey,
			ts: Date.now(),
		};

		try {
			VasakStorage.set(currentKey, draft);
			showIndicatorSaved(draft.ts);
		} catch (e) {
			showIndicatorError();
		}
	}

	// ── Cargar borrador ────────────────────────────────────────────────────

	function loadDraft(key) {
		if (!key) return null;
		var draft = VasakStorage.get(key);
		if (!draft) return null;
		if (Date.now() - draft.ts > EXPIRY_MS) {
			VasakStorage.remove(key);
			return null;
		}
		return draft;
	}

	function clearDraft(key) {
		if (!key) return;
		VasakStorage.remove(key);
		currentKey = null;
	}

	// ── Restaurar borrador ─────────────────────────────────────────────────

	function offerRestore(draft, $composer) {
		var age = formatAge(draft.ts);
		var preview = (draft.title || draft.content || "").substring(0, 60);
		if (preview.length === 60) preview += "…";

		// Banner de recuperación dentro del composer
		var $banner = $(
			'<div class="vasak-draft-banner" role="alert">' +
				'<div class="vasak-draft-banner-content">' +
				'<i class="fa fa-history vasak-draft-icon" aria-hidden="true"></i>' +
				'<div class="vasak-draft-text">' +
				"<strong>Unsaved draft found</strong>" +
				'<span class="vasak-draft-preview">' +
				escapeHtml(preview) +
				"</span>" +
				'<span class="vasak-draft-age">' +
				age +
				"</span>" +
				"</div>" +
				"</div>" +
				'<div class="vasak-draft-actions">' +
				'<button class="vasak-draft-restore btn btn-sm btn-primary" type="button">Restore</button>' +
				'<button class="vasak-draft-discard btn btn-sm btn-ghost" type="button">Discard</button>' +
				"</div>" +
				"</div>",
		);

		// Insertar en el composer (debajo del header)
		var $titleContainer = $composer.find(".title-container");
		if ($titleContainer.length) {
			$titleContainer.after($banner);
		} else {
			$composer.find(".composer-container").prepend($banner);
		}

		// Restaurar
		$banner.find(".vasak-draft-restore").on("click", function () {
			$composer
				.find(".title")
				.val(draft.title || "")
				.trigger("input");
			$composer
				.find(".write")
				.val(draft.content || "")
				.trigger("input");
			$banner.remove();
			showIndicatorSaved(draft.ts);
		});

		// Descartar
		$banner.find(".vasak-draft-discard").on("click", function () {
			clearDraft(currentKey);
			$banner.remove();
			showIndicatorEmpty();
		});
	}

	// ── Indicador de estado ────────────────────────────────────────────────

	function injectIndicator($composer) {
		// Remover indicador anterior
		$(".vasak-autosave-indicator").remove();

		$indicator = $(
			'<div class="vasak-autosave-indicator" aria-live="polite" aria-atomic="true">' +
				'<span class="vasak-autosave-text"></span>' +
				"</div>",
		);

		// Insertar en el tag-row (footer del composer)
		var $tagRow = $composer.find(".tag-row");
		if ($tagRow.length) {
			$tagRow.prepend($indicator);
		}
	}

	function hideIndicator() {
		if ($indicator) {
			$indicator.remove();
			$indicator = null;
		}
	}

	function showIndicatorSaving() {
		if (!$indicator) return;
		$indicator
			.removeClass("vasak-saved vasak-error")
			.addClass("vasak-saving")
			.find(".vasak-autosave-text")
			.text("Saving…");
	}

	function showIndicatorSaved(ts) {
		if (!$indicator) return;
		$indicator
			.removeClass("vasak-saving vasak-error")
			.addClass("vasak-saved")
			.find(".vasak-autosave-text")
			.text("Draft saved · " + formatTime(ts));
	}

	function showIndicatorEmpty() {
		if (!$indicator) return;
		$indicator
			.removeClass("vasak-saving vasak-saved vasak-error")
			.find(".vasak-autosave-text")
			.text("");
	}

	function showIndicatorError() {
		if (!$indicator) return;
		$indicator
			.removeClass("vasak-saving vasak-saved")
			.addClass("vasak-error")
			.find(".vasak-autosave-text")
			.text("Could not save draft");
	}

	// ── Helpers ────────────────────────────────────────────────────────────

	function hasMeaningfulContent(draft) {
		var combined = (draft.title || "") + (draft.content || "");
		return combined.trim().length >= MIN_CONTENT;
	}

	function formatTime(ts) {
		var d = new Date(ts);
		return (
			d.getHours().toString().padStart(2, "0") +
			":" +
			d.getMinutes().toString().padStart(2, "0")
		);
	}

	function formatAge(ts) {
		var diff = Math.floor((Date.now() - ts) / 1000);
		if (diff < 60) return "just now";
		if (diff < 3600) return Math.floor(diff / 60) + "m ago";
		if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
		return Math.floor(diff / 86400) + "d ago";
	}

	function escapeHtml(str) {
		return String(str)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	return Autosave;
});
