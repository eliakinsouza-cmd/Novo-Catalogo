export async function onRequest(context) {
  const { searchParams } = new URL(context.request.url);
  const host = searchParams.get('host');
  const id   = searchParams.get('id');
  const size = searchParams.get('size') || 'medium';

  const VALID_HOSTS = ['ovosneaker', 'yefactory'];
  const VALID_SIZES = ['small', 'medium', 'large'];

  if (!host || !id ||
      !VALID_HOSTS.includes(host) ||
      !VALID_SIZES.includes(size) ||
      !/^[a-f0-9]+$/.test(id)) {
    return new Response('Invalid parameters', { status: 400 });
  }

  const imgUrl = `https://photo.yupoo.com/${host}/${id}/${size}.jpg`;

  try {
    const res = await fetch(imgUrl, {
      headers: {
        'Referer':         `https://${host}.x.yupoo.com/`,
        'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept':          'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Cache-Control':   'no-cache',
      },
    });

    if (!res.ok) {
      return new Response(`Upstream error: ${res.status}`, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type':                contentType,
        'Cache-Control':               'public, max-age=86400, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return new Response('Proxy error', { status: 502 });
  }
}
