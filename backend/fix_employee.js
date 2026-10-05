const fs = require('fs');
const path = require('path');
const p = path.resolve('src/controllers/reports.controller.js');
let content = fs.readFileSync(p, 'utf8');

const newEmployeeReport = `const getEmployeeReport = async (req, res) => {
  try {
    const businessId = req.user.businessId;
    const userId = req.user.userId || req.user.id;
    const { dateRange } = req.query;

    let dateFilter = '';
    let fuDateFilter = '';
    if (dateRange === 'today') {
      dateFilter = 'AND DATE(c.created_at) = CURDATE()';
      fuDateFilter = 'AND DATE(f.entry_date_time) = CURDATE()';
    } else if (dateRange === 'this_week') {
      dateFilter = 'AND YEARWEEK(c.created_at, 1) = YEARWEEK(CURDATE(), 1)';
      fuDateFilter = 'AND YEARWEEK(f.entry_date_time, 1) = YEARWEEK(CURDATE(), 1)';
    } else if (dateRange === 'this_month') {
      dateFilter = 'AND MONTH(c.created_at) = MONTH(CURDATE()) AND YEAR(c.created_at) = YEAR(CURDATE())';
      fuDateFilter = 'AND MONTH(f.entry_date_time) = MONTH(CURDATE()) AND YEAR(f.entry_date_time) = YEAR(CURDATE())';
    }

    let teamFilter = '';
    let fuTeamFilter = '';
    let filterParams = [];

    if (req.user.role === 'agent') {
      const selfId = Number(userId);
      const [teamRows] = await pool.query(
        \`SELECT user_id FROM team_members 
         WHERE team_id = (SELECT id FROM teams WHERE name = CONCAT('__agent_', ?) AND business_id = ?)\`,
        [selfId, businessId]
      );
      const teamMemberIds = teamRows.map(r => Number(r.user_id));
      if (!teamMemberIds.includes(selfId)) teamMemberIds.push(selfId);
      
      teamFilter = \` AND c.assigned_to IN (\${teamMemberIds.map(() => '?').join(',')}) \`;
      fuTeamFilter = \` AND f.by_user_id IN (\${teamMemberIds.map(() => '?').join(',')}) \`;
      filterParams.push(...teamMemberIds);
    }

    // Total active agents in scope
    const [[{ activeAgents }]] = await pool.query(
      \`SELECT COUNT(DISTINCT c.assigned_to) as activeAgents FROM contacts c WHERE c.business_id = ? \${dateFilter} \${teamFilter} AND c.assigned_to IS NOT NULL\`,
      [businessId, ...filterParams]
    );

    // Total tasks = follow-ups logged in the period
    const [[{ totalTasks }]] = await pool.query(
      \`SELECT COUNT(*) as totalTasks 
       FROM follow_ups f
       JOIN contacts c ON f.contact_id = c.id
       WHERE c.business_id = ? \${fuDateFilter} \${fuTeamFilter}\`,
      [businessId, ...filterParams]
    );

    // Agent Details with real follow-up counts from follow_ups table
    const [agentDetails] = await pool.query(
      \`SELECT 
         u.id,
         u.name,
         COUNT(DISTINCT c.id) as assigned,
         IFNULL(fu_counts.followups, 0) as followups,
         SUM(CASE WHEN c.status_name = 'Converted' THEN 1 ELSE 0 END) as conversions
       FROM contacts c
       JOIN users u ON c.assigned_to = u.id
       LEFT JOIN (
         SELECT by_user_id, COUNT(*) as followups
         FROM follow_ups f2
         JOIN contacts c2 ON f2.contact_id = c2.id
         WHERE c2.business_id = ? \${fuDateFilter}
         GROUP BY by_user_id
       ) fu_counts ON fu_counts.by_user_id = u.id
       WHERE c.business_id = ? \${dateFilter} \${teamFilter}
       GROUP BY u.id, u.name
       ORDER BY assigned DESC\`,
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
      \`SELECT COUNT(*) as totalMessages FROM messages m
       JOIN conversations conv ON m.conversation_id = conv.id
       JOIN contacts c ON conv.contact_id = c.id
       WHERE c.business_id = ? AND m.direction = 'outbound'\`,
      [businessId]
    );

    const [[{ totalFollowUps }]] = await pool.query(
      \`SELECT COUNT(*) as totalFollowUps FROM follow_ups f
       JOIN contacts c ON f.contact_id = c.id
       WHERE c.business_id = ?\`,
      [businessId]
    );

    const [[{ totalContacts }]] = await pool.query(
      \`SELECT COUNT(*) as totalContacts FROM contacts c WHERE c.business_id = ?\`,
      [businessId]
    );

    const [[{ totalConversions }]] = await pool.query(
      \`SELECT COUNT(*) as totalConversions FROM contacts c WHERE c.business_id = ? AND c.status_name = 'Converted'\`,
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
};`;

// Use regex to replace the entire getEmployeeReport function
const regex = /const getEmployeeReport = async[\s\S]+?^};/m;
if (regex.test(content)) {
  content = content.replace(regex, newEmployeeReport);
  fs.writeFileSync(p, content, 'utf8');
  console.log('SUCCESS: getEmployeeReport replaced');
} else {
  // Try multi-line
  const regex2 = /const getEmployeeReport[\s\S]+?(\n|^)};/m;
  if (regex2.test(content)) {
    content = content.replace(regex2, newEmployeeReport);
    fs.writeFileSync(p, content, 'utf8');
    console.log('SUCCESS (regex2): getEmployeeReport replaced');
  } else {
    console.log('FAILED: Could not find getEmployeeReport');
  }
}
