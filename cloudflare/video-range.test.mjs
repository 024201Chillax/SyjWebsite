import {test} from 'node:test';
import assert from 'node:assert/strict';
import {serveVideo, VIDEO_PATH} from './video-range.mjs';
const data = new TextEncoder().encode('0123456789');
const assets = {async fetch(request) {
  assert.equal(request.headers.get('Range'), null);
  return new Response(request.method === 'HEAD' ? null : new ReadableStream({start(controller) {
    controller.enqueue(data.subarray(0, 4));
    controller.enqueue(data.subarray(4, 7));
    controller.enqueue(data.subarray(7));
    controller.close();
  }}), {headers: {ETag: '"video"'}});
}};
const url = `https://example.com${VIDEO_PATH}`;
test('seeking handles closed, open, suffix and oversized-end ranges across chunks', async () => {
  for (const [range, expected] of [['bytes=2-5', '2345'], ['bytes=7-', '789'], ['bytes=-3', '789'], ['bytes=8-99', '89']]) {
    const response = await serveVideo(new Request(url, {headers: {Range: range}}), assets, {}, data.length);
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('Content-Length'), String(expected.length));
    assert.equal(await response.text(), expected);
  }
});
test('invalid ranges return 416 and unmatched If-Range returns the complete video', async () => {
  for (const range of ['bytes=20-', 'bytes=8-2', 'bytes=-0', 'bytes=0-1,4-5']) {
    assert.equal((await serveVideo(new Request(url, {headers: {Range: range}}), assets, {}, data.length)).status, 416);
  }
  const response = await serveVideo(new Request(url, {headers: {Range: 'bytes=2-5', 'If-Range': '"old"'}}), assets, {}, data.length);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '0123456789');
});
test('HEAD reports file size; unrelated paths and write requests are not served', async () => {
  const head = await serveVideo(new Request(url, {method: 'HEAD'}), assets, {}, data.length);
  assert.equal(head.headers.get('Content-Length'), '10');
  assert.equal(await head.text(), '');
  assert.equal(await serveVideo(new Request('https://example.com/private.txt'), assets, {}), null);
  assert.equal((await serveVideo(new Request(url, {method: 'POST'}), assets, {})).status, 405);
});
