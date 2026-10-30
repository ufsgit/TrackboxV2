require('dotenv').config();
const db = require('./src/db/pool');

async function check() {
  const [sources] = await db.query('SELECT * FROM source_categories').catch(e => [[]]);
  console.log('source_categories:', sources);
  const [channels] = await db.query('SELECT * FROM channels').catch(e => [[]]);
  console.log('channels:', channels);
  process.exit(0);
}
check();
