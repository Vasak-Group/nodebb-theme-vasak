<div id="topic-sidebar" class="topic-sidebar">
    <div class="d-flex flex-column gap-2">
        <div class="topic-sidebar-actions d-flex flex-column gap-2 mb-3">
            <!-- Reply Button -->
            <!-- IMPORT partials/topic/reply-button.tpl -->

            <!-- Mark Unread Button -->
            {{{ if config.loggedIn }}}
            <button component="topic/mark-unread"
                class="btn btn-ghost btn-sm d-flex gap-2 align-items-center w-100 justify-content-start">
                <i class="fa fa-fw fa-inbox"></i>
                <span class="fw-semibold text-nowrap">[[topic:mark-unread]]</span>
            </button>
            {{{ end }}}

            <!-- Watching/Not Watching -->
            <!-- IMPORT partials/topic/watch.tpl -->

            <!-- Sort Options -->
            <!-- IMPORT partials/topic/sort.tpl -->

            <!-- Topic Tools (for mods/admins) -->
            <!-- IMPORT partials/topic/tools.tpl -->
        </div>

        <!-- Post Navigator / Timeline -->
        <div class="pagination-block flex-grow-1">
            <div class="scroller-content d-flex gap-2 flex-column align-items-start">
                <button
                    class="btn btn-ghost btn-sm d-flex gap-2 align-items-center pagetop w-100 justify-content-start">
                    <i class="fa fa-fw fa-angle-up"></i>
                    <span class="timeago text-xs text-muted text-nowrap" title="{./timestampISO}"></span>
                </button>
                <div class="scroller-container position-relative w-100">
                    <div class="scroller-thumb d-flex gap-2 text-nowrap position-relative" style="height: 40px;">
                        <div class="scroller-thumb-icon rounded d-inline-block" style="width: 4px; height: 40px;"></div>
                        <div class="d-flex flex-column">
                            <span class="thumb-text small fw-semibold mb-0"></span>
                            <span class="thumb-timestamp timeago text-xs text-muted mb-0"></span>
                        </div>
                    </div>
                </div>
                <button
                    class="btn btn-ghost btn-sm d-flex gap-2 align-items-center pagebottom w-100 justify-content-start">
                    <i class="fa fa-fw fa-angle-down"></i>
                    <span class="timeago text-xs text-muted text-nowrap" title="{./lastposttimeISO}"></span>
                </button>
            </div>
        </div>
    </div>
</div>