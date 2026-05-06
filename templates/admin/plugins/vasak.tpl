<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 col-md-8 px-0 mb-4" tabindex="0">

			<!-- ── Header ──────────────────────────────────────────────── -->
			<div class="mb-5">
				<div class="d-flex align-items-center gap-3 mb-2">
					<div style="width:40px;height:40px;border-radius:10px;background:#dd7878;display:flex;align-items:center;justify-content:center;">
						<i class="fa fa-paint-brush text-white"></i>
					</div>
					<div>
						<h4 class="fw-bold mb-0">Vasak Community Theme</h4>
						<p class="text-muted mb-0 small">Configuración del tema para NodeBB</p>
					</div>
				</div>
			</div>

			<form role="form" class="vasak-settings">

				<!-- ── Sección: Layout ─────────────────────────────────── -->
				<div class="mb-5">
					<h6 class="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">
						<i class="fa fa-columns me-1"></i> Layout
					</h6>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="openSidebars" name="openSidebars" />
						<label for="openSidebars" class="form-check-label fw-semibold">Sidebar expandido por defecto</label>
						<p class="form-text">Mantiene el sidebar izquierdo abierto al cargar la página. Recomendado: activado.</p>
					</div>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="centerHeaderElements" name="centerHeaderElements" />
						<label for="centerHeaderElements" class="form-check-label fw-semibold">Centrar elementos del header</label>
						<p class="form-text">Centra el título y la navegación en el header.</p>
					</div>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="stickyToolbar" name="stickyToolbar" />
						<label for="stickyToolbar" class="form-check-label fw-semibold">Toolbar fijo al hacer scroll</label>
						<p class="form-text">Mantiene la barra de herramientas del topic visible al hacer scroll.</p>
					</div>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="topicSidebarTools" name="topicSidebarTools" />
						<label for="topicSidebarTools" class="form-check-label fw-semibold">Herramientas en sidebar del topic</label>
						<p class="form-text">Muestra las herramientas del topic en el sidebar lateral en lugar de inline.</p>
					</div>
				</div>

				<!-- ── Sección: Mobile ─────────────────────────────────── -->
				<div class="mb-5">
					<h6 class="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">
						<i class="fa fa-mobile me-1"></i> Mobile
					</h6>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="mobileTopicTeasers" name="mobileTopicTeasers" />
						<label for="mobileTopicTeasers" class="form-check-label fw-semibold">Teasers de topics en mobile</label>
						<p class="form-text">Muestra el preview del último post en la lista de topics en dispositivos móviles.</p>
					</div>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="topMobilebar" name="topMobilebar" />
						<label for="topMobilebar" class="form-check-label fw-semibold">Barra de navegación arriba (mobile)</label>
						<p class="form-text">Muestra la navegación mobile en la parte superior en lugar de abajo.</p>
					</div>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="autohideBottombar" name="autohideBottombar" />
						<label for="autohideBottombar" class="form-check-label fw-semibold">Ocultar barra inferior al hacer scroll</label>
						<p class="form-text">Oculta automáticamente la barra de navegación inferior al hacer scroll hacia abajo.</p>
					</div>
				</div>

				<!-- ── Sección: Composer ───────────────────────────────── -->
				<div class="mb-5">
					<h6 class="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">
						<i class="fa fa-pencil me-1"></i> Composer
					</h6>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="enableQuickReply" name="enableQuickReply" />
						<label for="enableQuickReply" class="form-check-label fw-semibold">Quick Reply</label>
						<p class="form-text">Permite responder a topics sin abrir el composer completo.</p>
					</div>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="chatModals" name="chatModals" />
						<label for="chatModals" class="form-check-label fw-semibold">Chats en modal</label>
						<p class="form-text">Abre los chats en ventanas modales en lugar de navegar a la página de chat.</p>
					</div>
				</div>

				<!-- ── Sección: Navegación ─────────────────────────────── -->
				<div class="mb-5">
					<h6 class="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">
						<i class="fa fa-sitemap me-1"></i> Navegación
					</h6>

					<div class="form-check form-switch mb-3">
						<input type="checkbox" class="form-check-input" id="enableBreadcrumbs" name="enableBreadcrumbs" />
						<label for="enableBreadcrumbs" class="form-check-label fw-semibold">Breadcrumbs</label>
						<p class="form-text">Muestra la ruta de navegación (migas de pan) en la parte superior de las páginas.</p>
					</div>
				</div>

				<!-- ── Sección: Push Notifications ────────────────────── -->
				<div class="mb-5">
					<h6 class="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">
						<i class="fa fa-bell me-1"></i> Notificaciones Push
					</h6>

					<div class="alert alert-info mb-3">
						<i class="fa fa-info-circle me-2"></i>
						Las notificaciones push requieren <strong>VAPID keys</strong> configuradas como variables de entorno.
						Ver <a href="https://github.com/vasak-group/nodebb-theme-vasak#notificaciones-push" target="_blank" rel="noopener">documentación</a>.
					</div>

					<div class="mb-3">
						<label class="form-label fw-semibold">VAPID Public Key</label>
						<div class="input-group">
							<span class="input-group-text"><i class="fa fa-key"></i></span>
							<input type="text" class="form-control font-monospace" id="vasak-vapid-status"
								placeholder="Configurada via VAPID_PUBLIC_KEY env var" readonly />
						</div>
						<div class="form-text">
							Solo lectura. Configurar con <code>export VAPID_PUBLIC_KEY="..."</code> en el servidor.
						</div>
					</div>

					<div id="vasak-push-stats" class="d-none">
						<label class="form-label fw-semibold">Suscripciones activas</label>
						<div class="d-flex align-items-center gap-2">
							<span class="badge bg-primary fs-6" id="vasak-push-count">0</span>
							<span class="text-muted small">dispositivos suscritos</span>
						</div>
					</div>
				</div>

				<!-- ── Sección: Service Worker ─────────────────────────── -->
				<div class="mb-5">
					<h6 class="fw-bold text-uppercase text-muted small mb-3 border-bottom pb-2">
						<i class="fa fa-database me-1"></i> Caché (Service Worker)
					</h6>

					<div class="d-flex gap-2 flex-wrap">
						<button type="button" class="btn btn-outline-secondary btn-sm" id="vasak-sw-status-btn">
							<i class="fa fa-circle-info me-1"></i> Ver estado del caché
						</button>
						<button type="button" class="btn btn-outline-danger btn-sm" id="vasak-sw-clear-btn">
							<i class="fa fa-trash me-1"></i> Limpiar caché
						</button>
					</div>
					<div id="vasak-sw-status" class="mt-3 d-none">
						<pre class="bg-light p-3 rounded small" id="vasak-sw-status-output"></pre>
					</div>
				</div>

			</form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>

