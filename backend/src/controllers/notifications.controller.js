const pool = require('../db/pool');

const getNotifications = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const limit = parseInt(req.query.limit) || 50;

    const [notifications] = await pool.query(
      `SELECT * FROM notifications 
       WHERE business_id = ? AND user_id = ? AND is_read = FALSE
       ORDER BY created_at DESC 
       LIMIT ?`,
      [businessId, userId, limit]
    );

    res.json({ success: true, data: notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { notificationIds } = req.body;

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No notification IDs provided' });
    }

    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE business_id = ? AND user_id = ? AND id IN (?)`,
      [businessId, userId, notificationIds]
    );

    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ success: false, message: 'Server error marking notifications read' });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;

    await pool.query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE business_id = ? AND user_id = ?`,
      [businessId, userId]
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications read:', error);
    res.status(500).json({ success: false, message: 'Server error marking all notifications read' });
  }
};

const clearAllNotifications = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;

    await pool.query(
      `DELETE FROM notifications 
       WHERE business_id = ? AND user_id = ?`,
      [businessId, userId]
    );

    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing all notifications:', error);
    res.status(500).json({ success: false, message: 'Server error clearing notifications' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAllNotifications
};
