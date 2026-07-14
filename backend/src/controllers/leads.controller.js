const pool = require('../db/pool');

const createLead = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { contactId } = req.params;
    const { enquiry_for_id, status, loss_reason, assigned_to, follow_up_date, remark } = req.body;

    const [result] = await pool.query(
      `INSERT INTO leads (business_id, contact_id, enquiry_for_id, status, loss_reason, assigned_to, follow_up_date, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [businessId, contactId, enquiry_for_id || null, status || 'New', loss_reason || null, assigned_to || null, follow_up_date || null, remark || null]
    );

    res.json({ success: true, message: 'Lead created successfully', leadId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getContactLeads = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { contactId } = req.params;

    const [leads] = await pool.query(
      `SELECT l.*, e.name as enquiry_for_name, u.name as assigned_to_name
       FROM leads l
       LEFT JOIN enquiry_fors e ON l.enquiry_for_id = e.id
       LEFT JOIN users u ON l.assigned_to = u.id
       WHERE l.business_id = ? AND l.contact_id = ?
       ORDER BY l.created_at DESC`,
      [businessId, contactId]
    );

    res.json({ success: true, data: leads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateLead = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;
    const { enquiry_for_id, status, loss_reason, assigned_to, follow_up_date, remark } = req.body;

    await pool.query(
      `UPDATE leads 
       SET enquiry_for_id = ?, status = ?, loss_reason = ?, assigned_to = ?, follow_up_date = ?, remark = ?
       WHERE id = ? AND business_id = ?`,
      [enquiry_for_id || null, status, loss_reason || null, assigned_to || null, follow_up_date || null, remark || null, id, businessId]
    );

    res.json({ success: true, message: 'Lead updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteLead = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { id } = req.params;

    await pool.query(`DELETE FROM leads WHERE id = ? AND business_id = ?`, [id, businessId]);

    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createLead,
  getContactLeads,
  updateLead,
  deleteLead
};
