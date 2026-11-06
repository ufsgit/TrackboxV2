const pool = require('../../db/pool');

/**
 * Excel Export Controller for Today's Leads Report
 * Calls Stored Procedure: `get_todays_leads_export`
 */
const exportTodaysLeads = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { search = '', agent = null } = req.query;

    const searchParam = (search && search.trim()) ? search.trim() : null;
    const agentParam = (agent && agent !== 'all') ? agent : null;

    // Call the Stored Procedure
    const [result] = await pool.query(
      'CALL get_todays_leads_export(?, ?, ?, ?)',
      [businessId, userId, searchParam, agentParam]
    );

    const rows = (result && result[0]) ? result[0] : [];

    // Format clean columns for Excel
    const data = rows.map((r, index) => ({
      'S.No': index + 1,
      'Lead Name': r.name || r.leadName || 'N/A',
      'Phone': r.phone || 'N/A',
      'Interest / Product': r.interest || r.product || 'N/A',
      'Lead Status': r.status_name || 'N/A',
      'Due Date': r.follow_up_date ? new Date(r.follow_up_date).toISOString().slice(0, 10) : 'N/A',
      'Remarks': r.remarks || '',
      'Assignee': r.agent || r.assignee || 'Unassigned',
      'Follow-up Status': 'Due Today'
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Todays Leads Export SP Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export today\'s leads' });
  }
};

module.exports = {
  exportTodaysLeads
};
