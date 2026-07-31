const pool = require('./src/db/pool');

async function test() {
  try {
    const [rows] = await pool.query(
      `SELECT id, name FROM contacts c 
       WHERE c.business_id = 1 
       AND (JSON_CONTAINS(c.user_list, JSON_QUOTE(?)) OR JSON_CONTAINS(c.user_list, ?)) 
       AND (c.assigned_to != ? OR c.assigned_to IS NULL)`,
      ['11', '11', 11]
    );
    console.log('Result:', rows);
  } catch (e) {
    console.error('Error:', e);
  }
  process.exit(0);
}

test();
