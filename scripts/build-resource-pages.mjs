// Edit assets/data/resources.json, then run: node scripts/build-resource-pages.mjs
// Category/topic labels, tagging, optional images, and display order live in that catalog.
// Undated profiles retain their editorial order; news requires a publication date.
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';

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
function listing(list, layout, pageSize, title, topicFilter = false) {
  return `<section id="resources" class="container resource-listing" data-resource-library data-layout="${layout}" data-page-size="${pageSize}" aria-labelledby="resource-heading">
    <div class="resource-list-heading"><h2 id="resource-heading" tabindex="-1">${title}</h2><p id="resource-result-status" role="status" aria-live="polite">${list.length} resources${layout === 'news' ? ' · Newest first' : ''}</p></div>
    ${topicFilter ? `<div class="resource-filter"><label for="resource-topic">Filter by topic</label><select id="resource-topic"><option value="">All topics</option>${topics.filter(topic => topic.category === 'technical').map(topic => `<option value="${topic.id}">${escape(topic.name)}</option>`).join('')}</select></div>` : ''}
    <p id="resource-filter-summary" hidden></p>
    <div id="resource-list" class="resource-grid resource-grid--${layout}">${list.map(article => card(article, layout, true)).join('\n')}</div>
    <div id="resource-empty" class="resource-empty" hidden><h3>No resources found</h3><p>Try a broader term or clear the filters to browse this collection.</p></div>
    <div class="resource-results-footer"><a id="resource-reset" href="#resources" hidden>Clear search and filters</a><nav id="resource-pages" aria-label="Resource pages" hidden></nav></div>
  </section>`;
}
function landing() {
  // Unify v2.6.2: home/home-discover.html article and section structure.
  const sectionHeading = (name, href) => `<div class="mb-5"><h2 class="h3 g-color-black mb-0">${href ? `<a class="g-color-black g-color-primary--hover g-text-underline--none--hover" href="${href}">${escape(name)}</a>` : escape(name)}</h2><div class="d-inline-block g-width-50 g-height-1 g-bg-black"></div></div>`;
  function featuredCard(article, category) {
    if (category.id === 'technical') {
      // Use Unify's text-only article block for a balanced landing-page preview row.
      return `<div class="col-md-4 d-flex g-mb-30"><article class="u-shadow-v11 g-bg-white g-pos-rel d-flex flex-column g-pa-30 w-100">
        <h3 class="h5 g-color-black g-font-weight-600 mb-3"><a class="g-color-black g-color-primary--hover g-text-underline--none--hover" href="${article.href}">${escape(article.title)}</a></h3><p class="g-color-gray-dark-v4">${escape(article.description)}</p><a class="mt-auto align-self-start" href="${article.href}">Read more</a>
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
  const sections = categories.map((category, index) => {
    const selected = category.id === 'technical' ? ['blog/practical-guide-spps.html', 'blog/choosing-a-peptide-synthesizer.html', 'blog/optimizing-temperature-time-kinetics-spps.html'].map(href => articles.find(article => article.href === href)) : grouped(category.id).slice(0, category.id === 'researchers' ? 2 : 3);
    return `<section${category.id === 'news' ? ' class="g-bg-secondary"' : ''}><div class="container ${index === 0 ? 'g-pt-50' : 'g-pt-100'} g-pb-70">${sectionHeading(category.name, category.file)}<div class="row">${selected.map(article => featuredCard(article, category)).join('')}</div>${link(category.file, category.action)}</div></section>`;
  }).join('\n');
  return `<div id="resources" tabindex="-1"><h1 class="sr-only">Resources</h1>${sections}</div>`;
}
function collection(category) {
  const list = category.id === 'top' ? articles.filter(article => article.topPost).sort((a, b) => a.topPost - b.topPost) : grouped(category.id);
  return `<section class="resource-hero resource-hero--collection"><div class="container"><nav class="resource-breadcrumb" aria-label="Breadcrumb"><a href="blog.html">Resources</a><span aria-hidden="true">/</span><span aria-current="page">${escape(category.name)}</span></nav><p class="resource-eyebrow">${escape(category.eyebrow)}</p><h1>${escape(category.name)}</h1><p class="resource-intro">${escape(category.description)}</p></div></section>
    ${listing(list, category.layout, category.pageSize, category.id === 'news' ? 'Latest updates' : category.id === 'researchers' ? 'Conversations with leading researchers' : 'Browse the collection', category.id === 'technical')}`;
}
const topPosts = {id:'top', file:'top-posts.html', name:'Top Posts', description:'Featured guides, comparisons, and case studies for peptide synthesis.', eyebrow:'A place to start', layout:'masonry', pageSize:9};
for (const category of [null, ...categories, topPosts]) {
  const name = category?.name || 'Resources';
  const description = category?.description || 'Discover technical guides, peptide news, and profiles of leading peptide researchers. Browse the CSBio resource library.';
  const replacements = {TITLE:escape(`CSBio ${name} - Peptides and Peptide Synthesizers`), DESCRIPTION:escape(description), SCHEMA_NAME:JSON.stringify(`CSBio ${name}`), SCHEMA_DESCRIPTION:JSON.stringify(description), RESOURCE_CONTENT:category ? collection(category) : landing()};
  const output = template.replace(/\{\{(\w+)\}\}/g, (_, key) => replacements[key]).replace(/[\t ]+$/gm, '');
  writeFileSync(new URL(category?.file || 'blog.html', root), '<!-- Generated by scripts/build-resource-pages.mjs. Edit assets/data/resources.json and scripts/templates/resources.html. -->\n' + output);
  console.log(`${category?.file || 'blog.html'}: ${name}`);
}

// Include older public articles and the course request page, even when they are
// not in the current catalog. Archive folders and vendor demo pages stay separate.
let articleCount = 0;
for (const directory of ['blog', 'monthly']) {
  for (const entry of readdirSync(new URL(directory + '/', root), { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.html') || /^blog(?:-single-item-\d+)?\.html$/.test(entry.name)) continue;
    const file = new URL(`${directory}/${entry.name}`, root);
    const original = readFileSync(file, 'utf8');
    const newline = original.includes('\r\n') ? '\r\n' : '\n';
    const headerEnd = '<!-- End Header -->';
    if (original.split(headerEnd).length !== 2) throw new Error(`Expected one article header: ${directory}/${entry.name}`);
    const content = original
      .replace(/^[\t ]*<nav class="container resource-back-nav"[^>]*>[\s\S]*?<\/nav>\r?\n/gm, '')
      .replace(/^[\t ]*<a class="resource-back-link\b[^>]*>.*?<\/a>\r?\n/gm, '');
    const navigation = [
      '    <nav class="container resource-back-nav" aria-label="Back navigation">',
      '      <a class="resource-back-link" data-resource-back href="../blog.html"><span aria-hidden="true">&larr;</span> <span class="resource-back-label">All Resources</span></a>',
      '    </nav>'
    ].join(newline);
    const output = content.replace(headerEnd + newline, headerEnd + newline + navigation + newline);
    if (output !== original) writeFileSync(file, output);
    articleCount++;
  }
}
console.log(`${articleCount} article and course pages: shared back navigation`);
