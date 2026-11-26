const pool = require('../../db/pool');

// GET /api/qualifications/contact/:contactId
const getQualificationsByContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const businessId = req.user?.businessId || req.user?.business_id || 1;

    const [results] = await pool.query('CALL get_contact_qualifications(?, ?)', [
      contactId,
      businessId
    ]);

    const rows = results[0] || [];

    res.json({
      success: true,
      data: rows,
      count: rows.length,
      message: 'OK'
    });
  } catch (err) {
    console.error('Error fetching qualifications:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// POST /api/qualifications/contact/:contactId
// Body: Array of qualification objects (or { items: [...] })
const saveQualifications = async (req, res) => {
  try {
    const { contactId } = req.params;
    const businessId = req.user?.businessId || req.user?.business_id || 1;
    const userId = req.user?.userId || req.user?.id || null;

    // Accept either direct array or { items: [...] }
    const items = Array.isArray(req.body) ? req.body : (req.body.items || []);

    const [results] = await pool.query(
      'CALL save_contact_qualifications(?, ?, ?, ?)',
      [
        contactId,
        businessId,
        userId,
        JSON.stringify(items)
      ]
    );

    const savedList = results[0] || [];

    res.json({
      success: true,
      data: savedList,
      count: savedList.length,
      message: 'Qualifications saved successfully'
    });
  } catch (err) {
    console.error('Error saving qualifications:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// GET /api/qualifications/contact/:contactId/academic-counts
// Returns summary counts & latest statuses for all tabs in a single lightweight query
const getAcademicCounts = async (req, res) => {
  try {
    const { contactId } = req.params;
    const businessId = req.user?.businessId || req.user?.business_id || 1;

    const [rows] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM contact_qualifications WHERE contact_id = ? AND business_id = ?) AS qualifications_count,
        (SELECT COUNT(*) FROM contact_work_experiences WHERE contact_id = ? AND business_id = ?) AS experiences_count,
        (SELECT COUNT(*) FROM contact_tasks WHERE contact_id = ? AND status = 0) AS tasks_count,
        (SELECT COUNT(*) FROM applications WHERE contact_id = ? AND business_id = ?) AS applications_count,
        (SELECT COUNT(*) FROM receipts WHERE contact_id = ? AND business_id = ?) AS receipts_count,
        (SELECT COUNT(*) FROM user_document_upload WHERE contact_id = ? AND business_id = ?) AS documents_count,
        (SELECT status FROM visas WHERE contact_id = ? AND business_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC LIMIT 1) AS visa_status,
        (SELECT status FROM pte_students WHERE contact_id = ? AND business_id = ? AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY id DESC LIMIT 1) AS pte_status
    `, [
      contactId, businessId,
      contactId, businessId,
      contactId,
      contactId, businessId,
      contactId, businessId,
      contactId, businessId,
      contactId, businessId,
      contactId, businessId
    ]);

    const counts = rows[0] || {};

    res.json({
      success: true,
      data: {
        qualifications_count: Number(counts.qualifications_count || 0),
        experiences_count: Number(counts.experiences_count || 0),
        tasks_count: Number(counts.tasks_count || 0),
        applications_count: Number(counts.applications_count || 0),
        receipts_count: Number(counts.receipts_count || 0),
        documents_count: Number(counts.documents_count || 0),
        visa_status: counts.visa_status || '',
        pte_status: counts.pte_status || ''
      },
      message: 'OK'
    });
  } catch (err) {
    console.error('Error fetching academic counts:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = {
  getQualificationsByContact,
  saveQualifications,
  getAcademicCounts
};
