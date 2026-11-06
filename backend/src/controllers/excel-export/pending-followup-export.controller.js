const pool = require('../../db/pool');

/**
 * Excel Export Controller for Pending Followups Report (Overdue)
 * Calls Stored Procedure: `get_pending_followup_export`
 */
const exportPendingFollowups = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { search = '', agent = null } = req.query;

    const searchParam = (search && search.trim()) ? search.trim() : null;
    const agentParam = (agent && agent !== 'all') ? agent : null;

    // Call the Stored Procedure
    const [result] = await pool.query(
      'CALL get_pending_followup_export(?, ?, ?, ?)',
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
      'Follow-up Status': 'Overdue'
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Pending Follow-up Export SP Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export pending follow-ups' });
  }
};

module.exports = {
  exportPendingFollowups
};
