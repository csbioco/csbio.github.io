(function () {
  'use strict';

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

(function () {
  'use strict';

  var backLink = document.querySelector('[data-resource-back]');
  if (!backLink) return;

  // Direct visits (including search engines) retain the static All Resources link.
  var source;
  try {
    source = new URL(document.referrer);
  } catch (error) {
    return;
  }
  if (source.origin !== window.location.origin || source.pathname === window.location.pathname) return;

  backLink.href = source.href;
  backLink.querySelector('.resource-back-label').textContent = 'Back';
  var collections = {
    'blog.html': 'All Resources',
    'technical-resources.html': 'Technical Resources',
    'peptide-news.html': 'Peptide News',
    'leading-peptide-researchers.html': 'Researcher Profiles',
    'top-posts.html': 'Top Posts'
  };
  var collection = collections[source.pathname.split('/').pop()];
  backLink.setAttribute('aria-label', collection ? 'Back to ' + collection : 'Back to the previous page');

  // Fragment navigation adds history entries inside an article. In that case,
  // use the referring URL so Back still leaves the article in one click.
  var hasFragmentNavigation = Boolean(window.location.hash);
  window.addEventListener('hashchange', function () { hasFragmentNavigation = true; });
  backLink.addEventListener('click', function (event) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (backLink.target === '_blank' || window.history.length <= 1 || hasFragmentNavigation) return;
    // Native Back restores the referring page's filters, pagination, and scroll.
    event.preventDefault();
    window.history.back();
  });
}());
