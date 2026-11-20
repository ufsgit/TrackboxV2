const pool = require('../db/pool');
const bcrypt = require('bcrypt');

async function runMigrations() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS businesses (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255),
      whatsapp_number VARCHAR(20),
      fb_page_id VARCHAR(100),
      ig_account_id VARCHAR(100),
      whatsapp_token TEXT,
      whatsapp_phone_id VARCHAR(100),
      fb_verify_token VARCHAR(100),
      plan ENUM('starter','pro','enterprise') DEFAULT 'starter',
      green_tick_status ENUM('pending','verified','rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      email VARCHAR(255),
      password_hash VARCHAR(255),
      role ENUM('superadmin','admin','manager','agent') DEFAULT 'agent',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS teams (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS team_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      team_id INT NOT NULL,
      user_id INT NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_team_user (team_id, user_id),
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS contacts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      phone VARCHAR(20),
      email VARCHAR(255),
      tags JSON,
      opted_in BOOLEAN DEFAULT FALSE,
      opt_in_date TIMESTAMP NULL,
      opt_out_date TIMESTAMP NULL,
      opt_in_source ENUM('manual','link','whatsapp','import') DEFAULT 'manual',
      channel_preference ENUM('whatsapp','sms','rcs') DEFAULT 'whatsapp',
      current_sale_status INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS contact_history (
      id INT AUTO_INCREMENT PRIMARY KEY,
      contact_id INT NOT NULL,
      business_id INT NOT NULL,
      user_id INT NULL,
      field_name VARCHAR(100) NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
      FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )`,
    `CREATE TABLE IF NOT EXISTS opt_in_links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      token VARCHAR(100) UNIQUE,
      redirect_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS conversations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      contact_id INT,
      channel ENUM('whatsapp','facebook','instagram','website') DEFAULT 'whatsapp',
      status ENUM('open','resolved','pending') DEFAULT 'open',
      assigned_to INT NULL,
      last_message_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INT AUTO_INCREMENT PRIMARY KEY,
      conversation_id INT,
      direction ENUM('inbound','outbound'),
      content TEXT,
      media_url VARCHAR(500),
      message_type ENUM('text','image','video','document','template','interactive','location','audio'),
      status ENUM('sent','delivered','read','failed') DEFAULT 'sent',
      wa_message_id VARCHAR(100),
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )`,
    `CREATE TABLE IF NOT EXISTS templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      category ENUM('MARKETING','UTILITY','AUTHENTICATION'),
      language VARCHAR(10) DEFAULT 'en',
      header_type ENUM('none','text','image','video','document') DEFAULT 'none',
      header_content TEXT,
      body TEXT,
      footer TEXT,
      buttons JSON,
      status ENUM('pending','approved','rejected') DEFAULT 'pending',
      wa_template_id VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS broadcasts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      template_id INT,
      name VARCHAR(255),
      target_tags JSON,
      target_contact_ids JSON,
      scheduled_at TIMESTAMP NULL,
      started_at TIMESTAMP NULL,
      completed_at TIMESTAMP NULL,
      status ENUM('draft','scheduled','running','completed','failed') DEFAULT 'draft',
      total_recipients INT DEFAULT 0,
      total_sent INT DEFAULT 0,
      total_delivered INT DEFAULT 0,
      total_read INT DEFAULT 0,
      total_failed INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (template_id) REFERENCES templates(id)
    )`,
    `CREATE TABLE IF NOT EXISTS broadcast_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      broadcast_id INT,
      contact_id INT,
      status ENUM('sent','delivered','read','failed') DEFAULT 'sent',
      wa_message_id VARCHAR(100),
      sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (broadcast_id) REFERENCES broadcasts(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS chatbots (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      trigger_keywords JSON,
      flow JSON,
      ai_enabled BOOLEAN DEFAULT FALSE,
      openai_system_prompt TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      channel ENUM('whatsapp','facebook','instagram','website'),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS chatbot_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      chatbot_id INT,
      contact_id INT,
      current_node_id VARCHAR(100),
      session_data JSON,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chatbot_id) REFERENCES chatbots(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS drip_campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      steps JSON,
      trigger_event VARCHAR(100),
      trigger_tags JSON,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS drip_enrollments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      campaign_id INT,
      contact_id INT,
      current_step INT DEFAULT 0,
      next_send_at TIMESTAMP NULL,
      status ENUM('active','completed','stopped') DEFAULT 'active',
      enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (campaign_id) REFERENCES drip_campaigns(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      description TEXT,
      price DECIMAL(10,2),
      image_url VARCHAR(500),
      sku VARCHAR(100),
      stock INT DEFAULT 0,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      contact_id INT,
      conversation_id INT,
      items JSON,
      subtotal DECIMAL(10,2),
      tax DECIMAL(10,2) DEFAULT 0,
      total DECIMAL(10,2),
      status ENUM('pending','confirmed','shipped','delivered','cancelled') DEFAULT 'pending',
      payment_status ENUM('pending','paid','failed','refunded') DEFAULT 'pending',
      payment_gateway ENUM('razorpay','stripe','payu') NULL,
      payment_id VARCHAR(200),
      shipping_address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (contact_id) REFERENCES contacts(id)
    )`,
    `CREATE TABLE IF NOT EXISTS ctwa_links (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      phone VARCHAR(20),
      pre_filled_message TEXT,
      utm_source VARCHAR(100),
      utm_medium VARCHAR(100),
      utm_campaign VARCHAR(100),
      short_code VARCHAR(20) UNIQUE,
      qr_code_url VARCHAR(500),
      click_count INT DEFAULT 0,
      conversation_count INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS ctwa_clicks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      link_id INT,
      ip_address VARCHAR(45),
      user_agent TEXT,
      referrer VARCHAR(500),
      clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (link_id) REFERENCES ctwa_links(id)
    )`,
    `CREATE TABLE IF NOT EXISTS website_widgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      chatbot_id INT,
      widget_name VARCHAR(255),
      welcome_message TEXT,
      brand_color VARCHAR(7) DEFAULT '#25D366',
      position ENUM('bottom-right','bottom-left') DEFAULT 'bottom-right',
      allowed_domains TEXT,
      widget_token VARCHAR(100) UNIQUE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (chatbot_id) REFERENCES chatbots(id)
    )`,
    `CREATE TABLE IF NOT EXISTS rcs_campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      sender_id VARCHAR(100),
      content JSON,
      target_tags JSON,
      scheduled_at TIMESTAMP NULL,
      status ENUM('draft','scheduled','running','completed','failed') DEFAULT 'draft',
      total_sent INT DEFAULT 0,
      total_delivered INT DEFAULT 0,
      total_read INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS rcs_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      card_type ENUM('text','rich_card','carousel','quick_reply'),
      content JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS sms_campaigns (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      sender_id VARCHAR(20),
      dlt_template_id VARCHAR(100),
      message TEXT,
      target_tags JSON,
      scheduled_at TIMESTAMP NULL,
      status ENUM('draft','scheduled','running','completed','failed') DEFAULT 'draft',
      total_sent INT DEFAULT 0,
      total_delivered INT DEFAULT 0,
      total_failed INT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS sms_dlt_templates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      dlt_template_id VARCHAR(100),
      template_name VARCHAR(255),
      message TEXT,
      type ENUM('transactional','promotional','otp'),
      status ENUM('pending','approved','rejected') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS ivr_flows (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      name VARCHAR(255),
      did_number VARCHAR(20),
      welcome_audio_url VARCHAR(500),
      menu JSON,
      fallback_number VARCHAR(20),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS ivr_call_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      flow_id INT,
      caller_number VARCHAR(20),
      key_pressed VARCHAR(5),
      call_duration INT,
      status ENUM('answered','missed','forwarded'),
      called_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (flow_id) REFERENCES ivr_flows(id)
    )`,
    `CREATE TABLE IF NOT EXISTS integrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      type ENUM('zoho','hubspot','woocommerce','shopify','zapier','pabbly','google_sheets','google_calendar','openai','razorpay','stripe','payu'),
      config JSON,
      is_active BOOLEAN DEFAULT FALSE,
      connected_at TIMESTAMP NULL,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS affiliates (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      referral_code VARCHAR(20) UNIQUE,
      total_referrals INT DEFAULT 0,
      total_earnings DECIMAL(10,2) DEFAULT 0,
      pending_payout DECIMAL(10,2) DEFAULT 0,
      status ENUM('active','inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS affiliate_referrals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      affiliate_id INT,
      referred_business_id INT,
      commission DECIMAL(10,2),
      status ENUM('pending','paid') DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (affiliate_id) REFERENCES affiliates(id)
    )`,
    `CREATE TABLE IF NOT EXISTS analytics (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      metric_type VARCHAR(100),
      metric_value DECIMAL(15,2),
      dimension VARCHAR(100),
      recorded_date DATE,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
    )`,
    `CREATE TABLE IF NOT EXISTS attendance_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      business_id INT,
      user_id INT,
      user_name VARCHAR(255),
      menu ENUM('lead', 'crm', 'operation', 'hr'),
      check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      check_out_time TIMESTAMP NULL,
      total_minutes INT,
      status VARCHAR(50) DEFAULT 'Active',
      is_late BOOLEAN DEFAULT FALSE,
      late_reason TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS company_config (
      id INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(255) NOT NULL,
      title VARCHAR(255) DEFAULT NULL,
      is_email TINYINT(1) DEFAULT '0',
      logo VARCHAR(500) DEFAULT NULL,
      favicon VARCHAR(500) DEFAULT NULL,
      company_status INT DEFAULT '0',
      PRIMARY KEY (id)
    )`
  ];

  for (const query of queries) {
    await pool.query(query);
  }

  // Seed default company config if empty
  try {
    const [cfgRows] = await pool.query('SELECT id FROM company_config LIMIT 1');
    if (cfgRows.length === 0) {
      await pool.query(
        `INSERT INTO company_config (name, title, is_email, logo, favicon, company_status) VALUES (?, ?, ?, ?, ?, ?)`,
        ['Trackbox', 'Trackbox CRM', 0, 'assets/logos/trackbox-logo.png', 'assets/icons/trackbox-logo.png', 1]
      );
      console.log('✅ Default company_config seeded');
    }
  } catch (cfgErr) {
    console.error('Error seeding company_config:', cfgErr.message);
  }

  // Create social_accounts table
  await pool.query(`CREATE TABLE IF NOT EXISTS social_accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    platform ENUM('whatsapp', 'facebook', 'instagram') NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NULL,
    phone_id VARCHAR(100) NULL,
    account_id VARCHAR(100) NULL,
    token TEXT NOT NULL,
    verify_token VARCHAR(100) NULL,
    waba_id VARCHAR(100) NULL,
    app_id VARCHAR(100) NULL,
    app_secret VARCHAR(255) NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  )`);

  // Ensure users email is non-unique
  try {
    const [emailIndex] = await pool.query("SHOW INDEX FROM users WHERE Key_name = 'email' AND Non_unique = 0");
    if (emailIndex.length > 0) {
      await pool.query("ALTER TABLE users DROP INDEX email");
    }
  } catch (e) {
    // Ignore if already dropped
  }

  // Ensure idx_users_email exists for fast lookups
  try {
    const [idxCheck] = await pool.query("SHOW INDEX FROM users WHERE Key_name = 'idx_users_email'");
    if (idxCheck.length === 0) {
      await pool.query("ALTER TABLE users ADD INDEX idx_users_email (email)");
    }
  } catch (e) {
    // Ignore if already exists
  }

  // Add social_account_id to conversations if it does not already exist
  const [columns] = await pool.query("SHOW COLUMNS FROM conversations LIKE 'social_account_id'");
  if (columns.length === 0) {
    await pool.query("ALTER TABLE conversations ADD COLUMN social_account_id INT NULL");
    await pool.query("ALTER TABLE conversations ADD CONSTRAINT fk_conversations_social_account FOREIGN KEY (social_account_id) REFERENCES social_accounts(id) ON DELETE SET NULL");
  }

  // Add assigned_to to contacts if it does not already exist
  const [contactColumns] = await pool.query("SHOW COLUMNS FROM contacts LIKE 'assigned_to'");
  if (contactColumns.length === 0) {
    await pool.query("ALTER TABLE contacts ADD COLUMN assigned_to INT NULL");
    await pool.query("ALTER TABLE contacts ADD CONSTRAINT fk_contacts_assigned_to FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL");
  }

  // Add user_list to contacts if it does not already exist
  const [userListCol] = await pool.query("SHOW COLUMNS FROM contacts LIKE 'user_list'");
  if (userListCol.length === 0) {
    await pool.query("ALTER TABLE contacts ADD COLUMN user_list JSON NULL");
  }

  // Extend message_type ENUM to include 'voice' and 'sticker' (safety net)
  try {
    await pool.query("ALTER TABLE messages MODIFY COLUMN message_type ENUM('text','image','video','document','template','interactive','location','audio','voice','sticker')");
  } catch (e) {
    // Ignore if already modified or column doesn't exist
  }

  // Add address column to contacts if not exists
  const [addrCol] = await pool.query("SHOW COLUMNS FROM contacts LIKE 'address'");
  if (addrCol.length === 0) {
    await pool.query("ALTER TABLE contacts ADD COLUMN address TEXT NULL");
  }

  // Create source_categories table
  await pool.query(`CREATE TABLE IF NOT EXISTS source_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  )`);

  // Add source_category_id to social_accounts if not exists
  const [saCol] = await pool.query("SHOW COLUMNS FROM social_accounts LIKE 'source_category_id'");
  if (saCol.length === 0) {
    await pool.query("ALTER TABLE social_accounts ADD COLUMN source_category_id INT NULL");
    await pool.query("ALTER TABLE social_accounts ADD CONSTRAINT fk_sa_source_category FOREIGN KEY (source_category_id) REFERENCES source_categories(id) ON DELETE SET NULL");
  }

  // Create field_categories table
  await pool.query(`CREATE TABLE IF NOT EXISTS field_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  )`);

  // Create lead_fields table for custom field definitions
  await pool.query(`CREATE TABLE IF NOT EXISTS lead_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    label VARCHAR(120) NOT NULL,
    field_key VARCHAR(80) NOT NULL,
    field_type ENUM('text','number','dropdown','date','dob','email','phone','textarea') NOT NULL DEFAULT 'text',
    options JSON NULL,
    is_required TINYINT(1) DEFAULT 0,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_biz_key (business_id, field_key),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  )`);

  // Add category_id to lead_fields if not exists
  const [lfCol] = await pool.query("SHOW COLUMNS FROM lead_fields LIKE 'category_id'");
  if (lfCol.length === 0) {
    await pool.query("ALTER TABLE lead_fields ADD COLUMN category_id INT NULL");
    await pool.query("ALTER TABLE lead_fields ADD CONSTRAINT fk_lf_field_category FOREIGN KEY (category_id) REFERENCES field_categories(id) ON DELETE SET NULL");
  }

  // Create contact_custom_values table for per-contact values
  await pool.query(`CREATE TABLE IF NOT EXISTS contact_custom_values (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    field_id INT NOT NULL,
    value TEXT NULL,
    UNIQUE KEY uq_contact_field (contact_id, field_id),
    FOREIGN KEY (field_id) REFERENCES lead_fields(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  )`);

  // Extend channel_preference ENUM to include instagram, facebook, website
  try {
    await pool.query("ALTER TABLE contacts MODIFY COLUMN channel_preference VARCHAR(100) DEFAULT 'whatsapp'");
  } catch (e) { /* Ignore if already extended */ }

  // Create shared_media_library table for reusable files (brochures, PDFs, etc.)
  await pool.query(`CREATE TABLE IF NOT EXISTS shared_media_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type ENUM('image','video','document','audio') DEFAULT 'document',
    file_size INT DEFAULT 0,
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
  )`);

  // Create designations table
  await pool.query(`CREATE TABLE IF NOT EXISTS designations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL
  )`);

  // Alter statuses table safely to add transfer and department_id
  try { await pool.query("ALTER TABLE statuses ADD COLUMN transfer BOOLEAN DEFAULT FALSE"); } catch (e) { /* Ignore if exists */ }
  try { await pool.query("ALTER TABLE statuses ADD COLUMN department_id INT NULL"); } catch (e) { /* Ignore if exists */ }
  try { await pool.query("ALTER TABLE statuses ADD COLUMN type VARCHAR(50) NULL"); } catch (e) { /* Ignore if exists */ }

  // Alter users table safely to add new fields
  try { 
    await pool.query("ALTER TABLE users ADD COLUMN username VARCHAR(255) NULL");
    await pool.query("ALTER TABLE users ADD UNIQUE KEY uq_business_username (business_id, username)");
  } catch (e) { /* Ignore if exists */ }
  try { await pool.query("ALTER TABLE users ADD COLUMN employee_code VARCHAR(100) NULL"); } catch (e) { /* Ignore if exists */ }
  try { await pool.query("ALTER TABLE users ADD COLUMN designation_id INT NULL"); } catch (e) { /* Ignore if exists */ }
  try { await pool.query("ALTER TABLE users ADD COLUMN date_of_joining DATE NULL"); } catch (e) { /* Ignore if exists */ }
  try { await pool.query("ALTER TABLE users ADD COLUMN department_id INT NULL"); } catch (e) { /* Ignore if exists */ }
  try { await pool.query("ALTER TABLE users ADD COLUMN branch_id INT NULL"); } catch (e) { /* Ignore if exists */ }

  // Applications Module Tables
  await pool.query(`CREATE TABLE IF NOT EXISTS intakes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_id INT NOT NULL
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS years (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    business_id INT NOT NULL
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS application_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(50) DEFAULT '#000000',
    business_id INT NOT NULL
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    country VARCHAR(255),
    university VARCHAR(255),
    course VARCHAR(255),
    intake_id INT NULL,
    year_id INT NULL,
    status_id INT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (intake_id) REFERENCES intakes(id) ON DELETE SET NULL,
    FOREIGN KEY (year_id) REFERENCES years(id) ON DELETE SET NULL,
    FOREIGN KEY (status_id) REFERENCES application_statuses(id) ON DELETE SET NULL
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS application_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    changed_by INT NULL,
    action VARCHAR(255),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS application_status_change (
    id INT AUTO_INCREMENT PRIMARY KEY,
    application_id INT NOT NULL,
    status_change_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    old_status_id INT DEFAULT NULL,
    old_status_name VARCHAR(255) DEFAULT NULL,
    new_status_id INT DEFAULT NULL,
    new_status_name VARCHAR(255) DEFAULT NULL,
    changed_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
  )`);

  // Create enquiry_fors table
  await pool.query(`CREATE TABLE IF NOT EXISTS enquiry_fors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  )`);

  // Add enquiry_for_id to contacts if it doesn't exist
  const [enqCol] = await pool.query("SHOW COLUMNS FROM contacts LIKE 'enquiry_for_id'");
  if (enqCol.length === 0) {
    await pool.query("ALTER TABLE contacts ADD COLUMN enquiry_for_id INT NULL");
    try {
      await pool.query("ALTER TABLE contacts ADD CONSTRAINT fk_contacts_enquiry_for FOREIGN KEY (enquiry_for_id) REFERENCES enquiry_fors(id) ON DELETE SET NULL");
    } catch (e) {
      // ignore
    }
  }

  // Create leads table for 1-to-many relationship with contacts
  await pool.query(`CREATE TABLE IF NOT EXISTS leads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    contact_id INT NOT NULL,
    enquiry_for_id INT NULL,
    status VARCHAR(100) DEFAULT 'New',
    loss_reason VARCHAR(255) NULL,
    assigned_to INT NULL,
    follow_up_date DATE NULL,
    remark TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (enquiry_for_id) REFERENCES enquiry_fors(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
  )`);

  // Create user_document_upload table for contact documents
  await pool.query(`CREATE TABLE IF NOT EXISTS user_document_upload (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    document_type VARCHAR(100),
    file_name VARCHAR(255),
    file_url VARCHAR(500),
    file_size VARCHAR(50),
    file_type VARCHAR(50),
    notes TEXT,
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
  )`);

  // Create document_types table
  await pool.query(`CREATE TABLE IF NOT EXISTS document_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  )`);

  // Create lead_emails table for tracking emails and Brevo delivery status
  await pool.query(`CREATE TABLE IF NOT EXISTS lead_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    contact_id INT NULL,
    campaign_id VARCHAR(50) NULL,
    brevo_message_id VARCHAR(255) NULL,
    sender_email VARCHAR(255) NOT NULL,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    content LONGTEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'queued',
    bounce_reason TEXT NULL,
    last_event VARCHAR(50) NULL,
    last_event_at TIMESTAMP NULL,
    delivered_at TIMESTAMP NULL,
    opened_at TIMESTAMP NULL,
    clicked_at TIMESTAMP NULL,
    sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_contact (contact_id),
    INDEX idx_msg (brevo_message_id),
    INDEX idx_biz (business_id),
    INDEX idx_status (status),
    INDEX idx_campaign (campaign_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  // Ensure all tracking columns exist in lead_emails
  const safeAddColumn = async (table, colName, colDef) => {
    try {
      const [cols] = await pool.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [colName]);
      if (cols.length === 0) {
        await pool.query(`ALTER TABLE ${table} ADD COLUMN ${colName} ${colDef}`);
      }
    } catch (e) {
      console.warn(`[Migration Warning] Error checking/adding column ${colName}:`, e.message);
    }
  };

  await safeAddColumn('lead_emails', 'delivered_at', 'TIMESTAMP NULL');
  await safeAddColumn('lead_emails', 'opened_at', 'TIMESTAMP NULL');
  await safeAddColumn('lead_emails', 'clicked_at', 'TIMESTAMP NULL');
  await safeAddColumn('lead_emails', 'last_event', 'VARCHAR(50) NULL');
  await safeAddColumn('lead_emails', 'last_event_at', 'TIMESTAMP NULL');
  await safeAddColumn('lead_emails', 'sent_at', 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP');
  await safeAddColumn('lead_emails', 'campaign_id', 'VARCHAR(50) NULL');

  // Receipts Module
  await pool.query(`CREATE TABLE IF NOT EXISTS receipt_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  )`);

  await pool.query(`CREATE TABLE IF NOT EXISTS receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    receipt_type_id INT NULL,
    receipt_type_name VARCHAR(255) NULL,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    receipt_date DATE NOT NULL,
    description TEXT,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (receipt_type_id) REFERENCES receipt_types(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  )`);

  await safeAddColumn('receipts', 'created_by_name', 'VARCHAR(255) NULL');

  // Visas Module
  await pool.query(`CREATE TABLE IF NOT EXISTS visas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    visa_type VARCHAR(100) DEFAULT 'Student Visa',
    application_no VARCHAR(100) NULL,
    assigned_staff_id INT NULL,
    assigned_staff_name VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Preparation',
    submission_date DATE NULL,
    officer_name VARCHAR(255) NULL,
    officer_contact VARCHAR(255) NULL,
    extension_requested_date DATE NULL,
    extension_approved_date DATE NULL,
    extension_notes TEXT,
    outcome_date DATE NULL,
    outcome_notes TEXT,
    decline_category VARCHAR(100) NULL,
    decline_detailed_notes TEXT,
    visa_expiry_date DATE NULL,
    travel_date DATE NULL,
    intake_date DATE NULL,
    pre_departure_triggered TINYINT(1) DEFAULT 0,
    pre_departure_data JSON NULL,
    visa_date DATE NULL,
    description TEXT,
    updated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
  )`);

  // Ensure visas table column upgrades
  try {
    await pool.query(`ALTER TABLE visas MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Preparation'`);
  } catch (e) {
    // Ignore if already modified
  }
  await safeAddColumn('visas', 'visa_type', "VARCHAR(100) DEFAULT 'Student Visa'");
  await safeAddColumn('visas', 'contact_name', "VARCHAR(255) NULL");
  await safeAddColumn('visas', 'contact_phone', "VARCHAR(50) NULL");
  await safeAddColumn('visas', 'is_delete', "TINYINT(1) DEFAULT 0");
  await safeAddColumn('visas', 'is_deleted', "TINYINT(1) DEFAULT 0");
  await safeAddColumn('visas', 'application_no', "VARCHAR(100) NULL");
  await safeAddColumn('visas', 'assigned_staff_id', "INT NULL");
  await safeAddColumn('visas', 'assigned_staff_name', "VARCHAR(255) NULL");
  await safeAddColumn('visas', 'submission_date', "DATE NULL");
  await safeAddColumn('visas', 'officer_name', "VARCHAR(255) NULL");
  await safeAddColumn('visas', 'officer_contact', "VARCHAR(255) NULL");
  await safeAddColumn('visas', 'extension_requested_date', "DATE NULL");
  await safeAddColumn('visas', 'extension_approved_date', "DATE NULL");
  await safeAddColumn('visas', 'extension_notes', "TEXT NULL");
  await safeAddColumn('visas', 'outcome_date', "DATE NULL");
  await safeAddColumn('visas', 'outcome_notes', "TEXT NULL");
  await safeAddColumn('visas', 'decline_category', "VARCHAR(100) NULL");
  await safeAddColumn('visas', 'decline_detailed_notes', "TEXT NULL");
  await safeAddColumn('visas', 'visa_expiry_date', "DATE NULL");
  await safeAddColumn('visas', 'travel_date', "DATE NULL");
  await safeAddColumn('visas', 'intake_date', "DATE NULL");
  await safeAddColumn('visas', 'pre_departure_triggered', "TINYINT(1) DEFAULT 0");
  await safeAddColumn('visas', 'pre_departure_data', "JSON NULL");

  // Backfill contact_name and contact_phone for existing visa records
  try {
    await pool.query(`
      UPDATE visas v
      JOIN contacts c ON v.contact_id = c.id
      SET v.contact_name = COALESCE(v.contact_name, c.name),
          v.contact_phone = COALESCE(v.contact_phone, c.phone)
      WHERE v.contact_name IS NULL OR v.contact_phone IS NULL
    `);
  } catch (e) {}

  await pool.query(`CREATE TABLE IF NOT EXISTS visa_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visa_id INT NOT NULL,
    contact_id INT NOT NULL,
    changed_by INT NULL,
    action VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    details TEXT,
    notes TEXT,
    visa_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (visa_id) REFERENCES visas(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
  )`);
  try {
    await pool.query(`ALTER TABLE visa_history MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Submitted'`);
  } catch (e) {}
  await safeAddColumn('visa_history', 'notes', "TEXT NULL");

  // VISA-001: Official requests from immigration (RFI/PPI/Additional Docs)
  await pool.query(`CREATE TABLE IF NOT EXISTS visa_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visa_id INT NOT NULL,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    request_type VARCHAR(100) NOT NULL DEFAULT 'RFI',
    received_date DATE NOT NULL,
    due_date DATE NOT NULL,
    title VARCHAR(255) NOT NULL,
    details TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    assigned_task_id INT NULL,
    document_name VARCHAR(255) NULL,
    document_url VARCHAR(500) NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vr_visa (visa_id),
    INDEX idx_vr_contact (contact_id),
    INDEX idx_vr_due (due_date),
    INDEX idx_vr_status (status),
    FOREIGN KEY (visa_id) REFERENCES visas(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  )`);

  // Visa Types Settings Module
  await pool.query(`CREATE TABLE IF NOT EXISTS visa_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    business_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vt_business (business_id)
  )`);

  // Visa Statuses Settings Module
  await pool.query(`CREATE TABLE IF NOT EXISTS visa_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) DEFAULT '#4f46e5',
    stage_order INT DEFAULT 0,
    description VARCHAR(255) NULL,
    business_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    has_reason TINYINT(1) DEFAULT 0,
    reason_category_ids JSON NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vs_business (business_id)
  )`);

  try {
    await pool.query('ALTER TABLE visa_statuses ADD COLUMN has_reason TINYINT(1) DEFAULT 0');
  } catch (colErr) {
    // has_reason already exists
  }

  try {
    await pool.query('ALTER TABLE visa_statuses ADD COLUMN reason_category_ids JSON NULL AFTER has_reason');
  } catch (colErr) {
    // reason_category_ids already exists
  }

  // Seed default visa types and statuses for all businesses that don't have them yet
  try {
    const [businesses] = await pool.query('SELECT id FROM businesses');
    for (const b of businesses) {
      const [typeCount] = await pool.query('SELECT COUNT(*) as c FROM visa_types WHERE business_id = ?', [b.id]);
      if (typeCount[0].c === 0) {
        await pool.query(`
          INSERT INTO visa_types (name, description, business_id) VALUES
          ('Student Visa', 'Primary study and higher education visa', ?),
          ('Dependent Visa', 'Spouse or child dependent visa linked to student/work permit', ?),
          ('Work Visa', 'Post-graduate or employer sponsored work authorization', ?),
          ('Visitor / Tourist', 'Short-term travel or visitor exploration visa', ?),
          ('Post-Study Work', 'Post study graduate work visa stream', ?),
          ('Permanent Residency', 'Permanent residency or settlement stream', ?),
          ('Other', 'Custom or miscellaneous visa subclass', ?)
        `, [b.id, b.id, b.id, b.id, b.id, b.id, b.id]);
      }

      const [statusCount] = await pool.query('SELECT COUNT(*) as c FROM visa_statuses WHERE business_id = ?', [b.id]);
      if (statusCount[0].c === 0) {
        await pool.query(`
          INSERT INTO visa_statuses (name, color, stage_order, description, has_reason, business_id) VALUES
          ('Preparation', '#64748b', 1, 'Initial documentation and file setup', 0, ?),
          ('Ready', '#0284c7', 2, 'File complete and ready for submission', 0, ?),
          ('Submitted', '#2563eb', 3, 'Lodged with immigration authority', 0, ?),
          ('Under Assessment', '#7c3aed', 4, 'Case officer assigned and evaluating', 0, ?),
          ('RFI-PPI', '#d97706', 5, 'Official request for information / procedural fairness', 0, ?),
          ('AIP', '#0d9488', 6, 'Approval in principle received', 0, ?),
          ('Approved', '#16a34a', 7, 'Visa granted successfully', 0, ?),
          ('Declined', '#dc2626', 8, 'Visa refused or rejected', 1, ?),
          ('Withdrawn', '#475569', 9, 'Application withdrawn by applicant', 0, ?)
        `, [b.id, b.id, b.id, b.id, b.id, b.id, b.id, b.id, b.id]);
      }
    }
  } catch (seedErr) {
    console.error('Error seeding default visa types/statuses:', seedErr);
  }

  // Visa Reason Categories Module
  await pool.query(`CREATE TABLE IF NOT EXISTS visa_reason_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    business_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vrc_business (business_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  try {
    const [businesses] = await pool.query('SELECT id FROM businesses');
    for (const b of businesses) {
      const [rCount] = await pool.query('SELECT COUNT(*) as c FROM visa_reason_categories WHERE business_id = ?', [b.id]);
      if (rCount[0].c === 0) {
        await pool.query(`
          INSERT INTO visa_reason_categories (name, description, business_id) VALUES
          ('Financial Inadequacy / Funds Verification', 'Insufficient liquid funds, questionable source of wealth, or unverified deposits', ?),
          ('GTE / Genuine Student Requirement', 'Failure to convince case officer of intent to return, career roadmap gaps, or immigration risk', ?),
          ('Academic / Qualification Mismatch', 'Unexplained study gap, irrelevant past education, or low academic performance', ?),
          ('English Language Proficiency Requirement', 'IELTS/PTE score below threshold or suspicious language test verification', ?),
          ('Incomplete / Fraudulent Documentation', 'Missing bank statements, unverified employer reference, or documentation irregularities', ?),
          ('Medical / Character Requirement', 'Health issues, pending background clearances, or police certificate failure', ?),
          ('Country / Policy Restriction', 'Strict jurisdictional rejection quota or elevated risk tier embargo', ?),
          ('Other / Visa Officer Discretion', 'General discretionary refusal or miscellaneous high commission clauses', ?)
        `, [b.id, b.id, b.id, b.id, b.id, b.id, b.id, b.id]);
      }
    }
  } catch (rSeedErr) {
    console.error('Error seeding visa reason categories:', rSeedErr);
  }

  // Visa Pre-Departure Checklist Templates Module (VISA-003)
  await pool.query(`CREATE TABLE IF NOT EXISTS visa_checklist_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) DEFAULT 'Pre-Departure',
    description VARCHAR(255) NULL,
    stage_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    business_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vct_business (business_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  try {
    const [businesses] = await pool.query('SELECT id FROM businesses');
    for (const b of businesses) {
      const [chkCount] = await pool.query('SELECT COUNT(*) as c FROM visa_checklist_templates WHERE business_id = ?', [b.id]);
      if (chkCount[0].c === 0) {
        await pool.query(`
          INSERT INTO visa_checklist_templates (title, category, description, stage_order, business_id) VALUES
          ('Pre-Departure Briefing Session', 'Orientation', 'Mandatory pre-departure briefing and destination orientation', 1, ?),
          ('Flight Ticket & Travel Booking Verification', 'Travel', 'Confirm itinerary, airline baggage limits, and transit arrangements', 2, ?),
          ('Health Insurance (OSHC) & Travel Coverage', 'Insurance', 'Ensure policy active and valid for student & dependents', 3, ?),
          ('Accommodation Arrangements & Address Confirmation', 'Housing', 'Confirm initial housing, landlord contact, and check-in dates', 4, ?),
          ('Forex, Multi-currency Card & Bank Setup', 'Finance', 'Arrange international debit cards and initial living funds', 5, ?),
          ('Airport Pickup & Transit Arrangements', 'Transit', 'Coordinate airport transfer and local transport passes', 6, ?),
          ('Final Enrolment Pack & Document Compliance', 'Compliance', 'Verify offer letter, COE, passport, and entry visa grant notice', 7, ?)
        `, [b.id, b.id, b.id, b.id, b.id, b.id, b.id]);
      }
    }
  } catch (chkSeedErr) {
    console.error('Error seeding visa checklist templates:', chkSeedErr);
  }

  // Visa Pre-Departure Checklist Categories Module (VISA-003)
  await pool.query(`CREATE TABLE IF NOT EXISTS visa_checklist_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    business_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_vcc_business (business_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  try {
    const [businesses] = await pool.query('SELECT id FROM businesses');
    for (const b of businesses) {
      const [catCount] = await pool.query('SELECT COUNT(*) as c FROM visa_checklist_categories WHERE business_id = ?', [b.id]);
      if (catCount[0].c === 0) {
        await pool.query(`
          INSERT INTO visa_checklist_categories (name, description, business_id) VALUES
          ('Orientation', 'Pre-departure briefings, destination guides, and university orientations', ?),
          ('Travel', 'Flight bookings, itinerary verification, airline baggage and transit compliance', ?),
          ('Insurance', 'Health insurance (OSHC) and comprehensive travel medical coverage', ?),
          ('Housing', 'Accommodation arrangements, tenancy contracts, and address verification', ?),
          ('Finance', 'Forex cards, currency exchange, international banking, and living expense funds', ?),
          ('Transit', 'Airport pickup, transit transfers, and local transport connectivity', ?),
          ('Compliance', 'Offer letter, COE, passport validation, and visa grant conditions compliance', ?),
          ('Custom', 'Custom or institution-specific pre-departure requirements', ?)
        `, [b.id, b.id, b.id, b.id, b.id, b.id, b.id, b.id]);
      }
    }
  } catch (catSeedErr) {
    console.error('Error seeding visa checklist categories:', catSeedErr);
  }

  // Help Tutorial Videos Module
  await pool.query(`CREATE TABLE IF NOT EXISTS crm_help_videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    title VARCHAR(255) NOT NULL DEFAULT 'CRM Workflow & Tutorial Guide',
    description TEXT,
    video_url VARCHAR(1000) NOT NULL,
    file_name VARCHAR(255),
    file_size VARCHAR(50),
    uploaded_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_help_biz (business_id)
  )`);

  // WhatsApp QR Session Auth Table
  await pool.query(`CREATE TABLE IF NOT EXISTS whatsapp_qr_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(100) NOT NULL UNIQUE,
    user_id INT NULL,
    business_id INT NULL,
    phone_number VARCHAR(30) NULL,
    creds_json LONGTEXT NULL,
    status ENUM('pending', 'connected', 'disconnected') DEFAULT 'pending',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_wqr_phone (phone_number),
    INDEX idx_wqr_user (user_id)
  )`);

  // Imported leads table for bulk sync & tracking
  await pool.query(`CREATE TABLE IF NOT EXISTS imported_leads (
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
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  // PTE Management Module Tables
  await pool.query(`CREATE TABLE IF NOT EXISTS pte_statuses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    stage_order INT DEFAULT 1,
    color VARCHAR(50) DEFAULT '#3b82f6',
    description TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pstat_biz (business_id),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS pte_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    duration VARCHAR(100) NULL,
    price DECIMAL(10,2) DEFAULT 0.00,
    total_sessions INT DEFAULT 20,
    mock_tests_count INT DEFAULT 5,
    description TEXT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ppkg_biz (business_id),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS pte_trainers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(50) NULL,
    specialization VARCHAR(150) DEFAULT 'PTE Academic',
    user_id INT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ptrain_biz (business_id),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS pte_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    batch_name VARCHAR(150) NOT NULL,
    trainer_id INT NULL,
    trainer_name VARCHAR(255) NULL,
    schedule VARCHAR(255) NULL,
    start_date DATE NULL,
    end_date DATE NULL,
    capacity INT NOT NULL DEFAULT 20,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pb_biz (business_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS pte_students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    original_counsellor_id INT NULL,
    original_counsellor_name VARCHAR(255) NULL,
    referring_counsellor_id INT NULL,
    referring_counsellor_name VARCHAR(255) NULL,
    recommendation_date DATE NULL,
    referral_date DATE NULL,
    join_date DATE NULL,
    target_achievement_date DATE NULL,
    application_date DATE NULL,
    package_name VARCHAR(150) NULL,
    target_score DECIMAL(4,1) NULL,
    current_score DECIMAL(4,1) NULL,
    batch_id INT NULL,
    batch_name VARCHAR(150) NULL,
    trainer_id INT NULL,
    trainer_name VARCHAR(255) NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Recommended',
    target_achieved TINYINT(1) DEFAULT 0,
    application_id INT NULL,
    followup_date DATE NULL,
    followup_remarks TEXT NULL,
    remarks TEXT NULL,
    created_by INT NULL,
    is_deleted TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_ps_contact (contact_id),
    INDEX idx_ps_biz (business_id),
    INDEX idx_ps_batch (batch_id),
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (batch_id) REFERENCES pte_batches(id) ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS pte_attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pte_student_id INT NOT NULL,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    batch_id INT NULL,
    session_date DATE NOT NULL,
    session_title VARCHAR(255) NULL,
    status ENUM('Present', 'Absent', 'Late', 'Excused') DEFAULT 'Present',
    remarks TEXT NULL,
    marked_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pa_student (pte_student_id),
    INDEX idx_pa_contact (contact_id),
    FOREIGN KEY (pte_student_id) REFERENCES pte_students(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS pte_mock_tests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pte_student_id INT NOT NULL,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    test_date DATE NOT NULL,
    test_title VARCHAR(150) DEFAULT 'Mock Test',
    overall_score DECIMAL(4,1) NOT NULL,
    listening DECIMAL(4,1) NULL,
    reading DECIMAL(4,1) NULL,
    speaking DECIMAL(4,1) NULL,
    writing DECIMAL(4,1) NULL,
    comments TEXT NULL,
    evaluated_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pm_student (pte_student_id),
    INDEX idx_pm_contact (contact_id),
    FOREIGN KEY (pte_student_id) REFERENCES pte_students(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS pte_exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pte_student_id INT NOT NULL,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    booking_date DATE NULL,
    exam_date DATE NOT NULL,
    venue VARCHAR(255) NULL,
    mode ENUM('Offline Center', 'Online / Home') DEFAULT 'Offline Center',
    notes TEXT NULL,
    result_status ENUM('Result Pending', 'Result Received') DEFAULT 'Result Pending',
    result_received_date DATE NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pe_student (pte_student_id),
    INDEX idx_pe_contact (contact_id),
    FOREIGN KEY (pte_student_id) REFERENCES pte_students(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  await pool.query(`CREATE TABLE IF NOT EXISTS pte_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pte_student_id INT NOT NULL,
    contact_id INT NOT NULL,
    business_id INT NOT NULL,
    exam_id INT NULL,
    exam_date DATE NOT NULL,
    overall_score DECIMAL(4,1) NOT NULL,
    listening DECIMAL(4,1) NULL,
    reading DECIMAL(4,1) NULL,
    speaking DECIMAL(4,1) NULL,
    writing DECIMAL(4,1) NULL,
    target_score DECIMAL(4,1) NULL,
    target_achieved TINYINT(1) DEFAULT 0,
    achievement_date DATE NULL,
    next_action VARCHAR(255) NULL,
    remarks TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_pr_student (pte_student_id),
    INDEX idx_pr_contact (contact_id),
    FOREIGN KEY (pte_student_id) REFERENCES pte_students(id) ON DELETE CASCADE,
    FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`);

  try {
    const [businesses] = await pool.query('SELECT id FROM businesses');
    for (const b of businesses) {
      // Default Batches
      const [batchCount] = await pool.query('SELECT COUNT(*) as c FROM pte_batches WHERE business_id = ?', [b.id]);
      if (batchCount[0].c === 0) {
        await pool.query(`
          INSERT INTO pte_batches (batch_name, schedule, capacity, business_id) VALUES
          ('PTE Morning Foundation', 'Mon-Fri 08:30 AM - 10:30 AM', 20, ?),
          ('PTE Fast-Track Intensive', 'Mon-Fri 02:00 PM - 04:30 PM', 15, ?),
          ('PTE Weekend Masterclass', 'Sat-Sun 10:00 AM - 02:00 PM', 25, ?)
        `, [b.id, b.id, b.id]);
      }

      // Default PTE Statuses
      const [statusCount] = await pool.query('SELECT COUNT(*) as c FROM pte_statuses WHERE business_id = ?', [b.id]);
      if (statusCount[0].c === 0) {
        await pool.query(`
          INSERT INTO pte_statuses (name, stage_order, color, description, business_id) VALUES
          ('Recommended', 1, '#6366f1', 'Initial PTE coaching recommendation', ?),
          ('Referred', 2, '#8b5cf6', 'Student referred to PTE branch/faculty', ?),
          ('Joined', 3, '#3b82f6', 'Enrolled and joined regular classes', ?),
          ('Training', 4, '#06b6d4', 'Active coaching and daily practice', ?),
          ('Mock Test', 5, '#eab308', 'Engaged in mock tests & evaluations', ?),
          ('Exam Booked', 6, '#f97316', 'Official Pearson PTE exam date booked', ?),
          ('Result Pending', 7, '#a855f7', 'Exam completed, awaiting official score report', ?),
          ('Target Achieved', 8, '#10b981', 'Target score achieved - eligible for university application', ?),
          ('Target Not Achieved', 9, '#ef4444', 'Target score not achieved - revision needed', ?),
          ('Application Created', 10, '#059669', 'Handed over for university admission application', ?),
          ('Dropped', 11, '#64748b', 'Discontinued / dropped out', ?)
        `, [b.id, b.id, b.id, b.id, b.id, b.id, b.id, b.id, b.id, b.id, b.id]);
      }

      // Default PTE Packages
      const [pkgCount] = await pool.query('SELECT COUNT(*) as c FROM pte_packages WHERE business_id = ?', [b.id]);
      if (pkgCount[0].c === 0) {
        await pool.query(`
          INSERT INTO pte_packages (name, duration, price, total_sessions, mock_tests_count, description, business_id) VALUES
          ('Standard Coaching (30 Days)', '30 Days', 12000.00, 30, 5, 'Comprehensive 4-week preparation covering all four communicative skills.', ?),
          ('Comprehensive Mastery (60 Days)', '60 Days', 20000.00, 60, 10, 'In-depth foundation and masterclass with unlimited practice portal access.', ?),
          ('Crash Course (15 Days)', '15 Days', 8000.00, 15, 3, 'Intensive high-yield test strategies and rapid mock assessment for repeat test-takers.', ?),
          ('Weekend Fast-Track', '4 Weekends', 10000.00, 8, 4, 'Weekend-only batch tailored for working professionals and university students.', ?),
          ('One-on-One Mentorship', 'Flexible', 25000.00, 20, 8, 'Dedicated personal trainer with individualized speech analysis and essay reviews.', ?)
        `, [b.id, b.id, b.id, b.id, b.id]);
      }

      // Default PTE Trainers
      const [trainerCount] = await pool.query('SELECT COUNT(*) as c FROM pte_trainers WHERE business_id = ?', [b.id]);
      if (trainerCount[0].c === 0) {
        await pool.query(`
          INSERT INTO pte_trainers (name, email, phone, specialization, business_id) VALUES
          ('Dr. Sarah Jenkins', 'sarah.pte@trackbox.com', '+1-555-0192', 'PTE Speaking & Pronunciation', ?),
          ('David Wilson', 'david.wilson@trackbox.com', '+1-555-0144', 'PTE Academic Master Trainer', ?),
          ('Ananya Patel', 'ananya.p@trackbox.com', '+1-555-0178', 'PTE Writing & Grammar Analysis', ?)
        `, [b.id, b.id, b.id]);
      }
    }
  } catch (batchErr) {
    console.error('Error seeding default pte settings:', batchErr);
  }

  console.log('✅ Database migrations completed');

  await seedData();
}

async function seedData() {
  // Check if already seeded
  const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM businesses');
  if (rows[0].cnt > 0) return;

  // Seed business
  const [bizResult] = await pool.query(
    `INSERT INTO businesses (name, whatsapp_number, plan) VALUES (?, ?, ?)`,
    ['Demo Business', '+911234567890', 'pro']
  );
  const businessId = bizResult.insertId;

  // Seed users
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const agentHash = await bcrypt.hash('Agent@123', 10);
  await pool.query(
    `INSERT INTO users (business_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
    [businessId, 'Admin User', 'admin@demo.com', adminHash, 'admin']
  );
  await pool.query(
    `INSERT INTO users (business_id, name, email, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
    [businessId, 'Agent User', 'agent@demo.com', agentHash, 'agent']
  );

  // Seed contacts
  const contacts = [
    ['Alice Johnson', '+911111111111', 'alice@example.com', JSON.stringify(['vip', 'customer'])],
    ['Bob Smith', '+912222222222', 'bob@example.com', JSON.stringify(['lead'])],
    ['Carol White', '+913333333333', 'carol@example.com', JSON.stringify(['vip'])],
    ['David Brown', '+914444444444', 'david@example.com', JSON.stringify(['customer'])],
    ['Eve Davis', '+915555555555', 'eve@example.com', JSON.stringify(['lead', 'vip'])],
    ['Frank Miller', '+916666666666', 'frank@example.com', JSON.stringify(['customer'])],
    ['Grace Wilson', '+917777777777', 'grace@example.com', JSON.stringify(['lead'])],
    ['Henry Moore', '+918888888888', 'henry@example.com', JSON.stringify(['vip'])],
    ['Iris Taylor', '+919999999999', 'iris@example.com', JSON.stringify(['customer'])],
    ['Jack Anderson', '+910000000000', 'jack@example.com', JSON.stringify(['lead', 'customer'])],
  ];
  for (const [name, phone, email, tags] of contacts) {
    await pool.query(
      `INSERT INTO contacts (business_id, name, phone, email, tags, opted_in) VALUES (?, ?, ?, ?, ?, ?)`,
      [businessId, name, phone, email, tags, true]
    );
  }

  // Seed templates
  await pool.query(
    `INSERT INTO templates (business_id, name, category, language, header_type, body, footer, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [businessId, 'welcome_offer', 'MARKETING', 'en', 'none',
      'Hi {{1}}! Welcome to WLink. Enjoy 20% off your first order with code WLINK20. Shop now!',
      'Reply STOP to unsubscribe', 'approved']
  );
  await pool.query(
    `INSERT INTO templates (business_id, name, category, language, header_type, body, footer, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [businessId, 'order_confirmation', 'UTILITY', 'en', 'none',
      'Hi {{1}}, your order #{{2}} has been confirmed! Total: ₹{{3}}. We will notify you once shipped.',
      'Thank you for shopping with us!', 'approved']
  );

  // Seed chatbot
  const flow = JSON.stringify({
    nodes: [
      { id: 'start', type: 'message', content: 'Welcome! How can I help you today?\n1. Support\n2. Sales\n3. Track Order', next: 'collect_choice' },
      { id: 'collect_choice', type: 'collect_input', content: 'Please type your choice (1/2/3)', next: 'route' },
      { id: 'route', type: 'condition', rules: [{ match: '1', next: 'support' }, { match: '2', next: 'sales' }, { match: '3', next: 'track' }], default: 'end' },
      { id: 'support', type: 'message', content: 'Connecting you to our support team. Please wait...', next: 'end' },
      { id: 'sales', type: 'message', content: 'Our sales team will contact you shortly!', next: 'end' },
      { id: 'track', type: 'message', content: 'Please share your order number and we will update you.', next: 'end' },
      { id: 'end', type: 'end', content: 'Thank you for contacting us!' }
    ],
    edges: []
  });
  await pool.query(
    `INSERT INTO chatbots (business_id, name, trigger_keywords, flow, is_active, channel) VALUES (?, ?, ?, ?, ?, ?)`,
    [businessId, 'Main Support Bot', JSON.stringify(['hi', 'hello', 'help', 'start']), flow, true, 'whatsapp']
  );

  // Seed IVR flow
  const menu = JSON.stringify([
    { key: '1', label: 'Sales', action: 'forward', value: '+911234567890' },
    { key: '2', label: 'Support', action: 'chatbot', value: '1' },
    { key: '3', label: 'Business Hours', action: 'play', value: 'Our business hours are 9 AM to 6 PM, Monday to Saturday.' }
  ]);
  await pool.query(
    `INSERT INTO ivr_flows (business_id, name, did_number, menu, is_active) VALUES (?, ?, ?, ?, ?)`,
    [businessId, 'Main IVR', '+911234599999', menu, true]
  );

  // Seed RCS template
  await pool.query(
    `INSERT INTO rcs_templates (business_id, name, card_type, content) VALUES (?, ?, ?, ?)`,
    [businessId, 'Product Showcase Card', 'rich_card',
      JSON.stringify({ title: 'Check Our Latest Offers!', description: 'Exclusive deals just for you.', imageUrl: '', buttons: [{ type: 'openUrl', label: 'Shop Now', value: 'https://wlink.in' }] })]
  );

  // Seed SMS DLT template
  await pool.query(
    `INSERT INTO sms_dlt_templates (business_id, dlt_template_id, template_name, message, type, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [businessId, 'DLT123456', 'OTP Template', 'Your OTP is {#var#}. Valid for 10 minutes. - WLink', 'otp', 'approved']
  );

  console.log('✅ Seed data inserted');
}

module.exports = { runMigrations };
