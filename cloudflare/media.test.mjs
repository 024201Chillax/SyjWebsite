import {test} from 'node:test';
import assert from 'node:assert/strict';
import {serveMedia} from './media.mjs';

const data = new TextEncoder().encode('0123456789');
const bucket = {
  async head() {return {size: data.length, httpEtag: '"sample"', uploaded: new Date('2026-10-13T00:00:00Z')};},
  async get(key, options) {
    const range = options?.range;
    return {body: range ? data.slice(range.offset, range.offset + range.length) : data};
  }
};
const url = 'https://example.com/playground/maxxxine/motion-web.mp4';
test('plays the complete video and supports HEAD without downloading its body', async () => {
  const response = await serveMedia(new Request(url), bucket);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '0123456789');
  const head = await serveMedia(new Request(url, {method: 'HEAD'}), bucket);
  assert.equal(head.headers.get('Content-Length'), '10');
  assert.equal(await head.text(), '');
});
test('seeking returns only requested bytes, including open and suffix ranges', async () => {
  for (const [range, expected] of [['bytes=2-5', '2345'], ['bytes=7-', '789'], ['bytes=-3', '789']]) {
    const response = await serveMedia(new Request(url, {headers: {Range: range}}), bucket);
    assert.equal(response.status, 206);
    assert.equal(await response.text(), expected);
  }
});
test('rejects invalid ranges and returns a cached response for matching ETags', async () => {
  for (const range of ['bytes=20-', 'bytes=8-2', 'bytes=-0', 'bytes=0-1,4-5']) {
    assert.equal((await serveMedia(new Request(url, {headers: {Range: range}}), bucket)).status, 416);
  }
  assert.equal((await serveMedia(new Request(url, {headers: {'If-None-Match': '"sample"'}}), bucket)).status, 304);
});
test('does not expose other objects or accept writes', async () => {
  assert.equal(await serveMedia(new Request('https://example.com/private.txt'), bucket), null);
  assert.equal((await serveMedia(new Request(url, {method: 'POST'}), bucket)).status, 405);
});
