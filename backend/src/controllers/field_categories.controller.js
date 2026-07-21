const pool = require('../db/pool');

const getFieldCategories = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM field_categories WHERE business_id=? ORDER BY name ASC', [req.user.businessId]);
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const createFieldCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    
    const [result] = await pool.query('INSERT INTO field_categories (business_id, name) VALUES (?, ?)', [req.user.businessId, name]);
    const [rows] = await pool.query('SELECT * FROM field_categories WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Field category created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const updateFieldCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });

    await pool.query('UPDATE field_categories SET name=? WHERE id=? AND business_id=?', [name, req.params.id, req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM field_categories WHERE id=?', [req.params.id]);
    
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: rows[0], message: 'Field category updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const deleteFieldCategory = async (req, res) => {
  try {
    // Check if any fields are using this category and maybe un-assign them or cascade
    await pool.query('UPDATE lead_fields SET category_id=NULL WHERE category_id=? AND business_id=?', [req.params.id, req.user.businessId]);
    await pool.query('DELETE FROM field_categories WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, message: 'Field category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = {
  getFieldCategories,
  createFieldCategory,
  updateFieldCategory,
  deleteFieldCategory
};
