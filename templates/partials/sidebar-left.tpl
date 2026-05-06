<nav component="sidebar/left"
    class="{{{ if config.theme.openSidebars}}}open{{{ end }}} text-dark bg-light sidebar sidebar-left start-0 border-end vh-100 d-none d-lg-flex flex-column justify-content-between sticky-top">
    <!-- Vasak Logo Section -->
    <div class="vasak-sidebar-logo">
        <a href="{{{ if brand:logo:url }}}{brand:logo:url}{{{ else }}}{relative_path}/{{{ end }}}"
            class="vasak-logo-link"
            title="{{{ if config.siteTitle }}}{config.siteTitle}{{{ else }}}Vasak Community{{{ end }}}">

            {{{ if brand:logo }}}
            <!-- Logo configurado en el ACP (collapsed: recortado como ícono, expanded: completo) -->
            <img src="{brand:logo}?{config.cache-buster}"
                alt="{{{ if brand:logo:alt }}}{brand:logo:alt}{{{ else }}}{config.siteTitle}{{{ end }}}"
                class="vasak-logo-icon visible-closed"
                loading="eager"
                decoding="async" />
            <img src="{brand:logo}?{config.cache-buster}"
                alt="{{{ if brand:logo:alt }}}{brand:logo:alt}{{{ else }}}{config.siteTitle}{{{ end }}}"
                class="vasak-logo-full visible-open"
                style="height:44px;width:auto;"
                loading="eager"
                decoding="async" />
            {{{ else }}}
            <!-- Fallback: imágenes del tema si no hay logo configurado en el ACP -->
            <img src="{relative_path}/plugins/nodebb-theme-vasak/static/images/logo-icon.png"
                alt="{{{ if config.siteTitle }}}{config.siteTitle}{{{ else }}}Vasak{{{ end }}}"
                class="vasak-logo-icon visible-closed"
                loading="eager"
                decoding="async" />
            <img src="{relative_path}/plugins/nodebb-theme-vasak/static/images/logo-full.png"
                alt="{{{ if config.siteTitle }}}{config.siteTitle}{{{ else }}}Vasak Community{{{ end }}}"
                class="vasak-logo-full visible-open"
                style="height:44px;width:auto;"
                loading="eager"
                decoding="async" />
            {{{ end }}}

        </a>
    </div>

    <ul id="main-nav" class="list-unstyled d-flex flex-column w-100 overflow-y-auto">
        {{{ each navigation }}}
        {{{ if displayMenuItem(@root, @index) }}}
        <li class="nav-item mx-2 {./class}{{{ if ./dropdown }}} dropend{{{ end }}}" title="{./title}">
            <a class="nav-link navigation-link d-flex gap-2 justify-content-between align-items-center {{{ if ./dropdown }}}dropdown-toggle{{{ end }}}"
                {{{ if ./dropdown }}} href="#" role="button" data-bs-toggle="dropdown" aria-haspopup="true"
                aria-expanded="false" {{{ else }}} href="{./route}" {{{ end }}} {{{ if ./id }}}id="{./id}"
                {{{ end }}}{{{ if ./targetBlank }}} target="_blank" {{{ end }}} {{{ if ./text }}}aria-label="{./text}"
                {{{ end }}}>
                <span class="d-flex gap-2 align-items-center text-nowrap truncate-open">
                    <span class="position-relative">
                        {{{ if ./iconClass }}}
                        <i class="fa fa-fw {./iconClass}" data-content="{./content}"></i>
                        <span component="navigation/count"
                            class="visible-closed position-absolute top-0 start-100 translate-middle badge rounded-1 bg-primary {{{ if !./content }}}hidden{{{ end }}}">{./content}</span>
                        {{{ end }}}
                    </span>
                    {{{ if ./text }}}<span
                        class="nav-text small visible-open fw-semibold text-truncate">{./text}</span>{{{ end }}}
                </span>
                <span component="navigation/count"
                    class="visible-open badge rounded-1 bg-primary {{{ if !./content }}}hidden{{{ end }}}">{./content}</span>
            </a>
            {{{ if ./dropdown }}}
            <ul class="dropdown-menu p-1 shadow" role="menu">
                {./dropdownContent}
            </ul>
            {{{ end }}}
        </li>
        {{{ end }}}
        {{{ end }}}
    </ul>
    <div class="sidebar-toggle-container align-self-start">
        <!-- User Profile Section (only for logged-in users) -->
        {{{ if config.loggedIn }}}
        <div class="sidebar-user-section mx-2 mb-2">
            <div class="nav-item dropup usermenu">
                <a component="header/avatar" id="sidebar_user_dropdown" href="#" role="button"
                    class="nav-link d-flex gap-2 align-items-center text-truncate sidebar-user-trigger"
                    data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"
                    aria-label="[[user:user-menu]]">
                    <span class="sidebar-avatar-wrapper position-relative">
                        {buildAvatar(user, "32px", true)}
                        <span component="user/status"
                            class="sidebar-status-dot position-absolute border border-white border-2 rounded-circle status {user.status}"></span>
                    </span>
                    <span class="nav-text visible-open fw-semibold text-truncate">{user.username}</span>
                </a>
                <!-- IMPORT partials/sidebar/user-menu-dropdown.tpl -->
            </div>
        </div>
        {{{ else }}}
        <!-- Login/Register for logged-out users -->
        <div class="sidebar-auth-section mx-2 mb-2">
            <div class="nav-item">
                <a class="nav-link d-flex gap-2 align-items-center" href="{relative_path}/login">
                    <i class="fa fa-fw fa-sign-in"></i>
                    <span class="nav-text small visible-open fw-semibold">[[global:login]]</span>
                </a>
            </div>
            {{{ if config.allowRegistration }}}
            <div class="nav-item mt-1">
                <a class="nav-link d-flex gap-2 align-items-center" href="{relative_path}/register">
                    <i class="fa fa-fw fa-user-plus"></i>
                    <span class="nav-text small visible-open fw-semibold">[[global:register]]</span>
                </a>
            </div>
            {{{ end }}}
        </div>
        {{{ end }}}

        {{{ if !config.disableCustomUserSkins }}}
        <!-- IMPORT partials/skin-switcher.tpl -->
        {{{ end }}}

        <div class="dark-mode-toggle m-2">
            <button id="vasak-dark-toggle"
                class="nav-link d-flex gap-2 align-items-center p-2 pointer w-100 text-nowrap btn btn-ghost"
                title="Toggle dark mode" aria-label="Toggle dark mode">
                <i class="fa fa-fw fa-moon toggle-icon-moon"></i>
                <i class="fa fa-fw fa-sun toggle-icon-sun"></i>
                <span class="nav-text visible-open fw-semibold small lh-1">Dark mode</span>
            </button>
        </div>

        <div class="sidebar-toggle m-2 d-none d-lg-block">
            <a href="#" role="button" component="sidebar/toggle"
                class="nav-link d-flex gap-2 align-items-center p-2 pointer w-100 text-nowrap"
                title="[[themes/harmony:expand]]" aria-label="[[themes/harmony:sidebar-toggle]]">
                <i class="fa fa-fw fa-angles-right"></i>
                <i class="fa fa-fw fa-angles-left"></i>
                <span class="nav-text visible-open fw-semibold small lh-1">[[themes/harmony:collapse]]</span>
            </a>
        </div>
    </div>
</nav>