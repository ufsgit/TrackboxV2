require('dotenv').config();
const db = require('./src/db/pool');

async function searchAll() {
  const [tables] = await db.query('SHOW TABLES');
  for (const t of tables) {
    const table = Object.values(t)[0];
    try {
      const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
      const textCols = cols.filter(c => c.Type.includes('varchar') || c.Type.includes('text')).map(c => c.Field);
      if (textCols.length > 0) {
        const whereClause = textCols.map(c => `\`${c}\` LIKE '%GOOGLE%' OR \`${c}\` LIKE '%LINKDIN%' OR \`${c}\` LIKE '%TWITER%'`).join(' OR ');
        const [matches] = await db.query(`SELECT * FROM \`${table}\` WHERE ${whereClause} LIMIT 5`);
        if (matches.length > 0) {
          console.log('FOUND IN TABLE:', table, JSON.stringify(matches, null, 2));
        }
      }
    } catch(e) {}
  }
  process.exit(0);
}
searchAll();
