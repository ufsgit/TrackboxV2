require('dotenv').config();
const pool = require('../src/db/pool');

async function test() {
  const [users] = await pool.query("SELECT id, name, role, email FROM users WHERE name LIKE '%KEVIN%'");
  console.log('Kevin user:', users);
  if (users.length > 0) {
    const kevin = users[0];
    const [c] = await pool.query('SELECT COUNT(*) as count, assigned_to FROM contacts WHERE assigned_to = ? GROUP BY assigned_to', [kevin.id]);
    console.log('Contacts assigned to Kevin directly:', c);
    const [cAll] = await pool.query('SELECT id, name, assigned_to, follow_up, status_name, sale_won, sale_lost, created_at FROM contacts WHERE assigned_to = ?', [kevin.id]);
    console.log('Contacts for Kevin:', cAll);
    const [teams] = await pool.query('SELECT * FROM teams WHERE business_id = 1');
    console.log('Teams:', teams);
    const [tm] = await pool.query('SELECT * FROM team_members WHERE user_id = ?', [kevin.id]);
    console.log('Team members for Kevin:', tm);
    
    // Test the 6 SPs with Kevin's ID
    const [kpiRes] = await pool.query('CALL sp_get_crm_dashboard_kpis(?, ?, ?, ?)', [1, kevin.id, kevin.role, 'all_time']);
    console.log('KPI for Kevin:', kpiRes[0]);

    const [pipeRes] = await pool.query('CALL sp_get_crm_dashboard_pipeline(?, ?, ?, ?)', [1, kevin.id, kevin.role, 'all_time']);
    console.log('Pipeline for Kevin:', pipeRes[0]);

    const [monthRes] = await pool.query('CALL sp_get_crm_dashboard_monthly_performance(?, ?, ?, ?)', [1, kevin.id, kevin.role, 'all_time']);
    console.log('Monthly for Kevin:', monthRes[0]);

    const [sourceRes] = await pool.query('CALL sp_get_crm_dashboard_lead_sources(?, ?, ?, ?)', [1, kevin.id, kevin.role, 'all_time']);
    console.log('Sources for Kevin:', sourceRes[0]);

    const [teamRes] = await pool.query('CALL sp_get_crm_dashboard_team_performance(?, ?, ?, ?)', [1, kevin.id, kevin.role, 'all_time']);
    console.log('Team for Kevin:', teamRes[0]);

    const [recentRes] = await pool.query('CALL sp_get_crm_dashboard_recent_leads(?, ?, ?, ?)', [1, kevin.id, kevin.role, 'all_time']);
    console.log('Recent for Kevin:', recentRes[0]);
  }
  process.exit(0);
}

test().catch(e => { console.error(e); process.exit(1); });
