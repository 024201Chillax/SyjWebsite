const videoPath = '/playground/maxxxine/motion-web.mp4';

export async function serveMedia(request, bucket) {
  if (new URL(request.url).pathname !== videoPath) return null;
  if (!['GET', 'HEAD'].includes(request.method)) {
    return new Response('Method not allowed', {status: 405, headers: {Allow: 'GET, HEAD'}});
  }
  const key = videoPath.slice(1);
  const metadata = await bucket.head(key);
  if (!metadata) return new Response('Not found', {status: 404});
  const headers = new Headers({
    'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=86400', ETag: metadata.httpEtag,
    'Last-Modified': metadata.uploaded.toUTCString()
  });
  if (request.headers.get('If-None-Match') === metadata.httpEtag) {
    return new Response(null, {status: 304, headers});
  }
  let offset = 0;
  let length = metadata.size;
  let partial = false;
  const range = request.method === 'GET' ? request.headers.get('Range') : null;
  const ifRange = request.headers.get('If-Range');
  if (range && (!ifRange || ifRange === metadata.httpEtag || ifRange === headers.get('Last-Modified'))) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    if (!match || (!match[1] && !match[2])) {
      headers.set('Content-Range', `bytes */${metadata.size}`);
      return new Response(null, {status: 416, headers});
    }
    if (match[1]) {
      offset = Number(match[1]);
      const end = match[2] ? Math.min(Number(match[2]), metadata.size - 1) : metadata.size - 1;
      length = end - offset + 1;
    } else {
      length = Math.min(Number(match[2]), metadata.size);
      offset = metadata.size - length;
    }
    if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || offset >= metadata.size || length <= 0) {
      headers.set('Content-Range', `bytes */${metadata.size}`);
      return new Response(null, {status: 416, headers});
    }
    partial = true;
    headers.set('Content-Range', `bytes ${offset}-${offset + length - 1}/${metadata.size}`);
  }
  headers.set('Content-Length', String(length));
  if (request.method === 'HEAD') return new Response(null, {headers});
  const object = await bucket.get(key, partial ? {range: {offset, length}} : undefined);
  if (!object) return new Response('Not found', {status: 404});
  return new Response(object.body, {status: partial ? 206 : 200, headers});
}
