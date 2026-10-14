(function () {
  'use strict';

  document.querySelectorAll('.resource-return-link').forEach(function (link) {
    if (!document.referrer) return;
    var source;
    try { source = new URL(document.referrer); }
    catch (error) { return; }
    var current = new URL(window.location.href);
    if (source.origin !== current.origin ||
        (source.pathname === current.pathname && source.search === current.search)) return;

    var resources = new URL(link.href);
    var collections = {
      'blog.html': 'Resources',
      'technical-resources.html': 'Technical Resources',
      'peptide-news.html': 'Peptide News',
      'leading-peptide-researchers.html': 'Researcher Profiles',
      'top-posts.html': 'Top Posts'
    };
    var label = 'Back to previous page';
    Object.keys(collections).forEach(function (file) {
      if (source.pathname === new URL(file, resources).pathname) {
        label = 'Back to ' + collections[file];
      }
    });
    // A real link also works in a new tab and after following in-article anchors.
    // Retain the referring page's query so its filters and pagination are restored.
    link.href = source.href;
    link.querySelector('[data-resource-return-label]').textContent = label;
  });

  document.querySelectorAll('.site-resources-nav').forEach(function (navigation) {
    var toggle = navigation.querySelector('.site-resources-toggle');
    var menu = navigation.querySelector('.site-resources-menu');
    var links = menu.querySelectorAll('a');
    var desktopHover = window.matchMedia('(min-width: 992px) and (hover: hover)');
    function setOpen(open) {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    }
    toggle.addEventListener('click', function () { setOpen(menu.hidden); });
    navigation.addEventListener('pointerenter', function (event) {
      if (desktopHover.matches && event.pointerType === 'mouse') setOpen(true);
    });
    navigation.addEventListener('pointerleave', function () {
      if (desktopHover.matches && !navigation.contains(document.activeElement)) setOpen(false);
    });
    navigation.addEventListener('focusout', function (event) {
      if (!navigation.contains(event.relatedTarget)) setOpen(false);
    });
    navigation.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !menu.hidden) {
        setOpen(false);
        toggle.focus();
        event.preventDefault();
      } else if (event.key === 'ArrowDown' && event.target === toggle) {
        setOpen(true);
        links[0].focus();
        event.preventDefault();
      }
    });
    document.addEventListener('click', function (event) {
      if (!navigation.contains(event.target)) setOpen(false);
    });
  });
}());
