<div data-widget-area="header">
	{{{each widgets.header}}}
	{{widgets.header.html}}
	{{{end}}}
</div>
<style>.feed .post-body .content > p:last-child { margin-bottom: 0px; }</style>
<div class="feed">
	<div class="row">
		<div data-widget-area="left" class="col-lg-3 col-sm-12 {{{ if !widgets.left.length }}}hidden{{{ end }}}">
			{{{each widgets.left}}}
			{{widgets.left.html}}
			{{{end}}}
		</div>
		{{{ if ((widgets.left.length && widgets.right.length) || (!widgets.left.length && !widgets.right.length))}}}
		<div class="col-lg-6 col-sm-12 mx-auto">
		{{{ end }}}
		{{{ if (widgets.left.length && !widgets.right.length) }}}
		<div class="col-lg-6 col-sm-12 me-auto">
		{{{ end }}}
		{{{ if (!widgets.left.length && widgets.right.length) }}}
		<div class="col-lg-6 col-sm-12 ms-auto">
		{{{ end }}}

			<!-- For You / Following tabs + filter -->
			<div class="d-flex justify-content-between align-items-center py-2 mb-0 gap-1">
				{{{ if loggedIn }}}
				<div class="d-flex gap-1">
					<a href="{config.relative_path}/feed" class="btn btn-ghost btn-sm ff-secondary fw-semibold {{{ if !showFollowed }}}active{{{ end }}}">For You</a>
					<a href="{config.relative_path}/feed?users=followed" class="btn btn-ghost btn-sm ff-secondary fw-semibold {{{ if showFollowed }}}active{{{ end }}}">Following</a>
				</div>
				{{{ end }}}
				<div class="d-flex align-items-center gap-1 ms-auto">
					<!-- IMPORT partials/category/filter-dropdown-right.tpl -->
					{{{ if canPost }}}
					<button id="new_topic" class="btn btn-primary btn-sm d-none">[[category:new-topic-button]]</button>
					{{{ end }}}
				</div>
			</div>

			{{{ if !posts.length }}}
			{{{ if showFollowed }}}
			<div class="alert alert-info text-center mb-3">Follow new members to see their posts here.</div>
			<div class="vasak-suggested-users">
				<p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.6px;color:#6b7280;margin:0 0 4px;">People you should follow</p>
				<div id="vasak-suggested-users-list">
					<div class="text-center text-muted py-4"><i class="fa fa-spinner fa-spin me-2"></i></div>
				</div>
			</div>
			{{{ else }}}
			<div class="alert alert-warning text-center">[[feed:no-posts-found]]</div>
			{{{ end }}}
			{{{ end }}}

			<ul component="posts" class="list-unstyled" data-nextstart="{nextStart}">
				{{{ each posts }}}
				<li component="post" class="shadow-sm mb-3 rounded-2 border posts-list-item  {{{ if ./deleted }}} deleted{{{ else }}}{{{ if ./topic.deleted }}} deleted{{{ end }}}{{{ end }}}{{{ if ./topic.scheduled }}} scheduled{{{ end }}}" data-pid="{./pid}" data-uid="{./uid}">

					<!-- 1. CONTENT (first) -->
					<div class="p-3 feed-content-section">
						<div class="post-body d-flex flex-column gap-2 flex-grow-1" style="min-width: 0px;">
							<!-- Topic title (first) -->
							{{{ if ./isMainPost }}}
							<a class="lh-1 topic-title fw-semibold fs-5 text-reset text-break d-block" href="{config.relative_path}/topic/{./topic.slug}">
							{./topic.title}
							</a>
							{{{ end }}}

							<!-- Author info row (second) -->
							<div class="d-flex gap-2 post-info text-sm align-items-center">
								<a class="lh-1 text-decoration-none" href="{config.relative_path}/user/{./user.userslug}">{buildAvatar(./user, "24px", true, "not-responsive")}</a>
								<a class="lh-normal fw-semibold text-nowrap" href="{config.relative_path}/user/{./user.userslug}">{./user.displayname}</a>
								{{{ if !./isMainPost}}}{./repliedString}{{{ else }}}<span class="timeago text-muted lh-normal" title="{./timestampISO}"></span>{{{ end}}}
							</div>

							<!-- Post content text (third) -->
							<div component="post/content" class="content text-sm text-break position-relative truncate-post-content">
								<a href="{config.relative_path}/post/{./pid}" class="stretched-link"></a>
								{./content}
							</div>
							<div class="position-relative hover-visible">
								<button component="show/more" class="btn btn-light btn-sm rounded-pill position-absolute start-50 translate-middle-x bottom-0 z-1 hidden ff-secondary">[[feed:see-more]]</button>
							</div>
						</div>
					</div>

					<!-- 2. IMAGE (second) -->
					{{{ if (showThumbs && ./topic.thumbs.length)}}}
					<div class="p-1 position-relative feed-image-section">
						<div class="overflow-hidden rounded-1" style="max-height: 300px;">
							<a href="{config.relative_path}/topic/{./topic.slug}">
								<img class="w-100" src="{./topic.thumbs.0.url}">
							</a>
						</div>

						<div class="position-absolute end-0 bottom-0 p-3 d-flex gap-2 align-items-center pe-none">
							{{{ each ./topic.thumbs }}}
							{{{ if (@index != 0) }}}
							<img class="rounded-1" style="max-height: 64px; object-fit: contain;" src="{./url}">
							{{{ end }}}
							{{{ end }}}
						</div>
					</div>
					{{{ end }}}

					<!-- 3. ACTION BAR (third - separated from content) -->
					<!-- Order: Likes, Comments, Share -->
					<div class="feed-action-bar d-flex justify-content-between px-3 py-2 border-top">
						<a href="#" data-pid="{./pid}" data-action="upvote" data-upvoted="{./upvoted}" data-upvotes="{./upvotes}" class="btn btn-link btn-sm text-body"><i class="fa-fw fa-heart {{{ if ./upvoted }}}fa text-danger{{{ else }}}fa-regular text-muted{{{ end }}}"></i> <span component="upvote-count">{humanReadableNumber(./upvotes)}</span></a>

						<a href="{config.relative_path}/post/{{{ if ./topic.teaserPid }}}{./topic.teaserPid}{{{ else }}}{./pid}{{{ end }}}" class="btn btn-link btn-sm text-body {{{ if !./isMainPost }}}invisible{{{ end }}}"><i class="fa-fw fa-regular fa-message text-muted"></i> {humanReadableNumber(./topic.postcount)}</a>

						<a href="#" data-pid="{./pid}" component="share/linkedin" class="btn btn-link btn-sm text-body"><i class="fa-fw fa-brands fa-linkedin text-muted"></i> [[topic:share]]</a>
					</div>
				</li>
				{{{ end }}}
			</ul>
		</div>

		<div data-widget-area="right" class="col-lg-3 col-sm-12 {{{ if !widgets.right.length }}}hidden{{{ end }}}">
			{{{each widgets.right}}}
			{{widgets.right.html}}
			{{{end}}}
		</div>
	</div>
