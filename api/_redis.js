// Upstash Redis over its REST API (connected to the Vercel project under
// Storage, which sets the URL and token). Shared by the api/ functions.
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

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

module.exports = { redis, connected, ipOf, bodyOf, limited, emailKey };
