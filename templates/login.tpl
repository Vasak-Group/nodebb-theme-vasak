<div data-widget-area="header">
	{{{each widgets.header}}}
	{{widgets.header.html}}
	{{{end}}}
</div>
<div class="row login flex-fill align-items-center justify-content-center" style="min-height: calc(100vh - 200px);">
	<div class="d-flex flex-column gap-2 {{{ if widgets.sidebar.length }}}col-lg-9 col-sm-12{{{ else }}}col-lg-12{{{ end }}}">
		<div class="row justify-content-center align-items-center">
			<!-- LinkedIn Primary Login (hidden when ?admin=true) -->
			{{{ if alternate_logins }}}
			<div class="col-12 col-md-6 col-lg-4 px-md-0 linkedin-section">
				<div class="linkedin-login-block d-flex flex-column align-items-center gap-4 py-5">
					<h2 class="tracking-tight fw-semibold text-center mb-2">Welcome to Vasak Community</h2>
					<p class="text-muted text-center mb-4">Sign in with your LinkedIn account to continue</p>

					<ul class="alt-logins list-unstyled w-100" style="max-width: 320px;">
						{{{ each authentication }}}
						<li class="{./name} mb-2">
							<a class="btn linkedin-sso-btn d-flex align-items-center justify-content-center gap-3 w-100 py-3" rel="nofollow noopener noreferrer" target="_top" href="{config.relative_path}{./url}">
								<i class="fa-brands fa-linkedin fa-lg"></i>
								<span class="fw-semibold">Sign in with LinkedIn</span>
							</a>
						</li>
						{{{ end }}}
					</ul>

					<p class="text-muted text-center text-sm mt-4">
						By signing in, you agree to our Terms of Service and Privacy Policy
					</p>
				</div>
			</div>
			{{{ end }}}

			<!-- Admin Login Form -->
			{{{ if allowLocalLogin }}}
			<div class="col-12 col-md-6 col-lg-4 px-md-0 admin-login-section">
				<div class="admin-login-block d-flex flex-column gap-3 py-5">
					<h2 class="tracking-tight fw-semibold text-center mb-2">Admin Login</h2>
					<p class="text-muted text-center mb-3">Sign in with your administrator credentials</p>
					<form class="d-flex flex-column gap-3" role="form" method="post" id="login-form">
						<div class="mb-2 d-flex flex-column gap-2">
							<label for="username">{allowLoginWith}</label>
							<input class="form-control" type="text" placeholder="{allowLoginWith}" name="username" id="username" autocorrect="off" autocapitalize="off" autocomplete="nickname" value="{username}" aria-required="true"/>
						</div>

						<div class="mb-2 d-flex flex-column gap-2">
							<label for="password">[[user:password]]</label>
							<div>
								<input class="form-control" type="password" placeholder="[[user:password]]" name="password" id="password" autocomplete="current-password" autocapitalize="off" aria-required="true"/>
								<p id="caps-lock-warning" class="text-danger hidden text-sm mb-0 form-text" aria-live="polite" role="alert" aria-atomic="true">
									<i class="fa fa-exclamation-triangle"></i> [[login:caps-lock-enabled]]
								</p>
							</div>
							{{{ if allowPasswordReset }}}
							<div>
								<a id="reset-link" class="text-sm text-reset text-decoration-underline" href="{config.relative_path}/reset">[[login:forgot-password]]</a>
							</div>
							{{{ end }}}
						</div>

						{{{ each loginFormEntry }}}
						<div class="mb-2 loginFormEntry d-flex flex-column gap-2 {./styleName}">
							<label for="{./inputId}">{./label}</label>
							<div>{{./html}}</div>
						</div>
						{{{ end }}}

						<input type="hidden" name="_csrf" value="{config.csrf_token}" />
						<input type="hidden" name="noscript" id="noscript" value="true" />

						<button class="btn btn-primary" id="login" type="submit">[[global:login]]</button>

						<div class="form-check mb-2">
							<input class="form-check-input" type="checkbox" name="remember" id="remember" checked />
							<label class="form-check-label" for="remember">[[login:remember-me]]</label>
						</div>

						<div class="alert alert-danger {{{ if !error }}} hidden{{{ end }}}" id="login-error-notify" role="alert" aria-atomic="true">
							<strong>[[login:failed-login-attempt]]</strong>
							<p class="mb-0">{error}</p>
						</div>
					</form>
				</div>
			</div>
			{{{ end }}}
		</div>
	</div>
	<div data-widget-area="sidebar" class="col-lg-3 col-sm-12 {{{ if !widgets.sidebar.length }}}hidden{{{ end }}}">
		{{{each widgets.sidebar}}}
		{{widgets.sidebar.html}}
		{{{end}}}
	</div>
</div>
<div data-widget-area="footer">
	{{{each widgets.footer}}}
	{{widgets.footer.html}}
	{{{end}}}
</div>

<script>
// Control visibility based on ?admin=true parameter
(function() {
	const urlParams = new URLSearchParams(window.location.search);
	const isAdminMode = urlParams.get('admin') === 'true';
	const adminSection = document.querySelector('.admin-login-section');
	const linkedinSection = document.querySelector('.linkedin-section');

	if (isAdminMode) {
		// Admin mode: show admin form, hide LinkedIn
		if (adminSection) {
			adminSection.style.display = 'block';
		}
		if (linkedinSection) {
			linkedinSection.style.display = 'none';
		}
	} else {
		// Normal mode: show LinkedIn (if exists), hide admin form
		if (linkedinSection) {
			linkedinSection.style.display = 'block';
			if (adminSection) {
				adminSection.style.display = 'none';
			}
		} else {
			// No LinkedIn configured - show admin form as fallback
			if (adminSection) {
				adminSection.style.display = 'block';
			}
		}
	}
})();
</script>