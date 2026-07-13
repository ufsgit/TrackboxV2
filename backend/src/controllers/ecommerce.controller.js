const pool = require('../db/pool');
const WhatsappService = require('../services/WhatsappService');

const paginate = (p, l) => ({ offset: (Math.max(1,+p||1)-1)*(Math.min(10000,+l||1000)), limit: Math.min(10000,+l||1000), page: Math.max(1,+p||1) });

// Products
const getProducts = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM products WHERE business_id=?', [req.user.businessId]);
    const [rows] = await pool.query('SELECT * FROM products WHERE business_id=? ORDER BY created_at DESC LIMIT ? OFFSET ?', [req.user.businessId, lim, offset]);
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, image_url, sku, stock } = req.body;
    const [result] = await pool.query(
      'INSERT INTO products (business_id, name, description, price, image_url, sku, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, name, description||'', price||0, image_url||null, sku||null, stock||0]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Product created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, price, image_url, sku, stock, is_active } = req.body;
    await pool.query(
      'UPDATE products SET name=?,description=?,price=?,image_url=?,sku=?,stock=?,is_active=? WHERE id=? AND business_id=?',
      [name, description||'', price||0, image_url||null, sku||null, stock||0, is_active!==undefined?is_active:1, req.params.id, req.user.businessId]
    );
    const [rows] = await pool.query('SELECT * FROM products WHERE id=?', [req.params.id]);
    res.json({ success: true, data: rows[0], message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const deleteProduct = async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id=? AND business_id=?', [req.params.id, req.user.businessId]);
    res.json({ success: true, data: null, message: 'Deleted' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

// Orders
const getOrders = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const { offset, limit: lim, page: p } = paginate(page, limit);
    let where = 'WHERE o.business_id=?'; const params = [req.user.businessId];
    if (status) { where += ' AND o.status=?'; params.push(status); }
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM orders o ${where}`, params);
    const [rows] = await pool.query(
      `SELECT o.*, c.name as contact_name, c.phone as contact_phone FROM orders o LEFT JOIN contacts c ON o.contact_id=c.id ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      [...params, lim, offset]
    );
    res.json({ success: true, data: rows, total, page: p, limit: lim, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const createOrder = async (req, res) => {
  try {
    const { contact_id, conversation_id, items, subtotal, tax, total, shipping_address } = req.body;
    const [result] = await pool.query(
      'INSERT INTO orders (business_id, contact_id, conversation_id, items, subtotal, tax, total, shipping_address) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.businessId, contact_id, conversation_id||null, JSON.stringify(items||[]), subtotal||0, tax||0, total||0, shipping_address||'']
    );
    const [rows] = await pool.query('SELECT * FROM orders WHERE id=?', [result.insertId]);
    res.status(201).json({ success: true, data: rows[0], message: 'Order created' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status, payment_status } = req.body;
    const updates = []; const params = [];
    if (status) { updates.push('status=?'); params.push(status); }
    if (payment_status) { updates.push('payment_status=?'); params.push(payment_status); }
    params.push(req.params.id, req.user.businessId);
    await pool.query(`UPDATE orders SET ${updates.join(',')} WHERE id=? AND business_id=?`, params);
    res.json({ success: true, data: null, message: 'Updated' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const sendOrderConfirmation = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT o.*, c.phone, c.name as cname FROM orders o JOIN contacts c ON o.contact_id=c.id WHERE o.id=? AND o.business_id=?',
      [req.params.id, req.user.businessId]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Not found', data: null });
    const order = rows[0];
    const result = await WhatsappService.sendTextMessage(
      order.phone,
      `Hi ${order.cname}! Your order #${order.id} is confirmed. Total: ₹${order.total}. Thank you!`,
      req.user.businessId
    );
    res.json({ success: result.success, data: result.data, message: result.message || 'Confirmation sent' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, getOrders, createOrder, updateOrderStatus, sendOrderConfirmation };
