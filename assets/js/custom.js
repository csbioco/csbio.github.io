/* Share the existing Resources dropdown across the site's static headers. */
(function () {
  'use strict';

  var resourceCategory = document.getElementById('resource-category');
  if (resourceCategory) {
    resourceCategory.addEventListener('change', function () {
      window.location.assign(resourceCategory.value);
    });
    // Restore the current page's selection when returning with Back/Forward.
    window.addEventListener('pageshow', function () {
      Array.prototype.forEach.call(resourceCategory.options, function (option) {
        option.selected = option.defaultSelected;
      });
    });
  }

  var siteRoot = new URL('../../', document.currentScript.src);
  var destinations = [
    ['All Resources', 'blog.html'],
    ['Technical Resources', 'technical-resources.html'],
    ['Peptide News', 'peptide-news.html'],
    ['Leading Peptide Researchers', 'leading-peptide-researchers.html'],
    ['Top Posts', 'top-posts.html']
  ];
  var trigger = Array.prototype.find.call(document.querySelectorAll('#js-header a.nav-link'), function (link) {
    return link.textContent.trim() === 'Resources';
  });
  if (!trigger) return;

  var item = trigger.parentElement;
  if (item.querySelector('.hs-sub-menu')) return;
  item.classList.add('hs-has-sub-menu');
  trigger.id = 'nav-link--resources';
  trigger.href = new URL('blog.html', siteRoot).href;
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  trigger.setAttribute('aria-controls', 'nav-submenu--resources');

  var submenu = document.createElement('ul');
  submenu.id = 'nav-submenu--resources';
  submenu.className = 'hs-sub-menu list-unstyled u-shadow-v11 g-brd-top g-brd-primary g-brd-top-2 g-min-width-220 g-mt-18 g-mt-8--lg--scrolling';
  submenu.setAttribute('aria-labelledby', trigger.id);
  destinations.forEach(function (destination) {
    var row = document.createElement('li');
    row.className = 'dropdown-item';
    var link = document.createElement('a');
    link.className = 'nav-link';
    link.href = new URL(destination[1], siteRoot).href;
    link.textContent = destination[0];
    if (location.pathname.replace(/\.html$/, '') === new URL(link.href).pathname.replace(/\.html$/, '')) {
      link.setAttribute('aria-current', 'page');
    }
    row.appendChild(link);
    submenu.appendChild(row);
  });
  item.appendChild(submenu);

  // Let the existing menu plugin handle pointer/touch; add keyboard access.
  function menuInstance() {
    if (!window.jQuery) return null;
    var navigation = jQuery(trigger.closest('.js-mega-menu')).data('HSMegaMenu');
    if (!navigation) return null;
    if (!jQuery(item).data('HSMenuItem')) navigation.initMenuItem(jQuery(item), 'sub-menu');
    return { navigation: navigation, menu: jQuery(item).data('HSMenuItem') };
  }
  function closeMenu() {
    var instance = menuInstance();
    if (!instance) return;
    if (instance.navigation.getState() === 'mobile') instance.menu.mobileHide();
    else instance.menu.hide();
  }
  trigger.addEventListener('keydown', function (event) {
    if (event.key !== 'ArrowDown' && event.key !== ' ') return;
    var instance = menuInstance();
    if (!instance) return;
    event.preventDefault();
    instance.navigation.closeAll(jQuery(item));
    if (instance.navigation.getState() === 'mobile') instance.menu.mobileShow();
    else instance.menu.show();
    submenu.querySelector('a').focus();
  });
  item.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closeMenu();
    trigger.focus();
  });
  item.addEventListener('focusout', function () {
    setTimeout(function () {
      if (!item.contains(document.activeElement)) closeMenu();
    }, 0);
  });
  new MutationObserver(function () {
    trigger.setAttribute('aria-expanded', String(item.classList.contains('hs-sub-menu-opened')));
  }).observe(item, { attributes: true, attributeFilter: ['class'] });
}());
