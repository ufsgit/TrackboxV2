const pool = require('../db/pool');

// Helper to map frontend menu name to DB enum
const normalizeMenu = (menu) => {
  if (!menu) return null;
  const m = menu.toLowerCase();
  if (m === 'leads') return 'lead';
  return m;
};

// Check In to a specific menu
exports.checkIn = async (req, res) => {
  try {
    const { menu, late_reason } = req.body;
    const user_id = req.user.id || req.user.userId;
    const business_id = req.user.business_id || req.user.businessId;
    const user_name = req.user.name || 'Unknown User';

    const dbMenu = normalizeMenu(menu);

    if (!dbMenu) {
      return res.status(400).json({ success: false, message: 'Menu is required' });
    }

    // Check if there's already an active check-in for this specific menu that hasn't been checked out
    const [activeLogs] = await pool.query(
      'SELECT id, menu FROM attendance_logs WHERE user_id = ? AND menu = ? AND check_out_time IS NULL',
      [user_id, dbMenu]
    );

    if (activeLogs.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `You are already checked in to ${activeLogs[0].menu}. Please check out first.` 
      });
    }

    // Determine if late
    let is_late = false;
    const expectedStartStr = process.env.EXPECTED_START_TIME || '09:30';
    const [expectedHour, expectedMinute] = expectedStartStr.split(':').map(Number);
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Compare time
    if (currentHour > expectedHour || (currentHour === expectedHour && currentMinute > expectedMinute)) {
      is_late = true;
    }

    if (is_late && !late_reason) {
      return res.status(400).json({ 
        success: false, 
        is_late: true,
        message: 'You are late. Please provide a reason.' 
      });
    }

    await pool.query(
      `INSERT INTO attendance_logs (business_id, user_id, user_name, menu, is_late, late_reason) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [business_id, user_id, user_name, dbMenu, is_late, late_reason || null]
    );

    res.json({ success: true, message: `Checked in to ${menu} successfully.` });
  } catch (error) {
    console.error('Check In Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Check Out of current menu
exports.checkOut = async (req, res) => {
  try {
    const user_id = req.user.id || req.user.userId;
    const dbMenu = normalizeMenu(req.body.menu);

    if (!dbMenu) {
      return res.status(400).json({ success: false, message: 'Menu is required for check-out' });
    }

    // Find the active check in for this specific menu
    const [activeLogs] = await pool.query(
      'SELECT id, check_in_time FROM attendance_logs WHERE user_id = ? AND menu = ? AND check_out_time IS NULL',
      [user_id, dbMenu]
    );

    if (activeLogs.length === 0) {
      return res.status(400).json({ success: false, message: 'No active check-in found' });
    }

    const log = activeLogs[0];
    const checkOutTime = new Date();
    const checkInTime = new Date(log.check_in_time);
    
    // Calculate total minutes
    const diffMs = checkOutTime - checkInTime;
    const totalMinutes = Math.floor(diffMs / (1000 * 60));

    await pool.query(
      `UPDATE attendance_logs SET check_out_time = ?, total_minutes = ?, status = 'Completed' WHERE id = ?`,
      [checkOutTime, totalMinutes, log.id]
    );

    res.json({ success: true, message: 'Checked out successfully', data: { totalMinutes } });
  } catch (error) {
    console.error('Check Out Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get current status
exports.getStatus = async (req, res) => {
  try {
    const user_id = req.user.id || req.user.userId;
    const dbMenu = normalizeMenu(req.query.menu);

    let query = 'SELECT id, menu, check_in_time FROM attendance_logs WHERE user_id = ? AND check_out_time IS NULL';
    const params = [user_id];

    if (dbMenu) {
      query += ' AND menu = ?';
      params.push(dbMenu);
    }

    const [activeLogs] = await pool.query(query, params);

    if (activeLogs.length > 0) {
      res.json({ success: true, isCheckedIn: true, data: activeLogs[0] });
    } else {
      res.json({ success: true, isCheckedIn: false, data: null });
    }
  } catch (error) {
    console.error('Get Status Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get report
exports.getReport = async (req, res) => {
  try {
    const business_id = req.user.business_id || req.user.businessId;
    const { start_date, end_date, user_id } = req.query;
    
    let query = 'SELECT * FROM attendance_logs WHERE business_id = ?';
    const params = [business_id];

    if (start_date) {
      query += ' AND DATE(check_in_time) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      query += ' AND DATE(check_in_time) <= ?';
      params.push(end_date);
    }
    if (user_id) {
      query += ' AND user_id = ?';
      params.push(user_id);
    }
    
    query += ' ORDER BY check_in_time DESC';

    const expectedStartStr = process.env.EXPECTED_START_TIME || '09:30';
    const [expectedHour, expectedMinute] = expectedStartStr.split(':').map(Number);

    const [logs] = await pool.query(query, params);
    
    const enrichedLogs = logs.map(log => {
      let lateMinutes = 0;
      if (log.is_late) {
        const checkIn = new Date(log.check_in_time);
        const expectedTime = new Date(log.check_in_time);
        expectedTime.setHours(expectedHour, expectedMinute, 0, 0);
        const diff = Math.floor((checkIn.getTime() - expectedTime.getTime()) / (1000 * 60));
        lateMinutes = diff > 0 ? diff : 0;
      }
      return {
        ...log,
        late_minutes: lateMinutes
      };
    });

    res.json({ success: true, data: enrichedLogs });
  } catch (error) {
    console.error('Get Report Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
