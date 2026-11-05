const pool = require('../../db/pool');

/**
 * Excel Export Controller for Sale Won / Lost Report
 * Executes the stored procedure `get_won_lost_export`
 */
const exportWonLost = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { startDate, endDate } = req.query;

    const sDate = (startDate && startDate.trim()) ? startDate.trim() : null;
    const eDate = (endDate && endDate.trim()) ? endDate.trim() : null;

    // Call the Stored Procedure
    const [result] = await pool.query(
      'CALL get_won_lost_export(?, ?, ?, ?)',
      [businessId, userId, sDate, eDate]
    );

    // Stored procedure returns rows in the first index
    const rows = (result && result[0]) ? result[0] : [];

    // Format clean columns for Excel export
    const deals = rows.map((r, index) => ({
      'S.No': index + 1,
      'Lead / Client': r.client || 'N/A',
      'Status': r.deal_status || (r.current_sale_status === 1 ? 'Won' : 'Lost'),
      'Sales Rep': r.rep || 'Unassigned',
      'Date': r.date ? new Date(r.date).toISOString().replace('T', ' ').slice(0, 19) : 'N/A'
    }));

    return res.json({ success: true, data: deals });
  } catch (err) {
    console.error('Won/Lost Export SP Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export won/lost report' });
  }
};

module.exports = {
  exportWonLost
};
