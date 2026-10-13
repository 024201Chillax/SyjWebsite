export const VIDEO_PATH = '/playground/maxxxine/motion-cloudflare.mp4';
export const VIDEO_BYTES = 24713129;

function rangeFor(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return null;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= size || end < start || (!match[1] && Number(match[2]) === 0)) return null;
  return {start, length: end - start + 1};
}

function sliceStream(body, start, length) {
  const reader = body.getReader();
  let skipped = 0;
  let remaining = length;
  return new ReadableStream({
    async pull(controller) {
      try {
        while (remaining > 0) {
          const {value, done} = await reader.read();
          if (done) throw new Error('Video asset ended before the requested range');
          const offset = Math.max(0, start - skipped);
          skipped += value.byteLength;
          if (offset >= value.byteLength) continue;
          const chunk = value.subarray(offset, offset + remaining);
          controller.enqueue(chunk);
          remaining -= chunk.byteLength;
          if (!remaining) {
            controller.close();
            await reader.cancel();
          }
          return;
        }
      } catch (error) {
        controller.error(error);
        await reader.cancel(error);
      }
    },
    cancel(reason) {return reader.cancel(reason);}
  });
}

export async function serveVideo(request, assets, ctx, size = VIDEO_BYTES) {
  if (new URL(request.url).pathname !== VIDEO_PATH) return null;
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', {status: 405, headers: {Allow: 'GET, HEAD'}});
  const originHeaders = new Headers(request.headers);
  originHeaders.delete('Range');
  originHeaders.delete('If-Range');
  const asset = await assets.fetch(new Request(request, {headers: originHeaders}));
  if (asset.status !== 200) return asset;
  const headers = new Headers(asset.headers);
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Content-Type', 'video/mp4');
  headers.set('Cache-Control', 'public, max-age=3600');
  let start = 0;
  let length = size;
  let status = 200;
  const range = request.method === 'GET' ? request.headers.get('Range') : null;
  const ifRange = request.headers.get('If-Range');
  if (range && (!ifRange || ifRange === headers.get('ETag') || ifRange === headers.get('Last-Modified'))) {
    const selected = rangeFor(range, size);
    if (!selected) {
      await asset.body?.cancel();
      headers.set('Content-Range', `bytes */${size}`);
      headers.delete('Content-Length');
      return new Response(null, {status: 416, headers});
    }
    ({start, length} = selected);
    status = 206;
    headers.set('Content-Range', `bytes ${start}-${start + length - 1}/${size}`);
  }
  headers.set('Content-Length', String(length));
  if (request.method === 'HEAD') return new Response(null, {headers});
  let body = status === 206 ? sliceStream(asset.body, start, length) : asset.body;
  // Workers uses fixed-length streams to retain Content-Length on streamed responses.
  if (typeof FixedLengthStream !== 'undefined') {
    const fixed = new FixedLengthStream(length);
    ctx.waitUntil(body.pipeTo(fixed.writable).catch(() => {}));
    body = fixed.readable;
  }
  return new Response(body, {status, headers});
}
