(function () {
  'use strict';

  var siteRoot = new URL('../../', document.currentScript.src);
  function localPage(value) {
    if (!value) return null;
    try {
      var url = new URL(value, siteRoot);
      if (url.protocol === siteRoot.protocol && url.origin === siteRoot.origin &&
          url.pathname.indexOf(siteRoot.pathname) === 0) return url;
    } catch (error) { /* Keep the default link for invalid destinations. */ }
    return null;
  }

  document.querySelectorAll('.resource-return-link').forEach(function (link) {
    var current = new URL(window.location.href);
    var source = localPage(current.searchParams.get('returnTo')) || localPage(document.referrer);
    if (!source || (source.pathname === current.pathname && source.search === current.search)) return;
    var collections = {
      'blog.html': 'Resources',
      'technical-resources.html': 'Technical Resources',
      'peptide-news.html': 'Peptide News',
      'leading-peptide-researchers.html': 'Researcher Profiles',
      'top-posts.html': 'Top Posts'
    };
    var label = 'Back to previous page';
    Object.keys(collections).forEach(function (file) {
      if (source.pathname === new URL(file, siteRoot).pathname) {
        label = 'Back to ' + collections[file];
      }
    });
    link.href = source.href;
    link.querySelector('[data-resource-return-label]').textContent = label;
  });

  function rememberResourceSource(link) {
    if (!link || link.classList.contains('resource-return-link')) return;
    var target = localPage(link.href);
    var current = new URL(window.location.href);
    if (!target || target.pathname === current.pathname ||
        !/^(blog|monthly)\/[^/]+\.html$/.test(target.pathname.slice(siteRoot.pathname.length))) return;
    // Carry the exact source, including filters and anchors, even when referrers
    // are unavailable (such as local previews, privacy settings, or a new tab).
    target.searchParams.set('returnTo', current.pathname.slice(siteRoot.pathname.length) + current.search + current.hash);
    link.href = target.href;
  }
  function updateResourceLinks() {
    document.querySelectorAll('a[href]').forEach(rememberResourceSource);
  }
  updateResourceLinks();
  ['click', 'auxclick', 'contextmenu'].forEach(function (type) {
    document.addEventListener(type, function (event) {
      rememberResourceSource(event.target.closest('a[href]'));
    });
  });
  window.addEventListener('popstate', updateResourceLinks);
  window.addEventListener('hashchange', updateResourceLinks);
  window.addEventListener('pageshow', updateResourceLinks);

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
