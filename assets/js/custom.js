/* Resource collection selector and the site's Resources navigation link. */
(function () {
  'use strict';

  var resourceCategory = document.getElementById('resource-category');
  var resourceHeading = document.getElementById('resource-heading');
  var resourceArticles = document.getElementById('resource-articles');
  if (resourceCategory && resourceHeading && resourceArticles) {
    var pageCache = new Map();
    var requestNumber = 0;
    var scrollFrame = null;

    function pageContent(page) {
      var heading = page.getElementById('resource-heading');
      var articles = page.getElementById('resource-articles');
      var category = page.getElementById('resource-category');
      var schema = page.querySelector('script[type="application/ld+json"]');
      if (!heading || !articles || !category) throw new Error('Missing resource listing');
      return { heading: heading.textContent, articles: articles.innerHTML, category: category.value, title: page.title, schema: schema ? schema.textContent : '' };
    }

    function rememberScroll() {
      var state = Object.assign({}, history.state, { resourceScroll: [window.scrollX, window.scrollY] });
      history.replaceState(state, '', window.location.href);
    }

    pageCache.set(new URL(resourceCategory.value, window.location.href).href, pageContent(document));
    // Category changes replace only the listing, keeping the banner, dropdown,
    // focus, and scroll position in place. Static pages remain directly linkable.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    rememberScroll();
    window.addEventListener('scroll', function () {
      if (scrollFrame !== null) return;
      scrollFrame = requestAnimationFrame(function () {
        scrollFrame = null;
        rememberScroll();
      });
    }, { passive: true });

    async function showCollection(url, addHistory, savedScroll) {
      var currentRequest = ++requestNumber;
      resourceArticles.setAttribute('aria-busy', 'true');
      try {
        var content = pageCache.get(url.href);
        if (!content) {
          var response = await fetch(url.href);
          if (!response.ok) throw new Error('Unable to load resources');
          content = pageContent(new DOMParser().parseFromString(await response.text(), 'text/html'));
          pageCache.set(url.href, content);
        }
        if (currentRequest !== requestNumber) return;
        var scroll = addHistory ? [window.scrollX, window.scrollY] : savedScroll;
        if (addHistory) {
          rememberScroll();
          history.pushState({ resourceScroll: scroll }, '', url.href);
        }
        resourceHeading.textContent = content.heading;
        resourceArticles.innerHTML = content.articles;
        resourceCategory.value = content.category;
        document.title = content.title;
        var schema = document.querySelector('script[type="application/ld+json"]');
        if (schema && content.schema) schema.textContent = content.schema;
        window.scrollTo({ left: scroll[0], top: scroll[1], behavior: 'instant' });
      } catch (error) {
        if (currentRequest === requestNumber) window.location.assign(url.href);
      } finally {
        if (currentRequest === requestNumber) resourceArticles.removeAttribute('aria-busy');
      }
    }

    resourceCategory.addEventListener('change', function () {
      showCollection(new URL(resourceCategory.value, window.location.href), true);
    });
    window.addEventListener('popstate', function (event) {
      var scroll = event.state && event.state.resourceScroll || [window.scrollX, window.scrollY];
      showCollection(new URL(window.location.href), false, scroll);
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
