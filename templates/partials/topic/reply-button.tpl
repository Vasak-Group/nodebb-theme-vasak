<div component="topic/reply/container" class="btn-group {{{ if !privileges.topics:reply }}}hidden{{{ end }}}">
    <a href="{config.relative_path}/compose?tid={tid}"
        class="d-flex gap-2 align-items-center btn btn-sm btn-primary fw-semibold w-100 justify-content-center"
        component="topic/reply" data-ajaxify="false" role="button">
        <i class="fa fa-fw fa-reply"></i>
        <span>[[topic:reply]]</span>
    </a>
    <button type="button" class="btn btn-sm btn-primary dropdown-toggle flex-0" data-bs-toggle="dropdown"
        aria-haspopup="true" aria-expanded="false" aria-label="[[topic:reply-options]]">
        <span class="caret"></span>
    </button>
    <ul class="dropdown-menu dropdown-menu-end p-1 text-sm" role="menu">
        <li><a class="dropdown-item rounded-1" href="#" component="topic/reply-as-topic"
                role="menuitem">[[topic:reply-as-topic]]</a></li>
    </ul>
</div>

{{{ if loggedIn }}}
<a href="#" component="topic/reply/locked"
    class="d-flex gap-2 align-items-center fw-semibold btn btn-sm btn-primary disabled hidden w-100 justify-content-center {{{ if (privileges.topics:reply || !locked) }}}hidden{{{ end }}}"
    disabled><i class="fa fa-fw fa-lock"></i> [[topic:locked]]</a>
{{{ else }}}
{{{ if !privileges.topics:reply }}}
<a component="topic/reply/guest" href="{config.relative_path}/login"
    class="d-flex gap-2 align-items-center fw-semibold btn btn-sm btn-primary w-100 justify-content-center"><i
        class="fa fa-fw fa-sign-in"></i><span>[[topic:guest-login-reply]]</span></a>
{{{ end }}}
{{{ end }}}