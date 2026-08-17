const pool = require('./src/db/pool');

async function check() {
  try {
    const businessId = 1;
    const usersQuery = `
      SELECT 
        u.id as employee_id,
        COALESCE(u.name, 'Unassigned') as employee_name,
        COALESCE(u.employee_code, 'N/A') as employee_code,
        (SELECT COUNT(*) FROM contacts c WHERE c.assigned_to = u.id AND c.business_id = ?) as assigned,
        (SELECT COUNT(*) FROM follow_ups f JOIN contacts fc ON f.contact_id = fc.id WHERE f.by_user_id = u.id AND fc.business_id = ?) as follow_ups,
        (SELECT COUNT(*) FROM contacts c WHERE c.assigned_to = u.id AND c.business_id = ? AND c.sale_lost = 1) as lost,
        (SELECT COUNT(*) FROM contacts c WHERE c.assigned_to = u.id AND c.business_id = ? AND c.sale_won = 1) as converted,
        (SELECT COUNT(*) FROM contacts c WHERE c.assigned_to = u.id AND c.business_id = ? AND c.sale_won = 0 AND c.sale_lost = 0) as pending
      FROM users u
      WHERE u.business_id = ? AND u.role = 'agent'
    `;
    const [teamProductivityRows] = await pool.query(usersQuery, [businessId, businessId, businessId, businessId, businessId]);
    console.log(teamProductivityRows);
  } catch (err) {
    console.error(err);
  }
  process.exit();
}
check();
