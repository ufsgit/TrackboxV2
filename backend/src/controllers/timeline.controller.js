const pool = require('../db/pool');

const getContactTimeline = async (req, res) => {
  const contactId = req.params.contactId;
  const bizId = req.user.businessId;

  try {
    const events = [];

    // 1. Fetch Contact Creation Event
    const [contactRows] = await pool.query('SELECT created_at, name FROM contacts WHERE id = ? AND business_id = ?', [contactId, bizId]);
    if (contactRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    events.push({
      type: 'creation',
      title: 'Contact Created',
      description: `Lead created for ${contactRows[0].name}`,
      date: contactRows[0].created_at,
      icon: 'bi-person-plus-fill',
      color: '#3b82f6' // Blue
    });

    // 2. Fetch Contact History
    const [historyRows] = await pool.query(`
      SELECT ch.field_name, ch.old_value, ch.new_value, ch.created_at, u.name as changed_by_name
      FROM contact_history ch
      LEFT JOIN users u ON ch.user_id = u.id
      WHERE ch.contact_id = ? AND ch.business_id = ?
    `, [contactId, bizId]);

    for (const h of historyRows) {
      let icon = 'bi-pencil-fill';
      let color = '#64748b'; // Slate

      if (h.field_name === 'status' || h.field_name === 'status_name') { 
        icon = 'bi-tag-fill'; color = '#0ea5e9'; // Sky
      }
      if (h.field_name === 'assigned_to') { 
        icon = 'bi-person-badge-fill'; color = '#f59e0b'; // Amber
      }
      if (h.field_name === 'follow_up_date') {
        icon = 'bi-calendar-event-fill'; color = '#8b5cf6'; // Violet
      }

      events.push({
        type: 'history',
        title: `${h.field_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Updated`,
        description: `Changed from "${h.old_value || 'None'}" to "${h.new_value || 'None'}"`,
        author: h.changed_by_name,
        date: h.created_at,
        icon,
        color
      });
    }

    // 3. Fetch Follow Ups
    const [followUpRows] = await pool.query(`
      SELECT * FROM follow_ups WHERE contact_id = ?
    `, [contactId]);

    for (const f of followUpRows) {
      events.push({
        type: 'follow_up',
        title: 'Follow Up Activity',
        description: f.remarks || 'No remarks provided',
        details: f.status_name ? `Status updated to ${f.status_name}` : null,
        author: f.by_user_name,
        date: f.entry_date_time,
        icon: 'bi-telephone-fill',
        color: '#10b981' // Emerald
      });
    }

    // Sort chronologically (newest first)
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({ success: true, data: events });
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch timeline', error: error.message });
  }
};

module.exports = {
  getContactTimeline
};
