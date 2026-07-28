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

    if (assigned_to) {
      const io = req.app.get('io');
      const [contactRows] = await pool.query('SELECT * FROM contacts WHERE id = ? AND business_id = ?', [contactId, businessId]);
      if (contactRows.length > 0) {
        const contact = contactRows[0];
        // Insert persistent notification
        await pool.query(
          `INSERT INTO notifications (business_id, user_id, type, title, message, reference_id)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [businessId, assigned_to, 'assignment', 'New Lead Assigned', `You have been assigned a new lead: ${contact.name || contact.phone || 'Unknown'}`, result.insertId]
        );
          if (io) {
            io.to(`biz_${businessId}`).emit('contact_assigned', { contact: contact, assigned_to: assigned_to });
            io.emit('contact_assigned', { contact: contact, assigned_to: assigned_to });
          }
      }
    }

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
      [enquiry_for_id || null, status || 'New', loss_reason || null, assigned_to || null, follow_up_date || null, remark || null, id, businessId]
    );

    if (assigned_to) {
      const io = req.app.get('io');
      const [leadRows] = await pool.query('SELECT contact_id FROM leads WHERE id = ? AND business_id = ?', [id, businessId]);
      if (leadRows.length > 0) {
        const [contactRows] = await pool.query('SELECT * FROM contacts WHERE id = ? AND business_id = ?', [leadRows[0].contact_id, businessId]);
        if (contactRows.length > 0) {
          const contact = contactRows[0];
          // Insert persistent notification
          await pool.query(
            `INSERT INTO notifications (business_id, user_id, type, title, message, reference_id)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [businessId, assigned_to, 'assignment', 'Lead Reassigned', `A lead has been assigned to you: ${contact.name || contact.phone || 'Unknown'}`, id]
          );
          if (io) {
            console.log('Broadcasting contact_assigned globally');
            io.emit('contact_assigned', { contact: contact, assigned_to: assigned_to });
          }
        }
      }
    }

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
