const pool = require('./pool');

async function createStoredProcedure() {
  const dropSql = `DROP PROCEDURE IF EXISTS sp_save_lead_email;`;

  const createSql = `
  CREATE PROCEDURE sp_save_lead_email(
    IN p_business_id INT,
    IN p_contact_id INT,
    IN p_campaign_id VARCHAR(50),
    IN p_brevo_message_id VARCHAR(255),
    IN p_sender_email VARCHAR(255),
    IN p_to_email VARCHAR(255),
    IN p_subject VARCHAR(500),
    IN p_content LONGTEXT,
    IN p_status VARCHAR(30),
    IN p_bounce_reason TEXT
  )
  BEGIN
    INSERT INTO lead_emails (
      business_id,
      contact_id,
      campaign_id,
      brevo_message_id,
      sender_email,
      to_email,
      subject,
      content,
      status,
      bounce_reason,
      sent_at
    ) VALUES (
      p_business_id,
      p_contact_id,
      p_campaign_id,
      p_brevo_message_id,
      p_sender_email,
      p_to_email,
      p_subject,
      p_content,
      COALESCE(p_status, 'sent'),
      p_bounce_reason,
      NOW()
    );
    SELECT LAST_INSERT_ID() AS insertId;
  END;
  `;

  try {
    await pool.query(dropSql);
    await pool.query(createSql);
    console.log('Stored procedure sp_save_lead_email created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error creating sp_save_lead_email:', err);
    process.exit(1);
  }
}

createStoredProcedure();