<script>
$(document).ready(function () {
	// Verificar estado de VAPID
	$.get('/vasak-push/vapid-public-key')
		.done(function (data) {
			if (data.publicKey) {
				$('#vasak-vapid-status').val(data.publicKey.substring(0, 20) + '...');
				$('#vasak-push-stats').removeClass('d-none');
			}
		})
		.fail(function () {
			$('#vasak-vapid-status').val('No configurada').addClass('text-danger');
		});

	// Estado del Service Worker
	$('#vasak-sw-status-btn').on('click', function () {
		var $status = $('#vasak-sw-status');
		var $output = $('#vasak-sw-status-output');

		if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
			$output.text('Service Worker no registrado o no activo.');
			$status.removeClass('d-none');
			return;
		}

		var channel = new MessageChannel();
		channel.port1.onmessage = function (e) {
			if (e.data && e.data.caches) {
				var text = e.data.caches.map(function (c) {
					return c.name + ': ' + c.count + ' entradas';
				}).join('\n');
				$output.text(text);
				$status.removeClass('d-none');
			}
		};
		navigator.serviceWorker.controller.postMessage(
			{ type: 'GET_CACHE_STATUS' },
			[channel.port2]
		);
	});

	// Limpiar caché
	$('#vasak-sw-clear-btn').on('click', function () {
		if (!navigator.serviceWorker || !navigator.serviceWorker.controller) {
			alert('Service Worker no activo.');
			return;
		}
		if (!confirm('¿Limpiar todas las cachés del tema? La página se recargará.')) return;

		var channel = new MessageChannel();
		channel.port1.onmessage = function (e) {
			if (e.data && e.data.success) {
				alert('Caché limpiado correctamente.');
				location.reload();
			}
		};
		navigator.serviceWorker.controller.postMessage(
			{ type: 'CLEAR_CACHE' },
			[channel.port2]
		);
	});
});
</script>
