const pool = require('../../db/pool');

// GET /api/work-experiences/contact/:contactId
const getWorkExperiencesByContact = async (req, res) => {
  try {
    const { contactId } = req.params;
    const businessId = req.user?.businessId || req.user?.business_id || 1;

    const [results] = await pool.query('CALL get_contact_work_experiences(?, ?)', [
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
    console.error('Error fetching work experiences:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// POST /api/work-experiences/contact/:contactId
// Body: Array of work experience objects (or { items: [...] })
const saveWorkExperiences = async (req, res) => {
  try {
    const { contactId } = req.params;
    const businessId = req.user?.businessId || req.user?.business_id || 1;
    const userId = req.user?.userId || req.user?.id || null;

    // Accept either direct array or { items: [...] }
    const items = Array.isArray(req.body) ? req.body : (req.body.items || []);

    const [results] = await pool.query(
      'CALL save_contact_work_experiences(?, ?, ?, ?)',
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
      message: 'Work experiences saved successfully'
    });
  } catch (err) {
    console.error('Error saving work experiences:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = {
  getWorkExperiencesByContact,
  saveWorkExperiences
};
