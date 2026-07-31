require('dotenv').config({ path: '../../.env' });
const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

async function run() {
  let pool;
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('Migrating channels...');

    // Alter tables to remove ENUM constraint
    await pool.query("ALTER TABLE contacts MODIFY COLUMN channel_preference VARCHAR(100) DEFAULT 'whatsapp'");
    console.log('Modified contacts.channel_preference');

    // Handle conversations table
    await pool.query("ALTER TABLE conversations MODIFY COLUMN channel VARCHAR(100) DEFAULT 'whatsapp'");
    console.log('Modified conversations.channel');

    // Handle chatbots table
    await pool.query("ALTER TABLE chatbots MODIFY COLUMN channel VARCHAR(100) DEFAULT 'whatsapp'");
    console.log('Modified chatbots.channel');

    // Create channels table
    // Removing the foreign key to users table as users(business_id) might not be a primary/unique key, or let's just use business_id INT without foreign key constraint to match existing architecture if not strictly needed.
    await pool.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id INT AUTO_INCREMENT PRIMARY KEY,
        business_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Created channels table');

    // Seed default channels for existing businesses
    const [businesses] = await pool.query('SELECT DISTINCT business_id FROM users WHERE business_id IS NOT NULL');
    const defaultChannels = ['WhatsApp', 'SMS', 'RCS', 'Instagram', 'Facebook', 'Website'];
    
    for (const b of businesses) {
      const bizId = b.business_id;
      // Check if this business already has channels
      const [existing] = await pool.query('SELECT COUNT(*) as count FROM channels WHERE business_id = ?', [bizId]);
      if (existing[0].count === 0) {
        for (const ch of defaultChannels) {
          await pool.query('INSERT INTO channels (business_id, name) VALUES (?, ?)', [bizId, ch.toLowerCase()]);
        }
      }
    }
    console.log('Seeded default channels');

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

run();
