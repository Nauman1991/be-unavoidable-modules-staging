const { sql } = require('@vercel/postgres');

module.exports = async function handler(req, res) {
  // Always return 200 to Stripe immediately or after processing to avoid retries
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // In Vercel, req.body is already an object if it's JSON. 
    const event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    console.log('Stripe Webhook Event Received:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;

      if (userId) {
        console.log(`Processing completion for user: ${userId}`);
        
        // Robust update with UUID casting
        const updateResult = await sql`
          UPDATE users 
          SET paid = TRUE 
          WHERE id = ${userId}::uuid
        `;
        
        console.log(`Database update complete. Rows affected: ${updateResult.rowCount}`);
      } else {
        console.warn('Webhook received but no userId found in metadata.');
      }
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Stripe Webhook Error:', err.message);
    // Still return 200 to prevent Stripe from disabling the webhook, but log the error
    return res.status(200).json({ error: 'Internal processing error, but received', details: err.message });
  }
};
