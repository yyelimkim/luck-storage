// Accounts, kept online so they work on any phone: the email, username,
// name and birthday, the password (as a salted scrypt hash, never itself),
// and the account's things (clovers, earned luck, wishes and the rest).
//   POST /api/auth {action: 'signup', email, password, username, name, birthday, data}
//        -> {token, account}. Also how an account made on one phone before
//           accounts were online moves up (its email may already be
//           reserved for it, with the same username).
//   POST /api/auth {action: 'login', email, password} -> {token, account}
//        (422 if there's no such account online; 401 if the password's wrong)
//   POST /api/auth {action: 'save', token, data}      -> {ok}
//   POST /api/auth {action: 'delete', token}          -> {ok}
// A token lasts 90 days, renewed whenever it's used.
const crypto = require('crypto');
const { redis, connected, ipOf, bodyOf, limited, emailKey, seen } = require('./_redis');
const EMAIL = /^\S+@\S+\.\S+$/;
const NAME = /^[a-z0-9._]{3,20}$/;
const SESSION = 90 * 24 * 60 * 60;
const MAX_DATA = 64 * 1024;  // an account's things, as JSON

const scrypt = (password, salt) => new Promise((ok, fail) => {
  crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (e, key) => (e ? fail(e) : ok(key.toString('hex'))));
});
const acctKey = (email) => `acct:${emailKey(email)}`;
async function getAccount(email) {
  const raw = await redis('GET', acctKey(email));
  try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
const putAccount = (a) => redis('SET', acctKey(a.email), JSON.stringify(a));
// what the phone gets back: never the password's hash
const shown = (a) => ({ email: a.email, username: a.username, name: a.name, birthday: a.birthday, data: a.data || null });
async function newSession(email) {
  const token = crypto.randomBytes(32).toString('hex');
  await redis('SET', `sess:${token}`, emailKey(email), 'EX', String(SESSION));
  return token;
}
async function fromSession(token) {
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return null;
  const ek = await redis('GET', `sess:${token}`);
  if (!ek) return null;
  await redis('EXPIRE', `sess:${token}`, String(SESSION));
  const raw = await redis('GET', `acct:${ek}`);
  try { return raw ? JSON.parse(raw) : null; } catch (e) { return null; }
}
const cleanData = (d) => {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const s = JSON.stringify(d);
  return s.length > MAX_DATA ? null : JSON.parse(s);
};

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'POST' }); }
  if (!connected()) return res.status(503).json({ error: 'The store is not connected yet.', found: seen() });
  try {
    const b = bodyOf(req);
    const email = String(b.email || '').trim().toLowerCase();
    const password = typeof b.password === 'string' ? b.password : '';

    if (b.action === 'signup') {
      const username = String(b.username || '').toLowerCase();
      if (!EMAIL.test(email) || password.length < 8 || !NAME.test(username)) return res.status(400).json({ error: 'An email, a password of 8 or more, and a username.' });
      if (await limited(`rls:${ipOf(req)}`, 10)) return res.status(429).json({ error: 'Too many tries. Try again in a while.' });
      if (await getAccount(email)) return res.status(409).json({ taken: 'email', error: 'There’s already an account with this email.' });
      // the email: free, or reserved already for this same username
      const reservedFor = await redis('GET', `email:${emailKey(email)}`);
      if (reservedFor && reservedFor !== username) return res.status(409).json({ taken: 'email', error: 'There’s already an account with this email.' });
      // the username: free, or this email's own reservation
      if (reservedFor !== username && !(await redis('SET', `user:${username}`, String(Date.now()), 'NX'))) {
        return res.status(409).json({ taken: 'username', error: `@${username} is taken.` });
      }
      await redis('SET', `email:${emailKey(email)}`, username);
      const salt = crypto.randomBytes(16).toString('hex');
      const account = {
        email, username,
        name: String(b.name || '').trim().slice(0, 20) || username,
        birthday: /^\d{4}-\d{2}-\d{2}$/.test(String(b.birthday)) ? b.birthday : null,
        salt, hash: await scrypt(password, salt),
        data: cleanData(b.data),
        t: Date.now(),
      };
      await putAccount(account);
      return res.status(201).json({ token: await newSession(email), account: shown(account) });
    }

    if (b.action === 'login') {
      if (!EMAIL.test(email) || !password) return res.status(400).json({ error: 'An email and a password.' });
      if (await limited(`rll:${ipOf(req)}`, 30) || await limited(`rlle:${emailKey(email)}`, 10)) {
        return res.status(429).json({ error: 'Too many tries. Try again in a while.' });
      }
      const account = await getAccount(email);
      if (!account) return res.status(422).json({ missing: true, error: 'No account with that email yet.' });
      const hash = await scrypt(password, account.salt);
      if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(account.hash, 'hex'))) {
        return res.status(401).json({ error: 'That password doesn’t match this account.' });
      }
      return res.status(200).json({ token: await newSession(email), account: shown(account) });
    }

    if (b.action === 'save') {
      const account = await fromSession(b.token);
      if (!account) return res.status(401).json({ error: 'Not logged in.' });
      const data = cleanData(b.data);
      if (!data) return res.status(400).json({ error: 'Nothing to save.' });
      account.data = data;
      if (typeof data.name === 'string' && data.name.trim()) account.name = data.name.trim().slice(0, 20);
      if (/^\d{4}-\d{2}-\d{2}$/.test(String(data.birthday))) account.birthday = data.birthday;
      await putAccount(account);
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'delete') {
      const account = await fromSession(b.token);
      if (!account) return res.status(401).json({ error: 'Not logged in.' });
      await redis('DEL', acctKey(account.email));
      await redis('DEL', `email:${emailKey(account.email)}`);
      await redis('DEL', `user:${account.username}`);
      await redis('DEL', `sess:${b.token}`);
      return res.status(200).json({ ok: true });
    }

    return res.status(400).json({ error: 'signup, login, save or delete' });
  } catch (e) {
    return res.status(500).json({ error: 'Something went wrong. Try again.' });
  }
};
