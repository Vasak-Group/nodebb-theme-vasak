<ul component="category" class="topics-list list-unstyled" itemscope itemtype="http://www.schema.org/ItemList" data-nextstart="{nextStart}" data-set="{set}">

	{{{ each topics }}}
	<li component="category/topic" class="topic-card {function.generateTopicClass}" <!-- IMPORT partials/data/category.tpl -->>
		<link itemprop="url" content="{config.relative_path}/topic/{./slug}" />
		<meta itemprop="name" content="{function.stripTags, ./title}" />
		<meta itemprop="itemListOrder" content="descending" />
		<meta itemprop="position" content="{increment(./index, "1")}" />
		<a id="{./index}" data-index="{./index}" component="topic/anchor"></a>

		<!-- Vote Column (Reddit-style) -->
		{{{ if !reputation:disabled }}}
		<div class="vote-column" data-pid="{./mainPid}">
			<a component="post/upvote" href="#" class="vote-btn vote-up{{{ if ./upvoted }}} upvoted{{{ end }}}" title="[[topic:upvote]]">
				<i class="fa fa-chevron-up"></i>
			</a>
			<span component="post/vote-count" class="vote-count" data-votes="{./votes}" title="{./votes}">{humanReadableNumber(./votes, 0)}</span>
			<a component="post/downvote" href="#" class="vote-btn vote-down{{{ if ./downvoted }}} downvoted{{{ end }}}" title="[[topic:downvote]]">
				<i class="fa fa-chevron-down"></i>
			</a>
		</div>
		{{{ end }}}

		<!-- Main Content -->
		<div class="topic-content">
			<!-- Meta Row: Category + Author + Time -->
			<div class="topic-meta">
				{{{ if (!template.category || (cid != ./cid)) }}}
				{buildCategoryLabel(./category, "a", "border")}
				{{{ end }}}
				<span class="meta-separator">•</span>
				<span class="meta-author">
					Posted by
					<a href="{{{ if ./user.userslug }}}{config.relative_path}/user/{./user.userslug}{{{ else }}}#{{{ end }}}" class="author-link">{./user.displayname}</a>
				</span>
				<span class="meta-separator">•</span>
				<span class="timeago meta-time" title="{./timestampISO}"></span>
			</div>

			<!-- Title -->
			<h3 component="topic/header" class="topic-title">
				<a href="{{{ if topics.noAnchor }}}#{{{ else }}}{config.relative_path}/topic/{./slug}{{{ if ./bookmark }}}/{./bookmark}{{{ end }}}{{{ end }}}">{./title}</a>
			</h3>

			<!-- Labels/Badges -->
			<div component="topic/labels" class="topic-labels">
				<span component="topic/pinned" class="topic-badge pinned {{{ if (./scheduled || !./pinned) }}}hidden{{{ end }}}">
					<i class="fa fa-thumb-tack"></i> Pinned
				</span>
				<span component="topic/locked" class="topic-badge locked {{{ if !./locked }}}hidden{{{ end }}}">
					<i class="fa fa-lock"></i> Locked
				</span>
				<span component="topic/scheduled" class="topic-badge scheduled {{{ if !./scheduled }}}hidden{{{ end }}}">
					<i class="fa fa-clock-o"></i> Scheduled
				</span>
				{{{each ./icons}}}<span class="topic-badge">{@value}</span>{{{end}}}
			</div>

			<!-- Tags -->
			{{{ if ./tags.length }}}
			<div data-tid="{./tid}" component="topic/tags" class="topic-tags">
				{{{ each ./tags }}}
				<a href="{config.relative_path}/tags/{./valueEncoded}" class="topic-tag">{./valueEscaped}</a>
				{{{ end }}}
			</div>
			{{{ end }}}

			<!-- Thumbnail Preview (if exists) -->
			{{{ if ./thumbs.length }}}
			<a class="topic-thumbnail" href="{config.relative_path}/topic/{./slug}{{{ if ./bookmark }}}/{./bookmark}{{{ end }}}">
				<img src="{./thumbs.0.url}" alt="" loading="lazy" />
				{{{ if ./thumbs.1 }}}
				<span class="thumb-count">+{subtract(./thumbs.length, 1)}</span>
				{{{ end }}}
			</a>
			{{{ end }}}

			<!-- Teaser/Preview Content -->
			{{{ if ./teaser.content }}}
			<div class="topic-teaser">
				{./teaser.content}
			</div>
			{{{ end }}}

			<!-- Action Bar -->
			<div class="topic-actions">
				<a href="{config.relative_path}/topic/{./slug}" class="action-btn">
					<i class="fa-regular fa-comment"></i>
					<span>{humanReadableNumber(./postcount, 0)} Comments</span>
				</a>
				<button class="action-btn share-btn" data-vasak-share="{config.relative_path}/topic/{./slug}" data-share-title="{./title}" aria-label="Share this topic">
					<i class="fa fa-share"></i>
					<span>Share</span>
				</button>
				<button class="action-btn save-btn">
					<i class="fa-regular fa-bookmark"></i>
					<span>Save</span>
				</button>
				<span class="action-stat">
					<i class="fa fa-eye"></i>
					<span>{humanReadableNumber(./viewcount, 0)}</span>
				</span>
			</div>
		</div>
	</li>
	{{{end}}}
</ul>