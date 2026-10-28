const pool = require('./src/db/pool');

async function testAll() {
  try {
    // 1. Team / Agents
    const [team] = await pool.query(
      `SELECT u.id, u.name, u.role, u.is_active 
       FROM users u 
       WHERE u.business_id=1 AND (u.is_dev = 0 OR u.is_dev IS NULL) 
       ORDER BY u.name ASC`
    );
    console.log(`=== 1. AGENTS / TEAM (${team.length} users) ===`);
    console.table(team.map(u => ({ id: u.id, name: u.name, role: u.role, is_active: u.is_active })));

    // 2. Statuses
    const [statuses] = await pool.query('SELECT id, name, color, sequence FROM statuses ORDER BY sequence ASC, name ASC');
    console.log(`=== 2. LEAD STATUSES (${statuses.length} statuses) ===`);
    console.table(statuses);

    // 3. Tags
    const [tagRows] = await pool.query('SELECT tags FROM contacts WHERE business_id = 1 AND tags IS NOT NULL');
    const tags = new Set();
    tagRows.forEach(r => {
      let ct = r.tags;
      if (typeof ct === 'string') {
        try { ct = JSON.parse(ct); } catch (e) { ct = []; }
      }
      if (Array.isArray(ct)) {
        ct.forEach(t => { if (t && typeof t === 'string' && t.trim()) tags.add(t.trim()); });
      }
    });
    console.log(`=== 3. TAGS (${tags.size} tags) ===`);
    console.log(Array.from(tags));

    // 4. Enquiry Fors
    const [enquiries] = await pool.query('SELECT id, name FROM enquiry_fors WHERE business_id=1 ORDER BY name ASC');
    console.log(`=== 4. ENQUIRY FORS (${enquiries.length} enquiry types) ===`);
    console.table(enquiries);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

testAll();

