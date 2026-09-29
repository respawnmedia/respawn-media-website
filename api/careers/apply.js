/**
 * POST /api/careers/apply
 * Vercel Node serverless. Multipart proxy. Validates honeypot, size, and file type.
 * Forwards JSON + base64 resume to Apps Script. Does not log applicant PII.
 */

module.exports.config = {
  runtime: 'nodejs',
  maxDuration: 60,
  api: {
    bodyParser: false
  }
};

const MAX_BODY_BYTES = 6 * 1024 * 1024;
const MAX_RESUME_BYTES = 5.5 * 1024 * 1024;
const MAX_RESUME_DECLARED = 10 * 1024 * 1024;
const ALLOWED_EXT = { pdf: true, doc: true, docx: true };
const ALLOWED_MIME = {
  'application/pdf': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
  'application/octet-stream': true
};

function sendJson(res, status, obj) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = status;
  res.end(JSON.stringify(obj));
}

function mapError(code) {
  const table = {
    unauthorized: [401, 'unauthorized'],
    role_closed: [409, 'role_closed'],
    unknown_role: [400, 'unknown_role'],
    missing_field: [400, 'missing_field'],
    invalid_email: [400, 'invalid_email'],
    invalid_url: [400, 'invalid_url'],
    invalid_file_type: [400, 'invalid_file_type'],
    file_too_large: [413, 'file_too_large'],
    resume_required: [400, 'resume_required'],
    upload_failed: [502, 'upload_failed'],
    timeout: [504, 'timeout'],
    submit_failed: [502, 'submit_failed']
  };
  return table[code] || [502, 'submit_failed'];
}

