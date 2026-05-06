<!-- IMPORT partials/account/header.tpl -->

<div class="d-flex justify-content-between align-items-center mb-3">
    <div class="d-flex gap-1">
        <h3 class="fw-semibold fs-5 mb-0">{title}</h3>
    </div>

    <div class="d-flex gap-1">
        <div class="btn-group bottom-sheet" component="category/watch/all">
            <button class="btn btn-ghost btn-sm ff-secondary fw-semibold dropdown-toggle" data-bs-toggle="dropdown"
                aria-haspopup="true" aria-expanded="false" type="button">
                <span>[[user:change-all]]</span>
            </button>
            <ul class="dropdown-menu p-1 text-sm dropdown-menu-end" role="menu">
                <li>
                    <a class="dropdown-item rounded-1 d-flex align-items-center gap-2 p-2" href="#"
                        component="category/watching" data-state="watching" role="menuitem">
                        <i class="flex-shrink-0 fa fa-fw fa-bell text-secondary"></i>
                        <span class="fw-semibold">[[category:watching]]</span>
                    </a>
                </li>
                <li>
                    <a class="dropdown-item rounded-1 d-flex align-items-center gap-2 p-2" href="#"
                        component="category/tracking" data-state="tracking" role="menuitem">
                        <i class="flex-shrink-0 fa fa-fw fa-bell-o text-secondary"></i>
                        <span class="fw-semibold">[[category:not-watching]]</span>
                    </a>
                </li>
            </ul>
        </div>
    </div>
</div>

<div>
    <ul class="categories list-unstyled" itemscope itemtype="http://www.schema.org/ItemList">
        {{{each categories}}}
        <!-- IMPORT partials/account/category-item.tpl -->
        {{{end}}}
    </ul>
    <!-- IMPORT partials/paginator.tpl -->
</div>

<!-- IMPORT partials/account/footer.tpl -->