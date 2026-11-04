import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { storybooks } from '../src/data/storybooks.js';

test('every authored cover and numbered illustration is configured once in numeric order', async () => {
  assert.equal(new Set(storybooks.map(book => book.id)).size, 4);
  for (const book of storybooks) {
    assert.ok(book.title && book.author);
    const directory = new URL(`../public/${book.id}/`, import.meta.url);
    const actual = (await readdir(directory)).filter(file => file.endsWith('.png')).sort();
    const configured = [book.cover, ...book.pages];
    assert.deepEqual(configured.map(src => src.split('/').at(-1)).sort(), actual, book.title);
    assert.equal(new Set(configured).size, configured.length);
    for (const [index, src] of book.pages.entries()) {
      assert.match(src, new RegExp(`page${index + 1}\\.png$`));
    }
    for (const src of configured) {
      const png = await readFile(new URL(`../public${src}`, import.meta.url));
      assert.equal(png.subarray(1, 4).toString(), 'PNG', src);
      assert.ok(png.readUInt32BE(16) >= 1200 && png.readUInt32BE(20) >= 1000, src);
    }
  }
});
