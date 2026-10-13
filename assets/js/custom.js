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
