const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { user_id, role, status, goal, weighing, urgency } = req.body;

    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    try {
      await sql`
        CREATE TABLE IF NOT EXISTS intake_responses (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL UNIQUE,
          intake_role TEXT,
          intake_status TEXT,
          intake_goal TEXT,
          intake_weighing TEXT,
          intake_urgency TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        )
      `;

      await sql`
        INSERT INTO intake_responses (user_id, intake_role, intake_status, intake_goal, intake_weighing, intake_urgency)
        VALUES (${user_id}, ${role || ''}, ${status || ''}, ${goal || ''}, ${weighing || ''}, ${urgency || ''})
        ON CONFLICT (user_id) DO UPDATE SET
          intake_role = EXCLUDED.intake_role,
          intake_status = EXCLUDED.intake_status,
          intake_goal = EXCLUDED.intake_goal,
          intake_weighing = EXCLUDED.intake_weighing,
          intake_urgency = EXCLUDED.intake_urgency,
          updated_at = NOW()
      `;

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Intake save error:', error);
      return res.status(500).json({ error: 'Failed to save intake data: ' + error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};