</div>

<div data-widget-area="footer">
	{{{each widgets.footer}}}
	{{widgets.footer.html}}
	{{{end}}}
</div>

<script>
$(document).ready(function() {
	require(['share'], function(share) {
		share.addShareHandlers('{title}');
	});

});
</script>

<script>
// Suggested users – standalone, same pattern as video embed
(function() {
	function loadSuggestedUsers() {
		var $list = $('#vasak-suggested-users-list');
		if (!$list.length) return;

		fetch((config.relative_path || '') + '/api/users?section=top', {
			credentials: 'same-origin',
			headers: { 'Accept': 'application/json' }
		})
		.then(function(r) { return r.json(); })
		.then(function(data) {
			var users = (data.users || []).filter(function(u) {
				return u.uid && String(u.uid) !== String(config.uid);
			}).slice(0, 6);

			if (!users.length) {
				$list.html('<p class="text-muted text-center py-2 mb-0">No members to suggest yet.</p>');
				return;
			}

			$list.html(users.map(function(u, i) {
				var bg = u['icon:bgColor'] || '#0051ff';
				var icon = u['icon:text'] || (u.displayname || 'U')[0].toUpperCase();
				var isLast = i === users.length - 1;
				var avatarHtml = u.picture
					? '<img src="' + u.picture + '" style="width:40px;height:40px;min-width:40px;border-radius:50%;object-fit:cover;display:block;" data-bg="' + bg + '" data-icon="' + icon + '" class="vasak-sug-avatar-img">'
					: '<span style="width:40px;height:40px;min-width:40px;border-radius:50%;background:' + bg + ';color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:15px;font-weight:700;font-family:system-ui,sans-serif;flex-shrink:0;">' + icon + '</span>';
				return '<div style="display:flex;align-items:center;gap:12px;padding:10px 0;' + (isLast ? '' : 'border-bottom:1px solid rgba(0,0,0,0.07);') + '">' +
					'<a href="' + (config.relative_path || '') + '/user/' + u.userslug + '" style="flex-shrink:0;display:inline-flex;line-height:0;">' + avatarHtml + '</a>' +
					'<div style="flex:1;min-width:0;">' +
						'<a href="' + (config.relative_path || '') + '/user/' + u.userslug + '" style="font-size:13px;font-weight:600;color:#111;text-decoration:none;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (u.displayname || u.username) + '</a>' +
						'<span style="font-size:12px;color:#9ca3af;">' + (u.postcount || 0) + ' posts</span>' +
					'</div>' +
					'<button class="btn btn-sm rounded-pill vasak-follow-btn" style="flex-shrink:0;font-size:12px;font-weight:600;padding:4px 14px;border:1.5px solid #0051ff;color:#0051ff;background:transparent;white-space:nowrap;" data-userslug="' + u.userslug + '">Follow</button>' +
				'</div>';
			}).join(''));

			$list.find('img.vasak-sug-avatar-img').on('error', function() {
				var $img = $(this);
				$img.replaceWith('<span class="vasak-sug-avatar vasak-sug-avatar-icon" style="background:' + ($img.data('bg') || '#0051ff') + '">' + ($img.data('icon') || 'U') + '</span>');
			});
		})
		.catch(function() {
			$list.closest('.vasak-suggested-users').remove();
		});
	}

	// Initial load
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() { setTimeout(loadSuggestedUsers, 100); });
	} else {
		setTimeout(loadSuggestedUsers, 100);
	}

	// SPA navigation
	$(window).on('action:ajaxify.end', function() {
		setTimeout(loadSuggestedUsers, 100);
	});

	// Follow button
	$(document).on('click', '.vasak-follow-btn', function() {
		var $btn = $(this);
		var userslug = $btn.data('userslug');
		$btn.prop('disabled', true).text('...');
		fetch((config.relative_path || '') + '/api/v3/users/' + userslug + '/follow', {
			method: 'PUT',
			credentials: 'same-origin',
			headers: { 'Content-Type': 'application/json', 'x-csrf-token': config.csrf_token },
			body: JSON.stringify({})
		}).then(function(r) {
			if (r.ok) {
				$btn.text('Following').css({'background':'#0051ff','color':'#fff','border-color':'#0051ff'}).prop('disabled',true);
			} else { throw new Error(); }
		}).catch(function() {
			$btn.prop('disabled', false).text('Follow');
		});
	});
})();
</script>

