export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const type = searchParams.get('type');
  const host = searchParams.get('host');
  const id   = searchParams.get('id');

  const VALID_HOSTS = ['ovosneaker', 'yefactory'];

  const validId = type === 'album'
    ? /^[a-f0-9]+$/.test(id)
    : /^\d+$/.test(id);

  if (!type || !host || !id || !VALID_HOSTS.includes(host) || !validId) {
    return new Response(JSON.stringify({ error: 'Invalid parameters', got: { type, host, id } }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const HEADERS = {
    'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer':         `https://${host}.x.yupoo.com/`,
    'Cache-Control':   'no-cache',
    'Pragma':          'no-cache',
  };

  try {
    if (type === 'album') {
      const url = `https://${host}.x.yupoo.com/albums/${id}?uid=1`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Upstream error: ${res.status}` }), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const html = await res.text();
      const rx = new RegExp(`photo\\.yupoo\\.com/${host}/([a-f0-9]+)/`, 'g');
      const ids = [...new Set([...html.matchAll(rx)].map(m => m[1]))];
      return new Response(JSON.stringify({ cover: ids[0] || null, photos: ids }), {
        status: 200,
        headers: {
          'Content-Type':                'application/json',
          'Cache-Control':               'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } else if (type === 'cat') {
      const url = `https://${host}.x.yupoo.com/categories/${id}`;
      const res = await fetch(url, { headers: HEADERS });
      if (!res.ok) {
        return new Response(JSON.stringify({ error: `Upstream error: ${res.status}` }), {
          status: res.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const html = await res.text();
      const albumIds = [...new Set((html.match(/\b(\d{8,12})\b/g) || []))].slice(0, 30);
      return new Response(JSON.stringify({ albums: albumIds }), {
        status: 200,
        headers: {
          'Content-Type':                'application/json',
          'Cache-Control':               'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });

    } else {
      return new Response(JSON.stringify({ error: 'Invalid type' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
