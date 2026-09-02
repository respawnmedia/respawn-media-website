/**
 * GET /api/careers/config
 * Vercel Node serverless. Proxies Apps Script doGet. Secret never reaches the browser.
 */

module.exports.config = {
  runtime: 'nodejs',
  api: { bodyParser: false }
};

const CACHE_MS = 120000;
let cache = { at: 0, status: 0, body: '' };

function sendJson(res, status, obj, extraHeaders) {
  const headers = Object.assign({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': status === 200 ? 'public, max-age=120' : 'no-store'
  }, extraHeaders || {});
  Object.keys(headers).forEach(function (k) {
    res.setHeader(k, headers[k]);
  });
  res.statusCode = status;
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Cache-Control', 'no-store');
    res.end('');
    return;
  }
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
    return;
  }

  const scriptUrl = process.env.CAREERS_APPS_SCRIPT_URL;
  const secret = process.env.CAREERS_API_SECRET;
  if (!scriptUrl || !secret) {
    sendJson(res, 503, { ok: false, error: 'config_unavailable' });
    return;
  }

  const now = Date.now();
  if (cache.body && now - cache.at < CACHE_MS) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.statusCode = cache.status;
    res.end(cache.body);
    return;
  }

  const url = scriptUrl + (scriptUrl.indexOf('?') >= 0 ? '&' : '?') + 'token=' + encodeURIComponent(secret);

  try {
    const gasRes = await fetch(url, { method: 'GET', redirect: 'follow' });
    const text = await gasRes.text();
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      sendJson(res, 502, { ok: false, error: 'config_unavailable' });
      return;
    }
    if (!parsed || parsed.ok !== true) {
      sendJson(res, 502, { ok: false, error: 'config_unavailable' });
      return;
    }
    const body = JSON.stringify(parsed);
    cache = { at: now, status: 200, body: body };
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.statusCode = 200;
    res.end(body);
  } catch (e) {
    sendJson(res, 502, { ok: false, error: 'config_unavailable' });
  }
}
