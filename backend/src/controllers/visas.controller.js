const pool = require('../db/pool');

// GET /api/visas/contact/:contactId
// Returns current visa details + count of Submitted and Approved from history/current
const getContactVisa = async (req, res) => {
  try {
    const { contactId } = req.params;

    // Get latest visa record for this contact
    const [rows] = await pool.query(`
      SELECT v.*, u.name as updated_by_name
      FROM visas v
      LEFT JOIN users u ON v.updated_by = u.id
      WHERE v.contact_id = ? AND v.business_id = ?
      LIMIT 1
    `, [contactId, req.user.businessId]);

    // Count history / occurrences for this contact
    const [countRows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
        COUNT(*) as total_history_count
      FROM visa_history
      WHERE contact_id = ?
    `, [contactId]);

    const counts = {
      submitted_count: Number(countRows[0]?.submitted_count || 0),
      approved_count: Number(countRows[0]?.approved_count || 0),
      total_history_count: Number(countRows[0]?.total_history_count || 0)
    };

    // If no history exists yet but there is a current visa row, reflect that count
    if (counts.total_history_count === 0 && rows.length > 0) {
      if (rows[0].status === 'Submitted') counts.submitted_count = 1;
      if (rows[0].status === 'Approved') counts.approved_count = 1;
      counts.total_history_count = 1;
    }

    res.json({
      success: true,
      data: rows[0] || null,
      counts,
      message: 'OK'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// POST /api/visas
// Create or update visa and log to history
const saveVisa = async (req, res) => {
  try {
    const { contact_id, status, visa_date, description } = req.body;
    if (!contact_id) {
      return res.status(400).json({ success: false, message: 'Contact ID is required' });
    }

    const cleanStatus = (status === 'Approved') ? 'Approved' : 'Submitted';

    // Check if visa record already exists for this contact
    const [existing] = await pool.query(
      'SELECT * FROM visas WHERE contact_id = ? AND business_id = ? LIMIT 1',
      [contact_id, req.user.businessId]
    );

    let visaId;
    let action = '';
    let details = description || '';

    if (existing.length > 0) {
      visaId = existing[0].id;
      const prev = existing[0];
      action = prev.status !== cleanStatus ? `Status changed to ${cleanStatus}` : 'Visa details updated';
      
      await pool.query(
        `UPDATE visas 
         SET status = ?, visa_date = ?, description = ?, updated_by = ?
         WHERE id = ?`,
        [cleanStatus, visa_date || null, description || null, req.user.id, visaId]
      );
    } else {
      action = `Visa created with status ${cleanStatus}`;
      const [insertResult] = await pool.query(
        `INSERT INTO visas (contact_id, business_id, status, visa_date, description, updated_by)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [contact_id, req.user.businessId, cleanStatus, visa_date || null, description || null, req.user.id]
      );
      visaId = insertResult.insertId;
    }

    // Insert history entry
    await pool.query(
      `INSERT INTO visa_history (visa_id, contact_id, changed_by, action, status, details, visa_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [visaId, contact_id, req.user.id, action, cleanStatus, details, visa_date || null]
    );

    // Fetch updated visa record
    const [updated] = await pool.query(`
      SELECT v.*, u.name as updated_by_name
      FROM visas v
      LEFT JOIN users u ON v.updated_by = u.id
      WHERE v.id = ?
    `, [visaId]);

    // Recalculate counts
    const [countRows] = await pool.query(`
      SELECT 
        SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted_count,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_count,
        COUNT(*) as total_history_count
      FROM visa_history
      WHERE contact_id = ?
    `, [contact_id]);

    res.json({
      success: true,
      data: updated[0],
      counts: {
        submitted_count: Number(countRows[0]?.submitted_count || 0),
        approved_count: Number(countRows[0]?.approved_count || 0),
        total_history_count: Number(countRows[0]?.total_history_count || 0)
      },
      message: 'Visa record saved successfully'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// GET /api/visas/contact/:contactId/history
// Optional query ?status=Submitted or ?status=Approved to filter by clicked count card
const getVisaHistory = async (req, res) => {
  try {
    const { contactId } = req.params;
    const { status } = req.query;

    let query = `
      SELECT vh.*, u.name as user_name
      FROM visa_history vh
      LEFT JOIN users u ON vh.changed_by = u.id
      WHERE vh.contact_id = ?
    `;
    const params = [contactId];

    if (status && (status === 'Submitted' || status === 'Approved')) {
      query += ` AND vh.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY vh.created_at DESC, vh.id DESC`;

    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = {
  getContactVisa,
  saveVisa,
  getVisaHistory
};
