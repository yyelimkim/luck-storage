// Who's taken: usernames and emails, one each across everyone (emails kept
// only as a hash).
//   GET  /api/accounts?username=<name>  -> {taken}
//   GET  /api/accounts?email=<email>    -> {taken}
//   POST /api/accounts {username, email} -> claims both: 201, or 409 {taken: 'username' | 'email'}
const { redis, connected, ipOf, bodyOf, limited, emailKey, seen } = require('./_redis');
const NAME = /^[a-z0-9._]{3,20}$/;
const EMAIL = /^\S+@\S+\.\S+$/;

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (!connected()) return res.status(503).json({ error: 'The store is not connected yet.', found: seen() });
  try {
    if (req.method === 'GET') {
      const username = String(req.query?.username || '').toLowerCase();
      const email = String(req.query?.email || '').trim().toLowerCase();
      if (username) {
        if (!NAME.test(username)) return res.status(400).json({ error: 'Not a username.' });
        return res.status(200).json({ taken: !!(await redis('EXISTS', `user:${username}`)) });
      }
      if (email) {
        if (!EMAIL.test(email)) return res.status(400).json({ error: 'Not an email.' });
        return res.status(200).json({ taken: !!(await redis('EXISTS', `email:${emailKey(email)}`)) });
      }
      return res.status(400).json({ error: 'username or email' });
    }
    if (req.method === 'POST') {
      const b = bodyOf(req);
      const username = String(b.username || '').toLowerCase();
      const email = String(b.email || '').trim().toLowerCase();
      if (!NAME.test(username) || !EMAIL.test(email)) return res.status(400).json({ error: 'A username and an email.' });
      if (await limited(`rla:${ipOf(req)}`, 10)) return res.status(429).json({ error: 'Try again in a while.' });
      if (await redis('EXISTS', `email:${emailKey(email)}`)) return res.status(409).json({ taken: 'email' });
      if (!(await redis('SET', `user:${username}`, String(Date.now()), 'NX'))) return res.status(409).json({ taken: 'username' });
      await redis('SET', `email:${emailKey(email)}`, username);
      return res.status(201).json({ username });
    }
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'GET or POST' });
  } catch (e) {
    return res.status(500).json({ error: 'The store could not be reached.' });
  }
};
