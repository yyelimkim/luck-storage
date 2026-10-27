// Email verification: a 6-digit code, sent with Resend, good for 10 minutes.
//   POST /api/verify {email}       -> sends a code
//   POST /api/verify {email, code} -> {ok}
// Needs RESEND_API_KEY (and VERIFY_FROM, an address on a domain verified in
// Resend) set on the Vercel project, as well as the store.
const crypto = require('crypto');
const { redis, connected, ipOf, bodyOf, limited, emailKey } = require('./_redis');
const KEY = process.env.RESEND_API_KEY;
const FROM = process.env.VERIFY_FROM || 'Luck Corner <onboarding@resend.dev>';
const EMAIL = /^\S+@\S+\.\S+$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'POST' }); }
  if (!connected() || !KEY) return res.status(503).json({ error: 'Email verification is not set up yet.' });
  try {
    const b = bodyOf(req);
    const email = String(b.email || '').trim().toLowerCase();
    if (!EMAIL.test(email)) return res.status(400).json({ error: 'Not an email.' });
    const k = `verify:${emailKey(email)}`;
    if (b.code == null) {
      if (await limited(`rlv:${emailKey(email)}`, 5) || await limited(`rlvi:${ipOf(req)}`, 15)) {
        return res.status(429).json({ error: 'Too many codes. Try again in a while.' });
      }
      const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
      await redis('SET', k, code, 'EX', '600');
      await redis('DEL', `${k}:tries`);
      const sent = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: FROM,
          to: [email],
          subject: `${code} is your Luck Corner code`,
          text: `Your code for Luck Corner is ${code}.\n\nIt works for 10 minutes. If you didn't ask for it, you can ignore this email.`,
        }),
      });
      if (!sent.ok) return res.status(502).json({ error: 'The code couldn’t be sent.' });
      return res.status(200).json({ sent: true });
    }
    const tries = await redis('INCR', `${k}:tries`);
    if (tries === 1) await redis('EXPIRE', `${k}:tries`, '600');
    if (tries > 5) return res.status(429).json({ error: 'Too many tries. Send a new code.' });
    const want = await redis('GET', k);
    if (!want || String(b.code).trim() !== want) return res.status(400).json({ ok: false, error: 'That code doesn’t match.' });
    await redis('DEL', k);
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
};
