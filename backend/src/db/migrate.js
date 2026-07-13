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
      email VARCHAR(255) UNIQUE,
      password_hash VARCHAR(255),
      role ENUM('superadmin','admin','agent') DEFAULT 'agent',
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id)
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
    )`
  ];

  for (const query of queries) {
    await pool.query(query);
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
    await pool.query("ALTER TABLE contacts MODIFY COLUMN channel_preference ENUM('whatsapp','sms','rcs','instagram','facebook','website') DEFAULT 'whatsapp'");
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
