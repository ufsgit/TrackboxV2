const pool = require('../db/pool');

// BRANCHES
const getBranches = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM branches ORDER BY name ASC');
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.log('get branches error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createBranch = async (req, res) => {
  try {
    const { name, code, location, phone } = req.body;
    const [result] = await pool.query(
      'INSERT INTO branches (name, code, location, phone) VALUES (?, ?, ?, ?)',
      [name, code || null, location || null, phone || null]
    );
    const [rows] = await pool.query('SELECT * FROM branches WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Branch created' });
  } catch (err) {
    console.log('create branches error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { name, code, location, phone } = req.body;
    await pool.query(
      'UPDATE branches SET name=?, code=?, location=?, phone=? WHERE id=?',
      [name, code || null, location || null, phone || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM branches WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Branch updated' });
  } catch (err) {
    console.log('update branches error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteBranch = async (req, res) => {
  try {
    await pool.query('DELETE FROM branches WHERE id=?', [req.params.id]);
    res.json({ success: true, data: null, message: 'Branch deleted' });
  } catch (err) {
    console.log('delete branches error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};


// DEPARTMENTS
const getDepartments = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments ORDER BY name ASC');
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.log('get departments error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { branch_id, name, description } = req.body;
    const [result] = await pool.query(
      'INSERT INTO departments (branch_id, name, description) VALUES (?, ?, ?)',
      [branch_id, name, description || null]
    );
    const [rows] = await pool.query('SELECT * FROM departments WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Department created' });
  } catch (err) {
    console.log('create departments error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { branch_id, name, description } = req.body;
    await pool.query(
      'UPDATE departments SET branch_id=?, name=?, description=? WHERE id=?',
      [branch_id, name, description || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM departments WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Department updated' });
  } catch (err) {
    console.log('update departments error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await pool.query('DELETE FROM departments WHERE id=?', [req.params.id]);
    res.json({ success: true, data: null, message: 'Department deleted' });
  } catch (err) {
    console.log('delete departments error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};


// STATUSES
const getStatuses = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM statuses ORDER BY sequence ASC, name ASC');
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.log('get statuses error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createStatus = async (req, res) => {
  try {
    const { name, color, follow_needed, sequence, transfer, department_id, type } = req.body;
    const [result] = await pool.query(
      'INSERT INTO statuses (name, color, follow_needed, sequence, transfer, department_id, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, color || '#000000', follow_needed || 'Yes', sequence || 0, transfer ? 1 : 0, department_id || null, type || null]
    );
    const [rows] = await pool.query('SELECT * FROM statuses WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Status created' });
  } catch (err) {
    console.log('create statuses error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { name, color, follow_needed, sequence, transfer, department_id, type } = req.body;
    await pool.query(
      'UPDATE statuses SET name=?, color=?, follow_needed=?, sequence=?, transfer=?, department_id=?, type=? WHERE id=?',
      [name, color || '#000000', follow_needed || 'Yes', sequence || 0, transfer ? 1 : 0, department_id || null, type || null, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM statuses WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Status updated' });
  } catch (err) {
    console.log('update statuses error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteStatus = async (req, res) => {
  try {
    await pool.query('DELETE FROM statuses WHERE id=?', [req.params.id]);
    res.json({ success: true, data: null, message: 'Status deleted' });
  } catch (err) {
    console.log('delete statuses error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// DESIGNATIONS
const getDesignations = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM designations ORDER BY name ASC');
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    console.log('get designations error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createDesignation = async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO designations (name) VALUES (?)', [name]);
    const [rows] = await pool.query('SELECT * FROM designations WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Designation created' });
  } catch (err) {
    console.log('create designations error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateDesignation = async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE designations SET name=? WHERE id=?', [name, req.params.id]);
    const [rows] = await pool.query('SELECT * FROM designations WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Designation updated' });
  } catch (err) {
    console.log('update designations error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteDesignation = async (req, res) => {
  try {
    await pool.query('DELETE FROM designations WHERE id=?', [req.params.id]);
    res.json({ success: true, data: null, message: 'Designation deleted' });
  } catch (err) {
    console.log('delete designations error: ',err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// INTAKES
const getIntakes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM intakes WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createIntake = async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO intakes (name, business_id) VALUES (?, ?)', [name, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM intakes WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Intake created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateIntake = async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE intakes SET name=? WHERE id=? AND business_id=?', [name, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM intakes WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Intake updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteIntake = async (req, res) => {
  try {
    await pool.query('DELETE FROM intakes WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Intake deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// YEARS
const getYears = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM years WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createYear = async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO years (name, business_id) VALUES (?, ?)', [name, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM years WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Year created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateYear = async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE years SET name=? WHERE id=? AND business_id=?', [name, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM years WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Year updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteYear = async (req, res) => {
  try {
    await pool.query('DELETE FROM years WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Year deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// APPLICATION STATUSES
const getAppStatuses = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM application_statuses WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createAppStatus = async (req, res) => {
  try {
    const { name, color } = req.body;
    const [result] = await pool.query('INSERT INTO application_statuses (name, color, business_id) VALUES (?, ?, ?)', [name, color || '#000000', req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM application_statuses WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Status created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateAppStatus = async (req, res) => {
  try {
    const { name, color } = req.body;
    await pool.query('UPDATE application_statuses SET name=?, color=? WHERE id=? AND business_id=?', [name, color || '#000000', req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM application_statuses WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteAppStatus = async (req, res) => {
  try {
    await pool.query('DELETE FROM application_statuses WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Status deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// ENQUIRY FORS
const getEnquiryFors = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM enquiry_fors WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createEnquiryFor = async (req, res) => {
  try {
    const { name } = req.body;
    const [result] = await pool.query('INSERT INTO enquiry_fors (name, business_id) VALUES (?, ?)', [name, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM enquiry_fors WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Enquiry for created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateEnquiryFor = async (req, res) => {
  try {
    const { name } = req.body;
    await pool.query('UPDATE enquiry_fors SET name=? WHERE id=? AND business_id=?', [name, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM enquiry_fors WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Enquiry for updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteEnquiryFor = async (req, res) => {
  try {
    await pool.query('DELETE FROM enquiry_fors WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Enquiry for deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// DOCUMENT TYPES
const getDocumentTypes = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM document_types WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const createDocumentType = async (req, res) => {
  try {
    const { name, description } = req.body;
    const [result] = await pool.query('INSERT INTO document_types (name, description, business_id) VALUES (?, ?, ?)', [name, description || null, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM document_types WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Document type created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const updateDocumentType = async (req, res) => {
  try {
    const { name, description } = req.body;
    await pool.query('UPDATE document_types SET name=?, description=? WHERE id=? AND business_id=?', [name, description || null, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM document_types WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Document type updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};
const deleteDocumentType = async (req, res) => {
  try {
    await pool.query('DELETE FROM document_types WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Document type deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = {
  getBranches, createBranch, updateBranch, deleteBranch,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getStatuses, createStatus, updateStatus, deleteStatus,
  getDesignations, createDesignation, updateDesignation, deleteDesignation,
  getIntakes, createIntake, updateIntake, deleteIntake,
  getYears, createYear, updateYear, deleteYear,
  getAppStatuses, createAppStatus, updateAppStatus, deleteAppStatus,
  getEnquiryFors, createEnquiryFor, updateEnquiryFor, deleteEnquiryFor,
  getDocumentTypes, createDocumentType, updateDocumentType, deleteDocumentType
};
