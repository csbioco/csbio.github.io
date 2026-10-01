// Keep blog.html as the source of truth. After adding an article with a
// data-resource-category, run: node scripts/build-resource-pages.mjs
// data-resource-top-post is the optional display order in the Top Posts list.
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const source = readFileSync(new URL('blog.html', root), 'utf8');
const categories = [
  { id: 'technical', file: 'technical-resources.html', title: 'Technical Resources', description: 'Practical guides, equipment selection, heating methods, and applications for peptide synthesis and purification.' },
  { id: 'news', file: 'peptide-news.html', title: 'Peptide News', description: 'Quarterly updates and news from the world of peptide science, research, and drug development.' },
  { id: 'researchers', file: 'leading-peptide-researchers.html', title: 'Leading Peptide Researchers', description: 'Career advice: a series profiling leading peptide researchers, how they got into peptide science, and the lessons they share with the next generation.' }
];
const collections = categories.concat({ id: 'top', file: 'top-posts.html', title: 'Top Posts', description: 'Explore our featured guides, comparisons, and case studies for peptide synthesis.' });
const blockPattern = /<!-- Blog Minimal Blocks -->\s*<article class="g-mb-100" data-resource-category="([^"]+)"[^>]*>[\s\S]*?<\/article>\s*<!-- End Blog Minimal Blocks -->/g;
const blocks = [...source.matchAll(blockPattern)];
const articleCount = [...source.matchAll(/<article class="g-mb-100"/g)].length;
if (!articleCount || blocks.length !== articleCount || blocks.some(block => !categories.some(category => category.id === block[1]))) {
  throw new Error('Every main resource article needs a valid data-resource-category: technical, news, or researchers.');
}

for (const category of collections) {
  const selected = blocks.filter(block => category.id === 'top' ? /data-resource-top-post="\d+"/.test(block[0]) : block[1] === category.id);
  if (category.id === 'top') selected.sort((a, b) => Number(a[0].match(/data-resource-top-post="(\d+)"/)[1]) - Number(b[0].match(/data-resource-top-post="(\d+)"/)[1]));
  let inserted = false;
  let output = source.replace(blockPattern, () => {
    if (inserted) return '';
    inserted = true;
    return selected.map(block => block[0]).join('\n\n            ');
  });
  output = output.replace(/<title>[^<]*<\/title>/, `<title>CSBio ${category.title} - Peptides and Peptide Synthesizers</title>`);
  output = output.replace(/"name": "CSBio Resources and Blog"/, `"name": "CSBio ${category.title}"`);
  output = output.replace(/"description": "Resources, case studies, and news for peptide synthesizers, SPPS, and purification\."/, `"description": "${category.description}"`);
  // Keep the shared CSBio Blog banner; describe the collection below its dropdown.
  output = output.replace(/(<h2 id="resources"[^>]*>)Resources(<\/h2>)/, `$1${category.title}$2\n            <p class="g-color-gray-dark-v4 g-mb-30">${category.description}</p>`);
  output = output.replace('<option value="blog.html" selected>', '<option value="blog.html">');
  output = output.replace(`<option value="${category.file}">`, `<option value="${category.file}" selected>`);
  output = output.replace(/(?:[ \t]*\r?\n){4,}/g, '\n\n');
  output = '<!-- Generated from blog.html by scripts/build-resource-pages.mjs. -->\n' + output.trimStart();
  writeFileSync(new URL(category.file, root), output);
  console.log(`${category.file}: ${selected.length} articles`);
}
