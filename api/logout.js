const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/bu_session=([^;]+)/);
  const sessionId = match ? match[1] : null;

  if (sessionId) {
    try {
      await sql`DELETE FROM sessions WHERE id = ${sessionId}`;
    } catch (err) {
      console.error('Logout error:', err);
    }
  }

  res.setHeader('Set-Cookie', 'bu_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  return res.redirect(302, '/login.html');
};
