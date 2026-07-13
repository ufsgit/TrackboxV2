const cron = require('node-cron');
const pool = require('../db/pool');
const SmsService = require('../services/SmsService');

function startSmsJob() {
  cron.schedule('* * * * *', async () => {
    try {
      const [rows] = await pool.query("SELECT * FROM sms_campaigns WHERE status='scheduled' AND scheduled_at <= NOW()");
      for (const camp of rows) {
        await pool.query("UPDATE sms_campaigns SET status='running' WHERE id=?", [camp.id]);
        const tags = camp.target_tags || [];
        let contacts = [];
        if (tags.length) {
          const [all] = await pool.query('SELECT phone FROM contacts WHERE business_id=? AND opted_in=1', [camp.business_id]);
          contacts = all;
        }
        let sent = 0, failed = 0;
        for (const c of contacts) {
          const result = await SmsService.send(c.phone, camp.message, camp.sender_id);
          if (result.success) sent++; else failed++;
        }
        await pool.query("UPDATE sms_campaigns SET status='completed', total_sent=?, total_failed=? WHERE id=?", [sent, failed, camp.id]);
      }
    } catch (err) { console.error('SMS job error:', err.message); }
  });
  console.log('📱 SMS scheduler started');
}

module.exports = { startSmsJob };
