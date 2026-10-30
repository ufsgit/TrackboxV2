require('dotenv').config();
const db = require('./src/db/pool');

async function checkDbs() {
  const [dbs] = await db.query('SHOW DATABASES');
  console.log('DATABASES:', dbs);
  process.exit(0);
}
checkDbs();
