/* Resource collection selector and the site's Resources navigation link. */
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
  var trigger = Array.prototype.find.call(document.querySelectorAll('#js-header a.nav-link'), function (link) {
    return link.textContent.trim() === 'Resources';
  });
  if (!trigger) return;

  trigger.id = 'nav-link--resources';
  trigger.href = new URL('blog.html', siteRoot).href;
  ['aria-haspopup', 'aria-expanded', 'aria-controls'].forEach(function (attribute) {
    trigger.removeAttribute(attribute);
  });
}());
