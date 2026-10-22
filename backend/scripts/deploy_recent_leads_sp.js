require('dotenv').config();
const fs = require('fs');
const pool = require('../src/db/pool');

async function deploy() {
  try {
    const sql = fs.readFileSync('./src/db/sp_get_crm_dashboard_recent_leads.sql', 'utf8');
    const cleanSql = sql
      .replace(/DELIMITER\s+\$\$/g, '')
      .replace(/DELIMITER\s+;/g, '')
      .replace(/\$\$/g, ';');

    await pool.query('DROP PROCEDURE IF EXISTS sp_get_crm_dashboard_recent_leads');

    const startIdx = cleanSql.indexOf('CREATE DEFINER');
    const endIdx = cleanSql.lastIndexOf('END;') + 4;
    const procSql = cleanSql.substring(startIdx, endIdx);

    await pool.query(procSql);
    console.log('Successfully deployed sp_get_crm_dashboard_recent_leads');

    const [results] = await pool.query('CALL sp_get_crm_dashboard_recent_leads(?, ?, ?, ?)', [1, 1, 'admin', 'all_time']);
    console.log('SP Output Rows (Recent Leads):', results[0]);
    process.exit(0);
  } catch (err) {
    console.error('Error deploying SP:', err);
    process.exit(1);
  }
}

deploy();
