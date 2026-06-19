export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const type = searchParams.get('type');
  const host = searchParams.get('host');
  const id = searchParams.get('id');

  const VALID_HOSTS = ['ovosneaker', 'yefactory'];
  const validId = (type === 'album' || type === 'cat') ? /^\d+$/.test(id) : false;

  if (!type || !host || !id || !VALID_HOSTS.includes(host) || !validId) {
    return Response.json({ error: 'Invalid parameters', got: { type, host, id } }, { status: 400 });
  }

  const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Referer': `https://${host}.x.yupoo.com/`,
    'Cache-Control': 'no-cache',
  };

  try {
    const url = type === 'album'
      ? `https://${host}.x.yupoo.com/albums/${id}?uid=1`
      : `https://${host}.x.yupoo.com/categories/${id}`;

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      return Response.json({ error: `Upstream error: ${res.status}` }, { status: res.status });
    }

    const html = await res.text();

    if (type === 'album') {
      const rx = new RegExp(`photo\\.yupoo\\.com/${host}/([a-f0-9]+)/`, 'g');
      const photos = [...new Set([...html.matchAll(rx)].map(m => m[1]))];

      return Response.json({ cover: photos[0] || null, photos }, {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const albums = [...new Set([...html.matchAll(/\/albums\/(\d{6,12})/g)].map(m => m[1]))].slice(0, 80);
    return Response.json({ albums }, {
      headers: {
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 502 });
  }
}
