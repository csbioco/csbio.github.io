// Keep blog.html as the source of truth. After adding an article with a
// data-resource-category, run: node scripts/build-resource-pages.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('blog.html', root), 'utf8');
const categories = [
  { id: 'technical', file: 'technical-resources.html', title: 'Technical Resources', description: 'Practical guides, equipment selection, heating methods, and applications for peptide synthesis and purification.' },
  { id: 'news', file: 'peptide-news.html', title: 'Peptide News', description: 'Quarterly updates and news from the world of peptide science, research, and drug development.' },
  { id: 'researchers', file: 'leading-peptide-researchers.html', title: 'Leading Peptide Researchers', description: 'Career advice: a series profiling leading peptide researchers, how they got into peptide science, and the lessons they share with the next generation.' }
];
const blockPattern = /<!-- Blog Minimal Blocks -->\s*<article class="g-mb-100" data-resource-category="([^"]+)">[\s\S]*?<\/article>\s*<!-- End Blog Minimal Blocks -->/g;
const blocks = [...source.matchAll(blockPattern)];
const articleCount = [...source.matchAll(/<article class="g-mb-100"/g)].length;
if (!articleCount || blocks.length !== articleCount || blocks.some(block => !categories.some(category => category.id === block[1]))) {
  throw new Error('Every main resource article needs a valid data-resource-category: technical, news, or researchers.');
}

for (const category of categories) {
  let output = source.replace(blockPattern, (block, id) => id === category.id ? block : '');
  output = output.replace(/<title>[^<]*<\/title>/, `<title>CSBio ${category.title} - Peptides and Peptide Synthesizers</title>`);
  output = output.replace(/"name": "CSBio Resources and Blog"/, `"name": "CSBio ${category.title}"`);
  output = output.replace(/"description": "Resources, case studies, and news for peptide synthesizers, SPPS, and purification\."/, `"description": "${category.description}"`);
  output = output.replace(/<!-- Breadcrumbs -->[\s\S]*?<!-- End Breadcrumbs -->/, `<!-- Breadcrumbs -->
    <section class="g-bg-gray-light-v5 g-py-80">
      <div class="container text-center">
        <h1 class="h2 g-color-black g-font-weight-600">${category.title}</h1>
        <p class="g-color-gray-dark-v4 mb-0">${category.description}</p>
      </div>
    </section>
    <!-- End Breadcrumbs -->`);
  output = output.replace(/(<h2 id="resources"[^>]*>)Resources(<\/h2>)/, `$1${category.title}$2`);
  output = output.replace('href="blog.html" aria-current="page"', 'href="blog.html"');
  output = output.replace(`href="${category.file}">`, `href="${category.file}" aria-current="page">`);
  // Keep the familiar sidebar, but do not show unrelated technical posts in
  // the news and researcher collections.
  if (category.id !== 'technical') output = output.replace(/<!-- Publications -->[\s\S]*?<!-- End Publications -->/, '');
  output = output.replace(/(?:[ \t]*\r?\n){4,}/g, '\n\n');
  output = '<!-- Generated from blog.html by scripts/build-resource-pages.mjs. -->\n' + output.trimStart();
  writeFileSync(new URL(category.file, root), output);
  console.log(`${category.file}: ${blocks.filter(block => block[1] === category.id).length} articles`);
}
