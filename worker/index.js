// Serves the site's static files, adding byte-range support for video.
//
// Cloudflare's static-asset serving answers a Range request with the whole
// file (200). iPhone Safari will not play a <video> unless the server answers
// "Range: bytes=0-1" with 206 Partial Content, so the hero video would only
// ever show its poster there. This Worker runs for /assets/video/* only (see
// run_worker_first in wrangler.jsonc); everything else is served directly.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/assets/video/')) return env.ASSETS.fetch(request);

    // Fetch the whole file without the Range header, then cut out the part asked for.
    const asset = await env.ASSETS.fetch(new Request(url, {method: 'GET'}));
    if (asset.status !== 200) return asset;

    const headers = new Headers(asset.headers);
    headers.set('Accept-Ranges', 'bytes');
    const range = request.headers.get('Range');
    if (!range) {
      return new Response(request.method === 'HEAD' ? null : asset.body, {status: 200, headers});
    }

    const body = await asset.arrayBuffer();
    const size = body.byteLength;
    const m = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    let start, end;
    if (m && m[1] !== '') {
      start = Number(m[1]);
      end = m[2] !== '' ? Math.min(Number(m[2]), size - 1) : size - 1;
    } else if (m && m[2] !== '') {
      // "bytes=-N": the last N bytes
      start = Math.max(0, size - Number(m[2]));
      end = size - 1;
    }
    if (start === undefined || start > end || start >= size) {
      headers.set('Content-Range', `bytes */${size}`);
      headers.delete('Content-Length');
      return new Response(null, {status: 416, headers});
    }

    headers.set('Content-Range', `bytes ${start}-${end}/${size}`);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(request.method === 'HEAD' ? null : body.slice(start, end + 1), {status: 206, headers});
  },
};
