<div class="lastpost teaser-enhanced lh-sm h-100" style="--teaser-color: {./bgColor};">
    {{{ each ./posts }}}
    {{{ if @first }}}
    <div component="category/posts" class="d-flex flex-column h-100 gap-2">
        <div class="teaser-header d-flex align-items-center gap-2">
            <a class="text-decoration-none avatar-tooltip" title="{./user.displayname}"
                href="{config.relative_path}/user/{./user.userslug}">{buildAvatar(posts.user, "24px", true)}</a>
            <div class="teaser-meta">
                <span class="teaser-user">{./user.displayname}</span>
                <a class="permalink timeago teaser-time"
                    href="{config.relative_path}/topic/{./topic.slug}{{{ if ./index }}}/{./index}{{{ end }}}"
                    title="{./timestampISO}" aria-label="[[global:lastpost]]"></a>
            </div>
        </div>
        <div class="teaser-content-wrapper position-relative flex-fill">
            <div class="teaser-content text-break line-clamp-2">
                {./content}
            </div>
            <a class="teaser-read-more"
                href="{config.relative_path}/topic/{./topic.slug}{{{ if ./index }}}/{./index}{{{ end }}}">Read more
                →</a>
        </div>
    </div>
    {{{ end }}}
    {{{ end }}}

    {{{ if !./posts.length }}}
    <div component="category/posts" class="ps-2 empty-category-state">
        <div class="d-flex flex-column align-items-start gap-1">
            <span class="empty-icon"><i class="fa fa-inbox"></i></span>
            <span class="empty-text">Be the first to post</span>
        </div>
    </div>
    {{{ end }}}
</div>