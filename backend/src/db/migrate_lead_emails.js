const pool = require('./pool');

async function migrate() {
  const sql = `
  CREATE TABLE IF NOT EXISTS lead_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    contact_id INT NOT NULL,
    campaign_id VARCHAR(100) NULL,
    brevo_message_id VARCHAR(191) NULL,
    sender_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content MEDIUMTEXT NOT NULL,
    status ENUM('queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'blocked', 'failed') DEFAULT 'sent',
    bounce_reason TEXT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_contact_id (contact_id),
    INDEX idx_brevo_message_id (brevo_message_id),
    INDEX idx_business_id (business_id),
    INDEX idx_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  try {
    await pool.query(sql);
    console.log('lead_emails table successfully migrated/ensured.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
