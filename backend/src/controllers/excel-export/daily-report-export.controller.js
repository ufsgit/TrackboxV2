const pool = require('../../db/pool');

/**
 * Excel Export Controller for Daily Report (Follow-Up Audit Log)
 * Calls Stored Procedure: `get_daily_report_export`
 */
const exportDailyReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { 
      startDate, 
      endDate, 
      status, 
      employee, 
      search 
    } = req.query;

    const sDate = (startDate && startDate.trim()) ? startDate.trim() : null;
    const eDate = (endDate && endDate.trim()) ? endDate.trim() : null;
    const empParam = (employee && employee !== 'All') ? employee : null;
    const statusParam = (status && status !== 'All') ? status.trim() : null;
    const searchParam = (search && search.trim()) ? search.trim() : null;

    // Call the Stored Procedure with 7 parameters (start & end date only)
    const [result] = await pool.query(
      'CALL get_daily_report_export(?, ?, ?, ?, ?, ?, ?)',
      [
        businessId,
        userId,
        sDate,
        eDate,
        empParam,
        statusParam,
        searchParam
      ]
    );

    const rows = (result && result[0]) ? result[0] : [];

    // Format clean columns for Excel directly from follow_ups
    const data = rows.map((r, index) => ({
      'S.No': index + 1,
      'Contact Name': r.contact_name || 'N/A',
      'Phone': r.phone || 'N/A',
      'Logged At': r.entry_date_time ? new Date(r.entry_date_time).toISOString().replace('T', ' ').slice(0, 19) : 'N/A',
      'Follow-Up Status': r.status_name || 'N/A',
      'Logged By': r.by_user_name || 'System',
      'Assigned SDR': r.to_user_name || 'Unassigned',
      'Branch': r.branch_name || 'N/A',
      'Department': r.department_name || 'N/A',
      'Next Follow-Up Date': r.follow_up_date ? new Date(r.follow_up_date).toISOString().slice(0, 10) : 'N/A',
      'Remarks': r.remarks || ''
    }));

    return res.json({ success: true, data });
  } catch (err) {
    console.error('Daily Report Export SP Error:', err);
    return res.status(500).json({ success: false, message: 'Failed to export daily report' });
  }
};

module.exports = {
  exportDailyReport
};
