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
  const hero = `<section class="resource-hero resource-hero--discover"><div class="container"><p class="resource-eyebrow">The CSBio resource library</p><h1>Discover more in<br>peptide science.</h1><p class="resource-intro">Practical knowledge. New developments. Personal perspectives.<br>Find your next idea, answer, or inspiration.</p>${searchForm()}<p class="resource-search-hint">Explore ${articles.length} guides, news updates, and researcher interviews.</p></div></section>`;
  const top = `<section class="container resource-top-categories" aria-labelledby="top-categories"><div class="resource-section-heading"><h2 id="top-categories">Top Categories</h2><span>Find your focus</span></div><div class="resource-topic-grid">${topics.map(topic => {
    const category = categoryFor(topic.category);
    const href = `${category.file}${topic.category === 'technical' ? `?topic=${topic.id}#resources` : ''}`;
    return `<a class="resource-topic-card" href="${href}"><span class="resource-topic-icon"><i class="fa fa-${topic.icon}" aria-hidden="true"></i></span><div><h3>${escape(topic.name)}</h3><p>${escape(topic.description)}</p></div><span aria-hidden="true">↗</span></a>`;
  }).join('')}</div></section>`;
  const sections = categories.map(category => {
    const selected = category.id === 'technical' ? ['blog/practical-guide-spps.html', 'blog/choosing-a-peptide-synthesizer.html', 'blog/optimizing-temperature-time-kinetics-spps.html'].map(href => articles.find(article => article.href === href)) : grouped(category.id).slice(0, category.id === 'researchers' ? 2 : 3);
    return `<section class="resource-collection resource-collection--${category.id}"><div class="container"><div class="resource-section-heading"><div><p class="resource-eyebrow">${escape(category.eyebrow)}</p><h2>${escape(category.name)}</h2></div>${link(category.file, category.action)}</div><p class="resource-collection-intro">${escape(category.description)}</p><div class="resource-grid resource-grid--${category.layout}">${selected.map(article => card(article, category.layout)).join('')}</div></div></section>`;
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
