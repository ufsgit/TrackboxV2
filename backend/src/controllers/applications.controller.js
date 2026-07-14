const pool = require('../db/pool');

const getApplications = async (req, res) => {
  try {
    const { contactId } = req.params;
    const [rows] = await pool.query(`
      SELECT a.*, 
             i.name as intake_name, 
             y.name as year_name, 
             s.name as status_name, s.color as status_color
      FROM applications a
      LEFT JOIN intakes i ON a.intake_id = i.id
      LEFT JOIN years y ON a.year_id = y.id
      LEFT JOIN application_statuses s ON a.status_id = s.id
      WHERE a.contact_id = ? AND a.business_id = ?
      ORDER BY a.created_at DESC
    `, [contactId, req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createApplication = async (req, res) => {
  try {
    const { contact_id, country, university, course, intake_id, year_id, status_id, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO applications (contact_id, business_id, country, university, course, intake_id, year_id, status_id, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [contact_id, req.user.businessId, country, university, course, intake_id || null, year_id || null, status_id || null, description]
    );
    
    // Log history
    await pool.query(
      'INSERT INTO application_history (application_id, changed_by, action, details) VALUES (?, ?, ?, ?)',
      [result.insertId, req.user.id, 'Application Created', 'Initial application created.']
    );

    const [rows] = await pool.query('SELECT * FROM applications WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Application created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { country, university, course, intake_id, year_id, status_id, description } = req.body;
    
    // Get old data for history
    const [oldRows] = await pool.query('SELECT * FROM applications WHERE id=? AND business_id=?', [id, req.user.businessId]);
    if (oldRows.length === 0) return res.status(404).json({ success: false, message: 'Application not found' });
    const oldApp = oldRows[0];

    await pool.query(
      'UPDATE applications SET country=?, university=?, course=?, intake_id=?, year_id=?, status_id=?, description=? WHERE id=? AND business_id=?',
      [country, university, course, intake_id || null, year_id || null, status_id || null, description, id, req.user.businessId]
    );

    // Determine what changed
    let changes = [];
    if (oldApp.status_id != status_id) changes.push(`Status changed`);
    if (oldApp.university !== university) changes.push(`University changed`);
    if (oldApp.course !== course) changes.push(`Course changed`);
    
    const details = changes.length > 0 ? changes.join(', ') : 'Application updated.';

    // Log history
    await pool.query(
      'INSERT INTO application_history (application_id, changed_by, action, details) VALUES (?, ?, ?, ?)',
      [id, req.user.id, 'Application Updated', details]
    );

    const [rows] = await pool.query('SELECT * FROM applications WHERE id=?', [id]);
    res.json({ success: true, data: rows[0], message: 'Application updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteApplication = async (req, res) => {
  try {
    await pool.query('DELETE FROM applications WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Application deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getApplicationHistory = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const [rows] = await pool.query(`
      SELECT h.*, u.name as user_name 
      FROM application_history h
      LEFT JOIN users u ON h.changed_by = u.id
      WHERE h.application_id = ?
      ORDER BY h.created_at DESC
    `, [applicationId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = {
  getApplications,
  createApplication,
  updateApplication,
  deleteApplication,
  getApplicationHistory
};
