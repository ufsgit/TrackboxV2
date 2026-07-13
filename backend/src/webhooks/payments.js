const pool = require('../db/pool');

async function handleRazorpayWebhook(req, res) {
  try {
    const event = req.body;
    if (event.event === 'payment.captured') {
      const paymentId = event.payload?.payment?.entity?.id;
      const orderId = event.payload?.payment?.entity?.notes?.order_id;
      if (orderId) {
        await pool.query("UPDATE orders SET payment_status='paid', payment_id=? WHERE id=?", [paymentId, orderId]);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Razorpay webhook error:', err);
    res.sendStatus(200);
  }
}

async function handleStripeWebhook(req, res) {
  try {
    const event = req.body;
    if (event.type === 'checkout.session.completed') {
      const session = event.data?.object;
      const orderId = session?.metadata?.order_id;
      if (orderId) {
        await pool.query("UPDATE orders SET payment_status='paid', payment_id=? WHERE id=?", [session.payment_intent, orderId]);
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.sendStatus(200);
  }
}

module.exports = { handleRazorpayWebhook, handleStripeWebhook };
