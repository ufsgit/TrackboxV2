const pool = require('../db/pool');

const normalizeAssetPath = (p) => {
  if (!p || typeof p !== 'string') return p;
  return p.replace(/\\/g, '/').replace(/^(\/?backend\/src\/)+/, '').replace(/^\/+/, '');
};

/**
 * GET /api/company-config/active
 * Returns active company configuration where company_status = 1 (ORDER BY id DESC LIMIT 1)
 */
const getActiveCompanyConfig = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, title, is_email, logo, favicon, company_status FROM company_config WHERE company_status = 1 ORDER BY id DESC LIMIT 1'
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          id: 0,
          name: 'Trackbox',
          title: 'Trackbox CRM',
          is_email: 0,
          logo: 'assets/choice-logo.png',
          favicon: 'assets/choice-icon.png',
          company_status: 1
        },
        message: 'Default active config'
      });
    }

    const config = rows[0];
    return res.json({
      success: true,
      data: {
        id: config.id,
        name: config.name,
        title: config.title || config.name,
        is_email: (config.is_email === 1 || config.is_email === true) ? 1 : 0,
        logo: normalizeAssetPath(config.logo),
        favicon: normalizeAssetPath(config.favicon),
        company_status: config.company_status
      },
      message: 'Active company configuration loaded'
    });
  } catch (err) {
    console.error('Error fetching company config:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
      data: null
    });
  }
};

module.exports = {
  getActiveCompanyConfig
};

