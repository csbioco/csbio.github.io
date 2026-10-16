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
    link.href = source.href;
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
    var $menu = window.jQuery(menu);
    var mobile = window.matchMedia('(max-width: 991px)');
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var desktopHover = window.matchMedia('(min-width: 992px) and (hover: hover)');
    var isOpen = !menu.hidden;
    function finishSlide(open) {
      menu.hidden = !open;
      // Let the stylesheet size the menu again after an interrupted animation.
      $menu.css({ display: '', height: '', paddingTop: '', paddingBottom: '', marginTop: '', marginBottom: '', overflow: '' });
    }
    function setOpen(open, immediate) {
      if (open === isOpen && !immediate) return;
      isOpen = open;
      toggle.setAttribute('aria-expanded', String(open));
      if (immediate || !mobile.matches || reducedMotion.matches) {
        $menu.stop(true, true);
        finishSlide(open);
        return;
      }
      // Match the other mobile dropdowns, including reversals during a slide.
      $menu.stop(true);
      if (menu.hidden) $menu.hide();
      menu.hidden = false;
      $menu[open ? 'slideDown' : 'slideUp']({
        duration: 400,
        easing: 'linear',
        complete: function () { finishSlide(open); }
      });
    }
    toggle.addEventListener('click', function () { setOpen(!isOpen); });
    navigation.querySelector(':scope > .nav-link').addEventListener('click', function (event) {
      if (!mobile.matches) return;
      event.preventDefault();
      setOpen(!isOpen);
    });
    mobile.addEventListener('change', function () { setOpen(isOpen, true); });
    reducedMotion.addEventListener('change', function () { setOpen(isOpen, true); });
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
      if (event.key === 'Escape' && isOpen) {
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
