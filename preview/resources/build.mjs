import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// This isolated design proposal reads the existing index and never changes it.
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const source = readFileSync(path.join(root, 'blog.html'), 'utf8');
const escape = value => value.replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;').replace(/"/g, '&quot;');
const profiles = new Set(['blog/james-checco-interview.html', 'blog/ved.html', 'blog/bdelatorre.html', 'blog/pdawson.html']);
const earlierNews = new Set(['blog/csbioiipress.html', 'blog/covid.html']);
const entries = [...source.matchAll(/<article class="g-mb-100">([\s\S]*?)<\/article>/g)].map(([, block]) => {
  const [, href, title] = block.match(/<h2[^>]*>\s*<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
  const description = block.match(/<p[^>]*>([\s\S]*?)<\/p>/)[1];
  const label = block.match(/<span[^>]*>([^<]+)<\/span>/)[1];
  const category = profiles.has(href) ? 'careers' : href.startsWith('monthly/') || earlierNews.has(href) ? 'news' : 'technical';
  if (!existsSync(path.join(root, href))) throw new Error(`Missing article: ${href}`);
  return { href, title: title.trim(), description: description.trim(), label, category };
});
if (!entries.length || new Set(entries.map(entry => entry.href)).size !== entries.length) throw new Error('Empty or duplicate resource inventory');

const categories = [
  { id: 'technical', file: 'technical-resources.html', name: 'Technical Resources', verb: 'Build your knowledge', icon: 'book', description: 'Practical guides, synthesis methods, and tools to help you choose equipment and improve your peptide synthesis.', topics: 'SPPS guides · Equipment selection · Heating & scale-up', action: 'Explore technical resources' },
  { id: 'news', file: 'peptide-news.html', name: 'Peptide News', verb: 'Stay up to date', icon: 'news', description: 'Quarterly updates on peptide research and drug development, plus news from across the peptide community.', topics: 'Quarterly updates · Research & industry news', action: 'Browse peptide news' },
  { id: 'careers', file: 'peptide-career-stories.html', name: 'Peptide Career Stories', verb: 'Learn from the people', icon: 'people', description: 'Career advice from leading peptide researchers: how they got into peptide science, what they learned, and their advice for the next generation.', topics: 'Researcher profiles · Career paths · Mentorship', action: 'Meet the researchers' },
];
const grouped = id => entries.filter(entry => entry.category === id);
const icon = name => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">${{
  book: '<path d="M16 7c-4-3-9-3-13-1v21c4-2 9-2 13 1 4-3 9-3 13-1V6c-4-2-9-2-13 1Z"/><path d="M16 7v21M7 11h5M7 16h5M20 11h5M20 16h5"/>',
  news: '<rect x="5" y="3" width="23" height="26" rx="2"/><path d="M5 10H2v17a2 2 0 0 0 2 2M10 8h13M10 13h13M10 19h4v5h-4zM18 19h5M18 24h5"/>',
  people: '<circle cx="12" cy="10" r="5"/><path d="M2 29v-4a10 10 0 0 1 20 0v4M22 5a5 5 0 0 1 0 10M25 19a8 8 0 0 1 5 7v3"/>'
}[name]}</svg>`;
const countText = category => `${grouped(category.id).length} ${category.id === 'careers' ? 'interviews' : category.id === 'news' ? 'updates & articles' : 'resources'}`;
const categoryLinks = active => categories.map(category => `<a href="${category.file}"${active === category.id ? ' aria-current="page"' : ''}>${category.name}<span>${grouped(category.id).length}</span></a>`).join('');
const menu = (name, links, active = false) => `<details class="nav-dropdown${active ? ' is-active' : ''}"><summary>${name}<span class="chevron" aria-hidden="true"></span></summary><div class="dropdown-panel">${links.map(([label, href]) => `<a href="${href}">${label}</a>`).join('')}</div></details>`;
const header = () => `<a class="skip-link" href="#main-content">Skip to content</a>
  <div class="proposal-bar"><div class="wide"><span>Layout proposal <span class="proposal-divider">/</span> Resources</span><a href="proposal.html">Review notes <span aria-hidden="true">↗</span></a></div></div>
  <header class="site-header"><div class="wide header-inner">
    <a class="brand" href="../../index.html" aria-label="CSBio home"><img src="../../assets/img/favicon.png" width="46" height="46" alt="CSBio"></a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu <span aria-hidden="true">☰</span></button>
    <nav id="site-nav" class="site-nav" aria-label="Main navigation">
      <a href="../../index.html">Home</a>
      ${menu('Research Peptide Synthesizers', [['Overview', '../../researchscale.html'], ['CSBio II', '../../csbioii.html'], ['CS136X', '../../136x.html'], ['CS136M', '../../136M.html']])}
      ${menu('Pilot Peptide Synthesizers', [['Overview', '../../pilotscale.html'], ['CS536X', '../../536x.html'], ['CS936S', '../../936s.html']])}
      <a href="../../commercialscale.html">Commercial Peptide Synthesizers</a>
      <a href="../../dna.html">DNA Synthesizers</a>
      ${menu('Resources', [['All Resources', 'index.html'], ...categories.map(category => [category.name, category.file])], true)}
      ${menu('About', [['Company Overview', '../../offices.html'], ['Our Locations', '../../offices.html#locations']])}
      <a class="quote-link" href="../../quotesynthesizer.html">Request Synthesis Equipment</a>
    </nav>
  </div></header>`;
const footer = () => `<footer class="site-footer"><div class="container footer-inner"><div><strong>CSBio</strong><p>Peptide synthesis. From discovery to production.</p></div><div class="footer-links"><a href="index.html">Resources</a><a href="../../offices.html">About CSBio</a><a href="../../quotesynthesizer.html">Contact us</a></div></div><div class="container copyright">2026 © CSBio. All rights reserved.</div></footer>`;
const page = (title, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escape(title)} | CSBio layout proposal</title><link rel="icon" href="../../assets/img/favicon.png"><link href="https://fonts.googleapis.com/css?family=Open+Sans:400,600,700,800" rel="stylesheet"><link rel="stylesheet" href="styles.css"><script defer src="preview.js"></script></head><body>${header()}<main id="main-content">${body}</main>${footer()}</body></html>`;
const arrow = '<span aria-hidden="true">→</span>';
const categoryCards = categories.map(category => `<a class="category-card ${category.id}" href="${category.file}"><div class="card-top"><span class="category-icon">${icon(category.icon)}</span><span class="count">${countText(category)}</span></div><p class="eyebrow">${category.verb}</p><h3>${category.name}</h3><p class="card-description">${category.description}</p><p class="topics">${escape(category.topics)}</p><span class="text-link">${category.action} ${arrow}</span></a>`).join('');
const featured = [
  { href: 'blog/practical-guide-spps.html', title: 'A Practical Guide to Solid Phase Peptide Synthesis', description: 'Start with the fundamentals, with practical tips to avoid common obstacles in SPPS.', category: 'Technical Resources', meta: 'GUIDE' },
  { ...entries.find(entry => entry.href === 'monthly/news-Q22026.html'), title: 'Q2 2026 Peptide News', description: 'Explore the quarter’s developments in peptide therapeutics, research, and drug development.', category: 'Peptide News', meta: 'QUARTERLY UPDATE' },
  { href: 'blog/james-checco-interview.html', title: 'A Conversation with James Checco', description: 'On finding a path into chemical biology, exploring peptide signaling, and mentoring independent researchers.', category: 'Peptide Career Stories', meta: 'RESEARCHER INTERVIEW' },
];
const indexBody = `<section class="hero"><div class="container"><p class="eyebrow">The CSBio resource library</p><h1>Resources for peptide science</h1><p class="intro">Practical knowledge. New developments. Personal perspectives.<br>Find the resources that move your research and career forward.</p></div></section>
<section class="container browse-section" aria-labelledby="browse-title" id="resources"><div class="section-heading"><div><p class="eyebrow">Find your focus</p><h2 id="browse-title">Explore by category</h2></div><p>Three ways to keep learning.</p></div><div class="category-grid">${categoryCards}</div></section>
<section class="featured-section"><div class="container"><div class="section-heading"><div><p class="eyebrow">A place to start</p><h2>Featured resources</h2></div></div><div class="featured-grid">${featured.map(item => `<article class="featured-card"><p class="eyebrow">${item.category}</p><h3><a href="../../${item.href}">${item.title}</a></h3><p>${item.description}</p><a class="text-link" href="../../${item.href}">Read ${item.meta === 'GUIDE' ? 'the guide' : item.meta === 'RESEARCHER INTERVIEW' ? 'the interview' : 'the update'} ${arrow}</a></article>`).join('')}</div></div></section>
<section class="container series-section"><div class="series-photo"><img src="../../assets/img/blog/james-checco-professor.jpg" alt="Professor James Checco" width="1200" height="1600" loading="lazy"></div><div class="series-copy"><p class="eyebrow">Leading Peptide Researchers</p><h2>Every career has a starting point.</h2><p>Discover how leading researchers found their way into peptide science. Our interview series explores the decisions, mentors, and lessons that shaped their careers—and their advice for scientists finding their own path.</p><a class="text-link" href="peptide-career-stories.html">Explore Peptide Career Stories ${arrow}</a></div></section>`;
writeFileSync(path.join(here, 'index.html'), page('Resources', indexBody));

