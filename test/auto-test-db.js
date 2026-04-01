const fs = require('fs');
const path = require('path');
const dotenvPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(dotenvPath, 'utf8');
const url = env.match(/POSTGRES_URL="([^"]+)"/)[1];

const { createPool } = require('@vercel/postgres');
const pool = createPool({ connectionString: url });

async function runTest() {
  console.log('--- Starting Database Save Test on Newly Linked Database ---');
  
  try {
    let userRes = await pool.query('SELECT id FROM users LIMIT 1');
    let testUserId;
    if (userRes.rowCount === 0) {
      console.log('No users found in this Neon database. Injecting a fake test user to satisfy foreign key constraints...');
      // Insert a fake user so the test can proceed
      await pool.query(`INSERT INTO users (name, email, provider) VALUES ('Test User', 'test@example.com', 'email') ON CONFLICT DO NOTHING`);
      userRes = await pool.query('SELECT id FROM users LIMIT 1');
      if (userRes.rowCount === 0) throw new Error('Could not create fake user.');
    }
    testUserId = userRes.rows[0].id;
    console.log('✅ Found valid user ID:', testUserId);

    const fakeMessageHistory = [
      { role: 'assistant', content: 'Welcome to the personality assessment. How do you handle pressure?' },
      { role: 'user', content: 'I usually take a step back and breathe before acting. Sometimes "I" just need space.' }
    ];
    
    const fakeProfileData = {
      primaryTrait: 'Analytical',
      scores: { dominance: 40, influence: 50, steadiness: 60, conscientiousness: 80 }
    };

    console.log('⏳ Attempting to save data to personality_responses table...');
    
    await pool.query(`
      INSERT INTO personality_responses (user_id, profile_data, message_history, is_completed)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE SET
        profile_data = COALESCE(EXCLUDED.profile_data, personality_responses.profile_data),
        message_history = COALESCE(EXCLUDED.message_history, personality_responses.message_history),
        is_completed = COALESCE(EXCLUDED.is_completed, personality_responses.is_completed),
        updated_at = NOW()
    `, [
      testUserId,
      fakeProfileData ? JSON.stringify(fakeProfileData) : null,
      fakeMessageHistory ? JSON.stringify(fakeMessageHistory) : null,
      false
    ]);
    
    console.log('✅ Data saved successfully! No JSON parse errors.');

    const checkRes = await pool.query('SELECT * FROM personality_responses WHERE user_id = $1', [testUserId]);
    console.log('✅ Fetched saved row from database:');
    console.log(JSON.stringify(checkRes.rows[0], null, 2));
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
  } finally {
    process.exit(0);
  }
}

runTest();
