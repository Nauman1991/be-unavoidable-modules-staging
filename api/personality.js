const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  // CORS (if needed, but usually not for same-origin Vercel functions)
  if (req.method === 'OPTIONS') return res.status(200).end();

  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/bu_session=([^;]+)/);
  if (!match) return res.status(401).json({ error: 'Not authenticated' });

  const sessionId = match[1];

  try {
    // 1. Verify Session
    const sessionResult = await sql`
      SELECT user_id FROM sessions 
      WHERE id = ${sessionId} AND expires_at > NOW()
    `;
    const session = sessionResult.rows[0];
    if (!session) return res.status(401).json({ error: 'Session expired' });

    const userId = session.user_id;

    // 2. Handle GET (Retrieve Profile)
    if (req.method === 'GET') {
      const result = await sql`SELECT profile_data, message_history, is_completed FROM personality_responses WHERE user_id = ${userId}::uuid`;
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      return res.status(200).json(result.rows[0]);
    }

    // 3. Handle POST (Save/Update Profile)
    if (req.method === 'POST') {
      const { profile_data, message_history, is_completed } = req.body;

      let comp = is_completed !== undefined ? is_completed : false;

      // If they passed undefined, we don't want to insert 'null' string.
      // Better to check and upsert selectively, or we can use EXCLUDED and COALESCE
      await sql`
        INSERT INTO personality_responses (user_id, profile_data, message_history, is_completed)
        VALUES (
          ${userId}::uuid, 
          ${profile_data ? JSON.stringify(profile_data) : null}, 
          ${message_history ? JSON.stringify(message_history) : null}, 
          ${comp}
        )
        ON CONFLICT (user_id) DO UPDATE SET
          profile_data = COALESCE(EXCLUDED.profile_data, personality_responses.profile_data),
          message_history = COALESCE(EXCLUDED.message_history, personality_responses.message_history),
          is_completed = COALESCE(EXCLUDED.is_completed, personality_responses.is_completed),
          updated_at = NOW()
      `;

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Personality API error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
