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
      `SELECT c.id, c.name, c.phone, c.email, c.opt_in_source, c.created_at as time, u.name as agent, e.name as product
       FROM contacts c 
       LEFT JOIN users u ON c.assigned_to = u.id
       LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id
       WHERE c.business_id = ? AND DATE(c.created_at) = CURDATE()
       ORDER BY c.created_at DESC`,
      [businessId]
    );

    res.json({
      success: true,
      data: {
        totalToday: leads.length,
        actioned: 0, // Mock for now
        hotLeads: 0,
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

module.exports = {
  getEnquiriesReport,
  getStatusReport,
  getTodaysLeadsReport
};
