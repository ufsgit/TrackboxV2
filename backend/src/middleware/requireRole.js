const pool = require('../db/pool');

const requireRole = (...roles) => async (req, res, next) => {
  if (!req.user || (!req.user.role && !req.user.userId && !req.user.id)) {
    return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions', data: null });
  }
  
  try {
    const userId = req.user.userId || req.user.id;
    const [rows] = await pool.query('SELECT role, permissions FROM users WHERE id = ?', [userId]);
    
    if (rows.length > 0) {
      const dbUser = rows[0];
      const userRoleStr = String(dbUser.role).toLowerCase();
      const allowedRolesLower = roles.map(r => String(r).toLowerCase());
      
      // Check if role matches
      if (allowedRolesLower.includes(userRoleStr)) {
        return next();
      }

      // Check granular permissions for "System Settings" or if they have all permissions
      if (dbUser.permissions) {
        let perms = dbUser.permissions;
        if (typeof perms === 'string') {
          try { perms = JSON.parse(perms); } catch(e) { perms = []; }
        }
        
        if (Array.isArray(perms)) {
          // Check if they have a generic 'full access' flag or System Settings save permission
          const hasSystemSettings = perms.find(p => String(p.menuName).toLowerCase().includes('system settings') && p.save);
          const hasSettings = perms.find(p => String(p.menuName).toLowerCase() === 'settings' && p.save);
          const hasBranches = perms.find(p => String(p.menuName).toLowerCase().includes('branch') && p.save);
          
          if (hasSystemSettings || hasBranches || hasSettings) {
            return next();
          }
        }
      }
    }
  } catch (err) {
    console.error('Permission check error:', err);
  }
  
  return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions', data: null });
};

module.exports = requireRole;
