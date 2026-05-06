"use strict";

/**
 * Vasak Infinite Scroll UX
 * ========================
 * Mejoras de UX para el infinite scroll de NodeBB:
 *
 *  - Barra de progreso superior (tipo YouTube/GitHub)
 *  - Indicador de carga inline con dots animados
 *  - Estado "end of feed" cuando no hay más contenido
 *  - Botón "load more" como fallback manual
 *  - Botón "back to top" que aparece al hacer scroll
 *  - Restauración de posición de scroll al navegar atrás
 *  - Manejo de errores con retry
 *
 * Se registra como módulo AMD y se carga desde theme.js
 * en todas las páginas con listas (feed, category, recent, etc.)
 */
define("vasak/scroll-ux", ["hooks"], function (hooks) {
	var ScrollUX = {};

	// ── Configuración ──────────────────────────────────────────────────────
	var SCROLL_THRESHOLD = 300; // px desde el top para mostrar back-to-top
	var PROGRESS_TICK_MS = 80; // ms entre ticks de la barra de progreso
	var SCROLL_SAVE_KEY = "vasak:scroll:";
	var SENTINEL_MARGIN = "200px"; // pre-cargar 200px antes del final

	// ── Estado interno ─────────────────────────────────────────────────────
	var progressTimer = null;
	var progressValue = 0;
	var scrollSaveTimer = null;
	var sentinelObserver = null;
	var isLoading = false;
	var hasMore = true;

	// ── Init ───────────────────────────────────────────────────────────────

	ScrollUX.init = function () {
		injectProgressBar();
		injectBackToTop();
		initScrollSave();
		initBackToTopVisibility();
		hookNodeBBEvents();
	};

	// ── Barra de progreso ──────────────────────────────────────────────────

	function injectProgressBar() {
		if (document.getElementById("vasak-progress-bar")) return;
		var bar = document.createElement("div");
		bar.id = "vasak-progress-bar";
		document.body.appendChild(bar);
	}

	function progressStart() {
		var bar = document.getElementById("vasak-progress-bar");
		if (!bar) return;

		clearInterval(progressTimer);
		progressValue = 0;
		bar.style.width = "0%";
		bar.classList.add("vasak-progress-active");
		bar.classList.remove("vasak-progress-done", "vasak-progress-indeterminate");

		// Avanzar rápido al principio, luego más lento (simula progreso real)
		progressTimer = setInterval(function () {
			if (progressValue < 30) progressValue += 8;
			else if (progressValue < 60) progressValue += 4;
			else if (progressValue < 80) progressValue += 2;
			else if (progressValue < 90) progressValue += 0.5;
			// Se detiene en 90 — progressDone() lo lleva al 100%
			bar.style.width = progressValue + "%";
		}, PROGRESS_TICK_MS);
	}

	function progressDone() {
		var bar = document.getElementById("vasak-progress-bar");
		if (!bar) return;

		clearInterval(progressTimer);
		progressValue = 100;
		bar.style.width = "100%";
		bar.classList.add("vasak-progress-done");

		setTimeout(function () {
			bar.classList.remove("vasak-progress-active", "vasak-progress-done");
			bar.style.width = "0%";
		}, 500);
	}

	function progressError() {
		var bar = document.getElementById("vasak-progress-bar");
		if (!bar) return;

		clearInterval(progressTimer);
		bar.style.width = "100%";
		bar.style.background = "var(--use-status-error)";
		bar.classList.add("vasak-progress-done");

		setTimeout(function () {
			bar.classList.remove("vasak-progress-active", "vasak-progress-done");
			bar.style.width = "0%";
			bar.style.background = "";
		}, 600);
	}

	// ── Indicador de carga inline ──────────────────────────────────────────

	function showLoader(container) {
		if (!container || container.find(".vasak-scroll-loader").length) return;

		var html =
			'<div class="vasak-scroll-loader">' +
			'<div class="vasak-scroll-dots">' +
			"<span></span><span></span><span></span>" +
			"</div>" +
			'<span class="vasak-scroll-text">Loading more...</span>' +
			"</div>";

		container.after(html);
	}

	function hideLoader() {
		$(".vasak-scroll-loader").remove();
	}

	// ── Estado "end of feed" ───────────────────────────────────────────────

	function showEndState(container) {
		if (!container || container.find(".vasak-scroll-end").length) return;
		if ($(".vasak-scroll-end").length) return;

		var html =
			'<div class="vasak-scroll-end">' +
			'<div class="vasak-scroll-end-icon">' +
			'<i class="fa fa-check" aria-hidden="true"></i>' +
			"</div>" +
			'<p class="vasak-scroll-end-title">You\'re all caught up</p>' +
			'<p class="vasak-scroll-end-sub">Check back later for new posts</p>' +
			"</div>";

		container.after(html);
		hasMore = false;

		// Desconectar el sentinel observer — ya no hay nada que cargar
		if (sentinelObserver) {
			sentinelObserver.disconnect();
			sentinelObserver = null;
		}
	}

	function hideEndState() {
		$(".vasak-scroll-end").remove();
		hasMore = true;
	}

	// ── Estado de error ────────────────────────────────────────────────────

	function showError(container, retryFn) {
		hideLoader();
		if (!container) return;

		var $error = $(
			'<div class="vasak-scroll-error">' +
				'<i class="fa fa-exclamation-circle vasak-scroll-error-icon" aria-hidden="true"></i>' +
				'<span class="vasak-scroll-error-text">Failed to load more content</span>' +
				'<span class="vasak-scroll-error-retry">Retry</span>' +
				"</div>",
		);

		if (typeof retryFn === "function") {
			$error.find(".vasak-scroll-error-retry").on("click", function () {
				$error.remove();
				retryFn();
			});
		}

		container.after($error);
	}

	// ── Botón "back to top" ────────────────────────────────────────────────

	function injectBackToTop() {
		if (document.getElementById("vasak-back-to-top")) return;

		var btn = document.createElement("button");
		btn.id = "vasak-back-to-top";
		btn.setAttribute("aria-label", "Back to top");
		btn.setAttribute("title", "Back to top");
		btn.innerHTML = '<i class="fa fa-chevron-up" aria-hidden="true"></i>';
		document.body.appendChild(btn);

		btn.addEventListener("click", function () {
			window.scrollTo({ top: 0, behavior: "smooth" });
		});
	}

	function initBackToTopVisibility() {
		var btn = document.getElementById("vasak-back-to-top");
		if (!btn) return;

		var ticking = false;

		window.addEventListener(
			"scroll",
			function () {
				if (ticking) return;
				ticking = true;

				requestAnimationFrame(function () {
					if (window.scrollY > SCROLL_THRESHOLD) {
						btn.classList.add("visible");
					} else {
						btn.classList.remove("visible");
					}
					ticking = false;
				});
			},
			{ passive: true },
		);
	}

	// ── Restauración de posición de scroll ────────────────────────────────
	// Guarda la posición al hacer scroll y la restaura al navegar atrás.

	function initScrollSave() {
		// Guardar posición al hacer scroll (debounced)
		window.addEventListener(
			"scroll",
			function () {
				clearTimeout(scrollSaveTimer);
				scrollSaveTimer = setTimeout(function () {
					var key = SCROLL_SAVE_KEY + window.location.pathname;
					try {
						sessionStorage.setItem(key, window.scrollY);
					} catch (e) {
						/* storage lleno o bloqueado */
					}
				}, 200);
			},
			{ passive: true },
		);

		// Restaurar posición al cargar la página (solo si viene de "atrás")
		// NodeBB usa ajaxify, así que escuchamos action:ajaxify.end
		$(window).on("action:ajaxify.end", function () {
			// Pequeño delay para que el DOM esté listo
			setTimeout(function () {
				var key = SCROLL_SAVE_KEY + window.location.pathname;
				var saved;
				try {
					saved = parseInt(sessionStorage.getItem(key), 10);
				} catch (e) {
					return;
				}

				if (saved && saved > 0) {
					window.scrollTo({ top: saved, behavior: "instant" });
					// Limpiar después de restaurar para no interferir con navegación normal
					try {
						sessionStorage.removeItem(key);
					} catch (e) {}
				}
			}, 100);
		});
	}

	// ── Hooks de NodeBB ────────────────────────────────────────────────────

	function hookNodeBBEvents() {
		// ── Posts (feed) ─────────────────────────────────────────────────
		$(window).on("action:posts.loading", function () {
			if (isLoading) return;
			isLoading = true;

			progressStart();
			var $list = $('[component="posts"]');
			showLoader($list);
		});

		$(window).on("action:posts.loaded", function (ev, data) {
			isLoading = false;
			progressDone();
			hideLoader();

			// Detectar fin del feed
			var $list = $('[component="posts"]');
			var nextStart = $list.attr("data-nextstart");

			if (!data || !data.posts || data.posts.length === 0) {
				showEndState($list);
			} else {
				hideEndState();
				// Actualizar sentinel para la próxima carga
				updateSentinel($list);
			}
		});

		// ── Topics (category, recent, etc.) ──────────────────────────────
		$(window).on("action:topics.loading", function () {
			if (isLoading) return;
			isLoading = true;

			progressStart();
			var $list = $('[component="category"]');
			showLoader($list);
		});

		$(window).on("action:topics.loaded", function (ev, data) {
			isLoading = false;
			progressDone();
			hideLoader();

			var $list = $('[component="category"]');

			if (!data || !data.topics || data.topics.length === 0) {
				showEndState($list);
			} else {
				hideEndState();
				updateSentinel($list);
			}
		});

		// ── Navegación SPA ────────────────────────────────────────────────
		$(window).on("action:ajaxify.start", function () {
			progressStart();
			// Limpiar estados de la página anterior
			hideLoader();
			hideEndState();
			$(".vasak-scroll-error").remove();
			hasMore = true;
			isLoading = false;

			// Desconectar observer anterior
			if (sentinelObserver) {
				sentinelObserver.disconnect();
				sentinelObserver = null;
			}
		});

		$(window).on("action:ajaxify.end", function () {
			progressDone();
			// Inicializar sentinel para la nueva página
			setTimeout(function () {
				var $list = $('[component="posts"], [component="category"]').first();
				if ($list.length) {
					updateSentinel($list);
				}
			}, 300);
		});

		// ── Errores de red ────────────────────────────────────────────────
		// NodeBB no tiene un evento específico de error en infinite scroll,
		// pero podemos detectar si loading se queda activo demasiado tiempo.
		$(window).on("action:posts.loading action:topics.loading", function () {
			// Timeout de seguridad: si después de 15s no llega loaded, mostrar error
			var timeoutId = setTimeout(function () {
				if (isLoading) {
					isLoading = false;
					progressError();
					hideLoader();
					var $list = $('[component="posts"], [component="category"]').first();
					showError($list, null);
				}
			}, 15000);

			// Cancelar el timeout si la carga termina normalmente
			$(window).one("action:posts.loaded action:topics.loaded", function () {
				clearTimeout(timeoutId);
			});
		});
	}

	// ── Sentinel Observer ─────────────────────────────────────────────────
	// Elemento invisible al final de la lista que dispara la carga
	// cuando entra en el viewport (pre-carga 200px antes del final).

	function updateSentinel($list) {
		if (!$list || !$list.length) return;
		if (!("IntersectionObserver" in window)) return;

		// Remover sentinel anterior
		$list.next(".vasak-scroll-sentinel").remove();

		// No crear sentinel si ya llegamos al final
		if (!hasMore) return;

		// Crear nuevo sentinel
		var $sentinel = $(
			'<div class="vasak-scroll-sentinel" aria-hidden="true"></div>',
		);
		$list.after($sentinel);

		// Desconectar observer anterior
		if (sentinelObserver) {
			sentinelObserver.disconnect();
		}

		sentinelObserver = new IntersectionObserver(
			function (entries) {
				entries.forEach(function (entry) {
					if (!entry.isIntersecting) return;
					if (isLoading || !hasMore) return;

					// Disparar la carga de NodeBB
					// NodeBB expone el topicList/postList via hooks
					hooks.fire("action:vasak.scroll.loadMore", {});
				});
			},
			{
				rootMargin: SENTINEL_MARGIN,
				threshold: 0,
			},
		);

		sentinelObserver.observe($sentinel[0]);
	}

	// ── API pública ────────────────────────────────────────────────────────
	// Expone funciones para que otros módulos puedan usar la barra de progreso.

	ScrollUX.progressStart = progressStart;
	ScrollUX.progressDone = progressDone;
	ScrollUX.progressError = progressError;

	return ScrollUX;
});
