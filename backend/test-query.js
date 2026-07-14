require('dotenv').config({ path: './.env' });
const pool = require('./src/db/pool');

async function testQuery() {
  try {
    const [rows] = await pool.query("DESCRIBE document_types");
    console.log(rows);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testQuery();
