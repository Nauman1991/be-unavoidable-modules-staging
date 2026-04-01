const { sql } = require('@vercel/postgres');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51T9ywX6Jc3gz0AUfWaieYGufeJGhDVzd5wZBBxlztChLng9BPwKxczreGPwO4OT8Ol4baARzwVGIvctRcX7gSFCq00MV1aiQUm');

module.exports = async function handler(req, res) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/bu_session=([^;]+)/);
  if (!match) return res.status(401).json({ authenticated: false });

  const sessionId = match[1];

  try {
    // 1. Verify Session
    const sessionResult = await sql`
      SELECT id, user_id, expires_at FROM sessions 
      WHERE id = ${sessionId} AND expires_at > NOW()
    `;
    const session = sessionResult.rows[0];
    if (!session) return res.status(401).json({ authenticated: false });

    // 2. Get User (safely check for 'paid' column)
    let user;
    try {
      const userResult = await sql`SELECT id, name, email, paid FROM users WHERE id = ${session.user_id}`;
      user = userResult.rows[0];
    } catch (e) {
      // Fallback if 'paid' column is missing
      const userResult = await sql`SELECT id, name, email FROM users WHERE id = ${session.user_id}`;
      user = userResult.rows[0];
      user.paid = false; // Default if column missing
    }

    if (!user) return res.status(401).json({ authenticated: false });

    // 3. Optional Metadata (Intake & CCE)
    let intake_done = false;
    let intake_data = null;
    let conversation_count = 0;

    try {
      const intakeResult = await sql`SELECT * FROM intake_responses WHERE user_id = ${user.id}::text`;
      if (intakeResult.rows[0]) {
        intake_done = true;
        const row = intakeResult.rows[0];
        intake_data = {
          role: row.intake_role,
          status: row.intake_status,
          goal: row.intake_goal,
          weighing: row.intake_weighing,
          urgency: row.intake_urgency
        };
      }
    } catch (e) {
      console.warn('Intake check failed (table might be missing)');
    }

    try {
      const cceResult = await sql`SELECT count(*) FROM cce_responses WHERE user_id = ${user.id}`;
      conversation_count = parseInt(cceResult.rows[0]?.count || '0');
    } catch (e) {
      console.warn('CCE check failed (table might be missing)');
    }

    // New: Personality Check
    let personality_done = false;
    let personality_data = null;
    try {
      const personalityResult = await sql`SELECT profile_data FROM personality_responses WHERE user_id = ${user.id}`;
      if (personalityResult.rows[0]) {
        personality_done = true;
        personality_data = personalityResult.rows[0].profile_data;
      }
    } catch (e) {
      console.warn('Personality check failed (table might be missing)');
    }

    // 4. Stripe Check (if applicable)
    let paid = user.paid || false;
    const { session_id } = req.query;
    if (session_id && !paid) {
      try {
        const stripeSession = await stripe.checkout.sessions.retrieve(session_id);
        if (stripeSession.payment_status === 'paid') {
          if (stripeSession.metadata.userId === user.id) {
            await sql`UPDATE users SET paid = TRUE WHERE id = ${user.id}::uuid`;
            paid = true;
          }
        }
      } catch (se) {
        console.warn('Stripe check failed:', se.message);
      }
    }

    return res.status(200).json({ 
      authenticated: true, 
      name: user.name, 
      email: user.email, 
      userId: user.id, 
      intake_done,
      paid,
      conversation_count,
      intake: intake_data,
      personality_done,
      personality: personality_data
    });

  } catch (err) {
    console.error('Verify core error:', err);
    return res.status(500).json({ error: 'Server error: ' + err.message });
  }
};