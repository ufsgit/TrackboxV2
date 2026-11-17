const pool = require('../src/db/pool');

async function createImportedLeadsTable() {
  const sql = `
CREATE TABLE IF NOT EXISTS imported_leads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  business_id INT NOT NULL,
  contact_id INT NOT NULL,
  import_batch_id VARCHAR(64) DEFAULT NULL,
  name VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(20) DEFAULT NULL,
  country_code VARCHAR(10) DEFAULT '+91',
  email VARCHAR(255) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  tags JSON DEFAULT NULL,
  opt_in_source VARCHAR(50) DEFAULT 'import',
  channel_preference VARCHAR(100) DEFAULT 'whatsapp',
  source VARCHAR(100) DEFAULT NULL,
  enquiry_for_id INT DEFAULT NULL,
  enquiry_for_name VARCHAR(255) DEFAULT NULL,
  status_id INT DEFAULT NULL,
  status_name VARCHAR(100) DEFAULT NULL,
  lead_date DATETIME DEFAULT NULL,
  follow_up_date DATE DEFAULT NULL,
  follow_up TINYINT(1) DEFAULT 0,
  branch_id INT DEFAULT NULL,
  branch_name VARCHAR(255) DEFAULT NULL,
  department_id INT DEFAULT NULL,
  department_name VARCHAR(255) DEFAULT NULL,
  assigned_to INT DEFAULT NULL,
  assigned_user_name VARCHAR(255) DEFAULT NULL,
  current_sale_status INT DEFAULT 0,
  sale_won TINYINT(1) DEFAULT 0,
  sale_won_date DATETIME DEFAULT NULL,
  sale_won_by INT DEFAULT NULL,
  sale_lost TINYINT(1) DEFAULT 0,
  sale_lost_date DATETIME DEFAULT NULL,
  sale_lost_by INT DEFAULT NULL,
  loss_reason VARCHAR(255) DEFAULT NULL,
  created_by_user INT DEFAULT NULL,
  user_list JSON DEFAULT NULL,
  raw_data JSON DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_imported_leads_biz (business_id),
  INDEX idx_imported_leads_contact (contact_id),
  INDEX idx_imported_leads_phone (phone),
  INDEX idx_imported_leads_batch (import_batch_id),
  CONSTRAINT fk_imported_leads_contact FOREIGN KEY (contact_id) REFERENCES contacts (id) ON DELETE CASCADE,
  CONSTRAINT fk_imported_leads_biz FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
  `;

  try {
    await pool.query(sql);
    console.log('✅ imported_leads table created or already exists');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating imported_leads table:', err);
    process.exit(1);
  }
}

createImportedLeadsTable();

