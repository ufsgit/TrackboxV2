const pool = require('../db/pool');

const getSourceCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM source_categories WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createSourceCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    
    const [result] = await pool.query('INSERT INTO source_categories (business_id, name) VALUES (?, ?)', [req.user.businessId, name]);
    const [rows] = await pool.query('SELECT * FROM source_categories WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Source category created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateSourceCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    await pool.query('UPDATE source_categories SET name=? WHERE id=? AND business_id=?', [name, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM source_categories WHERE id=?', [req.params.id]);
    
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0], message: 'Source category updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteSourceCategory = async (req, res) => {
  try {
    await pool.query('UPDATE social_accounts SET source_category_id=NULL WHERE source_category_id=? AND business_id=?', [req.params.id, req.user.businessId]);
    await pool.query('DELETE FROM source_categories WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, message: 'Source category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = {
  getSourceCategories,
  createSourceCategory,
  updateSourceCategory,
  deleteSourceCategory
};
