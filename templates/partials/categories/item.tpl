<li component="categories/category" data-cid="{./cid}"
    class="category-card w-100 py-3 py-lg-4 gap-lg-0 gap-2 d-flex flex-column flex-lg-row align-items-start category-{./cid} {./unread-class}">
    <meta itemprop="name" content="{./name}">

    <div class="d-flex col-lg-7 gap-2 gap-lg-3">
        <div class="flex-shrink-0">
            {buildCategoryIcon(@value, "48px", "rounded-1 category-icon-enhanced")}
        </div>
        <div class="flex-grow-1 d-flex flex-wrap gap-1 me-0 me-lg-2">
            <h2 class="title text-break fs-5 fw-semibold m-0 tracking-tight w-100">
                <!-- IMPORT partials/categories/link.tpl -->
            </h2>
            {{{ if ./descriptionParsed }}}
            <div class="description text-muted text-sm w-100">
                {./descriptionParsed}
            </div>
            {{{ end }}}

            <!-- Activity Badge Row -->
            <div class="category-activity-row d-flex align-items-center gap-2 w-100 mt-1">
                {{{ each ./posts }}}
                {{{ if @first }}}
                <span class="activity-badge" title="Last activity">
                    <i class="fa fa-clock-o"></i>
                    <span class="timeago" title="{./timestampISO}"></span>
                </span>
                {{{ end }}}
                {{{ end }}}
            </div>

            {{{ if !config.hideSubCategories }}}
            {{{ if ./children.length }}}
            <div class="subcategory-pills d-flex flex-wrap gap-2 mt-2 w-100">
                {{{ each ./children }}}
                {{{ if !./isSection }}}
                <a href="{{{ if ./link }}}{./link}{{{ else }}}{config.relative_path}/category/{./slug}{{{ end }}}"
                    class="subcategory-pill" style="--pill-color: {./bgColor};">
                    <span class="pill-icon" style="background-color: {./bgColor};">
                        <i class="{./icon}"></i>
                    </span>
                    <span class="pill-name">{./name}</span>
                </a>
                {{{ end }}}
                {{{ end }}}
            </div>
            {{{ end }}}
            {{{ end }}}
        </div>
    </div>
    {{{ if !./link }}}
    <div class="d-flex col-lg-5 col-12 align-content-stretch">
        <div
            class="meta stats-minimal d-none d-lg-flex col-4 gap-3 pe-3 text-muted align-items-center justify-content-end">
            <div class="stat-item text-center">
                <span class="stat-number" title="{./totalTopicCount}">{humanReadableNumber(./totalTopicCount, 0)}</span>
                <span class="stat-label">topics</span>
            </div>
            <div class="stat-item text-center">
                <span class="stat-number" title="{./totalPostCount}">{humanReadableNumber(./totalPostCount, 0)}</span>
                <span class="stat-label">posts</span>
            </div>
        </div>
        {{{ if !config.hideCategoryLastPost }}}
        <div component="topic/teaser"
            class="teaser col-lg-8 col-12 {{{ if !config.theme.mobileTopicTeasers }}}d-none d-lg-block{{{ end }}}">
            <!-- IMPORT partials/categories/lastpost.tpl -->
        </div>
        {{{ end }}}
    </div>
    {{{ end }}}
</li>