function readRawBody(req) {
  return new Promise(function (resolve, reject) {
    const chunks = [];
    let size = 0;
    req.on('data', function (chunk) {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        const err = new Error('too_large');
        err.code = 'too_large';
        reject(err);
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', function () {
      resolve(Buffer.concat(chunks));
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Cache-Control', 'no-store');
    res.end('');
    return;
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
    return;
  }

  const scriptUrl = process.env.CAREERS_APPS_SCRIPT_URL;
  const secret = process.env.CAREERS_API_SECRET;
  if (!scriptUrl || !secret) {
    sendJson(res, 503, { ok: false, error: 'submit_failed' });
    return;
  }

  let buf;
  try {
    buf = await readRawBody(req);
  } catch (e) {
    if (e && e.code === 'too_large') {
      sendJson(res, 413, { ok: false, error: 'file_too_large' });
      return;
    }
    sendJson(res, 400, { ok: false, error: 'submit_failed' });
    return;
  }

  const contentType = String(req.headers['content-type'] || '');
  let fields;
  let file;
  try {
    const parsed = parseBody(contentType, buf);
    fields = parsed.fields;
    file = parsed.file;
  } catch (e) {
    sendJson(res, 400, { ok: false, error: 'submit_failed' });
    return;
  }

  var hp = String(fields.hp_confirm || fields.website || '').trim();
  if (hp) {
    sendJson(res, 200, { ok: false, error: 'submit_failed', ignored: true });
    return;
  }

  let payload;
  try {
    payload = fields.payload ? JSON.parse(fields.payload) : {
      role_id: fields.role_id,
      answers: fields.answers ? JSON.parse(fields.answers) : {},
      utm_source: fields.utm_source || '',
      utm_medium: fields.utm_medium || '',
      utm_campaign: fields.utm_campaign || '',
      utm_content: fields.utm_content || '',
      utm_term: fields.utm_term || '',
      referrer: fields.referrer || ''
    };
  } catch (e) {
    sendJson(res, 400, { ok: false, error: 'submit_failed' });
    return;
  }

  if (!payload.role_id) {
    sendJson(res, 400, { ok: false, error: 'missing_field' });
    return;
  }
  payload.answers = prepareAnswers(payload.answers || {});
  if (isBlankValue(payload.answers.current_company)) payload.answers.current_company = '-';
  if (isBlankValue(payload.answers.anything_else)) payload.answers.anything_else = '-';
  try {
    const cfg = await loadCareersConfig(scriptUrl, secret);
    payload.answers = fillOptionalBlanks(payload.answers, questionsForRole(cfg, payload.role_id));
  } catch (e) {}

  if (file) {
    const ext = extOf(file.filename);
    if (!ALLOWED_EXT[ext]) {
      sendJson(res, 400, { ok: false, error: 'invalid_file_type' });
      return;
    }
    if (file.data.length > MAX_RESUME_DECLARED) {
      sendJson(res, 413, { ok: false, error: 'file_too_large' });
      return;
    }
    if (file.data.length > MAX_RESUME_BYTES) {
      sendJson(res, 413, { ok: false, error: 'file_too_large' });
      return;
    }
    if (file.mime && !ALLOWED_MIME[file.mime] && file.mime.indexOf('officedocument') === -1) {
      sendJson(res, 400, { ok: false, error: 'invalid_file_type' });
      return;
    }
    payload.resume = {
      filename: file.filename,
      mimeType: file.mime || '',
      base64: file.data.toString('base64')
    };
  }

  payload.api_secret = secret;

  try {
    let parsed = await postToAppsScript(scriptUrl, payload);
    let tries = 0;
    while (parsed && parsed.ok !== true && tries < 4) {
      tries += 1;
      if (parsed.error === 'invalid_url' || parsed.error === 'missing_field') {
        const field = parsed.field;
        if (parsed.error === 'missing_field' && field && isCoreField(field)) break;
        payload.answers = prepareAnswers(payload.answers, { legacy: true, field: field });
        if (field && isBlankValue(payload.answers[field])) {
          payload.answers[field] = (isInstagramField(field) || isLinkField(field)) ? 'https://n/a' : '-';
        }
        parsed = await postToAppsScript(scriptUrl, payload);
        continue;
      }
      break;
    }
    if (!parsed || parsed.ok !== true) {
      const mapped = mapError(parsed && parsed.error);
      sendJson(res, mapped[0], { ok: false, error: mapped[1], field: parsed && parsed.field });
      return;
    }
    sendJson(res, 200, { ok: true, application_id: parsed.application_id || '' });
  } catch (e) {
    const timedOut = e && (e.name === 'AbortError' || e.code === 'ABORT_ERR');
    sendJson(res, timedOut ? 504 : 502, { ok: false, error: timedOut ? 'timeout' : 'submit_failed' });
  }
}

function looksLikeEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());
}

function isCoreField(key) {
  const k = String(key || '').toLowerCase();
  return {
    full_name: true,
    email: true,
    whatsapp: true,
    resume: true,
    portfolio_urls: true,
    years_experience: true,
    current_city: true,
    intern_current_city: true,
    cd_city: true,
    ugc_city: true,
    availability: true,
    join_timeline: true,
    cd_availability: true,
    typical_availability: true,
    current_availability: true,
    willing_onsite: true,
    chennai_wfo_confirm: true,
    chennai_office: true,
    chennai_availability: true,
    languages: true,
    languages_understood: true,
    best_language: true
  }[k] === true;
}

function isBlankValue(v) {
  if (v == null) return true;
  if (Array.isArray(v)) return !v.length;
  return String(v).trim() === '';
}

function questionsForRole(cfg, roleId) {
  const data = (cfg && cfg.data) || cfg || {};
  const uni = data.universalQuestions || [];
  const roles = data.roles || [];
  const needle = String(roleId || '').trim().toLowerCase();
  let role = null;
  roles.forEach(function (r) {
    if (!r) return;
    if (String(r.role_id || '').trim().toLowerCase() === needle) role = r;
    if (!role && String(r.slug || '').trim().toLowerCase() === needle) role = r;
  });
  return uni.concat((role && role.questions) || []);
}

function fillOptionalBlanks(answers, questions) {
  const out = Object.assign({}, answers || {});
  (questions || []).forEach(function (q) {
    if (!q || q.type === 'file') return;
    const k = q.question_key;
    if (!k || isCoreField(k)) return;
    if (!isBlankValue(out[k])) return;
    if (isInstagramField(k) || isLinkField(k) || String(q.type || '').toLowerCase() === 'url') {
      out[k] = 'https://n/a';
      return;
    }
    out[k] = '-';
  });
  return out;
}

async function loadCareersConfig(scriptUrl, secret) {
  const url = scriptUrl + (scriptUrl.indexOf('?') >= 0 ? '&' : '?') + 'token=' + encodeURIComponent(secret);
  const res = await readTimed(url, { method: 'GET', redirect: 'follow' }, 12000);
  return parseJsonLoose(await res.text());
}

function isInstagramField(key) {
  const k = String(key || '').toLowerCase();
  return k === 'instagram' || k === 'instagram_if_relevant' || k === 'cd_instagram' || k === 'ig_profile';
}

function isLinkField(key) {
  const k = String(key || '').toLowerCase();
  if (k === 'email' || k === 'full_name' || k === 'whatsapp' || k === 'current_city' || k === 'years_experience' || k === 'availability' || k === 'current_company' || k === 'anything_else') return false;
  return /instagram|portfolio|url|website|profile|social|creator_page|sample|writing|link/.test(k);
}

const SKIP_LINK = /^(n\/a|na|none|nil|-|no)$/i;

function prepareAnswers(answers, opts) {
  opts = opts || {};
  const out = Object.assign({}, answers || {});
  Object.keys(out).forEach(function (k) {
    if (typeof out[k] !== 'string') return;
    if (k === 'email') return;
    out[k] = out[k].split(/\r?\n/).map(function (line) {
      return normalizeAnswerLine(k, line, opts.legacy);
    }).join('\n');
  });
  ['instagram', 'instagram_if_relevant', 'cd_instagram', 'ig_profile'].forEach(function (k) {
    const s = String(out[k] == null ? '' : out[k]).trim();
    if (!s || SKIP_LINK.test(s)) out[k] = opts.legacy ? 'https://n/a' : 'no';
  });
  if (opts.legacy && opts.field && !isInstagramField(opts.field)) {
    const current = String(out[opts.field] == null ? '' : out[opts.field]).trim();
    if (!current || SKIP_LINK.test(current) || !/^https?:\/\//i.test(current)) {
      out[opts.field] = (!current || SKIP_LINK.test(current) || current.indexOf(' ') !== -1)
        ? 'https://n/a'
        : 'https://' + current.replace(/^\/\//, '');
    }
  }
  return out;
}

function normalizeAnswerLine(key, line, legacy) {
  const s = String(line || '').trim();
  if (!s || looksLikeEmail(s)) return line;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.charAt(0) === '@' && (isInstagramField(key) || isLinkField(key))) {
    return 'https://instagram.com/' + s.slice(1);
  }
  if (SKIP_LINK.test(s) && (isLinkField(key) || isInstagramField(key))) {
    if (isInstagramField(key) && !legacy) return 'no';
    return 'https://n/a';
  }
  if (s.indexOf(' ') === -1 && s.indexOf('@') === -1 && /\.[a-z]{2,}/i.test(s) && s.length < 200) {
    return 'https://' + s.replace(/^\/\//, '');
  }
  return line;
}

function parseJsonLoose(text) {
  const stripped = String(text || '').replace(/^\uFEFF/, '').replace(/^\)\]\}'\s*/, '').trim();
  if (!stripped) return null;
  try {
    return JSON.parse(stripped);
  } catch (e) {
    const start = stripped.indexOf('{');
    const end = stripped.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(stripped.slice(start, end + 1));
    } catch (e2) {
      return null;
    }
  }
}

