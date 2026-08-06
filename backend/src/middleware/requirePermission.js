const pool = require('../db/pool');

const requirePermission = (menuName, action = 'view') => async (req, res, next) => {
  if (!req.user || (!req.user.role && !req.user.userId && !req.user.id)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions', data: null });
  }

  try {
    const userId = req.user.userId || req.user.id;
    const [rows] = await pool.query('SELECT role, permissions FROM users WHERE id = ?', [userId]);

    if (rows.length > 0) {
      const dbUser = rows[0];
      const userRoleStr = String(dbUser.role).toLowerCase();

      // Admins and Superadmins always have full access
      if (['admin', 'superadmin'].includes(userRoleStr)) {
        return next();
      }

      // Check granular permissions for the specific menu
      if (dbUser.permissions) {
        let perms = dbUser.permissions;
        if (typeof perms === 'string') {
          try { perms = JSON.parse(perms); } catch(e) { perms = []; }
        }

        if (Array.isArray(perms)) {
          const perm = perms.find(p => String(p.menuName).toLowerCase() === String(menuName).toLowerCase());
          
          if (perm) {
            // Check the specific action
            if (action === 'view' && perm.view) return next();
            if (action === 'save' && perm.save) return next();
            if (action === 'edit' && perm.edit) return next();
            if (action === 'delete' && perm.delete) return next();
          }
        }
      }
    }
  } catch (err) {
    console.error('Permission check error:', err);
  }

  return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions', data: null });
};

module.exports = requirePermission;