function article(entry) {
  const category = categories.find(category => category.id === entry.category);
  const date = /\d/.test(entry.label) ? ` <span aria-hidden="true">·</span> ${entry.label}` : '';
  return `<article class="resource-article"><p class="article-meta">${category.id === 'careers' ? 'Leading Peptide Researchers' : category.name}${date}</p><h2><a href="../../${entry.href}">${escape(entry.title)}</a></h2><p>${entry.description}</p><a class="text-link" href="../../${entry.href}" aria-label="Read more: ${escape(entry.title)}">Read more ${arrow}</a></article>`;
}
for (const category of categories) {
  const list = grouped(category.id);
  const body = `<section class="hero category-hero"><div class="container"><nav class="breadcrumb" aria-label="Breadcrumb"><a href="index.html">Resources</a><span aria-hidden="true">/</span><span aria-current="page">${category.name}</span></nav><h1>${category.name}</h1><p class="intro">${category.description}</p></div></section>
  <div class="container listing-layout"><aside class="category-sidebar"><nav aria-label="Resource categories"><p class="eyebrow">Explore resources</p><a href="index.html" class="all-resources">All Resources ${arrow}</a><div class="category-nav">${categoryLinks(category.id)}</div></nav><div class="sidebar-note"><h2>${category.id === 'careers' ? 'Leading Peptide Researchers' : category.id === 'news' ? 'The quarterly perspective' : 'From fundamentals to scale-up'}</h2><p>${category.id === 'careers' ? 'A series about the people behind peptide science, how they got started, and what they would tell the next generation.' : category.id === 'news' ? 'Catch up on research and industry developments with our quarterly roundups. Earlier news remains available below.' : 'Explore SPPS methods, compare synthesizers, and learn from practical applications in the lab.'}</p></div></aside>
  <section class="article-list" aria-label="${category.name}"><div class="list-heading"><span>${countText(category)}</span><span>Browse the collection</span></div>${category.id === 'news' ? `<h2 class="collection-heading">Quarterly updates</h2>${list.filter(item => item.href.startsWith('monthly/news-Q')).map(article).join('')}<h2 class="collection-heading archive-heading">Earlier news &amp; updates</h2>${list.filter(item => !item.href.startsWith('monthly/news-Q')).map(article).join('')}` : list.map(article).join('')}</section></div>`;
  writeFileSync(path.join(here, category.file), page(category.name, body));
}

