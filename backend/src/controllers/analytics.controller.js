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
    const userId = req.user.userId || req.user.id;
    const range = req.query.range || 'today';

    // Call Stored Procedure with comprehensive IF conditions for all 7 KPIs
    const [spResults] = await pool.query(
      'CALL sp_get_crm_dashboard_kpis(?, ?, ?, ?)',
      [bizId, Number(userId), req.user.role || 'admin', range]
    );

    const kpiData = (spResults && spResults[0] && spResults[0][0]) ? spResults[0][0] : {};

    const totalLeads = Number(kpiData.totalLeads) || 0;
    const pendingFollowUps = Number(kpiData.pendingFollowUps) || 0;
    const todaysFollowUps = Number(kpiData.todaysFollowUps) || 0;
    const upcomingFollowUps = Number(kpiData.upcomingFollowUps) || 0;
    const wonDeals = Number(kpiData.wonDeals) || 0;
    const lostDeals = Number(kpiData.lostDeals) || 0;
    const conversionRate = parseFloat(kpiData.conversionRate) || 0.0;

    // Build role filter clause for status funnel and charts
    let agentClause = '';
    const queryParams = [bizId];

    if (req.user.role === 'agent') {
      const selfId = Number(userId);
      const [teamRows] = await pool.query(
        `SELECT user_id FROM team_members 
         WHERE team_id = (SELECT id FROM teams WHERE name = CONCAT('__agent_', ?) AND business_id = ?)`,
        [selfId, bizId]
      );
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);

      agentClause = `AND assigned_to IN (${teamMemberIds.map(() => '?').join(',')})`;
      queryParams.push(...teamMemberIds);
    }

    let dateClause = '';
    if (range === 'today') {
      dateClause = 'AND DATE(created_at) = CURDATE()';
    } else if (range === 'this_week') {
      dateClause = 'AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (range === 'this_month') {
      dateClause = 'AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
    } else if (range === 'last_30_days') {
      dateClause = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    } else if (range === 'this_year') {
      dateClause = 'AND YEAR(created_at) = YEAR(CURDATE())';
    }

    // Call Stored Procedure for Lead Status Pipeline Card
    const [pipelineResults] = await pool.query(
      'CALL sp_get_crm_dashboard_pipeline(?, ?, ?, ?)',
      [bizId, Number(userId), req.user.role || 'admin', range]
    );

    const pipelineStages = (pipelineResults && pipelineResults[0]) ? pipelineResults[0] : [];

    // Call Stored Procedure for Monthly Performance Grouped Bar Chart
    const [monthlyResults] = await pool.query(
      'CALL sp_get_crm_dashboard_monthly_performance(?, ?, ?, ?)',
      [bizId, Number(userId), req.user.role || 'admin', range]
    );

    const monthlyRows = (monthlyResults && monthlyResults[0]) ? monthlyResults[0] : [];
    const monthlyMonths = monthlyRows.map(r => r.month_name);
    const leadsValues = monthlyRows.map(r => Number(r.leads_count || 0));
    const contactedValues = monthlyRows.map(r => Number(r.contacted_count || 0));
    const followupsValues = monthlyRows.map(r => Number(r.followups_count || 0));
    const wonValues = monthlyRows.map(r => Number(r.won_count || 0));

    const maxVal = Math.max(...leadsValues, ...contactedValues, ...followupsValues, ...wonValues, 10);
    // Round up maxVal to a clean step (multiple of 10 or 20)
    const chartMax = Math.ceil((maxVal * 1.15) / 10) * 10;
    const step = chartMax / 4;
    const ticks = [0, Math.round(step), Math.round(step * 2), Math.round(step * 3), chartMax];

    const monthlyPerformance = {
      months: monthlyMonths,
      series: [
        { name: 'Leads', color: '#2F7BF5', values: leadsValues },
        { name: 'Contacted', color: '#1FB874', values: contactedValues },
        { name: 'Follow-ups Done', color: '#F59B2B', values: followupsValues },
        { name: 'Won', color: '#8B5CF6', values: wonValues }
      ],
      chartMax,
      ticks
    };

    // Call Stored Procedure for Lead Source Analysis
    const [sourceResults] = await pool.query(
      'CALL sp_get_crm_dashboard_lead_sources(?, ?, ?, ?)',
      [bizId, Number(userId), req.user.role || 'admin', range]
    );

    const sourceRows = (sourceResults && sourceResults[0]) ? sourceResults[0] : [];
    const sourcePalette = ['#2F7BF5', '#F0568C', '#1FB874', '#F2C230', '#8B5CF6', '#9AA7BD', '#06B6D4', '#EC4899'];
    const sources = sourceRows.map((s, idx) => ({
      name: s.name,
      value: Number(s.value || 0),
      color: sourcePalette[idx % sourcePalette.length]
    }));

    // Call Stored Procedure for Team Performance Table
    const [teamResults] = await pool.query(
      'CALL sp_get_crm_dashboard_team_performance(?, ?, ?, ?)',
      [bizId, Number(userId), req.user.role || 'admin', range]
    );

    const teamPalette = ['#2F7BF5', '#1FB874', '#F59B2B', '#8B5CF6', '#F0568C', '#06B6D4'];
    const teamRows = (teamResults && teamResults[0]) ? teamResults[0] : [];
    const team = teamRows.map((t, idx) => {
      const name = t.name || 'Executive';
      const parts = name.trim().split(' ');
      const initials = parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
      const leads = Number(t.leads || 0);
      const pending = Number(t.pending || 0);
      const today = Number(t.today || 0);
      const won = Number(t.won || 0);
      const conversion = parseFloat(t.conversion || 0.0);
      return {
        id: t.user_id,
        name,
        leads,
        pending,
        today,
        won,
        initials,
        color: teamPalette[idx % teamPalette.length],
        conversion
      };
    });

    // Call Stored Procedure for Recent Leads
    const [recentResults] = await pool.query(
      'CALL sp_get_crm_dashboard_recent_leads(?, ?, ?, ?)',
      [bizId, Number(userId), req.user.role || 'admin', range]
    );

    const recentRows = (recentResults && recentResults[0]) ? recentResults[0] : [];
    const recent = recentRows.map(r => {
      let color = 'var(--orange)';
      const st = (r.status || '').toUpperCase();
      if (st.includes('WON') || st.includes('CONVERTED')) color = 'var(--green)';
      else if (st.includes('LOST')) color = 'var(--red)';
      else if (st.includes('UPCOMING')) color = 'var(--cyan)';

      return {
        id: r.id,
        date: r.date,
        name: r.name,
        source: r.source,
        interest: r.interest,
        next: r.next,
        status: r.status,
        color,
        owner: r.owner
      };
    });

    // Fetch all available statuses first so we can show them even if count is 0
    const [allStatuses] = await pool.query('SELECT name, color FROM statuses ORDER BY sequence ASC');

    const [groupedFunnelData] = await pool.query(
      `SELECT status_name as name, COUNT(*) as count 
       FROM contacts 
       WHERE business_id = ? ${agentClause} AND status_name IS NOT NULL ${dateClause}
       GROUP BY status_name`,
      queryParams
    );

    // Merge actual counts with the complete list of statuses
    const statusesMap = {};
    allStatuses.forEach(s => statusesMap[s.name] = 0);
    groupedFunnelData.forEach(f => {
      if (statusesMap.hasOwnProperty(f.name)) {
        statusesMap[f.name] = f.count;
      }
    });

    const funnelData = [
      { name: 'Total Leads', count: totalLeads || 0, color: '#4f46e5' },
      ...allStatuses.map(s => ({
        name: s.name,
        count: statusesMap[s.name],
        color: s.color || '#000000'
      }))
    ];

    const [upcomingChartDataRows] = await pool.query(
      `SELECT DATEDIFF(DATE(follow_up_date), CURDATE()) as days_from_now, COUNT(*) as count 
       FROM contacts 
       WHERE business_id = ? ${agentClause} AND follow_up = 1 AND DATE(follow_up_date) > CURDATE() AND DATE(follow_up_date) <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATEDIFF(DATE(follow_up_date), CURDATE())`,
      queryParams
    );
    const upcomingChartData = [0, 0, 0, 0, 0, 0, 0];
    upcomingChartDataRows.forEach(r => {
      const idx = r.days_from_now - 1;
      if (idx >= 0 && idx < 7) {
        upcomingChartData[idx] = r.count;
      }
    });

    // Query Total Applications created from leads
    let appDateClause = '';
    if (range === 'today') {
      appDateClause = 'AND DATE(created_at) = CURDATE()';
    } else if (range === 'this_week') {
      appDateClause = 'AND YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (range === 'this_month') {
      appDateClause = 'AND YEAR(created_at) = YEAR(CURDATE()) AND MONTH(created_at) = MONTH(CURDATE())';
    } else if (range === 'last_30_days') {
      appDateClause = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    } else if (range === 'this_year') {
      appDateClause = 'AND YEAR(created_at) = YEAR(CURDATE())';
    }

    // Current counts by active application status
    const [appStatusCounts] = await pool.query(
      `SELECT 
        COUNT(CASE WHEN a.status_id = 5 OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%offer received%' THEN 1 END) as offerLetters,
        COUNT(CASE WHEN a.status_id = 6 OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%visa applied%' THEN 1 END) as visaSubmitted,
        COUNT(CASE WHEN a.status_id = 7 OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%visa received%' THEN 1 END) as visaApproved,
        COUNT(CASE WHEN a.status_id = 8 OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%enrolled%' OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%travelled%' THEN 1 END) as enrolled,
        COUNT(a.id) as totalApplications
      FROM applications a
      LEFT JOIN application_statuses s ON a.status_id = s.id
      WHERE a.business_id = ? ${appDateClause}`,
      [bizId]
    );
    const kpiApps = appStatusCounts[0] || {};

    // Fees Paid (leads who paid Application Fees)
    const [[{ feesPaid = 0 } = {}]] = await pool.query(
      `SELECT COUNT(DISTINCT r.contact_id) as feesPaid
       FROM receipts r
       LEFT JOIN receipt_types rt ON r.receipt_type_id = rt.id
       WHERE r.business_id = ? 
         AND (
           LOWER(TRIM(COALESCE(r.receipt_type_name, ''))) LIKE '%application fee%'
           OR LOWER(TRIM(COALESCE(rt.name, ''))) LIKE '%application fee%'
           OR r.receipt_type_id = 1
         )`,
      [bizId]
    );

    res.json({
      success: true,
      data: {
        totalLeads,
        totalApplications: Number(kpiApps.totalApplications) || 0,
        offerLetters: Number(kpiApps.offerLetters) || 0,
        visaSubmitted: Number(kpiApps.visaSubmitted) || 0,
        visaApproved: Number(kpiApps.visaApproved) || 0,
        enrolled: Number(kpiApps.enrolled) || 0,
        feesPaid: Number(feesPaid) || 0,
        pendingFollowUps,
        todaysFollowUps,
        upcomingFollowUps,
        wonDeals,
        lostDeals,
        conversionRate,
        deltaTotal: kpiData.deltaTotal || '12%',
        deltaPending: kpiData.deltaPending || '18%',
        deltaToday: kpiData.deltaToday || '0%',
        deltaUpcoming: kpiData.deltaUpcoming || '0%',
        deltaWon: kpiData.deltaWon || '100%',
        deltaLost: kpiData.deltaLost || '0%',
        deltaConversion: kpiData.deltaConversion || `${conversionRate}%`,
        pipelineStages,
        monthlyPerformance,
        sources,
        team,
        recent,
        funnelData,
        upcomingChartData
      },
      message: 'OK'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

// --- CUSTOM REPORTS ENDPOINTS ---

const getEmployeeProductivity = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const { startDate, endDate } = req.query;
    let dateClause = '';
    const params = [bizId];
    if (startDate && endDate) {
      dateClause = 'AND DATE(c.created_at) >= ? AND DATE(c.created_at) <= ?';
      params.push(startDate, endDate);
    }
    const [rows] = await pool.query(
      `SELECT u.name as employeeName, u.id as employeeCode, COUNT(*) as conversionCount
       FROM contacts c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? AND c.status_name = 'Converted' ${dateClause}
       GROUP BY u.id
       ORDER BY conversionCount DESC`,
      params
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getStudentPipeline = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const { status } = req.query;
    let statusClause = '';
    const params = [bizId];
    if (status) {
      statusClause = 'AND c.status_name = ?';
      params.push(status);
    }
    const [rows] = await pool.query(
      `SELECT u.name as employeeName, COUNT(*) as leadCount
       FROM contacts c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? ${statusClause}
       GROUP BY u.id
       ORDER BY leadCount DESC`,
      params
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getFollowUpReport = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const { startDate, endDate } = req.query;
    let dateClause = '';
    const params = [bizId];
    if (startDate && endDate) {
      dateClause = 'AND DATE(f.entry_date_time) >= ? AND DATE(f.entry_date_time) <= ?';
      params.push(startDate, endDate);
    }
    const [rows] = await pool.query(
      `SELECT u.name as employeeName, COUNT(*) as followUpCount
       FROM follow_ups f
       LEFT JOIN users u ON f.by_user_id = u.id
       WHERE f.contact_id IN (SELECT id FROM contacts WHERE business_id = ?) ${dateClause}
       GROUP BY u.id
       ORDER BY followUpCount DESC`,
      params
    );
    res.json({ success: true, data: rows, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getTeamProductivity = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const [rows] = await pool.query(
      `SELECT 
         u.name as employeeName,
         COUNT(*) as rawAssigned,
         SUM(CASE WHEN c.status_name = 'Follow Up' THEN 1 ELSE 0 END) as followUps,
         SUM(CASE WHEN c.status_name = 'Sales Loss' THEN 1 ELSE 0 END) as lost,
         SUM(CASE WHEN c.status_name = 'Pending' OR c.status_name IS NULL THEN 1 ELSE 0 END) as pending,
         SUM(CASE WHEN c.status_name = 'Converted' THEN 1 ELSE 0 END) as converted
       FROM contacts c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ?
       GROUP BY u.id`,
      [bizId]
    );
    const formattedData = rows.map(r => {
      const assigned = Number(r.followUps) + Number(r.lost) + Number(r.pending) + Number(r.converted);
      return {
        ...r,
        assigned,
        conversionPercent: assigned > 0 ? Math.round((Number(r.converted) / assigned) * 100) : 0
      };
    });
    res.json({ success: true, data: formattedData, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getTodaysActivity = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const [rows] = await pool.query(
      `SELECT 
         u.name as employeeName,
         SUM(CASE WHEN c.status_name = 'Follow Up' THEN 1 ELSE 0 END) as followUps,
         SUM(CASE WHEN c.status_name = 'Converted' THEN 1 ELSE 0 END) as converted,
         SUM(CASE WHEN c.status_name = 'Status 1' THEN 1 ELSE 0 END) as status1,
         SUM(CASE WHEN c.status_name = 'Status 2' THEN 1 ELSE 0 END) as status2
       FROM contacts c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? AND DATE(c.updated_at) = CURDATE()
       GROUP BY u.id`,
      [bizId]
    );
    const formattedData = rows.map(r => ({
      ...r,
      total: Number(r.followUps) + Number(r.converted) + Number(r.status1) + Number(r.status2)
    }));
    res.json({ success: true, data: formattedData, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

const getRawData = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT 
         c.id, u.name as employeeName, c.created_at as date, 
         c.status_name as status, c.name as contactName
       FROM contacts c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ?
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      [bizId, Number(limit), Number(offset)]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM contacts WHERE business_id = ?', [bizId]);
    res.json({ success: true, data: rows, total, message: 'OK' });
  } catch (err) { res.status(500).json({ success: false, message: err.message, data: null }); }
};

module.exports = { 
  getDashboard, getMessagesAnalytics, getBroadcastsAnalytics, 
  getChatbotAnalytics, getContactGrowth, getCrmDashboardStats,
  getEmployeeProductivity, getStudentPipeline, getFollowUpReport,
  getTeamProductivity, getTodaysActivity, getRawData
};
