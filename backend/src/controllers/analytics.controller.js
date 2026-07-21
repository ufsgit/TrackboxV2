const pool = require('../db/pool');

const getDashboard = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const [[{ totalContacts }]] = await pool.query('SELECT COUNT(*) as totalContacts FROM contacts WHERE business_id=?', [bizId]);
    const [[{ openConversations }]] = await pool.query("SELECT COUNT(*) as openConversations FROM conversations WHERE business_id=? AND status='open'", [bizId]);
    const [[{ messagesToday }]] = await pool.query("SELECT COUNT(*) as messagesToday FROM messages m JOIN conversations c ON m.conversation_id=c.id WHERE c.business_id=? AND DATE(m.sent_at)=CURDATE()", [bizId]);
    const [[{ totalBroadcasts }]] = await pool.query('SELECT COUNT(*) as totalBroadcasts FROM broadcasts WHERE business_id=?', [bizId]);
    const [[broadcastStats]] = await pool.query('SELECT SUM(total_read) as totalRead, SUM(total_sent) as totalSent FROM broadcasts WHERE business_id=?', [bizId]);
    const readRate = broadcastStats.totalSent > 0 ? Math.round((broadcastStats.totalRead / broadcastStats.totalSent) * 100) : 0;

    const [recentConvs] = await pool.query(
      `SELECT c.*, co.name as contact_name, co.phone,
        (SELECT content FROM messages m WHERE m.conversation_id=c.id ORDER BY m.sent_at DESC LIMIT 1) as last_message
       FROM conversations c JOIN contacts co ON c.contact_id=co.id WHERE c.business_id=? ORDER BY c.last_message_at DESC LIMIT 5`,
      [bizId]
    );

    res.json({ success: true, data: { totalContacts, openConversations, messagesToday, totalBroadcasts, broadcastReadRate: readRate, recentConversations: recentConvs }, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getMessagesAnalytics = async (req, res) => {
  try {
    const { from, to, channel } = req.query;
    const bizId = req.user.businessId;
    let where = 'WHERE c.business_id=?'; const params = [bizId];
    if (from) { where += ' AND DATE(m.sent_at) >= ?'; params.push(from); }
    if (to) { where += ' AND DATE(m.sent_at) <= ?'; params.push(to); }
    if (channel) { where += ' AND c.channel=?'; params.push(channel); }
    const [rows] = await pool.query(
      `SELECT DATE(m.sent_at) as date, COUNT(*) as count, m.direction FROM messages m JOIN conversations c ON m.conversation_id=c.id ${where} GROUP BY DATE(m.sent_at), m.direction ORDER BY date ASC`,
      params
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getBroadcastsAnalytics = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT name, total_recipients, total_sent, total_delivered, total_read, total_failed, created_at FROM broadcasts WHERE business_id=? ORDER BY created_at DESC LIMIT 20',
      [req.user.businessId]
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getChatbotAnalytics = async (req, res) => {
  try {
    const [[{ totalSessions }]] = await pool.query('SELECT COUNT(*) as totalSessions FROM chatbot_sessions WHERE chatbot_id=?', [req.params.id]);
    const [rows] = await pool.query(
      'SELECT current_node_id, COUNT(*) as count FROM chatbot_sessions WHERE chatbot_id=? GROUP BY current_node_id',
      [req.params.id]
    );
    res.json({ success: true, data: { totalSessions, nodeDropoff: rows }, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getContactGrowth = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT DATE(created_at) as date, COUNT(*) as count FROM contacts WHERE business_id=? GROUP BY DATE(created_at) ORDER BY date ASC',
      [req.user.businessId]
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getCrmDashboardStats = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const range = req.query.range || 'today';

    // Build date filter clause
    let dateClause = '';
    if (range === 'today') {
      dateClause = 'AND DATE(created_at) = CURDATE()';
    } else if (range === 'this_week') {
      dateClause = 'AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (range === 'this_month') {
      dateClause = 'AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
    }

    const [[{ totalLeads }]] = await pool.query(
      `SELECT COUNT(*) as totalLeads FROM contacts WHERE business_id = ? ${dateClause}`,
      [bizId]
    );
    
    // Follow-up counts are scheduling-state based, not date-filtered
    const [[{ pendingFollowUps }]] = await pool.query(
      'SELECT COUNT(*) as pendingFollowUps FROM contacts WHERE business_id = ? AND follow_up = 1 AND DATE(follow_up_date) <= CURDATE()',
      [bizId]
    );
    const [[{ todaysFollowUps }]] = await pool.query(
      'SELECT COUNT(*) as todaysFollowUps FROM contacts WHERE business_id = ? AND follow_up = 1 AND DATE(follow_up_date) = CURDATE()',
      [bizId]
    );
    const [[{ upcomingFollowUps }]] = await pool.query(
      'SELECT COUNT(*) as upcomingFollowUps FROM contacts WHERE business_id = ? AND follow_up = 1 AND DATE(follow_up_date) > CURDATE()',
      [bizId]
    );
    
    const [[{ wonDeals }]] = await pool.query(
      `SELECT COUNT(*) as wonDeals FROM contacts WHERE business_id = ? AND status_name = 'Converted' ${dateClause}`,
      [bizId]
    );
    const [[{ lostDeals }]] = await pool.query(
      `SELECT COUNT(*) as lostDeals FROM contacts WHERE business_id = ? AND status_name = 'Sales Loss' ${dateClause}`,
      [bizId]
    );

    const [funnelData] = await pool.query(
      `SELECT status_name as name, COUNT(*) as count 
       FROM contacts 
       WHERE business_id = ? AND status_name IS NOT NULL ${dateClause}
       GROUP BY status_name`,
      [bizId]
    );

    res.json({
      success: true,
      data: {
        totalLeads: totalLeads || 0,
        pendingFollowUps: pendingFollowUps || 0,
        todaysFollowUps: todaysFollowUps || 0,
        upcomingFollowUps: upcomingFollowUps || 0,
        wonDeals: wonDeals || 0,
        lostDeals: lostDeals || 0,
        funnelData
      },
      message: 'OK'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

module.exports = { getDashboard, getMessagesAnalytics, getBroadcastsAnalytics, getChatbotAnalytics, getContactGrowth, getCrmDashboardStats };
