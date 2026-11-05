const pool = require('../../db/pool');

/**
 * Excel Export Controller for Lead Creation Report
 * Calls Stored Procedure: `get_lead_creation_export`
 */
const exportLeadCreation = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { startDate, endDate } = req.query;

    const sDate = (startDate && startDate.trim()) ? startDate.trim() : null;
    const eDate = (endDate && endDate.trim()) ? endDate.trim() : null;

    // Call the Stored Procedure
    const [result] = await pool.query(
      'CALL get_lead_creation_export(?, ?, ?, ?)',
      [businessId, userId, sDate, eDate]
    );

    const rows = (result && result[0]) ? result[0] : [];

    // Format clean columns for Excel
    const data = rows.map((r, index) => ({
      'S.No': index + 1,
      'Lead Name': r.name || 'N/A',
      'Phone': r.phone || 'N/A',
      'Email': r.email || 'N/A',
      'Source / Channel': r.channel_preference || r.opt_in_source || 'Direct',
      'Created At': r.created_at ? new Date(r.created_at).toISOString().replace('T', ' ').slice(0, 19) : 'N/A',
      'Created By': r.created_by || 'System',
      'Assigned SDR': r.assigned_to || 'Unassigned',
      'Status': r.status_name || 'PENDING'
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Lead Creation Export SP Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export lead creation report' });
  }
};

module.exports = {
  exportLeadCreation
};
