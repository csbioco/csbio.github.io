/* Progressive enhancement: every resource link remains available without JavaScript. */
(function () {
  'use strict';
  var library = document.querySelector('[data-resource-library]');
  if (!library) return;
  var form = document.querySelector('.resource-search, [data-resource-search]');
  var query = document.getElementById('resource-query');
  var topic = document.getElementById('resource-topic');
  var grid = document.getElementById('resource-list');
  var cards = Array.from(grid.children);
  var heading = document.getElementById('resource-heading');
  var status = document.getElementById('resource-result-status');
  var summary = document.getElementById('resource-filter-summary');
  var empty = document.getElementById('resource-empty');
  var reset = document.getElementById('resource-reset');
  var pages = document.getElementById('resource-pages');
  var discover = document.getElementById('resource-discover');
  var isLanding = library.hasAttribute('data-landing');
  var pageSize = Number(library.dataset.pageSize);
  var masonry;
  var normalize = function (value) { return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); };
  var searchable = new Map(cards.map(function (card) { return [card, normalize(card.dataset.search)]; }));

  function updateMasonry() {
    if (library.dataset.layout !== 'masonry' || !window.Masonry) return;
    if (!masonry) {
      grid.classList.add('is-masonry');
      masonry = new window.Masonry(grid, { itemSelector: '.resource-card:not([hidden])', columnWidth: '.resource-card:not([hidden])', gutter: 28, percentPosition: true, horizontalOrder: true, transitionDuration: 0 });
    } else {
      masonry.reloadItems();
      masonry.layout();
    }
  }

  function pageURL(number) {
    var url = new URL(window.location.href);
    if (number > 1) url.searchParams.set('page', number);
    else url.searchParams.delete('page');
    url.hash = 'resources';
    return url;
  }

  function render() {
    var url = new URL(window.location.href);
    var value = url.searchParams.get('q') || '';
    var selectedTopic = url.searchParams.get('topic') || '';
    if (topic && !Array.from(topic.options).some(function (option) { return option.value === selectedTopic; })) selectedTopic = '';
    if (!topic) selectedTopic = '';
    query.value = value;
    if (topic) topic.value = selectedTopic;
    var words = normalize(value).split(' ').filter(Boolean);
    var filtered = cards.filter(function (card) {
      return words.every(function (word) { return searchable.get(card).includes(word); }) && (!selectedTopic || card.dataset.topics.split(' ').includes(selectedTopic));
    });
    var count = Math.max(1, Math.ceil(filtered.length / pageSize));
    var requested = Number(url.searchParams.get('page'));
    var current = Number.isInteger(requested) && requested > 0 ? Math.min(requested, count) : 1;
    if (current > 1) url.searchParams.set('page', current);
    else url.searchParams.delete('page');
    if (url.searchParams.has('topic') && !selectedTopic) url.searchParams.delete('topic');
    if (url.href !== window.location.href) history.replaceState(history.state, '', url);
    // ?q= and #resources also allow browsing the full index with an empty search.
    var showResults = !isLanding || url.searchParams.has('q') || current > 1 || url.hash === '#resources';
    library.hidden = !showResults;
    if (discover) discover.hidden = showResults;
    var visible = new Set(filtered.slice((current - 1) * pageSize, current * pageSize));
    cards.forEach(function (card) { card.hidden = !visible.has(card); });
    empty.hidden = filtered.length !== 0;
    status.textContent = filtered.length + (filtered.length === 1 ? ' resource' : ' resources') + (filtered.length ? ' · Page ' + current + ' of ' + count : '') + (library.dataset.layout === 'news' ? ' · Newest first' : '');
    if (isLanding) heading.textContent = value.trim() ? 'Search results' : 'All Resources';
    summary.textContent = (value.trim() ? 'Search: “' + value.trim() + '”' : '') + (selectedTopic ? (value.trim() ? ' · ' : '') + topic.selectedOptions[0].textContent : '');
    summary.hidden = !summary.textContent;
    reset.hidden = !(value || selectedTopic || isLanding);
    pages.replaceChildren();
    pages.hidden = count <= 1;
    if (count > 1) {
      var list = document.createElement('ul');
      function control(label, number, active) {
        var item = document.createElement('li');
        var node = document.createElement(active ? 'span' : 'a');
        node.textContent = label;
        if (active) node.setAttribute('aria-current', 'page');
        else { node.href = pageURL(number).href; node.dataset.page = number; }
        if (/^\d+$/.test(label)) node.setAttribute('aria-label', 'Page ' + label);
        item.appendChild(node); list.appendChild(item);
      }
      if (current > 1) control('Previous', current - 1);
      for (var number = 1; number <= count; number++) control(String(number), number, number === current);
      if (current < count) control('Next', current + 1);
      pages.appendChild(list);
    }
    updateMasonry();
  }

  function navigate(url, focus) {
    history.pushState(null, '', url);
    render();
    if (focus) {
      heading.focus({ preventScroll: true });
      library.scrollIntoView({ block: 'start' });
    }
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var url = new URL(window.location.href);
    url.searchParams.set('q', query.value.trim());
    url.searchParams.delete('page');
    url.hash = 'resources';
    navigate(url, true);
  });
  if (topic) topic.addEventListener('change', function () {
    var url = new URL(window.location.href);
    if (topic.value) url.searchParams.set('topic', topic.value);
    else url.searchParams.delete('topic');
    url.searchParams.delete('page');
    navigate(url, false);
  });
  pages.addEventListener('click', function (event) {
    var anchor = event.target.closest('a[data-page]');
    if (!anchor || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); navigate(new URL(anchor.href), true);
  });
  reset.addEventListener('click', function (event) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    var url = new URL(window.location.href);
    ['q', 'topic', 'page'].forEach(function (key) { url.searchParams.delete(key); });
    url.hash = isLanding ? '' : 'resources';
    navigate(url, !isLanding);
    if (isLanding) { query.focus(); form.scrollIntoView({ block: 'center' }); }
  });
  window.addEventListener('popstate', render);
  window.addEventListener('hashchange', render);
  grid.querySelectorAll('img').forEach(function (img) { img.addEventListener('load', updateMasonry); });
  if (document.fonts) document.fonts.ready.then(updateMasonry);
  render();
}());
