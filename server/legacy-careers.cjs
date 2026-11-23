// Keep the existing private application backend during the account migration.
// Use its stable alias, never the custom domain (which would recurse after cutover).
module.exports = async function proxyCareers(res, route, body, contentType) {
  try {
    const response = await fetch('https://respawn-media-website.vercel.app/api/careers/' + route, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? { Accept: 'application/json' } : {
        Accept: 'application/json', 'Content-Type': contentType
      },
      body,
      redirect: 'error',
      signal: AbortSignal.timeout(55000)
    });
    if (!String(response.headers.get('content-type')).includes('application/json')) throw new Error('invalid_backend');
    const result = await response.json();
    if (!result || typeof result.ok !== 'boolean') throw new Error('invalid_backend');
    res.statusCode = response.status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', route === 'config' && response.ok ? 'public, max-age=120' : 'no-store');
    res.end(JSON.stringify(result));
  } catch (error) {
    const timeout = error.name === 'TimeoutError' || error.name === 'AbortError';
    res.statusCode = timeout ? 504 : 502;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end(JSON.stringify({ ok: false, error: timeout ? 'timeout' : route === 'config' ? 'config_unavailable' : 'submit_failed' }));
  }
};
