const pool = require('../../db/pool');

/**
 * Excel Export Controller for Upcoming Followups Report
 * Calls Stored Procedure: `get_upcoming_followups_export`
 */
const exportUpcomingFollowups = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { search = '', agent = null } = req.query;

    const searchParam = (search && search.trim()) ? search.trim() : null;
    const agentParam = (agent && agent !== 'all') ? agent : null;

    // Call the Stored Procedure
    const [result] = await pool.query(
      'CALL get_upcoming_followups_export(?, ?, ?, ?)',
      [businessId, userId, searchParam, agentParam]
    );

    const rows = (result && result[0]) ? result[0] : [];

    // Format clean columns for Excel
    const data = rows.map((r, index) => ({
      'S.No': index + 1,
      'Lead Name': r.leadName || 'N/A',
      'Phone': r.phone || 'N/A',
      'Due Date': r.dueDate ? new Date(r.dueDate).toISOString().slice(0, 10) : 'N/A',
      'Lead Status': r.status_name || 'N/A',
      'Remarks': r.remarks || '',
      'Assignee': r.assignee || 'Unassigned',
      'Follow-up Status': 'Upcoming'
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Upcoming Followups Export SP Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export upcoming followups' });
  }
};

module.exports = {
  exportUpcomingFollowups
};
