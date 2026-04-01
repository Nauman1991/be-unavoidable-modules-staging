const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    await sql`
      INSERT INTO users (id, email, name, password_hash, provider, created_at)
      VALUES (${userId}, ${email.toLowerCase()}, ${name}, ${hash}, 'email', NOW())
    `;

    const sessionId = uuidv4();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES (${sessionId}, ${userId}, ${expires.toISOString()}, NOW())
    `;

    res.setHeader('Set-Cookie', `bu_session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${expires.toUTCString()}`);
    return res.status(200).json({ success: true, name });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
