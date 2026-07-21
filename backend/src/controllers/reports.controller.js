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

    // Total Enquiries
    const [[{ totalEnquiries }]] = await pool.query(
      `SELECT COUNT(*) as totalEnquiries FROM contacts c WHERE c.business_id = ? ${dateFilter}`,
      [businessId]
    );

    // High Value (mocked for now, or based on tags)
    const [[{ highValue }]] = await pool.query(
      `SELECT COUNT(*) as highValue FROM contacts c WHERE c.business_id = ? AND c.tags LIKE '%vip%' ${dateFilter}`,
      [businessId]
    );

    // Sources (Group by opt_in_source)
    const [sources] = await pool.query(
      `SELECT opt_in_source as source, COUNT(*) as count 
       FROM contacts c WHERE c.business_id = ? ${dateFilter} 
       GROUP BY opt_in_source ORDER BY count DESC`,
      [businessId]
    );

    const topSource = sources.length > 0 ? sources[0].source : 'N/A';

    // Categories (Group by enquiry_for_id)
    const [categories] = await pool.query(
      `SELECT e.name as category, COUNT(c.id) as count 
       FROM contacts c 
       LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id 
       WHERE c.business_id = ? ${dateFilter} 
       GROUP BY c.enquiry_for_id ORDER BY count DESC`,
      [businessId]
    );

    // Recent Enquiries
    const [recentEnquiries] = await pool.query(
      `SELECT c.name, c.opt_in_source as source, e.name as product, c.created_at as date 
       FROM contacts c 
       LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id 
       WHERE c.business_id = ? ${dateFilter} 
       ORDER BY c.created_at DESC LIMIT 10`,
      [businessId]
    );

    const formattedRecent = recentEnquiries.map(r => ({
      name: r.name,
      source: r.source || 'Unknown',
      product: r.product || 'Unknown',
      score: Math.floor(Math.random() * 40) + 60, // Mock score
      date: r.date
    }));

    res.json({
      success: true,
      data: {
        totalEnquiries: totalEnquiries || 0,
        highValue: highValue || 0,
        topSource,
        avgLeadScore: 85,
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
    const { dateRange } = req.query;

    let dateFilter = '';
    if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    }

    // Since we don't have a rigid lead status in the contacts table right now, 
    // we'll mock the status aggregation but return the structure expected by the frontend.
    // In a real scenario, this would query contacts and group by status column or application_statuses
    
    // For stale leads, we'll fetch contacts created over 7 days ago with no recent messages
    const [stale] = await pool.query(
      `SELECT c.name, 'New' as status, DATEDIFF(CURDATE(), c.created_at) as days, u.name as assignedTo
       FROM contacts c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? AND c.created_at < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       ORDER BY days DESC LIMIT 10`,
      [businessId]
    );

    res.json({
      success: true,
      data: {
        openLeads: Math.floor(Math.random() * 50) + 10,
        closedWon: Math.floor(Math.random() * 20),
        closedLost: Math.floor(Math.random() * 10),
        pipelineLabels: ['New', 'Contacted', 'Interested', 'In Negotiation', 'Converted'],
        pipelineValues: [40, 25, 12, 8, 5],
        lossLabels: ['Price too high', 'Competitor', 'No Response', 'Other'],
        lossValues: [2, 1, 3, 1],
        staleLeads: stale.map(s => ({
          name: s.name,
          status: s.status,
          days: s.days,
          assignedTo: s.assignedTo || 'Unassigned'
        }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const getTodaysLeadsReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    
    const [leads] = await pool.query(
      `SELECT c.id, c.name, c.phone, c.email, c.opt_in_source, c.created_at as time, u.name as agent, e.name as product, c.follow_up
       FROM contacts c 
       LEFT JOIN users u ON c.assigned_to = u.id
       LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id
       WHERE c.business_id = ? AND DATE(c.created_at) = CURDATE()
       ORDER BY c.created_at DESC`,
      [businessId]
    );

    const actionedCount = leads.filter(l => l.follow_up === 1).length;
    const unassignedCount = leads.filter(l => !l.agent).length;

    res.json({
      success: true,
      data: {
        totalToday: leads.length,
        actioned: actionedCount,
        unassignedLeads: unassignedCount,
        leads: leads.map(l => ({
          name: l.name,
          phone: l.phone,
          source: l.opt_in_source,
          time: l.time,
          agent: l.agent || 'Unassigned',
          interest: l.product || 'Unknown',
          status: 'New'
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

    const [followups] = await pool.query(
      `SELECT 
        c.id as lead_id,
        c.name as leadName,
        c.phone as phone,
        c.name as contact,
        c.follow_up_date as dueDate,
        u.name as assignee,
        CASE
          WHEN DATE(c.follow_up_date) < CURDATE() THEN 'Overdue'
          WHEN DATE(c.follow_up_date) = CURDATE() THEN 'Due Today'
          WHEN DATE(c.follow_up_date) > CURDATE() AND DATE(c.follow_up_date) <= DATE_ADD(CURDATE(), INTERVAL 7 DAY) THEN 'Upcoming'
          ELSE 'Other'
        END as status
       FROM contacts c
       LEFT JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? AND c.follow_up = 1 AND c.follow_up_date IS NOT NULL
       ORDER BY c.follow_up_date ASC`,
      [businessId]
    );

    const filteredFollowups = followups.filter(f => ['Overdue', 'Due Today', 'Upcoming'].includes(f.status));

    const overdueCount = filteredFollowups.filter(f => f.status === 'Overdue').length;
    const dueTodayCount = filteredFollowups.filter(f => f.status === 'Due Today').length;
    const upcomingCount = filteredFollowups.filter(f => f.status === 'Upcoming').length;

    res.json({
      success: true,
      data: {
        overdue: overdueCount,
        dueToday: dueTodayCount,
        upcoming: upcomingCount,
        list: filteredFollowups.map(f => ({
          id: f.lead_id,
          leadName: f.leadName,
          contact: f.contact,
          phone: f.phone,
          dueDate: f.dueDate,
          status: f.status,
          assignee: f.assignee || 'Unassigned'
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

    // Visibility Logic: user sees themselves OR anyone in their auto-team
    const teamFilter = `
      AND (
        c.assigned_to = ? OR 
        c.assigned_to IN (
          SELECT user_id FROM team_members 
          WHERE team_id = (SELECT id FROM teams WHERE name = CONCAT('__agent_', ?) AND business_id = ?)
        )
      )
    `;
    const filterParams = [userId, userId, businessId];
    
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

    // Recent Activities
    const [recentActivities] = await pool.query(
      `SELECT u.name as agent, c.name as lead, 
              COALESCE(c.status_name, 'Contacted') as action, c.created_at as time,
              'Completed' as status
       FROM contacts c
       JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? ${dateFilter} ${teamFilter}
       ORDER BY c.created_at DESC LIMIT 10`,
      [businessId, ...filterParams]
    );

    res.json({
      success: true,
      data: {
        totalLeads: totalLeads || 0,
        followUpsCompleted: followUpsCompleted || 0,
        totalConversions: totalConversions || 0,
        conversionRate,
        funnelData,
        agentData,
        recentActivities
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
    if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
    }

    const teamFilter = `
      AND (
        c.assigned_to = ? OR 
        c.assigned_to IN (
          SELECT user_id FROM team_members 
          WHERE team_id = (SELECT id FROM teams WHERE name = CONCAT('__agent_', ?) AND business_id = ?)
        )
      )
    `;
    const filterParams = [userId, userId, businessId];

    // Total active agents in scope (those who handled leads)
    const [[{ activeAgents }]] = await pool.query(
      `SELECT COUNT(DISTINCT c.assigned_to) as activeAgents FROM contacts c WHERE c.business_id = ? ${dateFilter} ${teamFilter} AND c.assigned_to IS NOT NULL`,
      [businessId, ...filterParams]
    );

    const [[{ totalTasks }]] = await pool.query(
      `SELECT COUNT(*) as totalTasks FROM contacts c WHERE c.business_id = ? AND c.follow_up = 1 ${dateFilter} ${teamFilter}`,
      [businessId, ...filterParams]
    );

    // Agent Details
    const [agentDetails] = await pool.query(
      `SELECT u.name, 
              COUNT(c.id) as assigned, 
              SUM(CASE WHEN c.follow_up = 1 THEN 1 ELSE 0 END) as followups,
              SUM(CASE WHEN c.status_name = 'Converted' THEN 1 ELSE 0 END) as conversions
       FROM contacts c
       JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? ${dateFilter} ${teamFilter}
       GROUP BY u.id, u.name
       ORDER BY assigned DESC`,
      [businessId, ...filterParams]
    );

    let topPerformer = 'N/A';
    let avgLeads = 0;
    
    if (agentDetails.length > 0) {
      const sortedByConv = [...agentDetails].sort((a, b) => b.conversions - a.conversions);
      topPerformer = sortedByConv[0].name;
      
      const totalLeads = agentDetails.reduce((sum, a) => sum + a.assigned, 0);
      avgLeads = Math.round(totalLeads / agentDetails.length);
    }

    const formattedDetails = agentDetails.map(a => ({
      ...a,
      winRate: a.assigned > 0 ? ((a.conversions / a.assigned) * 100).toFixed(1) : 0
    }));

    res.json({
      success: true,
      data: {
        activeAgents: activeAgents || 0,
        totalTasks: totalTasks || 0,
        topPerformer,
        avgLeads,
        agentDetails: formattedDetails
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getEnquiriesReport,
  getStatusReport,
  getTodaysLeadsReport,
  getPendingFollowupsReport,
  getWorkReport,
  getEmployeeReport
};
