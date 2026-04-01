const { sql } = require('@vercel/postgres');

async function runMigration() {
  try {
    console.log('Running migration: Adding paid column to users table...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS paid BOOLEAN DEFAULT FALSE`;
    console.log('Migration successful.');
    
    // Also create cce_responses if missing to prevent verify errors
    console.log('Creating cce_responses table if missing...');
    await sql`
      CREATE TABLE IF NOT EXISTS cce_responses (
        id SERIAL PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        message_history JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    console.log('Setup complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
  }
}

runMigration();
