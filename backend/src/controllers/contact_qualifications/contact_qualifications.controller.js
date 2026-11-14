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

module.exports = {
  getQualificationsByContact,
  saveQualifications
};