const proposal = `<section class="hero"><div class="container"><p class="eyebrow">For review · Updates 1 &amp; 2</p><h1>A clearer home for resources</h1><p class="intro">A layout and naming proposal for review with Saundra.</p><a class="text-link" href="index.html">Open the clickable preview ${arrow}</a></div></section>
<div class="container review-content"><section><h2>Proposed page structure</h2><ol><li><strong>Resources overview:</strong> a brief introduction, three category cards, a featured resource from each category, and an introduction to the researcher interview series.</li><li><strong>Resources dropdown:</strong> All Resources and direct links to each of the three categories. Each destination is also available from the overview and category sidebar.</li><li><strong>Category pages:</strong> the current blog’s text-led listing format, with category navigation on the left and article titles, descriptions, and Read more links on the right. On mobile, the navigation stacks above the articles.</li></ol></section>
<section><h2>Recommended category names</h2><div class="review-table"><table><thead><tr><th>Proposed name</th><th>What belongs here</th><th>Reasoning</th></tr></thead><tbody><tr><td>Technical Resources</td><td>Practical guides, selecting a synthesizer, heating, SPPS methods, videos, and scale-up.</td><td>Keep the original suggestion: clear and broad enough for different formats.</td></tr><tr><td>Peptide News</td><td>Quarterly updates, with earlier monthly roundups and historical news below.</td><td>Keep the original suggestion: concise and easy to scan.</td></tr><tr><td>Peptide Career Stories</td><td>The Leading Peptide Researchers interview series.</td><td>Signals both personal journeys and career advice. Retain “Leading Peptide Researchers” as the series label and supporting copy.</td></tr></tbody></table></div><p><strong>Alternative for discussion:</strong> “Career Advice &amp; Researcher Profiles” is more explicit but longer in the navigation. “Peptide Career Stories” is the recommended shorter label; the description makes the career-advice focus clear.</p><p><strong>Series description:</strong> Career advice from leading peptide researchers: how they got into peptide science, what they learned, and their advice for the next generation.</p><p><strong>For Saundra’s review:</strong> Do these category names match how visitors look for content, and does the interview framing strike the right balance between research profiles and career advice? Her feedback has not yet been collected.</p></section>
<section><h2>Content coverage</h2><p>The proposal includes all ${entries.length} entries from the current main resources listing: ${grouped('technical').length} technical resources, ${grouped('news').length} news entries, and ${grouped('careers').length} researcher interviews. Existing article destinations remain unchanged.</p><p>The interviews feature James Checco, Ved Srivastava, Beatriz G. de la Torre, and Phil Dawson. The news page puts quarterly updates first and keeps older monthly roundups, the CSBio II announcement, and the historical COVID-19 article in an archive section.</p></section>
<section><h2>Review status and scope</h2><p>This is a separate local proposal. The production Resources page and site-wide navigation have not been changed. Graduate research grant profiles and a past-winners page are outside this proposal.</p><p>The supplied <a href="https://drive.google.com/open?id=1i0tk9wtox-H9NJKuTLdxNZlbZWzbie2m&amp;usp=drive_fs">Drive template reference</a> requires sign-in and could not be reviewed. This proposal uses the current site’s colors, type, and blog listing pattern as its starting point.</p><p>Once the layout and category names are approved, the next step is to apply the overview and category navigation to the live site. No approval or feedback from Saundra is assumed.</p><a class="text-link" href="index.html">Review the Resources overview ${arrow}</a></section></div>`;
writeFileSync(path.join(here, 'proposal.html'), page('Proposal notes', proposal));
console.log(`Built isolated resources proposal: ${entries.length} articles; ${categories.map(category => `${category.name}: ${grouped(category.id).length}`).join(', ')}.`);
