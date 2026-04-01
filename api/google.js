const { sql } = require('@vercel/postgres');
const { v4: uuidv4 } = require('uuid');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'https://www.beunavoidable.com/api/google';

module.exports = async function handler(req, res) {
  const { code, error } = req.query;

  // No code = start OAuth flow
  if (!code && !error) {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });
    return res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  }

  if (error || !code) return res.redirect(302, '/login.html?error=google_denied');

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.access_token) return res.redirect(302, '/login.html?error=google_token');

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const googleUser = await userRes.json();
    if (!googleUser.email) return res.redirect(302, '/login.html?error=google_user');

    const existing = await sql`SELECT id, name FROM users WHERE email = ${googleUser.email.toLowerCase()}`;
    let userId;

    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
    } else {
      userId = uuidv4();
      const userName = googleUser.name || googleUser.email.split('@')[0];
      await sql`
        INSERT INTO users (id, email, name, provider, google_id, created_at)
        VALUES (${userId}, ${googleUser.email.toLowerCase()}, ${userName}, 'google', ${googleUser.id}, NOW())
      `;
    }

    const sessionId = uuidv4();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await sql`
      INSERT INTO sessions (id, user_id, expires_at, created_at)
      VALUES (${sessionId}, ${userId}, ${expires.toISOString()}, NOW())
    `;

    res.setHeader('Set-Cookie', `bu_session=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=${expires.toUTCString()}`);
    return res.redirect(302, '/dashboard.html');
  } catch (err) {
    console.error('Google OAuth error:', err);
    return res.redirect(302, '/login.html?error=server');
  }
};
