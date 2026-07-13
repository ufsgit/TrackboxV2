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
    const { name, color, follow_needed, sequence } = req.body;
    const [result] = await pool.query(
      'INSERT INTO statuses (name, color, follow_needed, sequence) VALUES (?, ?, ?, ?)',
      [name, color || '#000000', follow_needed || 'Yes', sequence || 0]
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
    const { name, color, follow_needed, sequence } = req.body;
    await pool.query(
      'UPDATE statuses SET name=?, color=?, follow_needed=?, sequence=? WHERE id=?',
      [name, color || '#000000', follow_needed || 'Yes', sequence || 0, req.params.id]
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

module.exports = {
  getBranches, createBranch, updateBranch, deleteBranch,
  getDepartments, createDepartment, updateDepartment, deleteDepartment,
  getStatuses, createStatus, updateStatus, deleteStatus
};
