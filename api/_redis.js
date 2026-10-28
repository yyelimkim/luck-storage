// Upstash Redis over its REST API (connected to the Vercel project under
// Storage, which sets the URL and token). Shared by the api/ functions.
// Found under whatever prefix Vercel gave them (KV_, UPSTASH_REDIS_, or a
// custom one, as STORAGE_KV_...), or from a plain redis:// URL
const env = process.env;
const pick = (end) => {
  const k = Object.keys(env).find((n) => n.endsWith(end) && env[n]);
  return k ? env[k] : null;
};
let URL_ = pick('KV_REST_API_URL') || pick('REDIS_REST_URL');
let TOKEN = pick('KV_REST_API_TOKEN') || pick('REDIS_REST_TOKEN');
if (!URL_ || !TOKEN) {
  const raw = pick('REDIS_URL') || pick('KV_URL');
  try {
    const u = new URL(raw);
    if (u.hostname && u.password) { URL_ = `https://${u.hostname}`; TOKEN = decodeURIComponent(u.password); }
  } catch (e) { /* not a URL */ }
}
// for working out why it isn't: the names of what's set (never the values)
const seen = () => Object.keys(env).filter((n) => /REDIS|KV|UPSTASH/i.test(n));

async function redis(...cmd) {
  const r = await fetch(URL_, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error);
  return j.result;
}
const connected = () => !!(URL_ && TOKEN);
const ipOf = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
const bodyOf = (req) => {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  return b || {};
};
// at most `max` of something per `key` an hour
async function limited(key, max) {
  const n = await redis('INCR', key);
  if (n === 1) await redis('EXPIRE', key, '3600');
  return n > max;
}
// emails are kept only as a hash
const emailKey = (email) => require('crypto').createHash('sha256').update(`luck-corner:${String(email).trim().toLowerCase()}`).digest('hex');

module.exports = { redis, connected, ipOf, bodyOf, limited, emailKey, seen };
