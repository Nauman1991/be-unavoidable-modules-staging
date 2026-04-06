const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/bu_session=([^;]+)/);
  if (!match) return res.status(401).json({ error: 'Not authenticated' });

  const sessionId = match[1];

  try {
    const sessionResult = await sql`
      SELECT id, user_id FROM sessions
      WHERE id = ${sessionId} AND expires_at > NOW()
    `;
    const session = sessionResult.rows[0];
    if (!session) return res.status(401).json({ error: 'Session expired or invalid' });

    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
      || req.socket?.remoteAddress
      || null;

    await sql`
      INSERT INTO terms_acceptances (user_id, ip_address)
      VALUES (${session.user_id}, ${ip})
    `;

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Accept terms error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};
