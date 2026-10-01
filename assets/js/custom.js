/* Resource collection selector and the site's Resources navigation link. */
(function () {
  'use strict';

  var resourceCategory = document.getElementById('resource-category');
  var resourceHeading = document.getElementById('resource-heading');
  var resourceArticles = document.getElementById('resource-articles');
  if (resourceCategory && resourceHeading && resourceArticles) {
    var pagination = document.getElementById('resource-pagination');
    var pageStatus = document.getElementById('resource-page-status');
    var configuredPageSize = Number(resourceArticles.getAttribute('data-page-size'));
    var pageSize = Number.isInteger(configuredPageSize) && configuredPageSize > 0 ? configuredPageSize : 10;
    var pageCache = new Map();
    var requestNumber = 0;
    var scrollFrame = null;

    function pageContent(page) {
      var heading = page.getElementById('resource-heading');
      var articles = page.getElementById('resource-articles');
      var category = page.getElementById('resource-category');
      var schema = page.querySelector('script[type="application/ld+json"]');
      if (!heading || !articles || !category) throw new Error('Missing resource listing');
      return { heading: heading.textContent, articles: Array.prototype.map.call(articles.querySelectorAll('article[data-resource-category]'), function (article) { return article.outerHTML; }), category: category.value, title: page.title, schema: schema ? schema.textContent : '' };
    }

    function collectionURL(url) {
      var collection = new URL(url.href);
      collection.searchParams.delete('page');
      collection.hash = '';
      return collection;
    }

    function pageURL(url, page) {
      var destination = new URL(url.href);
      if (page > 1) destination.searchParams.set('page', String(page));
      else destination.searchParams.delete('page');
      return destination;
    }

    function renderListing(content, url) {
      var pageCount = Math.max(1, Math.ceil(content.articles.length / pageSize));
      var requestedPage = Number(url.searchParams.get('page') || 1);
      var currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, pageCount) : 1;
      var start = (currentPage - 1) * pageSize;
      var end = Math.min(start + pageSize, content.articles.length);
      resourceArticles.innerHTML = content.articles.slice(start, end).join('\n');
      if (pageStatus) pageStatus.textContent = 'Page ' + currentPage + ' of ' + pageCount + '. Showing ' + (start + 1) + '–' + end + ' of ' + content.articles.length + ' resources.';

      if (pagination) {
        pagination.replaceChildren();
        pagination.hidden = pageCount <= 1;
        if (pageCount > 1) {
          var list = document.createElement('ul');
          list.className = 'list-inline mb-0 g-font-size-13';
          function addItem(label, target, current) {
            var item = document.createElement('li');
            item.className = 'list-inline-item g-mr-5';
            var control = document.createElement(target && !current ? 'a' : 'span');
            control.className = 'u-pagination-v1__item u-pagination-v1-4 g-rounded-50 g-py-5 g-px-10';
            control.textContent = label;
            if (current) {
              control.classList.add('u-pagination-v1-4--active');
              control.setAttribute('aria-current', 'page');
            } else if (target) {
              control.href = pageURL(url, target).href;
              control.setAttribute('data-resource-page', String(target));
              control.setAttribute('aria-controls', 'resource-articles');
              control.setAttribute('aria-label', /^\d+$/.test(label) ? 'Page ' + label : label + ' page');
            } else {
              control.classList.add('u-pagination-v1__item--disabled');
              control.setAttribute('aria-disabled', 'true');
            }
            item.appendChild(control);
            list.appendChild(item);
          }
          addItem('Previous', currentPage > 1 ? currentPage - 1 : null, false);
          var lastNumber = 0;
          for (var number = 1; number <= pageCount; number++) {
            if (pageCount > 7 && number !== 1 && number !== pageCount && Math.abs(number - currentPage) > 1) continue;
            if (number - lastNumber > 1) addItem('…', null, false);
            addItem(String(number), number, number === currentPage);
            lastNumber = number;
          }
          addItem('Next', currentPage < pageCount ? currentPage + 1 : null, false);
          pagination.appendChild(list);
        }
      }
      return pageURL(url, currentPage);
    }

    function rememberScroll() {
      var state = Object.assign({}, history.state, { resourceScroll: [window.scrollX, window.scrollY] });
      history.replaceState(state, '', window.location.href);
    }

    var initialURL = new URL(window.location.href);
    var initialContent = pageContent(document);
    pageCache.set(collectionURL(initialURL).href, initialContent);
    var initialPageURL = renderListing(initialContent, initialURL);
    if (initialURL.href !== initialPageURL.href) history.replaceState(history.state, '', initialPageURL.href);
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

    async function showCollection(url, addHistory, savedScroll, pageChange) {
      var currentRequest = ++requestNumber;
      resourceArticles.setAttribute('aria-busy', 'true');
      try {
        var sourceURL = collectionURL(url);
        var content = pageCache.get(sourceURL.href);
        if (!content) {
          var response = await fetch(sourceURL.href);
          if (!response.ok) throw new Error('Unable to load resources');
          content = pageContent(new DOMParser().parseFromString(await response.text(), 'text/html'));
          pageCache.set(sourceURL.href, content);
        }
        if (currentRequest !== requestNumber) return;
        var scroll = addHistory ? [window.scrollX, window.scrollY] : savedScroll;
        if (addHistory) rememberScroll();
        // A numbered page starts at the listing, never at the site's banner.
        if (pageChange) scroll = [window.scrollX, Math.max(0, resourceCategory.parentElement.getBoundingClientRect().top + window.scrollY - 20)];
        resourceHeading.textContent = content.heading;
        var destination = renderListing(content, url);
        resourceCategory.value = content.category;
        document.title = content.title;
        var schema = document.querySelector('script[type="application/ld+json"]');
        if (schema && content.schema) schema.textContent = content.schema;
        if (addHistory) history.pushState({ resourceScroll: scroll }, '', destination.href);
        else if (destination.href !== window.location.href) history.replaceState(history.state, '', destination.href);
        window.scrollTo({ left: scroll[0], top: scroll[1], behavior: 'instant' });
        if (pageChange) resourceHeading.focus({ preventScroll: true });
      } catch (error) {
        if (currentRequest === requestNumber) window.location.assign(url.href);
      } finally {
        if (currentRequest === requestNumber) resourceArticles.removeAttribute('aria-busy');
      }
    }

    resourceCategory.addEventListener('change', function () {
      showCollection(new URL(resourceCategory.value, window.location.href), true);
    });
    if (pagination) pagination.addEventListener('click', function (event) {
      var link = event.target.closest('a[data-resource-page]');
      if (!link || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      showCollection(new URL(link.href), true, null, true);
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
