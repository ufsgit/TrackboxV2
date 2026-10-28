const pool = require('../db/pool');

// GET /api/receipts/types
const getReceiptTypes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM receipt_types WHERE business_id = ? ORDER BY name ASC',
      [req.user.businessId]
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// POST /api/receipts/types
const createReceiptType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Receipt type name is required' });
    }
    const [result] = await pool.query(
      'INSERT INTO receipt_types (business_id, name) VALUES (?, ?)',
      [req.user.businessId, name.trim()]
    );
    const [rows] = await pool.query('SELECT * FROM receipt_types WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Receipt type created' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// PUT /api/receipts/types/:id
const updateReceiptType = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Receipt type name is required' });
    }
    await pool.query(
      'UPDATE receipt_types SET name = ? WHERE id = ? AND business_id = ?',
      [name.trim(), req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM receipt_types WHERE id = ?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Receipt type updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// DELETE /api/receipts/types/:id
const deleteReceiptType = async (req, res) => {
  try {
    await pool.query('DELETE FROM receipt_types WHERE id = ? AND business_id = ?', [req.params.id, req.user.businessId]);
    res.json({ success: true, message: 'Receipt type deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// GET /api/receipts/contact/:contactId
const getContactReceipts = async (req, res) => {
  try {
    const { contactId } = req.params;
    const businessId = req.user?.businessId || req.user?.business_id || 1;
    const [rows] = await pool.query(`
      SELECT r.*, rt.name as receipt_type_title, COALESCE(r.created_by_name, u.name) as created_by_name
      FROM receipts r
      LEFT JOIN receipt_types rt ON r.receipt_type_id = rt.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.contact_id = ? AND r.business_id = ?
      ORDER BY r.receipt_date DESC, r.created_at DESC
    `, [contactId, businessId]);

    // calculate total sum
    const totalAmount = rows.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    res.json({ 
      success: true, 
      data: rows, 
      totalAmount,
      count: rows.length, 
      message: 'OK' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// POST /api/receipts
const createReceipt = async (req, res) => {
  try {
    const { contact_id, receipt_type_id, receipt_type_name, amount, receipt_date, description } = req.body;
    if (!contact_id || !receipt_date) {
      return res.status(400).json({ success: false, message: 'Contact ID and date are required' });
    }

    const businessId = req.user?.businessId || req.user?.business_id || 1;
    const userId = req.user?.userId || req.user?.id || null;
    let userName = req.user?.name || null;

    // Fetch user name from DB if not present in token
    if (userId && !userName) {
      const [userRows] = await pool.query('SELECT name FROM users WHERE id = ?', [userId]);
      if (userRows.length > 0) {
        userName = userRows[0].name;
      }
    }

    let finalTypeId = receipt_type_id || null;
    let finalTypeName = receipt_type_name || null;

    // If user provided a new type name without ID, check or create it
    if (!finalTypeId && finalTypeName && finalTypeName.trim()) {
      const [existing] = await pool.query(
        'SELECT id, name FROM receipt_types WHERE business_id = ? AND LOWER(name) = LOWER(?)',
        [businessId, finalTypeName.trim()]
      );
      if (existing.length > 0) {
        finalTypeId = existing[0].id;
        finalTypeName = existing[0].name;
      } else {
        const [inserted] = await pool.query(
          'INSERT INTO receipt_types (business_id, name) VALUES (?, ?)',
          [businessId, finalTypeName.trim()]
        );
        finalTypeId = inserted.insertId;
      }
    } else if (finalTypeId && !finalTypeName) {
      const [typeRow] = await pool.query('SELECT name FROM receipt_types WHERE id = ?', [finalTypeId]);
      if (typeRow.length > 0) finalTypeName = typeRow[0].name;
    }

    const [result] = await pool.query(
      `INSERT INTO receipts (contact_id, business_id, receipt_type_id, receipt_type_name, amount, receipt_date, description, created_by, created_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [contact_id, businessId, finalTypeId, finalTypeName || 'General Receipt', Number(amount) || 0, receipt_date, description || null, userId, userName]
    );

    const [rows] = await pool.query(`
      SELECT r.*, rt.name as receipt_type_title, COALESCE(r.created_by_name, u.name) as created_by_name
      FROM receipts r
      LEFT JOIN receipt_types rt ON r.receipt_type_id = rt.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `, [result.insertId]);

    res.status(201).json({ success: true, data: rows[0], message: 'Receipt created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// DELETE /api/receipts/:id
const deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const businessId = req.user?.businessId || req.user?.business_id || 1;
    await pool.query('DELETE FROM receipts WHERE id = ? AND business_id = ?', [id, businessId]);
    res.json({ success: true, message: 'Receipt deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// PUT /api/receipts/:id
const updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { receipt_type_id, receipt_type_name, amount, receipt_date, description } = req.body;
    if (!receipt_date) {
      return res.status(400).json({ success: false, message: 'Receipt date is required' });
    }

    const businessId = req.user?.businessId || req.user?.business_id || 1;

    let finalTypeId = receipt_type_id || null;
    let finalTypeName = receipt_type_name || null;

    if (!finalTypeId && finalTypeName && finalTypeName.trim()) {
      const [existing] = await pool.query(
        'SELECT id, name FROM receipt_types WHERE business_id = ? AND LOWER(name) = LOWER(?)',
        [businessId, finalTypeName.trim()]
      );
      if (existing.length > 0) {
        finalTypeId = existing[0].id;
        finalTypeName = existing[0].name;
      } else {
        const [inserted] = await pool.query(
          'INSERT INTO receipt_types (business_id, name) VALUES (?, ?)',
          [businessId, finalTypeName.trim()]
        );
        finalTypeId = inserted.insertId;
      }
    } else if (finalTypeId && !finalTypeName) {
      const [typeRow] = await pool.query('SELECT name FROM receipt_types WHERE id = ?', [finalTypeId]);
      if (typeRow.length > 0) finalTypeName = typeRow[0].name;
    }

    const [updateResult] = await pool.query(
      `UPDATE receipts
       SET receipt_type_id = ?,
           receipt_type_name = ?,
           amount = ?,
           receipt_date = ?,
           description = ?
       WHERE id = ? AND business_id = ?`,
      [finalTypeId, finalTypeName || 'General Receipt', Number(amount) || 0, receipt_date, description || null, id, businessId]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    const [rows] = await pool.query(`
      SELECT r.*, rt.name as receipt_type_title, COALESCE(r.created_by_name, u.name) as created_by_name
      FROM receipts r
      LEFT JOIN receipt_types rt ON r.receipt_type_id = rt.id
      LEFT JOIN users u ON r.created_by = u.id
      WHERE r.id = ?
    `, [id]);

    res.json({ success: true, data: rows[0], message: 'Receipt updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = {
  getReceiptTypes,
  createReceiptType,
  updateReceiptType,
  deleteReceiptType,
  getContactReceipts,
  createReceipt,
  updateReceipt,
  deleteReceipt
};
