// The Wish Tree's shared wishes, kept in Upstash Redis (connected to the
// Vercel project under Storage, which sets the URL and token below).
//   GET  /api/wishes  -> the latest wishes, oldest first
//   POST /api/wishes  {id, text, fill, from} -> hangs one for everyone
const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const KEY = 'wishes';
const KEEP = 500;  // the most kept; older ones fall off
const SHOW = 200;  // the most handed out at once
const PER_HOUR = 10;  // wishes one address can hang in an hour
const FILLS = new Set(['#F0F0F0', '#F0F2A1', '#FC91B1']);  // the slips' paper colours

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

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!URL_ || !TOKEN) return res.status(503).json({ error: 'The wish store is not connected yet.' });
  try {
    if (req.method === 'GET') {
      const rows = await redis('LRANGE', KEY, '0', String(SHOW - 1));
      const wishes = rows.map((r) => { try { return JSON.parse(r); } catch (e) { return null; } }).filter(Boolean).reverse();
      return res.status(200).json(wishes);
    }
    if (req.method === 'POST') {
      let b = req.body;
      if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
      const text = typeof b?.text === 'string' ? b.text.trim() : '';
      const from = typeof b?.from === 'string' ? b.from.trim().slice(0, 40) : 'Anonymous';
      const id = typeof b?.id === 'string' && /^[a-z0-9]{8,24}$/.test(b.id) ? b.id : null;
      const fill = FILLS.has(String(b?.fill).toUpperCase()) ? String(b.fill).toUpperCase() : '#F0F0F0';
      if (!id || text.length < 3 || text.length > 250) return res.status(400).json({ error: 'A wish needs 3 to 250 characters.' });
      const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
      const n = await redis('INCR', `rl:${ip}`);
      if (n === 1) await redis('EXPIRE', `rl:${ip}`, '3600');
      if (n > PER_HOUR) return res.status(429).json({ error: 'That’s a lot of wishes. Try again in a while.' });
      const wish = { id, text, fill, from: from || 'Anonymous', t: Date.now() };
      await redis('LPUSH', KEY, JSON.stringify(wish));
      await redis('LTRIM', KEY, '0', String(KEEP - 1));
      return res.status(201).json(wish);
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'GET or POST' });
  } catch (e) {
    return res.status(500).json({ error: 'The wish store could not be reached.' });
  }
};
