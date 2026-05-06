{{{ if widgets.brand-header.length }}}
<div class="container-lg px-md-4 brand-container">
    <div
        class="col-12 d-flex border-bottom pb-3 {{{ if config.theme.centerHeaderElements }}}justify-content-center{{{ end }}}">
        <!-- Mobile Logo (only visible on mobile) -->
        <div class="vasak-mobile-header-logo d-none">
            <a href="{{{ if brand:logo:url }}}{brand:logo:url}{{{ else }}}{relative_path}/{{{ end }}}"
                class="vasak-mobile-logo-link"
                title="{{{ if config.siteTitle }}}{config.siteTitle}{{{ else }}}Vasak Community{{{ end }}}">
                {{{ if brand:logo }}}
                <img src="{brand:logo}?{config.cache-buster}"
                    alt="{{{ if brand:logo:alt }}}{brand:logo:alt}{{{ else }}}{config.siteTitle}{{{ end }}}"
                    class="vasak-mobile-logo-img"
                    loading="eager" />
                {{{ else }}}
                <img src="{relative_path}/plugins/nodebb-theme-vasak/static/images/logo-full.png"
                    alt="{{{ if config.siteTitle }}}{config.siteTitle}{{{ else }}}Vasak Community{{{ end }}}"
                    class="vasak-mobile-logo-img"
                    loading="eager" />
                {{{ end }}}
            </a>
        </div>

        <!-- Search widget area (left/center) -->
        <div data-widget-area="brand-header" class="flex-fill gap-3 p-2 align-self-center">
            {{{each widgets.brand-header}}}
            {{./html}}
            {{{end}}}
        </div>

        <!-- Right side: Notifications -->
        <div class="header-right-actions d-flex align-items-center gap-2 ms-auto">
            {{{ if config.loggedIn }}}
            <!-- Notifications dropdown (logged-in users) -->
            <div class="dropdown" component="notifications">
                <a data-bs-toggle="dropdown" href="#" role="button"
                    class="nav-link d-flex align-items-center position-relative p-2 rounded-circle" aria-haspopup="true"
                    aria-expanded="false" aria-label="[[global:header.notifications]]"
                    style="width: 40px; height: 40px; justify-content: center;">
                    <span class="position-relative">
                        <i component="notifications/icon"
                            class="fa fa-fw fa-lg {{{ if unreadCount.notification}}}fa-bell{{{ else }}}fa-bell-o{{{ end }}}"
                            style="color: #6b7280;"></i>
                        <span component="notifications/count"
                            class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger {{{ if !unreadCount.notification }}}hidden{{{ end }}}"
                            style="font-size: 10px; min-width: 18px;">{unreadCount.notification}</span>
                    </span>
                </a>
                <ul class="notifications-dropdown dropdown-menu dropdown-menu-end p-1 shadow" role="menu"
                    style="min-width: 320px;">
                    <li>
                        <div component="notifications/list"
                            class="list-container notification-list overscroll-behavior-contain pe-1 ff-base ghost-scrollbar"
                            style="max-height: 400px; overflow-y: auto;">
                            <div class="mb-2 p-1">
                                <div class="d-flex gap-1 justify-content-between">
                                    <div class="d-flex gap-2 flex-grow-1 placeholder-wave">
                                        <div class="placeholder rounded-circle" style="width: 32px; height: 32px;">
                                        </div>
                                        <div class="flex-grow-1">
                                            <div class="d-flex flex-column">
                                                <div class="text-sm">
                                                    <span class="placeholder placeholder-sm col-4"></span>
                                                    <span class="placeholder placeholder-sm col-6"></span>
                                                    <span class="placeholder placeholder-sm col-7"></span>
                                                </div>
                                                <div class="text-xs">
                                                    <div class="placeholder placeholder-xs col-6"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li class="dropdown-divider"></li>
                    <li>
                        <div class="d-flex justify-content-center gap-1 flex-wrap p-1">
                            <a role="button" href="#"
                                class="btn btn-sm btn-light mark-all-read flex-fill text-nowrap text-truncate"><i
                                    class="fa fa-check-double"></i> [[notifications:mark-all-read]]</a>
                            <a class="btn btn-sm btn-primary flex-fill text-nowrap text-truncate"
                                href="{relative_path}/notifications"><i class="fa fa-list"></i>
                                [[notifications:see-all]]</a>
                        </div>
                    </li>
                </ul>
            </div>
            {{{ else }}}
            <!-- Notification icon for guests (redirects to login) -->
            <a href="{relative_path}/login"
                class="nav-link d-flex align-items-center position-relative p-2 rounded-circle guest-notification-btn"
                aria-label="[[global:header.notifications]]" title="Sign in to view notifications"
                style="width: 40px; height: 40px; justify-content: center;">
                <i class="fa fa-fw fa-lg fa-bell-o" style="color: #6b7280;"></i>
            </a>
            {{{ end }}}
        </div>
    </div>
</div>
{{{ end }}}