<script>
// Embed videos on feed page - runs independently
(function() {
	function embedFeedVideos() {
		// Find all MP4 links in feed posts
		var $links = $('a[href*=".mp4"]').not('.stretched-link');

		$links.each(function() {
			var $link = $(this);

			// Avoid double-processing
			if ($link.data('vasakVideoEmbedded')) {
				return;
			}

			var href = $link.attr('href');
			if (!href || href.indexOf('.mp4') === -1) return;

			// Normalise relative URLs
			var src = href;
			if (href.indexOf('http') !== 0) {
				src = window.location.origin + href;
			}

			// Find the parent post content div and feed-content-section
			var $contentDiv = $link.closest('[component="post/content"]');
			var $feedContentSection = $link.closest('.feed-content-section');

			// Remove the stretched-link overlay so video controls work
			if ($contentDiv.length) {
				$contentDiv.find('.stretched-link').remove();
				$contentDiv.removeClass('position-relative');
			}

			// Create the inline video player
			var $video = $('<video />', {
				src: src,
				controls: true,
				preload: 'metadata',
				class: 'vasak-feed-video'
			}).css({
				width: '100%',
				maxWidth: '100%',
				borderRadius: '8px',
				backgroundColor: '#000'
			});

			// Wrap video in a container
			var $videoContainer = $('<div class="feed-video-section px-3 pb-3"></div>').append($video);

			// Insert video container after the feed-content-section (outside of it)
			if ($feedContentSection.length) {
				$feedContentSection.after($videoContainer);
			}

			// Hide the link/paragraph containing the MP4 link
			var $parent = $link.closest('p');
			if ($parent.length) {
				$parent.hide();
			} else {
				$link.hide();
			}

			$link.data('vasakVideoEmbedded', true);
		});
	}

	// Run when DOM is ready
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', function() {
			setTimeout(embedFeedVideos, 200);
		});
	} else {
		setTimeout(embedFeedVideos, 200);
	}

	// Also run on ajaxify (SPA navigation)
	$(window).on('action:ajaxify.end', function() {
		setTimeout(embedFeedVideos, 200);
	});

	// Run when new posts are loaded (infinite scroll)
	$(window).on('action:posts.loaded', function() {
		setTimeout(embedFeedVideos, 200);
	});
})();
</script>