async function readTimed(url, opts, ms) {
  const ac = new AbortController();
  const timer = setTimeout(function () { ac.abort(); }, ms);
  try {
    return await fetch(url, Object.assign({}, opts, { signal: ac.signal }));
  } finally {
    clearTimeout(timer);
  }
}

async function postToAppsScript(scriptUrl, payload) {
  // One POST only. Apps Script MimeType.JSON 302s to googleusercontent;
  // following that as another POST would duplicate the Sheet row.
  const first = await readTimed(scriptUrl, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }, 48000);

  let text = '';
  const loc = first.headers.get('location') || '';
  if (first.status >= 300 && first.status < 400 && loc) {
    if (/accounts\.google\.com/i.test(loc)) {
      return { ok: false, error: 'submit_failed' };
    }
    try { await first.arrayBuffer(); } catch (e) {}
    const abs = new URL(loc, scriptUrl).href;
    const second = await readTimed(abs, { method: 'GET', redirect: 'follow' }, 15000);
    text = await second.text();
  } else {
    text = await first.text();
  }
  return parseJsonLoose(text);
}

function extOf(name) {
  const parts = String(name || '').toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() : '';
}

function parseBody(contentType, buf) {
  if (contentType.indexOf('multipart/form-data') !== -1) {
    const m = contentType.match(/boundary=([^;]+)/i);
    if (!m) throw new Error('boundary');
    return parseMultipart(buf, m[1].trim().replace(/^"|"$/g, ''));
  }

  if (contentType.indexOf('application/json') !== -1) {
    const obj = JSON.parse(buf.toString('utf8') || '{}');
    return { fields: { payload: JSON.stringify(obj), website: obj.website || '' }, file: null };
  }

  return { fields: {}, file: null };
}

function parseMultipart(buffer, boundary) {
  const delim = Buffer.from('--' + boundary);
  const fields = {};
  let file = null;
  let start = indexOfBuffer(buffer, delim, 0);
  while (start !== -1) {
    const after = start + delim.length;
    if (buffer.slice(after, after + 2).toString() === '--') break;
    let partStart = after;
    if (buffer.slice(partStart, partStart + 2).toString() === '\r\n') partStart += 2;
    const next = indexOfBuffer(buffer, delim, partStart);
    if (next === -1) break;
    let part = buffer.slice(partStart, next);
    if (part.slice(-2).toString() === '\r\n') part = part.slice(0, -2);
    const headerSplit = indexOfBuffer(part, Buffer.from('\r\n\r\n'), 0);
    if (headerSplit === -1) {
      start = next;
      continue;
    }
    const header = part.slice(0, headerSplit).toString('utf8');
    const body = part.slice(headerSplit + 4);
    const nameMatch = header.match(/name="([^"]+)"/i);
    const fileMatch = header.match(/filename="([^"]*)"/i);
    const mimeMatch = header.match(/Content-Type:\s*([^\r\n]+)/i);
    if (!nameMatch) {
      start = next;
      continue;
    }
    const name = nameMatch[1];
    if (fileMatch && fileMatch[1]) {
      file = {
        field: name,
        filename: fileMatch[1],
        mime: mimeMatch ? mimeMatch[1].trim() : '',
        data: body
      };
    } else {
      fields[name] = body.toString('utf8');
    }
    start = next;
  }
  return { fields: fields, file: file };
}

function indexOfBuffer(hay, needle, from) {
  for (let i = from; i <= hay.length - needle.length; i++) {
    let ok = true;
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return i;
  }
  return -1;
}
