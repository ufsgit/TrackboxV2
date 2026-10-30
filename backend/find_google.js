require('dotenv').config();
const db = require('./src/db/pool');

async function findGoogle() {
  const [tables] = await db.query('SHOW TABLES');
  for (const t of tables) {
    const table = Object.values(t)[0];
    try {
      const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
      for (const col of cols) {
        if (col.Type.includes('char') || col.Type.includes('text')) {
          try {
            const [rows] = await db.query(`SELECT \`${col.Field}\` FROM \`${table}\` WHERE \`${col.Field}\` LIKE '%GOOGLE%' OR \`${col.Field}\` LIKE '%ADS%'`);
            if (rows.length > 0) {
              console.log(`MATCH in table: ${table}, col: ${col.Field}:`, rows);
            }
          } catch(e) {}
        }
      }
    } catch(err) {
      console.log('Error inspecting table:', table, err.message);
    }
  }
  process.exit(0);
}
findGoogle();
