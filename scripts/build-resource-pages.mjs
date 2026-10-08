// Edit assets/data/resources.json, then run: node scripts/build-resource-pages.mjs
// Category/topic labels, tagging, optional images, and display order live in that catalog.
// Undated profiles retain their editorial order; news requires a publication date.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const { categories, topics, articles } = JSON.parse(readFileSync(new URL('assets/data/resources.json', root), 'utf8'));
const template = readFileSync(new URL('scripts/templates/resources.html', root), 'utf8');
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const categoryFor = id => categories.find(category => category.id === id);
const topicFor = id => topics.find(topic => topic.id === id);
const localFile = file => typeof file === 'string' && !file.includes('..') && !file.includes(':') && existsSync(new URL(file, root));
if (!articles.length || new Set(articles.map(article => article.href)).size !== articles.length) throw new Error('Empty or duplicate resource inventory.');
for (const article of articles) {
  if (!categoryFor(article.category) || !article.topics?.length || article.topics.some(id => !topicFor(id))) throw new Error(`Invalid category or topic: ${article.href}`);
  if (!localFile(article.href) || (article.image && (!localFile(article.image) || !article.imageAlt))) throw new Error(`Missing article, image, or image description: ${article.href}`);
  if (article.category === 'news' && !/^\d{4}-\d{2}-\d{2}$/.test(article.date)) throw new Error(`News needs a publication date: ${article.href}`);
  if (article.date && (Number.isNaN(Date.parse(article.date)) || new Date(article.date).toISOString().slice(0, 10) !== article.date)) throw new Error(`Invalid date: ${article.href}`);
}
const grouped = id => {
  const selected = articles.filter(article => article.category === id);
  return id === 'news' ? selected.sort((a, b) => b.date.localeCompare(a.date)) : selected;
};
const date = article => article.date ? `<time datetime="${article.date}">${new Intl.DateTimeFormat('en-US', {month:'long', day:'numeric', year:'numeric', timeZone:'UTC'}).format(new Date(article.date))}</time>` : '';
const arrow = '<span aria-hidden="true">→</span>';
const link = (href, label, className = 'resource-link') => `<a class="${className}" href="${escape(href)}">${escape(label)} ${arrow}</a>`;
const picture = article => article.image ? `<img class="resource-card-image${article.imageFit === 'contain' ? ' resource-card-image--contain' : ''}" src="${article.image}" alt="${escape(article.imageAlt)}" loading="lazy" decoding="async"${article.imagePosition ? ` style="object-position:${escape(article.imagePosition)}"` : ''}>` : '';

