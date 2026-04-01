const { sql } = require('@vercel/postgres');

async function fixUser(email) {
  try {
    console.log(`Manually activating user: ${email}`);
    const result = await sql`
      UPDATE users 
      SET paid = TRUE 
      WHERE email = ${email.toLowerCase()}
    `;
    console.log('Update complete. Rows affected:', result.rowCount);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

// Pass the email from the screenshot
fixUser('nnauman1991@gmail.com');
