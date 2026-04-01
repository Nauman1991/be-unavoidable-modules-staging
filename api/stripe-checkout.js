const stripe = require('stripe')('sk_test_51T9ywX6Jc3gz0AUfWaieYGufeJGhDVzd5wZBBxlztChLng9BPwKxczreGPwO4OT8Ol4baARzwVGIvctRcX7gSFCq00MV1aiQUm');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { userId, email } = req.body;
  if (!userId || !email) return res.status(400).json({ error: 'Missing userId or email' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: 'price_1T9z0i6Jc3gz0AUfuZQFOLki',
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/dashboard.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/dashboard.html`,
      customer_email: email,
      metadata: { userId },
    });

    res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe Checkout error:', err);
    res.status(500).json({ error: 'Checkout error: ' + err.message });
  }
};
