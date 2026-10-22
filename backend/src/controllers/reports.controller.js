const pool = require('../db/pool');

const getEnquiriesReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { dateRange } = req.query;

    let dateFilter = '';
    if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    }
    // 'all' or unrecognized = no date filter

    // Total Enquiries
    const [[{ totalEnquiries }]] = await pool.query(
      `SELECT COUNT(*) as totalEnquiries FROM contacts c WHERE c.business_id = ? ${dateFilter}`,
      [businessId]
    );

    // High Value — contacts tagged 'vip'
    const [[{ highValue }]] = await pool.query(
      `SELECT COUNT(*) as highValue FROM contacts c 
       WHERE c.business_id = ? 
       AND (JSON_CONTAINS(c.tags, '"vip"') OR c.tags LIKE '%vip%') ${dateFilter}`,
      [businessId]
    );

    // Sources (Group by opt_in_source)
    const [sources] = await pool.query(
      `SELECT IFNULL(opt_in_source, 'Unknown') as source, COUNT(*) as count 
       FROM contacts c WHERE c.business_id = ? ${dateFilter} 
       GROUP BY opt_in_source ORDER BY count DESC`,
      [businessId]
    );

    const topSource = sources.length > 0 ? (sources[0].source || 'N/A') : 'N/A';

    // Categories (Group by enquiry_for_id)
    const [categories] = await pool.query(
      `SELECT IFNULL(e.name, 'Uncategorized') as category, COUNT(c.id) as count 
       FROM contacts c 
       LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id 
       WHERE c.business_id = ? ${dateFilter} 
       GROUP BY c.enquiry_for_id, e.name ORDER BY count DESC`,
      [businessId]
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Recent Enquiries with real score based on activity
    const [recentEnquiries] = await pool.query(
      `SELECT c.name, c.opt_in_source as source, e.name as product, c.created_at as date,
              c.follow_up_count, c.sale_won, c.status_name
       FROM contacts c 
       LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id 
       WHERE c.business_id = ? ${dateFilter} 
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [businessId, limit, offset]
    );

    // Score: base 40 + up to 40 from follow_ups + 20 for won
    const computeScore = (r) => {
      let score = 40;
      score += Math.min((r.follow_up_count || 0) * 10, 40);
      if (r.sale_won) score += 20;
      return Math.min(score, 100);
    };

    const formattedRecent = recentEnquiries.map(r => ({
      name: r.name || 'Unknown',
      source: r.source || 'Unknown',
      product: r.product || 'Unknown',
      score: computeScore(r),
      date: r.date
    }));

    const avgLeadScore = formattedRecent.length > 0
      ? Math.round(formattedRecent.reduce((sum, r) => sum + r.score, 0) / formattedRecent.length)
      : 0;

    res.json({
      success: true,
      data: {
        totalEnquiries: totalEnquiries || 0,
        recentEnquiriesTotal: totalEnquiries || 0,
        page,
        limit,
        highValue: highValue || 0,
        topSource,
        avgLeadScore,
        sources: sources.map(s => ({ label: s.source || 'Unknown', value: s.count })),
        categories: categories.map(c => ({ label: c.category || 'Unknown', value: c.count })),
        recentEnquiries: formattedRecent
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getStatusReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { dateRange, startDate, endDate } = req.query;

    let dateFilter = '';
    const dateParams = [];

    if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(c.created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)';
    } else if (dateRange === 'ytd') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'prev_year') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE()) - 1';
    } else if ((dateRange === 'custom' || (!dateRange && startDate && endDate)) && startDate && endDate) {
      dateFilter = 'AND DATE(c.created_at) BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    }
    // 'all' => no date restriction

    // Agent team filtering
    let teamFilter = '';
    const teamParams = [];
    if (req.user.role === 'agent') {
      const selfId = Number(userId);
      const [teamRows] = await pool.query(
        'SELECT user_id FROM team_members WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)',
        [selfId]
      );
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
      teamFilter = ' AND c.assigned_to IN (' + teamMemberIds.map(() => '?').join(',') + ') ';
      teamParams.push(...teamMemberIds);
    }

    // 1. Open Leads (active leads in sales pipeline)
    const [[{ openLeadsPeriod }]] = await pool.query(
      'SELECT COUNT(*) as openLeadsPeriod FROM contacts c WHERE c.business_id = ? AND c.sale_won = 0 AND c.sale_lost = 0 AND COALESCE(c.current_sale_status, 0) NOT IN (1, 2) AND (c.status_name IS NULL OR (c.status_name NOT LIKE \'%WON%\' AND c.status_name NOT LIKE \'%LOST%\' AND c.status_name NOT IN (\'Converted\', \'Sales Loss\'))) ' + dateFilter + ' ' + teamFilter,
      [businessId, ...dateParams, ...teamParams]
    );

    const [[{ totalActiveOpenLeads }]] = await pool.query(
      'SELECT COUNT(*) as totalActiveOpenLeads FROM contacts c WHERE c.business_id = ? AND c.sale_won = 0 AND c.sale_lost = 0 AND COALESCE(c.current_sale_status, 0) NOT IN (1, 2) AND (c.status_name IS NULL OR (c.status_name NOT LIKE \'%WON%\' AND c.status_name NOT LIKE \'%LOST%\' AND c.status_name NOT IN (\'Converted\', \'Sales Loss\'))) ' + teamFilter,
      [businessId, ...teamParams]
    );

    const openLeads = (dateFilter && Number(openLeadsPeriod) > 0) ? Number(openLeadsPeriod) : Number(totalActiveOpenLeads);

    // 2. Closed Won
    const [[{ closedWonPeriod }]] = await pool.query(
      'SELECT COUNT(*) as closedWonPeriod FROM contacts c WHERE c.business_id = ? AND (c.sale_won = 1 OR c.current_sale_status = 1 OR c.status_name = \'Converted\' OR c.status_name LIKE \'%WON%\') ' + dateFilter + ' ' + teamFilter,
      [businessId, ...dateParams, ...teamParams]
    );
    const closedWon = Number(closedWonPeriod) || 0;

    // 3. Closed Lost
    const [[{ closedLostPeriod }]] = await pool.query(
      'SELECT COUNT(*) as closedLostPeriod FROM contacts c WHERE c.business_id = ? AND (c.sale_lost = 1 OR c.current_sale_status = 2 OR c.status_name = \'Sales Loss\' OR c.status_name LIKE \'%LOST%\') ' + dateFilter + ' ' + teamFilter,
      [businessId, ...dateParams, ...teamParams]
    );
    const closedLost = Number(closedLostPeriod) || 0;

    const totalLeads = openLeads + closedWon + closedLost;
    const wonRate = totalLeads > 0 ? ((closedWon / totalLeads) * 100).toFixed(1) : '0';
    const lostRate = totalLeads > 0 ? ((closedLost / totalLeads) * 100).toFixed(1) : '0';

    // 4. Pipeline Funnel (configured statuses from db + counts)
    const [dbStatuses] = await pool.query(
      'SELECT id, TRIM(name) as name, color, sequence FROM statuses ORDER BY sequence ASC, id ASC'
    );

    let [contactStatuses] = await pool.query(
      'SELECT TRIM(c.status_name) as status_name, COUNT(*) as count FROM contacts c WHERE c.business_id = ? AND c.status_name IS NOT NULL AND c.status_name != \'\' ' + dateFilter + ' ' + teamFilter + ' GROUP BY TRIM(c.status_name)',
      [businessId, ...dateParams, ...teamParams]
    );

    if (contactStatuses.length === 0) {
      [contactStatuses] = await pool.query(
        'SELECT TRIM(c.status_name) as status_name, COUNT(*) as count FROM contacts c WHERE c.business_id = ? AND c.status_name IS NOT NULL AND c.status_name != \'\' ' + teamFilter + ' GROUP BY TRIM(c.status_name)',
        [businessId, ...teamParams]
      );
    }

    const statusCounts = {};
    contactStatuses.forEach(cs => {
      if (cs.status_name) {
        statusCounts[cs.status_name.toLowerCase()] = { name: cs.status_name, count: Number(cs.count) };
      }
    });

    const pipelineMap = new Map();
    dbStatuses.forEach(s => {
      const key = (s.name || '').toLowerCase();
      const count = statusCounts[key] ? statusCounts[key].count : 0;
      pipelineMap.set(key, { name: s.name, count, color: s.color || '#3B82F6' });
    });

    contactStatuses.forEach(cs => {
      const key = (cs.status_name || '').toLowerCase();
      if (!pipelineMap.has(key)) {
        pipelineMap.set(key, { name: cs.status_name, count: Number(cs.count), color: '#3B82F6' });
      }
    });

    if (pipelineMap.size === 0) {
      ['New', 'Contacted', 'Interested', 'In Negotiation', 'Converted'].forEach(label => {
        pipelineMap.set(label.toLowerCase(), { name: label, count: 0, color: '#3B82F6' });
      });
    }

    const pipelineLabels = [];
    const pipelineValues = [];
    const pipelineColors = [];
    const palette = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#EF4444', '#EC4899', '#06B6D4', '#9CA3AF'];
    let colorIdx = 0;

    for (const item of pipelineMap.values()) {
      pipelineLabels.push(item.name);
      pipelineValues.push(item.count);
      pipelineColors.push(item.color || palette[colorIdx % palette.length]);
      colorIdx++;
    }

    // 5. Sales Loss Reasons
    let [lossReasons] = await pool.query(
      'SELECT COALESCE(NULLIF(TRIM(c.loss_reason), \'\'), \'Unspecified\') as reason, COUNT(*) as count FROM contacts c WHERE c.business_id = ? AND (c.sale_lost = 1 OR c.current_sale_status = 2 OR c.status_name = \'Sales Loss\' OR c.status_name LIKE \'%LOST%\') ' + dateFilter + ' ' + teamFilter + ' GROUP BY reason ORDER BY count DESC',
      [businessId, ...dateParams, ...teamParams]
    );

    if (lossReasons.length === 0) {
      [lossReasons] = await pool.query(
        'SELECT COALESCE(NULLIF(TRIM(c.loss_reason), \'\'), \'Unspecified\') as reason, COUNT(*) as count FROM contacts c WHERE c.business_id = ? AND (c.sale_lost = 1 OR c.current_sale_status = 2 OR c.status_name = \'Sales Loss\' OR c.status_name LIKE \'%LOST%\') ' + teamFilter + ' GROUP BY reason ORDER BY count DESC',
        [businessId, ...teamParams]
      );
    }

    let lossLabels = [];
    let lossValues = [];

    if (lossReasons.length > 0) {
      lossLabels = lossReasons.map(r => r.reason);
      lossValues = lossReasons.map(r => Number(r.count));
    } else {
      lossLabels = ['Price too high', 'Competitor', 'No Response', 'Other'];
      lossValues = [0, 0, 0, 0];
    }

    // 6. Stale Leads (Action Required) with Server-Side Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const staleWhere = 'WHERE c.business_id = ? AND c.sale_won = 0 AND c.sale_lost = 0 AND COALESCE(c.current_sale_status, 0) NOT IN (1, 2) AND (c.status_name IS NULL OR (c.status_name NOT LIKE \'%WON%\' AND c.status_name NOT LIKE \'%LOST%\' AND c.status_name NOT IN (\'Converted\', \'Sales Loss\'))) ' + teamFilter + ' AND ((c.follow_up_date IS NOT NULL AND DATE(c.follow_up_date) < CURDATE()) OR DATEDIFF(CURDATE(), COALESCE((SELECT MAX(f.entry_date_time) FROM follow_ups f WHERE f.contact_id = c.id), c.created_at)) >= 3)';

    const [[{ totalStaleLeads }]] = await pool.query(
      `SELECT COUNT(*) as totalStaleLeads FROM contacts c ${staleWhere}`,
      [businessId, ...teamParams]
    );

    const [stale] = await pool.query(
      `SELECT c.id, c.name, c.phone, COALESCE(NULLIF(TRIM(c.status_name), ''), 'New') as status, 
              GREATEST(DATEDIFF(CURDATE(), COALESCE((SELECT MAX(f.entry_date_time) FROM follow_ups f WHERE f.contact_id = c.id), c.created_at)), 0) as days, 
              COALESCE(u.name, 'Unassigned') as assignedTo 
       FROM contacts c 
       LEFT JOIN users u ON c.assigned_to = u.id 
       ${staleWhere} 
       ORDER BY days DESC, c.id DESC 
       LIMIT ? OFFSET ?`,
      [businessId, ...teamParams, limit, offset]
    );

    res.json({
      success: true,
      data: {
        openLeads,
        closedWon,
        closedLost,
        wonRate: wonRate || '0',
        lostRate: lostRate || '0',
        pipelineLabels,
        pipelineValues,
        pipelineColors,
        lossLabels,
        lossValues,
        staleLeadsTotal: Number(totalStaleLeads) || 0,
        page,
        limit,
        staleLeads: stale.map(s => ({
          id: s.id,
          name: s.name || 'Unnamed Lead',
          phone: s.phone || '',
          status: s.status,
          days: s.days,
          assignedTo: s.assignedTo || 'Unassigned'
        }))
      }
    });
  } catch (err) {
    console.error('getStatusReport error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTodaysLeadsReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;

    let teamFilter = '';
    const filterParams = [businessId];

    if (req.user.role === 'agent') {
      // Include all teammates sharing a team with this agent
      const selfId = Number(userId);
      const [teamRows] = await pool.query(
        `SELECT user_id FROM team_members 
         WHERE team_id = (SELECT id FROM teams WHERE name = CONCAT('__agent_', ?) AND business_id = ?)`,
        [selfId, businessId]
      );
      // Cast to Number to avoid string vs. integer mismatch from includes()
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
      teamFilter = ` AND c.assigned_to IN (${teamMemberIds.map(() => '?').join(',')}) `;
      filterParams.push(...teamMemberIds);
    }

    // Get all contacts whose follow-up date is today, joined with the latest follow_up entry
    const [leads] = await pool.query(
      `SELECT
        c.id          AS id,
        c.id          AS lead_id,
        c.name,
        c.phone,
        c.status_name,
        c.branch_name,
        c.department_name,
        c.assigned_to,
        COALESCE(c.follow_up_date, fu.follow_up_date) AS follow_up_date,
        COALESCE(u2.name, u.name) AS agent,
        e.name AS product,
        fu.remarks,
        fu.status_name AS fu_status_name
      FROM contacts c
      LEFT JOIN users u  ON c.assigned_to = u.id
      LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id
      LEFT JOIN (
        SELECT
          fu1.follow_up_id,
          fu1.contact_id,
          fu1.follow_up_date,
          fu1.to_user_id,
          fu1.remarks,
          fu1.status_name
        FROM follow_ups fu1
        INNER JOIN (
          SELECT contact_id, MAX(follow_up_id) AS max_id
          FROM follow_ups
          GROUP BY contact_id
        ) latest ON fu1.contact_id = latest.contact_id AND fu1.follow_up_id = latest.max_id
      ) fu ON fu.contact_id = c.id
      LEFT JOIN users u2 ON fu.to_user_id = u2.id
      WHERE c.business_id = ? ${teamFilter}
        AND DATE(COALESCE(c.follow_up_date, fu.follow_up_date)) = CURDATE()
      ORDER BY COALESCE(c.follow_up_date, fu.follow_up_date) ASC`,
      filterParams
    );

    const unassignedCount = leads.filter(l => !l.agent || l.agent === 'Unassigned').length;

    res.json({
      success: true,
      data: {
        totalToday: leads.length,
        unassignedLeads: unassignedCount,
        leads: leads.map(l => ({
          id:         l.id || l.lead_id,
          lead_id:    l.id || l.lead_id,
          name:       l.name,
          phone:      l.phone || '—',
          interest:   l.product || '—',
          statusName: l.fu_status_name || l.status_name || '—',
          remarks:    l.remarks || '',
          agent:      l.agent || 'Unassigned'
        }))
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getPendingFollowupsReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;

    let teamFilter = '';
    const filterParams = [businessId];

    if (req.user.role === 'agent') {
      // Include all teammates sharing a team with this agent
      const selfId = Number(userId);
      const [teamRows] = await pool.query(
        `SELECT user_id FROM team_members 
         WHERE team_id = (SELECT id FROM teams WHERE name = CONCAT('__agent_', ?) AND business_id = ?)`,
        [selfId, businessId]
      );
      // Cast to Number to avoid string vs. integer mismatch from includes()
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
      teamFilter = ` AND c.assigned_to IN (${teamMemberIds.map(() => '?').join(',')}) `;
      filterParams.push(...teamMemberIds);
    }

    // Pull the latest follow-up entry per contact from the follow_ups table,
    // joined with the contact so we have name, phone and assigned agent.
    const [followups] = await pool.query(
      `SELECT
        c.id          AS lead_id,
        c.name        AS leadName,
        c.phone       AS phone,
        c.status_name,
        c.branch_name,
        c.department_name,
        c.assigned_to,
        COALESCE(u2.name, u.name) AS assignee,
        COALESCE(c.follow_up_date, fu.follow_up_date) AS dueDate,
        fu.remarks,
        CASE
          WHEN DATE(COALESCE(c.follow_up_date, fu.follow_up_date)) < CURDATE()  THEN 'Overdue'
          WHEN DATE(COALESCE(c.follow_up_date, fu.follow_up_date)) = CURDATE()  THEN 'Due Today'
          WHEN DATE(COALESCE(c.follow_up_date, fu.follow_up_date)) > CURDATE() THEN 'Upcoming'
          ELSE 'Other'
        END AS status
      FROM contacts c
      LEFT JOIN users u  ON c.assigned_to = u.id
      LEFT JOIN (
        SELECT
          fu1.follow_up_id,
          fu1.contact_id,
          fu1.follow_up_date,
          fu1.to_user_id,
          fu1.remarks
        FROM follow_ups fu1
        INNER JOIN (
          SELECT contact_id, MAX(follow_up_id) AS max_id
          FROM follow_ups
          GROUP BY contact_id
        ) latest ON fu1.contact_id = latest.contact_id AND fu1.follow_up_id = latest.max_id
      ) fu ON fu.contact_id = c.id
      LEFT JOIN users u2 ON fu.to_user_id = u2.id
      WHERE c.business_id = ? ${teamFilter}
        AND COALESCE(c.follow_up_date, fu.follow_up_date) IS NOT NULL
      ORDER BY COALESCE(c.follow_up_date, fu.follow_up_date) ASC`,
      filterParams
    );

    const filteredFollowups = followups.filter(f => ['Overdue', 'Due Today', 'Upcoming'].includes(f.status));

    const overdueCount  = filteredFollowups.filter(f => f.status === 'Overdue').length;
    const dueTodayCount = filteredFollowups.filter(f => f.status === 'Due Today').length;
    const upcomingCount = filteredFollowups.filter(f => f.status === 'Upcoming').length;

    res.json({
      success: true,
      data: {
        overdue:  overdueCount,
        dueToday: dueTodayCount,
        upcoming: upcomingCount,
        list: filteredFollowups.map(f => ({
          id:         f.lead_id,
          leadName:   f.leadName,
          contact:    f.contact,
          phone:      f.phone,
          dueDate:    f.dueDate,
          remarks:    f.remarks || '',
          status:     f.status,
          statusName: f.status_name || '',
          assignee:   f.assignee || 'Unassigned'
        }))
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getWorkReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { dateRange, agent } = req.query;

    let dateFilter = '';
    if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
    } else if (dateRange === 'yesterday') {
      dateFilter = 'AND DATE(c.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(c.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
    }

    let teamFilter = '';
    let filterParams = [];

    if (agent && agent !== 'all') {
      let targetUserId = null;
      if (!isNaN(Number(agent))) {
        targetUserId = Number(agent);
      } else {
        const [uRows] = await pool.query('SELECT id FROM users WHERE (name = ? OR username = ?) AND business_id = ?', [agent, agent, businessId]);
        if (uRows.length) targetUserId = uRows[0].id;
      }
      if (targetUserId) {
        teamFilter += ` AND (c.assigned_to = ? OR EXISTS (SELECT 1 FROM follow_ups fu WHERE fu.contact_id = c.id AND (fu.by_user_id = ? OR fu.to_user_id = ?))) `;
        filterParams.push(targetUserId, targetUserId, targetUserId);
      }
    } else if (req.user.role === 'agent') {
      const selfId = Number(userId);
      const [teamRows] = await pool.query(
        `SELECT user_id FROM team_members 
         WHERE team_id = (SELECT id FROM teams WHERE name = CONCAT('__agent_', ?) AND business_id = ?)`,
        [selfId, businessId]
      );
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
      
      teamFilter = ` AND c.assigned_to IN (${teamMemberIds.map(() => '?').join(',')}) `;
      filterParams.push(...teamMemberIds);
    }
    
    // Total Leads Handled
    const [[{ totalLeads }]] = await pool.query(
      `SELECT COUNT(*) as totalLeads FROM contacts c WHERE c.business_id = ? ${dateFilter} ${teamFilter}`,
      [businessId, ...filterParams]
    );

    // Follow-ups Completed
    const [[{ followUpsCompleted }]] = await pool.query(
      `SELECT COUNT(*) as followUpsCompleted FROM contacts c WHERE c.business_id = ? AND c.follow_up = 1 ${dateFilter} ${teamFilter}`,
      [businessId, ...filterParams]
    );

    // Total Conversions
    const [[{ totalConversions }]] = await pool.query(
      `SELECT COUNT(*) as totalConversions FROM contacts c WHERE c.business_id = ? AND c.status_name = 'Converted' ${dateFilter} ${teamFilter}`,
      [businessId, ...filterParams]
    );
    
    const conversionRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : 0;
    
    // Funnel Chart
    const [funnelData] = await pool.query(
      `SELECT status_name as name, COUNT(*) as count 
       FROM contacts c 
       WHERE c.business_id = ? AND c.status_name IS NOT NULL ${dateFilter} ${teamFilter}
       GROUP BY c.status_name
       ORDER BY count DESC`,
      [businessId, ...filterParams]
    );

    // Agent Chart (Top 5 agents)
    const [agentData] = await pool.query(
      `SELECT u.name as agent, COUNT(c.id) as leadsHandled, 
              SUM(CASE WHEN c.status_name = 'Converted' THEN 1 ELSE 0 END) as conversions
       FROM contacts c
       JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? ${dateFilter} ${teamFilter}
       GROUP BY u.id, u.name
       ORDER BY leadsHandled DESC LIMIT 5`,
      [businessId, ...filterParams]
    );

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const [[totalActRow]] = await pool.query(
      `SELECT COUNT(*) as totalCount
       FROM contacts c
       JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? ${dateFilter} ${teamFilter}`,
      [businessId, ...filterParams]
    );

    // Recent Activities
    const [recentActivities] = await pool.query(
      `SELECT u.name as agent, c.name as \`lead\`, 
              COALESCE(c.status_name, 'Contacted') as action, c.created_at as time,
              'Completed' as status
       FROM contacts c
       JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? ${dateFilter} ${teamFilter}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [businessId, ...filterParams, limit, offset]
    );

    // Activity Data (Trend matching dateRange)
    let activityLabels = [];
    let activityData = [];
    let followUpTrendData = [];

    if (dateRange === 'today' || dateRange === 'yesterday') {
      const targetDateExpr = dateRange === 'today' ? 'CURDATE()' : 'DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
      const [hourlyLeads] = await pool.query(
        `SELECT HOUR(c.created_at) as hour, COUNT(*) as count 
         FROM contacts c 
         WHERE c.business_id = ? AND DATE(c.created_at) = ${targetDateExpr} ${teamFilter} 
         GROUP BY HOUR(c.created_at)`,
        [businessId, ...filterParams]
      );
      const [hourlyFollowUps] = await pool.query(
        `SELECT HOUR(f.entry_date_time) as hour, COUNT(*) as count 
         FROM follow_ups f 
         JOIN contacts c ON f.contact_id = c.id 
         WHERE c.business_id = ? AND DATE(f.entry_date_time) = ${targetDateExpr} ${teamFilter} 
         GROUP BY HOUR(f.entry_date_time)`,
        [businessId, ...filterParams]
      );

      for (let h = 0; h < 24; h += 2) {
        const label = h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;
        activityLabels.push(label);
        const lCount = (hourlyLeads.find(r => r.hour === h)?.count || 0) + (hourlyLeads.find(r => r.hour === h + 1)?.count || 0);
        const fCount = (hourlyFollowUps.find(r => r.hour === h)?.count || 0) + (hourlyFollowUps.find(r => r.hour === h + 1)?.count || 0);
        activityData.push(lCount);
        followUpTrendData.push(fCount);
      }
    } else if (dateRange === 'this_week') {
      const [dailyLeads] = await pool.query(
        `SELECT DATE_FORMAT(c.created_at, '%Y-%m-%d') as date_str, COUNT(*) as count 
         FROM contacts c 
         WHERE c.business_id = ? AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1) ${teamFilter} 
         GROUP BY date_str`,
        [businessId, ...filterParams]
      );
      const [dailyFollowUps] = await pool.query(
        `SELECT DATE_FORMAT(f.entry_date_time, '%Y-%m-%d') as date_str, COUNT(*) as count 
         FROM follow_ups f 
         JOIN contacts c ON f.contact_id = c.id 
         WHERE c.business_id = ? AND YEARWEEK(f.entry_date_time, 1) = YEARWEEK(CURDATE(), 1) ${teamFilter} 
         GROUP BY date_str`,
        [businessId, ...filterParams]
      );

      const now = new Date();
      const currentDay = now.getDay();
      const distanceToMon = (currentDay + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - distanceToMon);

      const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${day}`;

        activityLabels.push(dayNames[i]);
        const foundLead = dailyLeads.find(r => r.date_str === dateStr);
        const foundFu = dailyFollowUps.find(r => r.date_str === dateStr);
        activityData.push(foundLead ? foundLead.count : 0);
        followUpTrendData.push(foundFu ? foundFu.count : 0);
      }
    } else if (dateRange === 'last_month') {
      const [dailyLeads] = await pool.query(
        `SELECT DATE_FORMAT(c.created_at, '%Y-%m-%d') as date_str, COUNT(*) as count 
         FROM contacts c 
         WHERE c.business_id = ? AND MONTH(c.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(c.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) ${teamFilter} 
         GROUP BY date_str`,
        [businessId, ...filterParams]
      );
      const [dailyFollowUps] = await pool.query(
        `SELECT DATE_FORMAT(f.entry_date_time, '%Y-%m-%d') as date_str, COUNT(*) as count 
         FROM follow_ups f 
         JOIN contacts c ON f.contact_id = c.id 
         WHERE c.business_id = ? AND MONTH(f.entry_date_time) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(f.entry_date_time) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) ${teamFilter} 
         GROUP BY date_str`,
        [businessId, ...filterParams]
      );

      const now = new Date();
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const totalDays = prevMonth.getDate();
      const mName = prevMonth.toLocaleString('en-US', { month: 'short' });
      const yearStr = prevMonth.getFullYear();
      const mNum = String(prevMonth.getMonth() + 1).padStart(2, '0');

      for (let day = 1; day <= totalDays; day++) {
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${yearStr}-${mNum}-${dayStr}`;
        activityLabels.push(`${mName} ${day}`);
        const foundLead = dailyLeads.find(r => r.date_str === dateStr);
        const foundFu = dailyFollowUps.find(r => r.date_str === dateStr);
        activityData.push(foundLead ? foundLead.count : 0);
        followUpTrendData.push(foundFu ? foundFu.count : 0);
      }
    } else {
      // Default: 'this_month'
      const [dailyLeads] = await pool.query(
        `SELECT DATE_FORMAT(c.created_at, '%Y-%m-%d') as date_str, COUNT(*) as count 
         FROM contacts c 
         WHERE c.business_id = ? AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE()) ${teamFilter} 
         GROUP BY date_str`,
        [businessId, ...filterParams]
      );
      const [dailyFollowUps] = await pool.query(
        `SELECT DATE_FORMAT(f.entry_date_time, '%Y-%m-%d') as date_str, COUNT(*) as count 
         FROM follow_ups f 
         JOIN contacts c ON f.contact_id = c.id 
         WHERE c.business_id = ? AND MONTH(f.entry_date_time) = MONTH(CURDATE()) AND YEAR(f.entry_date_time) = YEAR(CURDATE()) ${teamFilter} 
         GROUP BY date_str`,
        [businessId, ...filterParams]
      );

      const now = new Date();
      const currentMonthDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const mName = now.toLocaleString('en-US', { month: 'short' });
      const yearStr = now.getFullYear();
      const mNum = String(now.getMonth() + 1).padStart(2, '0');

      const endDay = Math.min(now.getDate(), currentMonthDays);
      for (let day = 1; day <= Math.max(endDay, 7); day++) {
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${yearStr}-${mNum}-${dayStr}`;
        activityLabels.push(`${mName} ${day}`);
        const foundLead = dailyLeads.find(r => r.date_str === dateStr);
        const foundFu = dailyFollowUps.find(r => r.date_str === dateStr);
        activityData.push(foundLead ? foundLead.count : 0);
        followUpTrendData.push(foundFu ? foundFu.count : 0);
      }
    }

    res.json({
      success: true,
      data: {
        totalLeads: totalLeads || 0,
        followUpsCompleted: followUpsCompleted || 0,
        totalConversions: totalConversions || 0,
        conversionRate,
        funnelData,
        agentData,
        recentActivitiesTotal: Number(totalActRow?.totalCount) || 0,
        page,
        limit,
        recentActivities,
        activityLabels,
        activityData,
        followUpTrendData
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getEmployeeReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { dateRange } = req.query;

    let dateFilter = '';
    let fuDateFilter = '';   // for queries using alias 'f'
    let fuDateFilter2 = '';  // for subqueries using alias 'f2'
    if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
      fuDateFilter = 'AND DATE(f.entry_date_time) = CURDATE()';
      fuDateFilter2 = 'AND DATE(f2.entry_date_time) = CURDATE()';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
      fuDateFilter = 'AND YEARWEEK(f.entry_date_time, 1) = YEARWEEK(CURDATE(), 1)';
      fuDateFilter2 = 'AND YEARWEEK(f2.entry_date_time, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
      fuDateFilter = 'AND MONTH(f.entry_date_time) = MONTH(CURDATE()) AND YEAR(f.entry_date_time) = YEAR(CURDATE())';
      fuDateFilter2 = 'AND MONTH(f2.entry_date_time) = MONTH(CURDATE()) AND YEAR(f2.entry_date_time) = YEAR(CURDATE())';
    }

    let teamFilter = '';
    let fuTeamFilter = '';
    let filterParams = [];

    if (req.user.role === 'agent') {
      const selfId = Number(userId);
      const [teamRows] = await pool.query(
        `SELECT user_id FROM team_members 
         WHERE team_id = (SELECT id FROM teams WHERE name = CONCAT('__agent_', ?) AND business_id = ?)`,
        [selfId, businessId]
      );
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
      
      teamFilter = ` AND c.assigned_to IN (${teamMemberIds.map(() => '?').join(',')}) `;
      fuTeamFilter = ` AND f.by_user_id IN (${teamMemberIds.map(() => '?').join(',')}) `;
      filterParams.push(...teamMemberIds);
    }

    // Total active agents in scope
    const [[{ activeAgents }]] = await pool.query(
      `SELECT COUNT(DISTINCT c.assigned_to) as activeAgents FROM contacts c WHERE c.business_id = ? ${dateFilter} ${teamFilter} AND c.assigned_to IS NOT NULL`,
      [businessId, ...filterParams]
    );

    // Total tasks = follow-ups logged in the period
    const [[{ totalTasks }]] = await pool.query(
      `SELECT COUNT(*) as totalTasks 
       FROM follow_ups f
       JOIN contacts c ON f.contact_id = c.id
       WHERE c.business_id = ? ${fuDateFilter} ${fuTeamFilter}`,
      [businessId, ...filterParams]
    );

    // Agent Details with real follow-up counts from follow_ups table
    const [agentDetails] = await pool.query(
      `SELECT 
         u.id,
         u.name,
         COUNT(DISTINCT c.id) as assigned,
         IFNULL(MAX(fu_counts.followups), 0) as followups,
         SUM(CASE WHEN c.status_name = 'Converted' THEN 1 ELSE 0 END) as conversions
       FROM contacts c
       JOIN users u ON c.assigned_to = u.id
       LEFT JOIN (
         SELECT by_user_id, COUNT(*) as followups
         FROM follow_ups f2
         JOIN contacts c2 ON f2.contact_id = c2.id
         WHERE c2.business_id = ? ${fuDateFilter2}
         GROUP BY by_user_id
       ) fu_counts ON fu_counts.by_user_id = u.id
       WHERE c.business_id = ? ${dateFilter} ${teamFilter}
       GROUP BY u.id, u.name
       ORDER BY assigned DESC`,
      [businessId, ...filterParams, businessId, ...filterParams]
    );

    let topPerformer = 'N/A';
    let avgLeads = 0;
    
    if (agentDetails.length > 0) {
      const sortedByConv = [...agentDetails].sort((a, b) => b.conversions - a.conversions);
      topPerformer = sortedByConv[0].name;
      const totalLeadCount = agentDetails.reduce((sum, a) => sum + Number(a.assigned), 0);
      avgLeads = Math.round(totalLeadCount / agentDetails.length);
    }

    const formattedDetails = agentDetails.map(a => ({
      name: a.name,
      assigned: Number(a.assigned) || 0,
      followups: Number(a.followups) || 0,
      conversions: Number(a.conversions) || 0,
      winRate: Number(a.assigned) > 0 ? ((Number(a.conversions) / Number(a.assigned)) * 100).toFixed(1) : 0
    }));

    // Activity Breakdown — real message and follow-up counts
    const [[{ totalMessages }]] = await pool.query(
      `SELECT COUNT(*) as totalMessages FROM messages m
       JOIN conversations conv ON m.conversation_id = conv.id
       JOIN contacts c ON conv.contact_id = c.id
       WHERE c.business_id = ? AND m.direction = 'outbound'`,
      [businessId]
    );

    const [[{ totalFollowUps }]] = await pool.query(
      `SELECT COUNT(*) as totalFollowUps FROM follow_ups f
       JOIN contacts c ON f.contact_id = c.id
       WHERE c.business_id = ?`,
      [businessId]
    );

    const [[{ totalContacts }]] = await pool.query(
      `SELECT COUNT(*) as totalContacts FROM contacts c WHERE c.business_id = ?`,
      [businessId]
    );

    const [[{ totalConversions }]] = await pool.query(
      `SELECT COUNT(*) as totalConversions FROM contacts c WHERE c.business_id = ? AND c.status_name = 'Converted'`,
      [businessId]
    );

    res.json({
      success: true,
      data: {
        activeAgents: activeAgents || 0,
        totalTasks: totalTasks || 0,
        topPerformer,
        avgLeads,
        agentDetails: formattedDetails,
        activityBreakdown: {
          messages: Number(totalMessages) || 0,
          followUps: Number(totalFollowUps) || 0,
          contacts: Number(totalContacts) || 0,
          conversions: Number(totalConversions) || 0
        }
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getSourceConversionReport = async (req, res) => {
  try {
    const businessId = req.user.businessId || req.user.business_id;
    const userId = req.user.userId || req.user.id;
    const { startDate, endDate, dateRange } = req.query;

    let dateFilter = '';
    const params = [businessId];

    if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(c.created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)';
    } else if (dateRange === 'ytd') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (startDate && endDate) {
      dateFilter = 'AND DATE(c.created_at) >= ? AND DATE(c.created_at) <= ?';
      params.push(startDate, endDate);
    }

    let teamFilter = '';
    if (req.user.role === 'agent') {
      const selfId = Number(userId);
      const [teamRows] = await pool.query(
        'SELECT user_id FROM team_members WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)',
        [selfId]
      );
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
      teamFilter = ' AND c.assigned_to IN (' + teamMemberIds.map(() => '?').join(',') + ') ';
      params.push(...teamMemberIds);
    }

    const query = `
      SELECT 
        COALESCE(
          NULLIF(TRIM(sc.name), ''),
          CASE 
            WHEN LOWER(TRIM(c.opt_in_source)) = 'manual' THEN 'Manual Entry'
            WHEN LOWER(TRIM(c.opt_in_source)) = 'whatsapp' THEN 'WhatsApp'
            WHEN LOWER(TRIM(c.opt_in_source)) = 'link' THEN 'Web Link'
            WHEN LOWER(TRIM(c.opt_in_source)) = 'import' THEN 'Excel Import'
            ELSE NULLIF(TRIM(c.opt_in_source), '')
          END,
          NULLIF(TRIM(e.name), ''),
          CASE 
            WHEN LOWER(TRIM(c.channel_preference)) = 'whatsapp' THEN 'WhatsApp'
            ELSE NULLIF(TRIM(c.channel_preference), '')
          END,
          'Direct'
        ) as category_name,
        COUNT(DISTINCT c.id) as total_leads,
        SUM(CASE WHEN c.sale_won = 1 OR c.current_sale_status = 1 OR c.status_name LIKE '%WON%' OR c.status_name = 'Converted' THEN 1 ELSE 0 END) as converted_leads
      FROM contacts c
      LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id
      LEFT JOIN conversations conv ON c.id = conv.contact_id
      LEFT JOIN social_accounts sa ON conv.social_account_id = sa.id
      LEFT JOIN source_categories sc ON sa.source_category_id = sc.id
      WHERE c.business_id = ? ${dateFilter} ${teamFilter}
      GROUP BY category_name
      ORDER BY total_leads DESC
    `;

    const [rows] = await pool.query(query, params);

    const data = rows.map(r => {
      const total = Number(r.total_leads) || 0;
      const converted = Number(r.converted_leads) || 0;
      return {
        category_name: r.category_name,
        total_leads: total,
        converted_leads: converted,
        conversion_rate: total > 0 ? ((converted / total) * 100).toFixed(2) : '0.00'
      };
    });

    res.json({ success: true, data, message: 'OK' });
  } catch (err) {
    console.error('getSourceConversionReport error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getTimeTrackReport = async (req, res) => {
  try {
    const { date, agent } = req.query;
    const bizId = req.user.businessId;

    let query = `
      SELECT HOUR(f.entry_date_time) as hour, COUNT(*) as count 
      FROM follow_ups f
      JOIN contacts c ON f.contact_id = c.id
      WHERE c.business_id = ? 
    `;
    const params = [bizId];

    if (date) {
      query += ` AND (DATE(f.entry_date_time) = ? OR DATE(f.follow_up_date) = ?) `;
      params.push(date, date);
    }
    
    if (agent && agent !== 'all') {
      let targetUserId = null;
      let targetUserName = null;
      if (!isNaN(Number(agent))) {
        targetUserId = Number(agent);
        const [uRows] = await pool.query('SELECT name FROM users WHERE id = ?', [targetUserId]);
        if (uRows.length) targetUserName = uRows[0].name;
      } else {
        targetUserName = agent;
        const [uRows] = await pool.query('SELECT id, name FROM users WHERE (name = ? OR username = ?) AND business_id = ?', [agent, agent, bizId]);
        if (uRows.length) {
          targetUserId = uRows[0].id;
          targetUserName = uRows[0].name;
        }
      }

      if (targetUserId && targetUserName) {
        query += ` AND (f.by_user_id = ? OR f.to_user_id = ? OR c.assigned_to = ? OR f.by_user_name = ? OR f.to_user_name = ?) `;
        params.push(targetUserId, targetUserId, targetUserId, targetUserName, targetUserName);
      } else if (targetUserId) {
        query += ` AND (f.by_user_id = ? OR f.to_user_id = ? OR c.assigned_to = ?) `;
        params.push(targetUserId, targetUserId, targetUserId);
      } else if (targetUserName) {
        query += ` AND (f.by_user_name = ? OR f.to_user_name = ?) `;
        params.push(targetUserName, targetUserName);
      }
    } else if (req.user.role === 'agent') {
      const selfId = Number(req.user.userId || req.user.id);
      const [teamRows] = await pool.query(
        `SELECT user_id FROM team_members 
         WHERE team_id = (SELECT id FROM teams WHERE name = CONCAT('__agent_', ?) AND business_id = ?)`,
        [selfId, bizId]
      );
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);

      query += ` AND (f.by_user_id IN (${teamMemberIds.map(() => '?').join(',')}) OR f.to_user_id IN (${teamMemberIds.map(() => '?').join(',')}) OR c.assigned_to IN (${teamMemberIds.map(() => '?').join(',')})) `;
      params.push(...teamMemberIds, ...teamMemberIds, ...teamMemberIds);
    }

    query += ` GROUP BY HOUR(f.entry_date_time) ORDER BY hour ASC`;

    const [rows] = await pool.query(query, params);

    // Fill missing hours from 0 to 23
    const fullDayData = [];
    for (let i = 0; i < 24; i++) {
      const found = rows.find(r => r.hour === i);
      fullDayData.push({
        hour: i,
        count: found ? found.count : 0
      });
    }

    res.json({ success: true, data: fullDayData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getChannelsReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { 
      dateRange, 
      startDate, 
      endDate, 
      viewDetails, 
      channel, 
      search = '', 
      page = 1, 
      limit = 20 
    } = req.query;

    let dateFilter = '';
    let queryParams = [businessId];

    if (dateRange === 'ytd') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'prev_year') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE()) - 1';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(c.created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = 'AND DATE(c.created_at) BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    } else if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
    }

    // Drilldown details popup mode
    if (viewDetails === 'true') {
      const detailParams = [...queryParams];
      let channelFilter = '';

      if (channel && channel !== 'all' && channel !== 'Total Leads') {
        if (channel.toLowerCase() === 'unknown') {
          channelFilter = "AND (c.channel_preference IS NULL OR c.channel_preference = '' OR LOWER(c.channel_preference) = 'unknown')";
        } else {
          channelFilter = 'AND LOWER(c.channel_preference) = LOWER(?)';
          detailParams.push(channel);
        }
      }

      let searchFilter = '';
      if (search && search.trim()) {
        searchFilter = 'AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.status_name LIKE ?)';
        const term = '%' + search.trim() + '%';
        detailParams.push(term, term, term, term);
      }

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, parseInt(limit) || 20);
      const offset = (pageNum - 1) * limitNum;

      const [[{ totalCount }]] = await pool.query(
        `SELECT COUNT(c.id) as totalCount
         FROM contacts c
         WHERE c.business_id = ? ${dateFilter} ${channelFilter} ${searchFilter}`,
        detailParams
      );

      const [leads] = await pool.query(
        `SELECT 
           c.id,
           c.name,
           c.phone,
           c.email,
           COALESCE(NULLIF(c.channel_preference, ''), 'Unknown') as channel,
           c.opt_in_source as source,
           c.created_at,
           COALESCE(u_assigned.name, 'Unassigned') as assigned_to,
           COALESCE(u_created.name, 'System') as created_by,
           COALESCE(TRIM(c.status_name), 'PENDING') as status_name,
           c.sale_won,
           c.sale_won_date,
           c.follow_up_count
         FROM contacts c
         LEFT JOIN users u_assigned ON c.assigned_to = u_assigned.id
         LEFT JOIN users u_created ON c.created_by_user = u_created.id
         WHERE c.business_id = ? ${dateFilter} ${channelFilter} ${searchFilter}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [...detailParams, limitNum, offset]
      );

      return res.json({
        success: true,
        data: {
          totalCount: Number(totalCount) || 0,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((Number(totalCount) || 0) / limitNum) || 1,
          leads
        }
      });
    }

    const [channels] = await pool.query(
      `SELECT IFNULL(NULLIF(c.channel_preference, ''), 'Unknown') as channel, COUNT(c.id) as count 
       FROM contacts c 
       WHERE c.business_id = ? ${dateFilter} 
       GROUP BY channel ORDER BY count DESC`,
      queryParams
    );

    const totalLeads = channels.reduce((sum, ch) => sum + ch.count, 0);
    const topChannel = channels.length > 0 ? channels[0].channel : 'N/A';

    res.json({
      success: true,
      data: {
        totalLeads,
        topChannel,
        channels: channels.map(c => ({ label: c.channel || 'Unknown', value: c.count }))
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getWonLostReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { startDate, endDate, agent } = req.query;
    let dateFilter = '';
    let queryParams = [businessId];

    if (startDate && endDate) {
      dateFilter = 'AND DATE(c.created_at) BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    if (agent) {
      dateFilter += ' AND c.assigned_to = ?';
      queryParams.push(agent);
    }

    if (req.user.role === 'agent') {
      dateFilter += ' AND c.assigned_to = ?';
      queryParams.push(req.user.userId);
    }

    const query = `
      SELECT 
        c.id, c.name as client, c.status_name as status, 
        c.current_sale_status,
        (SELECT name FROM users WHERE id = c.assigned_to) as rep,
        c.created_at as date 
      FROM contacts c
      WHERE c.business_id = ? AND c.current_sale_status IN (1, 2) ${dateFilter} 
      ORDER BY c.created_at DESC
    `;

    const [rows] = await pool.query(query, queryParams);

    const deals = rows.map(r => ({
      id: r.id,
      client: r.client,
      amount: 'N/A',
      status: r.current_sale_status === 1 ? 'Won' : 'Lost',
      reason: r.reason || 'N/A',
      rep: r.rep || 'Unassigned',
      date: r.date
    }));

    res.json({ success: true, data: deals });
  } catch (err) {
    console.error('Won/Lost Report Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

const getChannelConversionReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { dateRange, startDate, endDate, agent } = req.query;
    let dateFilter = '';
    let queryParams = [businessId];

    if (dateRange === 'ytd') {
      dateFilter = 'AND YEAR(created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'prev_year') {
      dateFilter = 'AND YEAR(created_at) = YEAR(CURDATE()) - 1';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND YEAR(created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    } else if (dateRange === 'today') {
      dateFilter = 'AND DATE(created_at) = CURDATE()';
    } else if (startDate && endDate) {
      dateFilter = 'AND DATE(created_at) BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    if (agent) {
      dateFilter += ' AND assigned_to = ?';
      queryParams.push(agent);
    }

    if (req.user.role === 'agent') {
      dateFilter += ' AND assigned_to = ?';
      queryParams.push(req.user.userId);
    }

    const query = `
      SELECT 
        COALESCE(channel_preference, 'Unknown') as channel,
        COUNT(id) as total_leads,
        SUM(IF(current_sale_status = 1, 1, 0)) as sale_won,
        SUM(IF(current_sale_status = 2, 1, 0)) as sale_lost
      FROM contacts
      WHERE business_id = ? ${dateFilter}
      GROUP BY channel_preference
      ORDER BY total_leads DESC
    `;

    const [rows] = await pool.query(query, queryParams);

    const data = rows.map(r => {
      const total = Number(r.total_leads) || 0;
      const won = Number(r.sale_won) || 0;
      const lost = Number(r.sale_lost) || 0;
      
      const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0.0';
      const lossRate = total > 0 ? ((lost / total) * 100).toFixed(1) : '0.0';
      
      return {
        channel: r.channel,
        total_leads: total,
        sale_won: won,
        sale_lost: lost,
        conversion_rate: conversionRate,
        loss_rate: lossRate
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('getChannelConversionReport Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

const getEmployeeConversionReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { dateRange, startDate, endDate } = req.query;
    let dateFilter = '';
    let queryParams = [businessId];

    if (dateRange === 'ytd') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'prev_year') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE()) - 1';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(c.created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = 'AND DATE(c.created_at) BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    } else if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
    } else if (startDate && endDate) {
      dateFilter = 'AND DATE(c.created_at) BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    let teamFilter = '';
    const selfId = Number(userId);

    if (req.user.role === 'agent') {
      // Find the teams the current user belongs to
      const [myTeams] = await pool.query(
        `SELECT team_id FROM team_members WHERE user_id = ?`,
        [selfId]
      );

      if (myTeams.length > 0) {
        const teamIds = myTeams.map(t => t.team_id);
        
        // Get all members of those teams
        const [teamRows] = await pool.query(
          `SELECT DISTINCT user_id FROM team_members WHERE team_id IN (?)`,
          [teamIds]
        );
        
        const teamMemberIds = teamRows.map(r => Number(r.user_id));
        if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
        
        teamFilter = ` AND c.assigned_to IN (${teamMemberIds.map(() => '?').join(',')}) `;
        queryParams.push(...teamMemberIds);
      } else {
        // If agent has no team, they only see themselves
        teamFilter = ` AND c.assigned_to = ? `;
        queryParams.push(selfId);
      }
    }
    // Admin will see all (teamFilter remains empty)

    const query = `
      SELECT 
        COALESCE(u.name, 'Unassigned') as employee,
        COALESCE(u.employee_code, 'N/A') as employee_code,
        COUNT(c.id) as total_leads,
        SUM(IF(c.current_sale_status = 1, 1, 0)) as sale_won,
        SUM(IF(c.current_sale_status = 2, 1, 0)) as sale_lost
      FROM contacts c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.business_id = ? ${dateFilter} ${teamFilter}
      GROUP BY c.assigned_to, u.name, u.employee_code
      ORDER BY total_leads DESC
    `;
    console.log("EXEC QUERY:", query, queryParams);

    const [rows] = await pool.query(query, queryParams);

    const data = rows.map(r => {
      const total = Number(r.total_leads) || 0;
      const won = Number(r.sale_won) || 0;
      const lost = Number(r.sale_lost) || 0;
      
      const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : '0.0';
      const lossRate = total > 0 ? ((lost / total) * 100).toFixed(1) : '0.0';
      
      return {
        employee: r.employee,
        employee_code: r.employee_code,
        total_leads: total,
        sale_won: won,
        sale_lost: lost,
        conversion_rate: conversionRate,
        loss_rate: lossRate
      };
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('getEmployeeConversionReport Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

const getStudentPipelineReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    // Removed 'status' because table needs all statuses; graph will filter on frontend.
    const { dateRange, startDate, endDate, date, course, source, employee } = req.query;
    let dateFilter = '';
    let queryParams = [businessId];

    if (dateRange === 'ytd') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'prev_year') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE()) - 1';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(c.created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = 'AND DATE(c.created_at) BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    } else if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
    } else if (date) {
      dateFilter = 'AND DATE(c.created_at) = ?';
      queryParams.push(date);
    } else if (startDate && endDate) {
      dateFilter = 'AND DATE(c.created_at) BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    let courseFilter = '';
    if (course && course !== 'All') {
      courseFilter = 'AND c.enquiry_for_id = ?';
      queryParams.push(course);
    }

    let sourceFilter = '';
    if (source && source !== 'All') {
      sourceFilter = 'AND c.opt_in_source = ?';
      queryParams.push(source);
    }

    let employeeFilter = '';
    if (employee && employee !== 'All') {
      employeeFilter = 'AND c.assigned_to = ?';
      queryParams.push(employee);
    }

    let teamFilter = '';
    const selfId = Number(userId);

    const [myTeams] = await pool.query(
      `SELECT team_id FROM team_members WHERE user_id = ?`,
      [selfId]
    );

    if (myTeams.length > 0) {
      const teamIds = myTeams.map(t => t.team_id);
      
      const [teamRows] = await pool.query(
        `SELECT DISTINCT user_id FROM team_members WHERE team_id IN (?)`,
        [teamIds]
      );
      
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
      
      teamFilter = ` AND c.assigned_to IN (${teamMemberIds.map(() => '?').join(',')}) `;
      queryParams.push(...teamMemberIds);
    } else if (req.user.role === 'agent') {
      teamFilter = ` AND c.assigned_to = ? `;
      queryParams.push(selfId);
    }

    const query = `
      SELECT 
        COALESCE(c.assigned_to, 'unassigned') as user_id,
        COALESCE(u.name, 'Unassigned') as employee,
        COALESCE(u.employee_code, 'N/A') as employee_code,
        COALESCE(c.status_name, 'Unspecified') as status_name,
        COUNT(c.id) as lead_count,
        SUM(IF(c.sale_won = 1, 1, 0)) as converted_count
      FROM contacts c
      LEFT JOIN users u ON c.assigned_to = u.id
      WHERE c.business_id = ? ${dateFilter} ${courseFilter} ${sourceFilter} ${employeeFilter} ${teamFilter}
      GROUP BY c.assigned_to, u.name, u.employee_code, c.status_name
    `;

    const [rows] = await pool.query(query, queryParams);

    const employeesMap = {};
    rows.forEach(r => {
      const empId = r.user_id;
      if (!employeesMap[empId]) {
        employeesMap[empId] = { 
          employee: r.employee, 
          employee_code: r.employee_code, 
          total_leads: 0, 
          converted_count: 0, 
          statuses: {} 
        };
      }
      employeesMap[empId].statuses[r.status_name] = Number(r.lead_count) || 0;
      employeesMap[empId].total_leads += Number(r.lead_count) || 0;
      employeesMap[empId].converted_count += Number(r.converted_count) || 0;
    });

    const data = Object.values(employeesMap).map(e => {
      e.conversion_rate = e.total_leads > 0 ? ((e.converted_count / e.total_leads) * 100).toFixed(1) : '0.0';
      return e;
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error('getStudentPipelineReport Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

const getFollowUpReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { dateRange, startDate, endDate, status, employee } = req.query;
    
    let dateFilter = '';
    // Query uses business_id twice: once in JOIN for contacts, once in WHERE for users
    let queryParams = [businessId, businessId];

    if (dateRange === 'ytd') {
      dateFilter = 'AND YEAR(f.entry_date_time) = YEAR(CURDATE())';
    } else if (dateRange === 'prev_year') {
      dateFilter = 'AND YEAR(f.entry_date_time) = YEAR(CURDATE()) - 1';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND YEAR(f.entry_date_time) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(f.entry_date_time) = MONTH(CURDATE() - INTERVAL 1 MONTH)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(f.entry_date_time) = MONTH(CURDATE()) AND YEAR(f.entry_date_time) = YEAR(CURDATE())';
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = 'AND DATE(f.entry_date_time) BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    } else if (dateRange === 'today') {
      dateFilter = 'AND DATE(f.entry_date_time) = CURDATE()';
    } else if (startDate && endDate) {
      dateFilter = 'AND DATE(f.entry_date_time) BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    let statusFilter = '';
    if (status && status !== 'All') {
      statusFilter = 'AND f.status_name = ?';
      queryParams.push(status);
    }

    let employeeFilter = '';
    if (employee && employee !== 'All') {
      employeeFilter = 'AND u.id = ?';
      queryParams.push(employee);
    }

    let teamFilter = '';
    const selfId = Number(userId);

    const [myTeams] = await pool.query(
      `SELECT team_id FROM team_members WHERE user_id = ?`,
      [selfId]
    );

    if (myTeams.length > 0) {
      const teamIds = myTeams.map(t => t.team_id);
      
      const [teamRows] = await pool.query(
        `SELECT DISTINCT user_id FROM team_members WHERE team_id IN (?)`,
        [teamIds]
      );
      
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
      
      teamFilter = ` AND u.id IN (${teamMemberIds.map(() => '?').join(',')}) `;
      queryParams.push(...teamMemberIds);
    } else if (req.user.role === 'agent') {
      teamFilter = ` AND u.id = ? `;
      queryParams.push(selfId);
    }

    const query = `
      SELECT 
        COALESCE(u.name, 'Unassigned') as employee_name,
        COALESCE(u.employee_code, 'N/A') as employee_code,
        COUNT(f.follow_up_id) as follow_up_count
      FROM users u
      LEFT JOIN (
        follow_ups f
        JOIN contacts c ON f.contact_id = c.id AND c.business_id = ?
      ) ON u.id = f.by_user_id ${dateFilter} ${statusFilter}
      WHERE u.business_id = ? AND u.role IN ('agent', 'admin') ${employeeFilter} ${teamFilter}
      GROUP BY u.id, u.name, u.employee_code
      ORDER BY follow_up_count DESC
    `;

    const [rows] = await pool.query(query, queryParams);

    const data = rows.map(r => ({
      employee: r.employee_name,
      employee_code: r.employee_code,
      follow_up_count: Number(r.follow_up_count) || 0
    }));

    // Calculate Summary Metrics
    let totalFollowUps = 0;
    let highestFollowUps = 0;
    let lowestFollowUps = data.length > 0 ? data[0].follow_up_count : 0;
    let totalEmployees = data.length;

    data.forEach(r => {
      totalFollowUps += r.follow_up_count;
      if (r.follow_up_count > highestFollowUps) highestFollowUps = r.follow_up_count;
      if (r.follow_up_count < lowestFollowUps) lowestFollowUps = r.follow_up_count;
    });

    let averageFollowUps = totalEmployees > 0 ? Math.round((totalFollowUps / totalEmployees) * 10) / 10 : 0;
    if (data.length === 0) {
      lowestFollowUps = 0;
    }

    res.json({ 
      success: true, 
      data,
      summary: {
        totalFollowUps,
        averageFollowUps,
        highestFollowUps,
        lowestFollowUps,
        totalEmployees
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to generate report' });
  }
};

const getTeamProductivityReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    let { date, employee } = req.query;
    
    // Default to today if date not provided
    if (!date || date === 'null' || date === 'undefined') {
      const today = new Date();
      date = today.toISOString().split('T')[0];
    }
    
    let employeeFilterUsers = '';
    let employeeFilterFollowUps = '';
    
    let teamFilter = '';
    const selfId = Number(req.user.userId || req.user.id);
    let teamMemberIds = [];

    if (req.user.role === 'agent') {
      const [teamRows] = await pool.query(
        `SELECT team_id FROM team_members WHERE user_id = ?`,
        [selfId]
      );
      if (teamRows.length > 0) {
        const teamIds = teamRows.map(t => t.team_id);
        const [members] = await pool.query(
          `SELECT DISTINCT user_id FROM team_members WHERE team_id IN (?)`,
          [teamIds]
        );
        teamMemberIds = members.map(m => Number(m.user_id));
        if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
        teamFilter = ` AND u.id IN (${teamMemberIds.map(() => '?').join(',')}) `;
      } else {
        teamFilter = ` AND u.id = ? `;
        teamMemberIds = [selfId];
      }
    }

    let queryParamsUsers = [
      businessId, date, 
      businessId, date, 
      businessId, date, 
      businessId, date, 
      businessId, date,
      businessId, ...teamMemberIds
    ];
    let queryParamsFollowUps = [businessId, date];

    if (employee && employee !== 'All') {
      employeeFilterUsers = 'AND u.id = ?';
      queryParamsUsers.push(employee);
      
      employeeFilterFollowUps = 'AND (c.assigned_to = ? OR f.by_user_id = ? OR f.to_user_id = ?)';
      queryParamsFollowUps.push(employee, employee, employee);
    }

    // 1. Team Productivity Table Data
    const usersQuery = `
      SELECT 
        u.id as employee_id,
        COALESCE(u.name, 'Unassigned') as employee_name,
        COALESCE(u.employee_code, 'N/A') as employee_code,
        (SELECT COUNT(*) FROM contacts c WHERE c.assigned_to = u.id AND c.business_id = ? AND DATE(c.created_at) = ?) as assigned,
        (SELECT COUNT(*) FROM follow_ups f JOIN contacts fc ON f.contact_id = fc.id WHERE (f.by_user_id = u.id OR f.to_user_id = u.id) AND fc.business_id = ? AND DATE(f.entry_date_time) = ?) as follow_ups,
        (SELECT COUNT(*) FROM contacts c WHERE c.assigned_to = u.id AND c.business_id = ? AND c.sale_lost = 1 AND DATE(c.created_at) = ?) as lost,
        (SELECT COUNT(*) FROM contacts c WHERE c.assigned_to = u.id AND c.business_id = ? AND c.sale_won = 1 AND DATE(c.created_at) = ?) as converted,
        (SELECT COUNT(*) FROM contacts c WHERE c.assigned_to = u.id AND c.business_id = ? AND c.sale_won = 0 AND c.sale_lost = 0 AND DATE(c.created_at) = ?) as pending
      FROM users u
      WHERE u.business_id = ? AND u.role = 'agent' ${teamFilter} ${employeeFilterUsers}
    `;
    const [teamProductivityRows] = await pool.query(usersQuery, queryParamsUsers);

    const teamProductivity = teamProductivityRows.map(row => {
      const converted = Number(row.converted) || 0;
      const assigned = Number(row.assigned) || 0;
      const conversion_percentage = assigned > 0 ? ((converted / assigned) * 100).toFixed(1) : '0.0';
      return {
        ...row,
        assigned: Number(row.assigned),
        follow_ups: Number(row.follow_ups),
        lost: Number(row.lost),
        converted,
        pending: Number(row.pending),
        conversion_percentage: Number(conversion_percentage)
      };
    });

    // 2. Today's Activity Summary
    const activityQuery = `
      SELECT 
        COALESCE(f.status_name, 'Unspecified') as status_name,
        COUNT(f.follow_up_id) as count
      FROM follow_ups f
      JOIN contacts c ON f.contact_id = c.id
      WHERE c.business_id = ? AND DATE(f.entry_date_time) = ? ${employeeFilterFollowUps}
      GROUP BY f.status_name
    `;
    const [todaysActivityRows] = await pool.query(activityQuery, queryParamsFollowUps);

    // 3. Activity Timeline (Hour by Hour)
    const timelineQuery = `
      SELECT 
        HOUR(f.entry_date_time) as hour,
        COUNT(f.follow_up_id) as count
      FROM follow_ups f
      JOIN contacts c ON f.contact_id = c.id
      WHERE c.business_id = ? AND DATE(f.entry_date_time) = ? ${employeeFilterFollowUps}
      GROUP BY HOUR(f.entry_date_time)
      ORDER BY hour ASC
    `;
    const [timelineRows] = await pool.query(timelineQuery, queryParamsFollowUps);

    res.json({
      success: true,
      data: {
        teamProductivity,
        todaysActivity: todaysActivityRows,
        activityTimeline: timelineRows
      }
    });

  } catch (error) {
    console.error('getTeamProductivityReport Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate team productivity report' });
  }
};

const getLeadCreationReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { 
      dateRange, 
      startDate, 
      endDate, 
      viewDetails, 
      filterType = 'range', 
      userId, 
      search = '', 
      page = 1, 
      limit = 20 
    } = req.query;

    let dateFilter = '';
    const dateParams = [];
    if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(c.created_at) = YEAR(CURDATE() - INTERVAL 1 MONTH)';
    } else if (dateRange === 'ytd') {
      dateFilter = 'AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = 'AND DATE(c.created_at) BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    }

    // Drilldown details popup mode
    if (viewDetails === 'true') {
      let detailDateFilter = '';
      const detailParams = [businessId];

      if (filterType === 'all') {
        detailDateFilter = '';
      } else if (filterType === 'today') {
        detailDateFilter = 'AND DATE(c.created_at) = CURDATE()';
      } else if (filterType === 'week') {
        detailDateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
      } else {
        detailDateFilter = dateFilter;
        detailParams.push(...dateParams);
      }

      let detailEmployeeFilter = '';
      if (filterType === 'employee') {
        if (userId && userId !== 'null' && userId !== 'undefined' && userId !== '0') {
          detailEmployeeFilter = 'AND c.created_by_user = ?';
          detailParams.push(userId);
        } else {
          detailEmployeeFilter = 'AND (c.created_by_user IS NULL OR c.created_by_user = 0)';
        }
      }

      let searchFilter = '';
      if (search && search.trim()) {
        searchFilter = 'AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR c.status_name LIKE ?)';
        const term = `%${search.trim()}%`;
        detailParams.push(term, term, term, term);
      }

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, parseInt(limit) || 20);
      const offset = (pageNum - 1) * limitNum;

      const [[{ totalCount }]] = await pool.query(
        `SELECT COUNT(c.id) as totalCount
         FROM contacts c
         WHERE c.business_id = ? ${detailDateFilter} ${detailEmployeeFilter} ${searchFilter}`,
        detailParams
      );

      const [leads] = await pool.query(
        `SELECT 
           c.id,
           c.name,
           c.phone,
           c.email,
           c.opt_in_source as source,
           c.created_at,
           COALESCE(u_assigned.name, 'Unassigned') as assigned_to,
           COALESCE(u_created.name, 'System') as created_by,
           COALESCE(TRIM(c.status_name), 'PENDING') as status_name,
           c.sale_won,
           c.sale_won_date,
           c.follow_up_count
         FROM contacts c
         LEFT JOIN users u_assigned ON c.assigned_to = u_assigned.id
         LEFT JOIN users u_created ON c.created_by_user = u_created.id
         WHERE c.business_id = ? ${detailDateFilter} ${detailEmployeeFilter} ${searchFilter}
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [...detailParams, limitNum, offset]
      );

      return res.json({
        success: true,
        data: {
          totalCount: Number(totalCount) || 0,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((Number(totalCount) || 0) / limitNum) || 1,
          leads
        }
      });
    }

    // Overall Totals
    const [[{ totalLeads }]] = await pool.query(`SELECT COUNT(*) as totalLeads FROM contacts c WHERE c.business_id = ?`, [businessId]);
    const [[{ todayLeads }]] = await pool.query(`SELECT COUNT(*) as todayLeads FROM contacts c WHERE c.business_id = ? AND DATE(c.created_at) = CURDATE()`, [businessId]);
    const [[{ weekLeads }]] = await pool.query(`SELECT COUNT(*) as weekLeads FROM contacts c WHERE c.business_id = ? AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)`, [businessId]);
    const [[{ rangeLeads }]] = await pool.query(`SELECT COUNT(*) as rangeLeads FROM contacts c WHERE c.business_id = ? ${dateFilter}`, [businessId, ...dateParams]);

    // Group by User for the given date filter
    const [userBreakdown] = await pool.query(
      `SELECT c.created_by_user as user_id, u.name as employee, u.employee_code, COUNT(c.id) as leads_created
       FROM contacts c
       LEFT JOIN users u ON c.created_by_user = u.id
       WHERE c.business_id = ? ${dateFilter}
       GROUP BY c.created_by_user, u.name, u.employee_code
       ORDER BY leads_created DESC`,
      [businessId, ...dateParams]
    );

    res.json({
      success: true,
      data: {
        totalLeads: totalLeads || 0,
        todayLeads: todayLeads || 0,
        weekLeads: weekLeads || 0,
        rangeLeads: rangeLeads || 0,
        breakdown: userBreakdown
      }
    });

  } catch (err) {
    console.error('getLeadCreationReport Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate lead creation report' });
  }
};
const getApplicationStatusSummaryReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const { 
      dateRange = 'all', 
      startDate, 
      endDate, 
      viewDetails, 
      statusId, 
      statusName, 
      search = '', 
      page = 1, 
      limit = 20 
    } = req.query;

    let dateFilter = '';
    const dateParams = [];

    if (dateRange === 'today') {
      dateFilter = 'AND DATE(a.created_at) = CURDATE()';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(a.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(a.created_at) = MONTH(CURDATE()) AND YEAR(a.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND MONTH(a.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(a.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
    } else if (dateRange === 'ytd') {
      dateFilter = 'AND YEAR(a.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'prev_year') {
      dateFilter = 'AND YEAR(a.created_at) = YEAR(CURDATE()) - 1';
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = 'AND DATE(a.created_at) BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    }

    // Drilldown details popup mode
    if (viewDetails === 'true') {
      let statusFilter = '';
      const filterParams = [businessId, ...dateParams];

      if (statusId && statusId !== 'all') {
        statusFilter = 'AND a.status_id = ?';
        filterParams.push(statusId);
      } else if (statusName && statusName !== 'all' && statusName !== 'Total Applications') {
        statusFilter = 'AND TRIM(LOWER(s.name)) = TRIM(LOWER(?))';
        filterParams.push(statusName);
      }

      let searchFilter = '';
      if (search && search.trim()) {
        searchFilter = 'AND (a.course LIKE ? OR a.university LIKE ? OR a.country LIKE ? OR c.name LIKE ? OR c.phone LIKE ? OR s.name LIKE ?)';
        const term = '%' + search.trim() + '%';
        filterParams.push(term, term, term, term, term, term);
      }

      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.max(1, parseInt(limit) || 20);
      const offset = (pageNum - 1) * limitNum;

      const [[{ totalCount }]] = await pool.query(
        `SELECT COUNT(a.id) as totalCount
         FROM applications a
         LEFT JOIN application_statuses s ON a.status_id = s.id
         LEFT JOIN contacts c ON a.contact_id = c.id
         WHERE a.business_id = ? ${dateFilter} ${statusFilter} ${searchFilter}`,
        filterParams
      );

      const [applications] = await pool.query(
        `SELECT 
           a.id,
           a.country,
           a.university,
           a.course,
           a.description,
           a.created_at,
           COALESCE(TRIM(s.name), 'Unassigned') as status,
           COALESCE(s.color, '#6366f1') as status_color,
           COALESCE(c.name, c.phone, CONCAT('Applicant #', a.id)) as applicant_name,
           c.phone as applicant_phone,
           c.email as applicant_email
         FROM applications a
         LEFT JOIN application_statuses s ON a.status_id = s.id
         LEFT JOIN contacts c ON a.contact_id = c.id
         WHERE a.business_id = ? ${dateFilter} ${statusFilter} ${searchFilter}
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
        [...filterParams, limitNum, offset]
      );

      return res.json({
        success: true,
        data: {
          totalCount: Number(totalCount) || 0,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((Number(totalCount) || 0) / limitNum) || 1,
          applications
        }
      });
    }

    // Status Summary Query
    const query = `
      SELECT 
        s.id,
        TRIM(s.name) AS status,
        s.color,
        COUNT(a.id) AS count
      FROM application_statuses s
      LEFT JOIN applications a ON a.status_id = s.id AND a.business_id = ? ${dateFilter}
      WHERE s.business_id = ?
      GROUP BY s.id, s.name, s.color
      ORDER BY s.id ASC
    `;

    const [rows] = await pool.query(query, [businessId, ...dateParams, businessId]);

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error('getApplicationStatusSummaryReport Error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate application status summary report' });
  }
};

const getConversationReport = async (req, res) => {
  try {
    const businessId = req.user.businessId || req.user.business_id;
    const userId = req.user.userId || req.user.id;
    const { dateRange, startDate, endDate } = req.query;

    let dateFilter = '';
    const dateParams = [];
    if (dateRange === 'today') {
      dateFilter = ' AND DATE(m.sent_at) = CURDATE() ';
    } else if (dateRange === 'this_week') {
      dateFilter = ' AND YEARWEEK(m.sent_at, 1) = YEARWEEK(CURDATE(), 1) ';
    } else if (dateRange === 'this_month') {
      dateFilter = ' AND MONTH(m.sent_at) = MONTH(CURDATE()) AND YEAR(m.sent_at) = YEAR(CURDATE()) ';
    } else if (dateRange === 'last_month') {
      dateFilter = ' AND YEAR(m.sent_at) = YEAR(CURDATE() - INTERVAL 1 MONTH) AND MONTH(m.sent_at) = MONTH(CURDATE() - INTERVAL 1 MONTH) ';
    } else if (dateRange === 'ytd') {
      dateFilter = ' AND YEAR(m.sent_at) = YEAR(CURDATE()) ';
    } else if (startDate && endDate) {
      dateFilter = ' AND DATE(m.sent_at) >= ? AND DATE(m.sent_at) <= ? ';
      dateParams.push(startDate, endDate);
    }

    let teamFilter = '';
    const filterParams = [businessId];

    if (req.user.role === 'agent') {
      const selfId = Number(userId);
      const [teamRows] = await pool.query(
        'SELECT user_id FROM team_members WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)',
        [selfId]
      );
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
      teamFilter = ' AND (c.assigned_to IN (' + teamMemberIds.map(() => '?').join(',') + ') OR c.assigned_to IS NULL) ';
      filterParams.push(...teamMemberIds);
    }

    // 1. Messages Sent (outbound)
    const [[sentRow]] = await pool.query(
      `SELECT COUNT(m.id) as cnt
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE c.business_id = ? ${teamFilter} ${dateFilter} AND m.direction = 'outbound'`,
      [...filterParams, ...dateParams]
    );
    const messagesSent = Number(sentRow?.cnt) || 0;

    // 2. Messages Received (inbound)
    const [[recvRow]] = await pool.query(
      `SELECT COUNT(m.id) as cnt
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE c.business_id = ? ${teamFilter} ${dateFilter} AND m.direction = 'inbound'`,
      [...filterParams, ...dateParams]
    );
    const messagesReceived = Number(recvRow?.cnt) || 0;

    // 3. Average Response Time (minutes between inbound and first reply)
    const dateFilterForM1 = dateFilter ? dateFilter.replace(/m\.sent_at/g, 'm1.sent_at') : '';
    const [[timeRow]] = await pool.query(
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, m1.sent_at, m2.sent_at)) as avgTime
       FROM messages m1
       JOIN conversations c ON m1.conversation_id = c.id
       JOIN messages m2 ON m2.conversation_id = c.id 
         AND m2.direction = 'outbound' 
         AND m2.sent_at >= m1.sent_at
         AND m2.sent_at <= DATE_ADD(m1.sent_at, INTERVAL 24 HOUR)
       WHERE c.business_id = ? ${teamFilter} ${dateFilterForM1}
         AND m1.direction = 'inbound'`,
      [...filterParams, ...dateParams]
    );
    const avgResponseTime = timeRow?.avgTime ? Number(Number(timeRow.avgTime).toFixed(1)) : 0;

    // 4. Bot vs Human Handoffs %
    let [[botRow]] = await pool.query(
      `SELECT 
         COUNT(DISTINCT c.id) as totalConvs,
         COUNT(DISTINCT CASE WHEN c.assigned_to IS NOT NULL THEN c.id END) as humanConvs
       FROM conversations c
       JOIN messages m ON m.conversation_id = c.id
       WHERE c.business_id = ? ${teamFilter} ${dateFilter}`,
      [...filterParams, ...dateParams]
    );

    let totalConvs = Number(botRow?.totalConvs) || 0;
    let humanConvs = Number(botRow?.humanConvs) || 0;
    let botHandoff = totalConvs > 0 ? Math.round((humanConvs / totalConvs) * 100) : 0;

    if (totalConvs === 0) {
      const [[allBotRow]] = await pool.query(
        `SELECT 
           COUNT(DISTINCT c.id) as totalConvs,
           COUNT(DISTINCT CASE WHEN c.assigned_to IS NOT NULL THEN c.id END) as humanConvs
         FROM conversations c
         WHERE c.business_id = ? ${teamFilter}`,
        [...filterParams]
      );
      const allTotal = Number(allBotRow?.totalConvs) || 0;
      const allHuman = Number(allBotRow?.humanConvs) || 0;
      botHandoff = allTotal > 0 ? Math.round((allHuman / allTotal) * 100) : 0;
    }

    // 5. Volume Trend (last 7 days)
    const [volumeTrend] = await pool.query(
      `SELECT DATE_FORMAT(m.sent_at, '%Y-%m-%d') as msg_date, COUNT(*) as cnt
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE c.business_id = ? ${teamFilter} AND m.sent_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY DATE_FORMAT(m.sent_at, '%Y-%m-%d')
       ORDER BY msg_date ASC`,
      [...filterParams]
    );

    const volumeLabels = [];
    const volumeData = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const match = volumeTrend.find(r => r.msg_date === dateStr);
      volumeLabels.push(days[d.getDay()]);
      volumeData.push(match ? Number(match.cnt) : 0);
    }

    // 6. Messages by Channel
    let [channelRows] = await pool.query(
      `SELECT LOWER(c.channel) as ch, COUNT(m.id) as cnt
       FROM conversations c
       JOIN messages m ON m.conversation_id = c.id
       WHERE c.business_id = ? ${teamFilter} ${dateFilter}
       GROUP BY ch`,
      [...filterParams, ...dateParams]
    );

    if (!channelRows || channelRows.length === 0) {
      [channelRows] = await pool.query(
        `SELECT LOWER(c.channel) as ch, COUNT(m.id) as cnt
         FROM conversations c
         JOIN messages m ON m.conversation_id = c.id
         WHERE c.business_id = ? ${teamFilter}
         GROUP BY ch`,
        [...filterParams]
      );
    }

    const chMap = { whatsapp: 0, sms: 0, email: 0, website: 0 };
    (channelRows || []).forEach(r => {
      const key = (r.ch || '').toLowerCase();
      if (key.includes('whats')) chMap.whatsapp += Number(r.cnt);
      else if (key.includes('sms')) chMap.sms += Number(r.cnt);
      else if (key.includes('email') || key.includes('mail')) chMap.email += Number(r.cnt);
      else chMap.website += Number(r.cnt);
    });
    const channelData = [chMap.whatsapp, chMap.sms, chMap.email, chMap.website];

    // 7. Recent Conversations with Server-Side Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    let [[totalRecentRow]] = await pool.query(
      `SELECT COUNT(m.id) as totalCount
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE c.business_id = ? ${teamFilter} ${dateFilter}`,
      [...filterParams, ...dateParams]
    );

    let [recentRows] = await pool.query(
      `SELECT 
         COALESCE(co.name, co.phone, 'Unknown') as contact,
         CASE 
           WHEN LOWER(c.channel) = 'whatsapp' THEN 'WhatsApp'
           WHEN LOWER(c.channel) = 'sms' THEN 'SMS'
           WHEN LOWER(c.channel) = 'email' THEN 'Email'
           ELSE 'Web Chat'
         END as channel,
         m.content as message,
         CASE 
           WHEN c.assigned_to IS NULL THEN 'Bot'
           ELSE COALESCE(u.name, 'Admin User')
         END as handledBy,
         m.sent_at as time
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       LEFT JOIN contacts co ON c.contact_id = co.id
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? ${teamFilter} ${dateFilter}
       ORDER BY m.sent_at DESC
       LIMIT ? OFFSET ?`,
      [...filterParams, ...dateParams, limit, offset]
    );

    if ((!recentRows || recentRows.length === 0) && (!totalRecentRow || totalRecentRow.totalCount === 0)) {
      const [[allTotalRow]] = await pool.query(
        `SELECT COUNT(m.id) as totalCount
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         WHERE c.business_id = ? ${teamFilter}`,
        [...filterParams]
      );
      totalRecentRow = allTotalRow;

      [recentRows] = await pool.query(
        `SELECT 
           COALESCE(co.name, co.phone, 'Unknown') as contact,
           CASE 
             WHEN LOWER(c.channel) = 'whatsapp' THEN 'WhatsApp'
             WHEN LOWER(c.channel) = 'sms' THEN 'SMS'
             WHEN LOWER(c.channel) = 'email' THEN 'Email'
             ELSE 'Web Chat'
           END as channel,
           m.content as message,
           CASE 
             WHEN c.assigned_to IS NULL THEN 'Bot'
             ELSE COALESCE(u.name, 'Admin User')
           END as handledBy,
           m.sent_at as time
         FROM messages m
         JOIN conversations c ON m.conversation_id = c.id
         LEFT JOIN contacts co ON c.contact_id = co.id
         LEFT JOIN users u ON c.assigned_to = u.id
         WHERE c.business_id = ? ${teamFilter}
         ORDER BY m.sent_at DESC
         LIMIT ? OFFSET ?`,
        [...filterParams, limit, offset]
      );
    }

    const recentMessages = (recentRows || []).map(r => ({
      contact: r.contact,
      channel: r.channel,
      message: r.message,
      handledBy: r.handledBy,
      time: r.time
    }));

    res.json({
      success: true,
      data: {
        messagesSent,
        messagesReceived,
        avgResponseTime,
        botHandoff,
        volumeLabels,
        volumeData,
        channelData,
        recentMessagesTotal: Number(totalRecentRow?.totalCount) || 0,
        page,
        limit,
        recentMessages
      }
    });
  } catch (err) {
    console.error('getConversationReport error:', err);
    res.status(500).json({ success: false, message: err.message, data: null });
  }
};

const getDailyReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { 
      dateRange = 'today', 
      startDate, 
      endDate, 
      status, 
      employee, 
      search,
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    let dateCondition = 'DATE(f.entry_date_time) = CURDATE()';
    const dateParams = [];

    if (dateRange === 'today') {
      dateCondition = 'DATE(f.entry_date_time) = CURDATE()';
    } else if (dateRange === 'yesterday') {
      dateCondition = 'DATE(f.entry_date_time) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
    } else if (dateRange === 'this_week') {
      dateCondition = 'YEARWEEK(f.entry_date_time, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateCondition = 'MONTH(f.entry_date_time) = MONTH(CURDATE()) AND YEAR(f.entry_date_time) = YEAR(CURDATE())';
    } else if (dateRange === 'last_month') {
      dateCondition = 'MONTH(f.entry_date_time) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(f.entry_date_time) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
    } else if (dateRange === 'all') {
      dateCondition = '1=1';
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateCondition = 'DATE(f.entry_date_time) BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    } else if (startDate && endDate) {
      dateCondition = 'DATE(f.entry_date_time) BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    }

    // Role-based team scoping
    let teamFilter = '';
    const teamParams = [];
    const selfId = Number(userId);

    if (req.user.role === 'team_leader' || req.user.role === 'manager') {
      const [myTeams] = await pool.query(
        `SELECT team_id FROM team_members WHERE user_id = ?`,
        [selfId]
      );
      if (myTeams.length > 0) {
        const teamIds = myTeams.map(t => t.team_id);
        const [teamRows] = await pool.query(
          `SELECT DISTINCT user_id FROM team_members WHERE team_id IN (?)`,
          [teamIds]
        );
        const teamMemberIds = teamRows.map(r => Number(r.user_id));
        if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
        teamFilter = ` AND (f.by_user_id IN (${teamMemberIds.map(() => '?').join(',')}) OR f.to_user_id IN (${teamMemberIds.map(() => '?').join(',')})) `;
        teamParams.push(...teamMemberIds, ...teamMemberIds);
      } else {
        teamFilter = ` AND (f.by_user_id = ? OR f.to_user_id = ?) `;
        teamParams.push(selfId, selfId);
      }
    } else if (req.user.role === 'agent') {
      teamFilter = ` AND (f.by_user_id = ? OR f.to_user_id = ?) `;
      teamParams.push(selfId, selfId);
    }

    // Status filter
    let statusFilter = '';
    const statusParams = [];
    if (status && status !== 'All') {
      statusFilter = ` AND TRIM(LOWER(f.status_name)) = TRIM(LOWER(?)) `;
      statusParams.push(status);
    }

    // Employee filter
    let employeeFilter = '';
    const employeeParams = [];
    if (employee && employee !== 'All') {
      employeeFilter = ` AND (f.by_user_id = ? OR f.to_user_id = ?) `;
      employeeParams.push(employee, employee);
    }

    // Search filter
    let searchFilter = '';
    const searchParams = [];
    if (search && search.trim()) {
      searchFilter = ` AND (c.name LIKE ? OR c.phone LIKE ? OR f.remarks LIKE ? OR f.by_user_name LIKE ? OR f.to_user_name LIKE ?) `;
      const term = `%${search.trim()}%`;
      searchParams.push(term, term, term, term, term);
    }

    // Base WHERE
    const whereClause = `
      WHERE c.business_id = ?
        AND ${dateCondition}
        ${teamFilter}
        ${statusFilter}
        ${employeeFilter}
        ${searchFilter}
    `;

    const allParams = [
      businessId,
      ...dateParams,
      ...teamParams,
      ...statusParams,
      ...employeeParams,
      ...searchParams
    ];

    // 1. Total Count Query
    const [[countRow]] = await pool.query(
      `SELECT COUNT(f.follow_up_id) as totalFollowUps,
              COUNT(DISTINCT f.contact_id) as uniqueLeads,
              COUNT(DISTINCT f.by_user_id) as activeAgents
       FROM follow_ups f
       JOIN contacts c ON f.contact_id = c.id
       ${whereClause}`,
      allParams
    );

    // 2. Status Breakdown
    const [statusRows] = await pool.query(
      `SELECT COALESCE(TRIM(f.status_name), 'Unspecified') as status_name,
              COUNT(f.follow_up_id) as count
       FROM follow_ups f
       JOIN contacts c ON f.contact_id = c.id
       ${whereClause}
       GROUP BY f.status_name
       ORDER BY count DESC`,
      allParams
    );

    // 3. Paginated Follow-Up Records (Each followup added = 1 individual row)
    const listParams = [...allParams, limitNum, offset];
    const [entries] = await pool.query(
      `SELECT 
         f.follow_up_id,
         f.contact_id,
         COALESCE(f.contact_name, c.name, 'Unknown Lead') as lead_name,
         c.phone,
         c.opt_in_source as source,
         f.follow_up_date as next_follow_up_date,
         f.entry_date_time as logged_at,
         COALESCE(f.by_user_name, u_by.name, 'System') as logged_by,
         COALESCE(f.to_user_name, u_to.name, 'Unassigned') as assigned_to,
         COALESCE(TRIM(f.status_name), 'Follow Up') as status_name,
         f.branch_name,
         f.department_name,
         COALESCE(f.remarks, '') as remarks
       FROM follow_ups f
       JOIN contacts c ON f.contact_id = c.id
       LEFT JOIN users u_by ON f.by_user_id = u_by.id
       LEFT JOIN users u_to ON f.to_user_id = u_to.id
       ${whereClause}
       ORDER BY f.entry_date_time DESC, f.follow_up_id DESC
       LIMIT ? OFFSET ?`,
      listParams
    );

    // 4. Hourly distribution for today / selected range
    const [hourlyRows] = await pool.query(
      `SELECT HOUR(f.entry_date_time) as hour,
              COUNT(f.follow_up_id) as count
       FROM follow_ups f
       JOIN contacts c ON f.contact_id = c.id
       ${whereClause}
       GROUP BY HOUR(f.entry_date_time)
       ORDER BY hour ASC`,
      allParams
    );

    // 5. Dynamic Dropdown Lists from Real Backend Data
    const [dropdownUsers] = await pool.query(
      `SELECT id, name, employee_code, role 
       FROM users 
       WHERE business_id = ? AND is_active = 1 
       ORDER BY name ASC`,
      [businessId]
    );

    const [dbStatuses] = await pool.query(
      `SELECT DISTINCT TRIM(name) as name 
       FROM statuses 
       WHERE name IS NOT NULL AND TRIM(name) != '' 
       ORDER BY name ASC`
    );

    const [distinctFollowupStatuses] = await pool.query(
      `SELECT DISTINCT TRIM(f.status_name) as name 
       FROM follow_ups f 
       JOIN contacts c ON f.contact_id = c.id 
       WHERE c.business_id = ? AND f.status_name IS NOT NULL AND TRIM(f.status_name) != '' 
       ORDER BY name ASC`,
      [businessId]
    );

    // Merge and deduplicate status names
    const statusSet = new Set();
    const dropdownStatuses = [];
    [...dbStatuses, ...distinctFollowupStatuses].forEach(s => {
      const cleanName = (s.name || '').trim();
      if (cleanName && !statusSet.has(cleanName.toLowerCase())) {
        statusSet.add(cleanName.toLowerCase());
        dropdownStatuses.push({ name: cleanName });
      }
    });

    res.json({
      success: true,
      data: {
        totalFollowUps: Number(countRow?.totalFollowUps) || 0,
        uniqueLeads: Number(countRow?.uniqueLeads) || 0,
        activeAgents: Number(countRow?.activeAgents) || 0,
        statusBreakdown: statusRows,
        hourlyDistribution: hourlyRows,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((Number(countRow?.totalFollowUps) || 0) / limitNum) || 1,
        dropdowns: {
          users: dropdownUsers,
          statuses: dropdownStatuses
        },
        entries
      }
    });

  } catch (error) {
    console.error('getDailyReport error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getLeadFlowReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { 
      dateRange = 'this_month', 
      startDate, 
      endDate, 
      employee = 'All',
      page = 1,
      limit = 10
    } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 10);
    const offset = (pageNum - 1) * limitNum;

    // Date filtering on lead creation (created_at)
    let dateCondition = '1=1';
    const dateParams = [];

    if (dateRange === 'today') {
      dateCondition = 'DATE(c.created_at) = CURDATE()';
    } else if (dateRange === 'yesterday') {
      dateCondition = 'DATE(c.created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)';
    } else if (dateRange === 'this_week') {
      dateCondition = 'YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateCondition = 'MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'last_month') {
      dateCondition = 'MONTH(c.created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(c.created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))';
    } else if (dateRange === 'ytd') {
      dateCondition = 'YEAR(c.created_at) = YEAR(CURDATE())';
    } else if (dateRange === 'all') {
      dateCondition = '1=1';
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateCondition = 'DATE(c.created_at) BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    } else if (startDate && endDate) {
      dateCondition = 'DATE(c.created_at) BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    }

    // Role-based staff scoping
    let teamFilter = '';
    const teamParams = [];
    const selfId = Number(userId);

    if (req.user.role === 'team_leader' || req.user.role === 'manager') {
      const [myTeams] = await pool.query(
        `SELECT team_id FROM team_members WHERE user_id = ?`,
        [selfId]
      );
      if (myTeams.length > 0) {
        const teamIds = myTeams.map(t => t.team_id);
        const [teamRows] = await pool.query(
          `SELECT DISTINCT user_id FROM team_members WHERE team_id IN (?)`,
          [teamIds]
        );
        const teamMemberIds = teamRows.map(r => Number(r.user_id));
        if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
        teamFilter = ` AND (c.assigned_to IN (${teamMemberIds.map(() => '?').join(',')}) OR c.created_by_user IN (${teamMemberIds.map(() => '?').join(',')})) `;
        teamParams.push(...teamMemberIds, ...teamMemberIds);
      } else {
        teamFilter = ` AND (c.assigned_to = ? OR c.created_by_user = ?) `;
        teamParams.push(selfId, selfId);
      }
    } else if (req.user.role === 'agent') {
      teamFilter = ` AND (c.assigned_to = ? OR c.created_by_user = ?) `;
      teamParams.push(selfId, selfId);
    }

    // Employee dropdown filter
    let employeeFilter = '';
    const employeeParams = [];
    if (employee && employee !== 'All') {
      employeeFilter = ` AND (c.assigned_to = ? OR c.created_by_user = ?) `;
      employeeParams.push(employee, employee);
    }

    const whereClause = `
      WHERE c.business_id = ?
        AND ${dateCondition}
        ${teamFilter}
        ${employeeFilter}
    `;

    const allParams = [
      businessId,
      ...dateParams,
      ...teamParams,
      ...employeeParams
    ];

    // 1. KPI Totals for the selected timeframe
    const [[kpiRow]] = await pool.query(
      `SELECT 
         COUNT(c.id) as totalCreated,
         SUM(CASE WHEN c.sale_won = 1 OR LOWER(c.status_name) LIKE '%won%' THEN 1 ELSE 0 END) as totalConverted,
         SUM(CASE WHEN c.sale_lost = 1 OR LOWER(c.status_name) LIKE '%lost%' THEN 1 ELSE 0 END) as totalLost,
         SUM(CASE WHEN (c.sale_won = 0 OR c.sale_won IS NULL) AND (c.sale_lost = 0 OR c.sale_lost IS NULL) AND LOWER(c.status_name) NOT LIKE '%won%' AND LOWER(c.status_name) NOT LIKE '%lost%' THEN 1 ELSE 0 END) as totalInPipeline
       FROM contacts c
       ${whereClause}`,
      allParams
    );

    const totalCreated = Number(kpiRow?.totalCreated) || 0;
    const totalConverted = Number(kpiRow?.totalConverted) || 0;
    const totalLost = Number(kpiRow?.totalLost) || 0;
    const totalInPipeline = Number(kpiRow?.totalInPipeline) || 0;
    const conversionRate = totalCreated > 0 ? Number(((totalConverted / totalCreated) * 100).toFixed(1)) : 0;

    // 2. Day-wise breakdown (matches day-wise charts from user screenshot)
    const [daywiseRows] = await pool.query(
      `SELECT 
         DATE_FORMAT(c.created_at, '%Y-%m-%d') as day,
         DATE_FORMAT(c.created_at, '%b %d') as formattedDay,
         COUNT(c.id) as createdCount,
         SUM(CASE WHEN c.sale_won = 1 OR LOWER(c.status_name) LIKE '%won%' THEN 1 ELSE 0 END) as convertedCount
       FROM contacts c
       ${whereClause}
       GROUP BY DATE_FORMAT(c.created_at, '%Y-%m-%d'), formattedDay
       ORDER BY day ASC`,
      allParams
    );

    // 3. Month-wise summary for the selected year (all 12 months: Jan to Dec)
    const targetYear = parseInt(req.query.year) || 2026;
    const [yearlyRows] = await pool.query(
      `SELECT 
         MONTH(c.created_at) as monthNum,
         COUNT(c.id) as createdCount,
         SUM(CASE WHEN c.sale_won = 1 OR LOWER(c.status_name) LIKE '%won%' THEN 1 ELSE 0 END) as convertedCount,
         SUM(CASE WHEN c.sale_lost = 1 OR LOWER(c.status_name) LIKE '%lost%' THEN 1 ELSE 0 END) as lostCount
       FROM contacts c
       WHERE c.business_id = ?
         AND YEAR(c.created_at) = ?
         ${teamFilter}
         ${employeeFilter}
       GROUP BY MONTH(c.created_at)
       ORDER BY monthNum ASC`,
      [businessId, targetYear, ...teamParams, ...employeeParams]
    );

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const monthDataMap = {};
    for (const r of yearlyRows) {
      monthDataMap[r.monthNum] = {
        createdCount: Number(r.createdCount) || 0,
        convertedCount: Number(r.convertedCount) || 0,
        lostCount: Number(r.lostCount) || 0
      };
    }

    let maxCreated = 0;
    const months2026 = [];
    for (let m = 1; m <= 12; m++) {
      const data = monthDataMap[m] || { createdCount: 0, convertedCount: 0, lostCount: 0 };
      const rate = data.createdCount > 0 ? Number(((data.convertedCount / data.createdCount) * 100).toFixed(1)) : 0;
      if (data.createdCount > maxCreated) {
        maxCreated = data.createdCount;
      }
      months2026.push({
        monthNumber: m,
        shortName: shortNames[m - 1],
        fullName: monthNames[m - 1],
        label: `${shortNames[m - 1]} ${targetYear}`,
        createdCount: data.createdCount,
        convertedCount: data.convertedCount,
        lostCount: data.lostCount,
        conversionRate: rate,
        isPeak: false
      });
    }

    let peakMonth = null;
    if (maxCreated > 0) {
      for (const m of months2026) {
        if (m.createdCount === maxCreated) {
          m.isPeak = true;
          peakMonth = {
            name: `${m.fullName} ${targetYear}`,
            shortName: m.shortName,
            monthNumber: m.monthNumber,
            createdCount: m.createdCount,
            convertedCount: m.convertedCount,
            conversionRate: m.conversionRate
          };
          break;
        }
      }
    }

    // 4. Paginated List of Leads Created in this timeframe with their current conversion status
    const listParams = [...allParams, limitNum, offset];
    const [leads] = await pool.query(
      `SELECT 
         c.id,
         c.name,
         c.phone,
         c.email,
         c.opt_in_source as source,
         c.created_at,
         COALESCE(u_assigned.name, 'Unassigned') as assigned_to,
         COALESCE(u_created.name, 'System') as created_by,
         COALESCE(TRIM(c.status_name), 'PENDING') as status_name,
         CASE 
           WHEN c.sale_won = 1 OR LOWER(c.status_name) LIKE '%won%' THEN 'Converted (Won)'
           WHEN c.sale_lost = 1 OR LOWER(c.status_name) LIKE '%lost%' THEN 'Lost'
           ELSE 'In Progress'
         END as conversion_status,
         c.sale_won,
         c.sale_won_date,
         c.follow_up_count
       FROM contacts c
       LEFT JOIN users u_assigned ON c.assigned_to = u_assigned.id
       LEFT JOIN users u_created ON c.created_by_user = u_created.id
       ${whereClause}
       ORDER BY c.created_at DESC
       LIMIT ? OFFSET ?`,
      listParams
    );

    // 5. Staff / Employees dropdown list for filter
    const [dropdownUsers] = await pool.query(
      `SELECT id, name, employee_code, role 
       FROM users 
       WHERE business_id = ? AND is_active = 1 
       ORDER BY name ASC`,
      [businessId]
    );

    res.json({
      success: true,
      data: {
        totals: {
          totalCreated,
          totalConverted,
          totalLost,
          totalInPipeline,
          conversionRate
        },
        selectedYear: targetYear,
        months2026,
        peakMonth,
        daywiseTrend: daywiseRows,
        monthlyTrend: months2026,
        dropdownUsers,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCreated / limitNum) || 1,
        leads
      }
    });

  } catch (error) {
    console.error('getLeadFlowReport error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getPipelineKpiReport = async (req, res) => {
  try {
    const bizId = req.user.businessId;
    const userId = Number(req.user.userId || req.user.id);
    const role = req.user.role || 'admin';
    const {
      type = 'applications',
      dateRange = 'all',
      startDate,
      endDate,
      search = '',
      page = 1,
      limit = 25
    } = req.query;

    // 1. Role / Agent scoping
    let agentScopeClause = '';
    const agentScopeParams = [];
    if (role === 'agent') {
      const [teamRows] = await pool.query(
        `SELECT user_id FROM team_members WHERE team_id = (SELECT id FROM teams WHERE name = CONCAT('__agent_', ?) AND business_id = ?)`,
        [userId, bizId]
      );
      const scopedIds = teamRows.map(r => Number(r.user_id));
      if (!scopedIds.includes(userId)) scopedIds.push(userId);
      agentScopeClause = `AND c.assigned_to IN (${scopedIds.map(() => '?').join(',')})`;
      agentScopeParams.push(...scopedIds);
    }

    // 2. Date filter builder
    const buildDateFilter = (field) => {
      let clause = '';
      const params = [];
      if (dateRange === 'today') {
        clause = `AND DATE(${field}) = CURDATE()`;
      } else if (dateRange === 'this_week') {
        clause = `AND YEARWEEK(${field}, 1) = YEARWEEK(CURDATE(), 1)`;
      } else if (dateRange === 'this_month') {
        clause = `AND MONTH(${field}) = MONTH(CURDATE()) AND YEAR(${field}) = YEAR(CURDATE())`;
      } else if (dateRange === 'last_30_days') {
        clause = `AND ${field} >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
      } else if (dateRange === 'this_year') {
        clause = `AND YEAR(${field}) = YEAR(CURDATE())`;
      } else if (dateRange === 'custom' && startDate && endDate) {
        clause = `AND DATE(${field}) BETWEEN ? AND ?`;
        params.push(startDate, endDate);
      }
      return { clause, params };
    };

    const appDateFilter = buildDateFilter('a.created_at');
    const recDateFilter = buildDateFilter('COALESCE(r.receipt_date, r.created_at)');

    // 3. Summary Counts
    const [[appCountRow]] = await pool.query(
      `SELECT COUNT(a.id) as cnt FROM applications a LEFT JOIN contacts c ON a.contact_id = c.id WHERE a.business_id = ? ${agentScopeClause} ${appDateFilter.clause}`,
      [bizId, ...agentScopeParams, ...appDateFilter.params]
    );

    const [[offerCountRow]] = await pool.query(
      `SELECT COUNT(a.id) as cnt FROM applications a 
       LEFT JOIN contacts c ON a.contact_id = c.id 
       LEFT JOIN application_statuses s ON a.status_id = s.id 
       WHERE a.business_id = ? AND LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%offer%'
       ${agentScopeClause} ${appDateFilter.clause}`,
      [bizId, ...agentScopeParams, ...appDateFilter.params]
    );

    const [[feesCountRow]] = await pool.query(
      `SELECT COUNT(r.id) as cnt, COALESCE(SUM(r.amount), 0) as totalAmount 
       FROM receipts r 
       LEFT JOIN contacts c ON r.contact_id = c.id 
       LEFT JOIN receipt_types rt ON r.receipt_type_id = rt.id
       WHERE r.business_id = ? AND (LOWER(TRIM(COALESCE(r.receipt_type_name, ''))) LIKE '%application fee%' OR LOWER(TRIM(COALESCE(rt.name, ''))) LIKE '%application fee%')
       ${agentScopeClause} ${recDateFilter.clause}`,
      [bizId, ...agentScopeParams, ...recDateFilter.params]
    );

    const [[visaSubCountRow]] = await pool.query(
      `SELECT COUNT(a.id) as cnt FROM applications a 
       LEFT JOIN contacts c ON a.contact_id = c.id 
       LEFT JOIN application_statuses s ON a.status_id = s.id 
       WHERE a.business_id = ? AND (LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%visa applied%' OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%visa submit%')
       ${agentScopeClause} ${appDateFilter.clause}`,
      [bizId, ...agentScopeParams, ...appDateFilter.params]
    );

    const [[visaAppCountRow]] = await pool.query(
      `SELECT COUNT(a.id) as cnt FROM applications a 
       LEFT JOIN contacts c ON a.contact_id = c.id 
       LEFT JOIN application_statuses s ON a.status_id = s.id 
       WHERE a.business_id = ? AND (LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%visa received%' OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%visa approv%')
       ${agentScopeClause} ${appDateFilter.clause}`,
      [bizId, ...agentScopeParams, ...appDateFilter.params]
    );

    const [[enrolledCountRow]] = await pool.query(
      `SELECT COUNT(a.id) as cnt FROM applications a 
       LEFT JOIN contacts c ON a.contact_id = c.id 
       LEFT JOIN application_statuses s ON a.status_id = s.id 
       WHERE a.business_id = ? AND (LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%enrolled%' OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%travel%')
       ${agentScopeClause} ${appDateFilter.clause}`,
      [bizId, ...agentScopeParams, ...appDateFilter.params]
    );

    const summary = {
      applications: Number(appCountRow?.cnt || 0),
      offerLetters: Number(offerCountRow?.cnt || 0),
      feesPaid: Number(feesCountRow?.cnt || 0),
      feesPaidAmount: Number(feesCountRow?.totalAmount || 0),
      visaSubmitted: Number(visaSubCountRow?.cnt || 0),
      visaApproved: Number(visaAppCountRow?.cnt || 0),
      enrolled: Number(enrolledCountRow?.cnt || 0)
    };

    // 4. Detailed Data Query
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 25);
    const offset = (pageNum - 1) * limitNum;

    let items = [];
    let totalCount = 0;

    if (type === 'fees-paid') {
      let searchClause = '';
      const searchParams = [];
      if (search && search.trim()) {
        const term = '%' + search.trim() + '%';
        searchClause = `AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR r.receipt_type_name LIKE ? OR r.description LIKE ?)`;
        searchParams.push(term, term, term, term, term);
      }

      const whereBase = `
        WHERE r.business_id = ?
        AND (LOWER(TRIM(COALESCE(r.receipt_type_name, ''))) LIKE '%application fee%' OR LOWER(TRIM(COALESCE(rt.name, ''))) LIKE '%application fee%')
        ${agentScopeClause}
        ${recDateFilter.clause}
        ${searchClause}
      `;
      const baseParams = [bizId, ...agentScopeParams, ...recDateFilter.params, ...searchParams];

      const [[{ total }]] = await pool.query(
        `SELECT COUNT(r.id) as total FROM receipts r 
         LEFT JOIN contacts c ON r.contact_id = c.id 
         LEFT JOIN receipt_types rt ON r.receipt_type_id = rt.id
         ${whereBase}`,
        baseParams
      );
      totalCount = Number(total || 0);

      const [rows] = await pool.query(
        `SELECT 
           r.id as receipt_id,
           r.amount,
           r.receipt_date,
           COALESCE(r.receipt_type_name, rt.name, 'Application Fees') as receipt_type_name,
           r.description,
           r.created_at,
           c.id as contact_id,
           COALESCE(c.name, CONCAT('Lead #', c.id)) as applicant_name,
           c.phone as applicant_phone,
           c.email as applicant_email,
           counselor.name as assigned_counselor,
           COALESCE(r.created_by_name, u.name) as received_by_name
         FROM receipts r
         LEFT JOIN contacts c ON r.contact_id = c.id
         LEFT JOIN receipt_types rt ON r.receipt_type_id = rt.id
         LEFT JOIN users counselor ON c.assigned_to = counselor.id
         LEFT JOIN users u ON r.created_by = u.id
         ${whereBase}
         ORDER BY COALESCE(r.receipt_date, r.created_at) DESC
         LIMIT ? OFFSET ?`,
        [...baseParams, limitNum, offset]
      );
      items = rows;

    } else {
      // Applications & Application-Status based reports
      let stageFilter = '';
      if (type === 'offer-letters') {
        stageFilter = `AND LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%offer%'`;
      } else if (type === 'visa-submitted') {
        stageFilter = `AND (LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%visa applied%' OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%visa submit%')`;
      } else if (type === 'visa-approved') {
        stageFilter = `AND (LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%visa received%' OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%visa approv%')`;
      } else if (type === 'enrolled') {
        stageFilter = `AND (LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%enrolled%' OR LOWER(TRIM(COALESCE(s.name, ''))) LIKE '%travel%')`;
      }

      let searchClause = '';
      const searchParams = [];
      if (search && search.trim()) {
        const term = '%' + search.trim() + '%';
        searchClause = `AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR a.university LIKE ? OR a.country LIKE ? OR a.course LIKE ? OR s.name LIKE ?)`;
        searchParams.push(term, term, term, term, term, term, term);
      }

      const whereBase = `
        WHERE a.business_id = ?
        ${stageFilter}
        ${agentScopeClause}
        ${appDateFilter.clause}
        ${searchClause}
      `;
      const baseParams = [bizId, ...agentScopeParams, ...appDateFilter.params, ...searchParams];

      const [[{ total }]] = await pool.query(
        `SELECT COUNT(a.id) as total FROM applications a
         LEFT JOIN contacts c ON a.contact_id = c.id
         LEFT JOIN application_statuses s ON a.status_id = s.id
         ${whereBase}`,
        baseParams
      );
      totalCount = Number(total || 0);

      const [rows] = await pool.query(
        `SELECT 
           a.id as application_id,
           a.country,
           a.university,
           a.course,
           a.description,
           a.created_at as application_created_at,
           a.updated_at as application_updated_at,
           COALESCE(TRIM(s.name), 'Unassigned') as status_name,
           COALESCE(s.color, '#6366f1') as status_color,
           y.year as year_name,
           c.id as contact_id,
           COALESCE(c.name, CONCAT('Applicant #', a.id)) as applicant_name,
           c.phone as applicant_phone,
           c.email as applicant_email,
           counselor.name as assigned_counselor,
           u.name as created_by_name
         FROM applications a
         LEFT JOIN contacts c ON a.contact_id = c.id
         LEFT JOIN application_statuses s ON a.status_id = s.id
         LEFT JOIN application_years y ON a.year_id = y.id
         LEFT JOIN users counselor ON c.assigned_to = counselor.id
         LEFT JOIN users u ON a.created_by = u.id
         ${whereBase}
         ORDER BY a.created_at DESC
         LIMIT ? OFFSET ?`,
        [...baseParams, limitNum, offset]
      );
      items = rows;
    }

    res.json({
      success: true,
      data: {
        type,
        summary,
        items,
        totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1
      }
    });

  } catch (error) {
    console.error('getPipelineKpiReport error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getReceiptsReport = async (req, res) => {
  try {
    const businessId = req.user?.businessId || req.user?.business_id || 1;
    const {
      dateRange = 'this_month',
      startDate,
      endDate,
      userId,
      receiptTypeId,
      search = '',
      page = 1,
      limit = 25
    } = req.query;

    // Build date filter for receipts based on COALESCE(r.receipt_date, r.created_at)
    let dateFilter = '';
    const dateParams = [];
    if (dateRange === 'today') {
      dateFilter = 'AND DATE(COALESCE(r.receipt_date, r.created_at)) = CURDATE()';
    } else if (dateRange === 'yesterday') {
      dateFilter = 'AND DATE(COALESCE(r.receipt_date, r.created_at)) = SUBDATE(CURDATE(), 1)';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(COALESCE(r.receipt_date, r.created_at), 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(COALESCE(r.receipt_date, r.created_at)) = MONTH(CURDATE()) AND YEAR(COALESCE(r.receipt_date, r.created_at)) = YEAR(CURDATE())';
    } else if (dateRange === 'last_month') {
      dateFilter = 'AND MONTH(COALESCE(r.receipt_date, r.created_at)) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(COALESCE(r.receipt_date, r.created_at)) = YEAR(CURDATE() - INTERVAL 1 MONTH)';
    } else if (dateRange === 'last_30_days') {
      dateFilter = 'AND COALESCE(r.receipt_date, r.created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    } else if (dateRange === 'ytd') {
      dateFilter = 'AND YEAR(COALESCE(r.receipt_date, r.created_at)) = YEAR(CURDATE())';
    } else if (dateRange === 'custom' && startDate && endDate) {
      dateFilter = 'AND DATE(COALESCE(r.receipt_date, r.created_at)) BETWEEN ? AND ?';
      dateParams.push(startDate, endDate);
    } // 'all' leaves dateFilter empty

    // 1. Overall KPIs
    const [[allTimeStats]] = await pool.query(
      `SELECT COUNT(id) as totalCount, COALESCE(SUM(amount), 0) as totalAmount FROM receipts WHERE business_id = ?`,
      [businessId]
    );

    const [[todayStats]] = await pool.query(
      `SELECT COUNT(id) as todayCount, COALESCE(SUM(amount), 0) as todayAmount 
       FROM receipts 
       WHERE business_id = ? AND DATE(COALESCE(receipt_date, created_at)) = CURDATE()`,
      [businessId]
    );

    const [[monthStats]] = await pool.query(
      `SELECT COUNT(id) as monthCount, COALESCE(SUM(amount), 0) as monthAmount 
       FROM receipts 
       WHERE business_id = ? AND MONTH(COALESCE(receipt_date, created_at)) = MONTH(CURDATE()) AND YEAR(COALESCE(receipt_date, created_at)) = YEAR(CURDATE())`,
      [businessId]
    );

    const [[rangeStats]] = await pool.query(
      `SELECT COUNT(r.id) as rangeCount, COALESCE(SUM(r.amount), 0) as rangeAmount 
       FROM receipts r 
       WHERE r.business_id = ? ${dateFilter}`,
      [businessId, ...dateParams]
    );

    const rangeCount = Number(rangeStats?.rangeCount || 0);
    const rangeAmount = Number(rangeStats?.rangeAmount || 0);
    const avgAmount = rangeCount > 0 ? Math.round(rangeAmount / rangeCount) : 0;

    // 2. Employee breakdown for selected date range
    const [employeeBreakdown] = await pool.query(
      `SELECT 
         r.created_by as user_id,
         COALESCE(r.created_by_name, u.name, 'Unknown Staff') as employee_name,
         u.email as employee_email,
         u.role as employee_role,
         COUNT(r.id) as receipts_count,
         COALESCE(SUM(r.amount), 0) as total_amount,
         ROUND(AVG(r.amount), 2) as avg_amount,
         MAX(COALESCE(r.receipt_date, r.created_at)) as last_receipt_date
       FROM receipts r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.business_id = ? ${dateFilter}
       GROUP BY r.created_by, COALESCE(r.created_by_name, u.name, 'Unknown Staff'), u.email, u.role
       ORDER BY receipts_count DESC, total_amount DESC`,
      [businessId, ...dateParams]
    );

    const breakdownWithShare = employeeBreakdown.map(emp => ({
      ...emp,
      receipts_count: Number(emp.receipts_count || 0),
      total_amount: Number(emp.total_amount || 0),
      avg_amount: Number(emp.avg_amount || 0),
      percentage: rangeCount > 0 ? Math.round((Number(emp.receipts_count || 0) / rangeCount) * 100) : 0
    }));

    // 3. Receipt Types Breakdown for selected date range
    const [typeBreakdown] = await pool.query(
      `SELECT 
         COALESCE(r.receipt_type_name, rt.name, 'General Receipt') as type_name,
         COUNT(r.id) as count,
         COALESCE(SUM(r.amount), 0) as total_amount
       FROM receipts r
       LEFT JOIN receipt_types rt ON r.receipt_type_id = rt.id
       WHERE r.business_id = ? ${dateFilter}
       GROUP BY COALESCE(r.receipt_type_name, rt.name, 'General Receipt')
       ORDER BY count DESC`,
      [businessId, ...dateParams]
    );

    // 4. Timeline Graph data: daily or monthly
    let timelineGroupFormat = '%Y-%m-%d';
    let timelineLabelFormat = '%d %b';
    if (dateRange === 'ytd' || dateRange === 'all') {
      timelineGroupFormat = '%Y-%m';
      timelineLabelFormat = '%b %Y';
    }

    const [timelineData] = await pool.query(
      `SELECT 
         DATE_FORMAT(COALESCE(r.receipt_date, r.created_at), '${timelineGroupFormat}') as period_key,
         DATE_FORMAT(COALESCE(r.receipt_date, r.created_at), '${timelineLabelFormat}') as label,
         COUNT(r.id) as count,
         COALESCE(SUM(r.amount), 0) as total_amount
       FROM receipts r
       WHERE r.business_id = ? ${dateFilter}
       GROUP BY period_key, label
       ORDER BY period_key ASC`,
      [businessId, ...dateParams]
    );

    // 5. Detailed Receipts Query with Search & Filtering
    let extraFilters = '';
    const extraParams = [];

    if (userId && userId !== 'all') {
      if (userId === '0' || userId === 'null') {
        extraFilters += ' AND (r.created_by IS NULL OR r.created_by = 0)';
      } else {
        extraFilters += ' AND r.created_by = ?';
        extraParams.push(userId);
      }
    }

    if (receiptTypeId && receiptTypeId !== 'all') {
      extraFilters += ' AND (r.receipt_type_id = ? OR r.receipt_type_name = ?)';
      extraParams.push(receiptTypeId, receiptTypeId);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      extraFilters += ' AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ? OR r.receipt_type_name LIKE ? OR r.created_by_name LIKE ? OR u.name LIKE ? OR r.description LIKE ? OR CAST(r.id AS CHAR) LIKE ?)';
      extraParams.push(term, term, term, term, term, term, term, term);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.max(1, parseInt(limit) || 25);
    const offset = (pageNum - 1) * limitNum;

    const [[{ totalRows }]] = await pool.query(
      `SELECT COUNT(r.id) as totalRows
       FROM receipts r
       LEFT JOIN contacts c ON r.contact_id = c.id
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.business_id = ? ${dateFilter} ${extraFilters}`,
      [businessId, ...dateParams, ...extraParams]
    );

    const [receipts] = await pool.query(
      `SELECT 
         r.id as receipt_id,
         r.contact_id,
         r.business_id,
         r.receipt_type_id,
         COALESCE(r.receipt_type_name, rt.name, 'Application Fees') as receipt_type_name,
         r.amount,
         r.receipt_date,
         r.description,
         r.created_by,
         COALESCE(r.created_by_name, u.name, 'Unknown Staff') as created_by_name,
         r.created_at,
         c.name as contact_name,
         c.phone as contact_phone,
         c.email as contact_email,
         c_assignee.name as assigned_to_name
       FROM receipts r
       LEFT JOIN contacts c ON r.contact_id = c.id
       LEFT JOIN receipt_types rt ON r.receipt_type_id = rt.id
       LEFT JOIN users u ON r.created_by = u.id
       LEFT JOIN users c_assignee ON c.assigned_to = c_assignee.id
       WHERE r.business_id = ? ${dateFilter} ${extraFilters}
       ORDER BY COALESCE(r.receipt_date, r.created_at) DESC, r.id DESC
       LIMIT ? OFFSET ?`,
      [businessId, ...dateParams, ...extraParams, limitNum, offset]
    );

    // List of staff members for creator filter
    const [staffList] = await pool.query(
      `SELECT DISTINCT r.created_by as id, COALESCE(r.created_by_name, u.name, 'Unknown Staff') as name
       FROM receipts r
       LEFT JOIN users u ON r.created_by = u.id
       WHERE r.business_id = ? AND r.created_by IS NOT NULL
       ORDER BY name ASC`,
      [businessId]
    );

    res.json({
      success: true,
      data: {
        kpis: {
          totalCount: Number(allTimeStats?.totalCount || 0),
          totalAmount: Number(allTimeStats?.totalAmount || 0),
          todayCount: Number(todayStats?.todayCount || 0),
          todayAmount: Number(todayStats?.todayAmount || 0),
          monthCount: Number(monthStats?.monthCount || 0),
          monthAmount: Number(monthStats?.monthAmount || 0),
          rangeCount,
          rangeAmount,
          avgAmount,
          activeEmployeesCount: employeeBreakdown.length
        },
        employeeBreakdown: breakdownWithShare,
        typeBreakdown,
        timelineData,
        staffList,
        receipts,
        pagination: {
          total: Number(totalRows || 0),
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil((Number(totalRows) || 0) / limitNum) || 1
        }
      }
    });

  } catch (error) {
    console.error('getReceiptsReport Error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate receipts report', error: error.message });
  }
};

module.exports = {
  getTimeTrackReport,
  getEnquiriesReport,
  getStatusReport,
  getTodaysLeadsReport,
  getPendingFollowupsReport,
  getWorkReport,
  getEmployeeReport,
  getSourceConversionReport,
  getChannelsReport,
  getWonLostReport,
  getChannelConversionReport,
  getEmployeeConversionReport,
  getStudentPipelineReport,
  getFollowUpReport,
  getTeamProductivityReport,
  getLeadCreationReport,
  getApplicationStatusSummaryReport,
  getConversationReport,
  getDailyReport,
  getLeadFlowReport,
  getPipelineKpiReport,
  getReceiptsReport
};


