import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'HTML IDs must be unique');
const files = [...html.matchAll(/(?:src|srcset|href)="\.\/([^"]+)"/g)].map(match => match[1]);
await Promise.all([...new Set(files)].map(file => access(new URL('../' + file, import.meta.url))));
for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
  assert(ids.includes(id), `Anchor #${id} must resolve`);
}
for (const [tag] of html.matchAll(/<[^>]+\bdata-en="[^"]*"[^>]*>/g)) {
  assert(tag.includes('data-ar='), 'Visible translated copy needs an Arabic counterpart');
}
assert.equal((html.match(/<h1\b/g) || []).length, 1, 'One primary page heading');
console.log(`Verified ${new Set(files).size} local assets, unique IDs, anchors and bilingual copy.`);