function card(article, layout = 'text', search = false) {
  const meta = layout === 'news' ? date(article) : escape(article.format || 'Researcher interview');
  const attributes = search ? ` data-search="${escape([article.title, article.description, article.person || '', article.date || '', article.format || '', categoryFor(article.category).name, ...article.topics.map(id => topicFor(id).name)].join(' '))}" data-topics="${article.topics.join(' ')}"` : '';
  const heading = layout === 'profiles' ? article.person : article.title;
  return `<article class="resource-card resource-card--${layout}" data-resource-category="${article.category}"${attributes}>
    ${layout === 'masonry' || layout === 'profiles' ? picture(article) : ''}
    <div class="resource-card-body">
      <p class="resource-meta">${meta}${layout === 'profiles' && article.date ? ` · ${date(article)}` : ''}</p>
      <h3><a href="${article.href}">${escape(heading)}</a></h3>
      <p class="resource-card-description">${escape(layout === 'profiles' ? article.title : article.description)}</p>
      ${link(article.href, layout === 'profiles' ? 'Read the interview' : 'Read more')}
    </div>
  </article>`;
}
function navigation(active) {
  return `<nav class="resource-nav" aria-label="Resource collections">
    <a href="blog.html"${active === 'all' ? ' aria-current="page"' : ''}>All Resources</a>
    ${categories.map(category => `<a href="${category.file}"${category.id === active ? ' aria-current="page"' : ''}>${escape(category.name)}</a>`).join('\n')}
    <a href="top-posts.html"${active === 'top' ? ' aria-current="page"' : ''}>Top Posts</a>
  </nav>`;
}
function searchForm(collection = false) {
  return `<form class="resource-search" role="search" method="get">
    <label for="resource-query">${collection ? 'Search this collection' : 'Search the resource library'}</label>
    <div class="resource-search-row"><input id="resource-query" name="q" type="search" placeholder="Try SPPS, heating, or a researcher’s name…" autocomplete="off"><button type="submit"><i class="fa fa-search" aria-hidden="true"></i> Search</button></div>
  </form>`;
}
function listing(list, layout, pageSize, title, landing = false, topicFilter = false) {
  return `<section id="resources" class="container resource-listing" data-resource-library data-layout="${layout}" data-page-size="${pageSize}"${landing ? ' data-landing' : ''} aria-labelledby="resource-heading">
    <div class="resource-list-heading"><h2 id="resource-heading" tabindex="-1">${title}</h2><p id="resource-result-status" role="status" aria-live="polite">${list.length} resources${layout === 'news' ? ' · Newest first' : ''}</p></div>
    ${topicFilter ? `<div class="resource-filter"><label for="resource-topic">Filter by topic</label><select id="resource-topic"><option value="">All topics</option>${topics.filter(topic => topic.category === 'technical').map(topic => `<option value="${topic.id}">${escape(topic.name)}</option>`).join('')}</select></div>` : ''}
    <p id="resource-filter-summary" hidden></p>
    <div id="resource-list" class="resource-grid resource-grid--${layout}">${list.map(article => card(article, layout, true)).join('\n')}</div>
    <div id="resource-empty" class="resource-empty" hidden><h3>No resources found</h3><p>Try a broader term or clear the filters to browse this collection.</p></div>
    <div class="resource-results-footer"><a id="resource-reset" href="${landing ? 'blog.html#resources' : '#resources'}" hidden>Clear search and filters</a><nav id="resource-pages" aria-label="Resource pages" hidden></nav></div>
  </section>`;
}
function landing() {
  // Unify v2.6.2: home/home-discover.html search, icon blocks, and section structure.
  // Keep existing content; omit the demo's stock images, ratings, counters, and testimonials.
  const hero = `<section class="g-bg-secondary"><div class="container text-center g-py-60">
    <h1 class="h1 g-color-black g-font-weight-600 text-uppercase g-mb-30">Resources</h1>
    <form data-resource-search role="search" method="get">
      <div class="g-max-width-540 mx-auto g-mb-20"><label for="resource-query" class="sr-only">Search the resource library</label><div class="input-group">
        <input id="resource-query" name="q" type="search" class="form-control g-font-size-16" placeholder="Search resources" autocomplete="off">
        <div class="input-group-append"><button class="btn btn-primary g-font-size-18 g-py-12 g-px-25" type="submit" aria-label="Search"><i class="fa fa-search" aria-hidden="true"></i></button></div>
      </div></div>
    </form>
  </div></section>`;
  const sectionHeading = (name, href) => `<div class="mb-5"><h2 class="h3 g-color-black mb-0">${href ? `<a class="g-color-black g-color-primary--hover g-text-underline--none--hover" href="${href}">${escape(name)}</a>` : escape(name)}</h2><div class="d-inline-block g-width-50 g-height-1 g-bg-black"></div></div>`;
  const top = `<section class="container g-pt-100 g-pb-40" aria-label="Top Categories">${sectionHeading('Top Categories')}<div class="row align-items-center">${categories.map(category => {
    const icon = topics.find(topic => topic.category === category.id).icon;
    return `<div class="col-sm-6 col-lg-4 g-mb-30"><div class="media g-mb-20"><div class="d-flex mr-4"><span class="u-icon-v2 u-icon-size--sm g-color-white g-bg-primary g-font-size-16 rounded-circle"><i class="fa fa-${icon}" aria-hidden="true"></i></span></div><div class="media-body align-self-center"><h3 class="g-font-size-17 mb-0"><a class="g-color-black g-color-primary--hover g-text-underline--none--hover" href="${category.file}">${escape(category.name)}</a></h3></div></div></div>`;
  }).join('')}</div></section>`;
  function featuredCard(article, category) {
    if (category.id === 'technical') {
      // Unify blog/blog-masonry-col-3.html: image and text-only article blocks.
      return `<div class="col-md-4 g-mb-30"><article class="u-shadow-v11 g-bg-white g-pos-rel">
        ${article.image ? `<img class="img-fluid w-100" src="${article.image}" alt="${escape(article.imageAlt)}" loading="lazy" decoding="async">` : ''}
        <div class="g-pa-30"><h3 class="h5 g-color-black g-font-weight-600 mb-3"><a class="g-color-black g-color-primary--hover g-text-underline--none--hover" href="${article.href}">${escape(article.title)}</a></h3><p class="g-color-gray-dark-v4">${escape(article.description)}</p><a href="${article.href}">Read more</a></div>
      </article></div>`;
    }
    if (category.id === 'researchers') {
      // Unify blog/blog-grid-background-overlay-2.html, with the existing profile crops.
      return `<div class="col-md-6 g-mb-30"><article class="u-block-hover">
        <div class="g-bg-cover g-bg-white-gradient-opacity-v1--after"><img class="w-100 u-block-hover__main--mover-down" src="${article.image}" alt="${escape(article.imageAlt)}" loading="lazy" decoding="async" style="aspect-ratio:1;object-fit:cover;object-position:${escape(article.imagePosition || '50% 50%')}"></div>
        <div class="u-block-hover__additional--partially-slide-up g-z-index-1"><div class="u-block-hover__visible g-pa-25"><h3 class="h3 g-color-white g-font-weight-600 mb-3"><a class="u-link-v5 g-color-white" href="${article.href}">${escape(article.person)}</a></h3><p class="g-color-white mb-0">${escape(article.title)}</p></div><div class="g-pl-25"><a class="d-inline-block g-brd-bottom g-brd-white g-color-white g-font-weight-600 g-font-size-12 text-uppercase g-text-underline--none--hover g-mb-30" href="${article.href}">Read the interview</a></div></div>
      </article></div>`;
    }
    return `<div class="col-12 g-mb-30"><article class="g-brd-bottom g-brd-gray-light-v3 g-pb-30"><p class="g-color-gray-dark-v4 g-font-size-12 mb-2">${date(article)}</p><h3 class="h4 g-color-black mb-3"><a class="g-color-black g-color-primary--hover g-text-underline--none--hover" href="${article.href}">${escape(article.title)}</a></h3><p class="g-color-gray-dark-v4">${escape(article.description)}</p><a href="${article.href}">Read more</a></article></div>`;
  }
  const sections = categories.map(category => {
    const selected = category.id === 'technical' ? ['blog/practical-guide-spps.html', 'blog/choosing-a-peptide-synthesizer.html', 'blog/optimizing-temperature-time-kinetics-spps.html'].map(href => articles.find(article => article.href === href)) : grouped(category.id).slice(0, category.id === 'researchers' ? 2 : 3);
    return `<section${category.id === 'news' ? ' class="g-bg-secondary"' : ''}><div class="container g-pt-100 g-pb-70">${sectionHeading(category.name, category.file)}<div class="row">${selected.map(article => featuredCard(article, category)).join('')}</div>${link(category.file, category.action)}</div></section>`;
  }).join('\n');
  return hero + `<div class="container">${navigation('all')}</div>` + listing(articles, 'text', 7, 'All Resources', true) + `<div id="resource-discover">${top}${sections}</div>`;
}
function collection(category) {
  const list = category.id === 'top' ? articles.filter(article => article.topPost).sort((a, b) => a.topPost - b.topPost) : grouped(category.id);
  return `<section class="resource-hero resource-hero--collection"><div class="container"><nav class="resource-breadcrumb" aria-label="Breadcrumb"><a href="blog.html">Resources</a><span aria-hidden="true">/</span><span aria-current="page">${escape(category.name)}</span></nav><p class="resource-eyebrow">${escape(category.eyebrow)}</p><h1>${escape(category.name)}</h1><p class="resource-intro">${escape(category.description)}</p></div></section>
    <div class="container">${navigation(category.id)}<div class="resource-collection-search">${searchForm(true)}</div></div>
    ${listing(list, category.layout, category.pageSize, category.id === 'news' ? 'Latest updates' : category.id === 'researchers' ? 'Conversations with leading researchers' : 'Browse the collection', false, category.id === 'technical')}`;
}
const topPosts = {id:'top', file:'top-posts.html', name:'Top Posts', description:'Featured guides, comparisons, and case studies for peptide synthesis.', eyebrow:'A place to start', layout:'masonry', pageSize:9};
for (const category of [null, ...categories, topPosts]) {
  const name = category?.name || 'Resources';
  const description = category?.description || 'Discover technical guides, peptide news, and profiles of leading peptide researchers. Search the CSBio resource library by topic.';
  const replacements = {TITLE:escape(`CSBio ${name} - Peptides and Peptide Synthesizers`), DESCRIPTION:escape(description), SCHEMA_NAME:JSON.stringify(`CSBio ${name}`), SCHEMA_DESCRIPTION:JSON.stringify(description), RESOURCE_CONTENT:category ? collection(category) : landing()};
  const output = template.replace(/\{\{(\w+)\}\}/g, (_, key) => replacements[key]).replace(/[\t ]+$/gm, '');
  writeFileSync(new URL(category?.file || 'blog.html', root), '<!-- Generated by scripts/build-resource-pages.mjs. Edit assets/data/resources.json and scripts/templates/resources.html. -->\n' + output);
  console.log(`${category?.file || 'blog.html'}: ${name}`);
}
