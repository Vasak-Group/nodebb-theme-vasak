<div class="acp-page-container">
	<!-- IMPORT admin/partials/settings/header.tpl -->

	<div class="row m-0">
		<div id="spy-container" class="col-12 col-md-8 px-0 mb-4" tabindex="0">
			<form role="form" class="vasak-settings">
				<div class="mb-4">
					<h5 class="fw-bold">Vasak Theme Settings</h5>
					<p class="text-muted">Configure the default settings for the Vasak Community theme.</p>
				</div>

				<div class="form-check form-switch mb-3">
					<input type="checkbox" class="form-check-input" id="enableQuickReply" name="enableQuickReply" />
					<label for="enableQuickReply" class="form-check-label">Enable Quick Reply</label>
					<p class="form-text">Allow users to quickly reply to topics without opening the full composer.</p>
				</div>

				<div class="form-check form-switch mb-3">
					<input type="checkbox" class="form-check-input" id="enableBreadcrumbs" name="enableBreadcrumbs" />
					<label for="enableBreadcrumbs" class="form-check-label">Enable Breadcrumbs</label>
					<p class="form-text">Show navigation breadcrumbs at the top of pages.</p>
				</div>

				<div class="form-check form-switch mb-3">
					<input type="checkbox" class="form-check-input" id="centerHeaderElements" name="centerHeaderElements" />
					<label for="centerHeaderElements" class="form-check-label">Center Header Elements</label>
					<p class="form-text">Center-align the header navigation elements.</p>
				</div>

				<div class="form-check form-switch mb-3">
					<input type="checkbox" class="form-check-input" id="mobileTopicTeasers" name="mobileTopicTeasers" />
					<label for="mobileTopicTeasers" class="form-check-label">Mobile Topic Teasers</label>
					<p class="form-text">Show topic teasers on mobile devices.</p>
				</div>

				<div class="form-check form-switch mb-3">
					<input type="checkbox" class="form-check-input" id="stickyToolbar" name="stickyToolbar" />
					<label for="stickyToolbar" class="form-check-label">Sticky Toolbar</label>
					<p class="form-text">Keep the topic toolbar visible when scrolling.</p>
				</div>

				<div class="form-check form-switch mb-3">
					<input type="checkbox" class="form-check-input" id="topicSidebarTools" name="topicSidebarTools" />
					<label for="topicSidebarTools" class="form-check-label">Topic Sidebar Tools</label>
					<p class="form-text">Show topic tools in the sidebar instead of inline.</p>
				</div>

				<div class="form-check form-switch mb-3">
					<input type="checkbox" class="form-check-input" id="autohideBottombar" name="autohideBottombar" />
					<label for="autohideBottombar" class="form-check-label">Auto-hide Bottom Bar</label>
					<p class="form-text">Automatically hide the bottom navigation bar when scrolling down.</p>
				</div>

				<div class="form-check form-switch mb-3">
					<input type="checkbox" class="form-check-input" id="topMobilebar" name="topMobilebar" />
					<label for="topMobilebar" class="form-check-label">Top Mobile Bar</label>
					<p class="form-text">Show mobile navigation at the top instead of bottom.</p>
				</div>

				<div class="form-check form-switch mb-3">
					<input type="checkbox" class="form-check-input" id="openSidebars" name="openSidebars" />
					<label for="openSidebars" class="form-check-label">Open Sidebars by Default</label>
					<p class="form-text">Keep sidebars expanded by default (Vasak default: enabled).</p>
				</div>

				<div class="form-check form-switch mb-3">
					<input type="checkbox" class="form-check-input" id="chatModals" name="chatModals" />
					<label for="chatModals" class="form-check-label">Chat Modals</label>
					<p class="form-text">Open chats in modal windows instead of navigating to the chat page.</p>
				</div>
			</form>
		</div>

		<!-- IMPORT admin/partials/settings/toc.tpl -->
	</div>
</div>