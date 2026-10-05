const fs = require('fs');
const path = require('path');
const p = path.resolve('src/controllers/reports.controller.js');
let content = fs.readFileSync(p, 'utf8');

const newFn = `const getEnquiriesReport = async (req, res) => {
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
      \`SELECT COUNT(*) as totalEnquiries FROM contacts c WHERE c.business_id = ? \${dateFilter}\`,
      [businessId]
    );

    // High Value — contacts tagged 'vip'
    const [[{ highValue }]] = await pool.query(
      \`SELECT COUNT(*) as highValue FROM contacts c 
       WHERE c.business_id = ? 
       AND (JSON_CONTAINS(c.tags, '"vip"') OR c.tags LIKE '%vip%') \${dateFilter}\`,
      [businessId]
    );

    // Sources (Group by opt_in_source)
    const [sources] = await pool.query(
      \`SELECT IFNULL(opt_in_source, 'Unknown') as source, COUNT(*) as count 
       FROM contacts c WHERE c.business_id = ? \${dateFilter} 
       GROUP BY opt_in_source ORDER BY count DESC\`,
      [businessId]
    );

    const topSource = sources.length > 0 ? (sources[0].source || 'N/A') : 'N/A';

    // Categories (Group by enquiry_for_id)
    const [categories] = await pool.query(
      \`SELECT IFNULL(e.name, 'Uncategorized') as category, COUNT(c.id) as count 
       FROM contacts c 
       LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id 
       WHERE c.business_id = ? \${dateFilter} 
       GROUP BY c.enquiry_for_id, e.name ORDER BY count DESC\`,
      [businessId]
    );

    // Recent Enquiries with real score based on activity
    const [recentEnquiries] = await pool.query(
      \`SELECT c.name, c.opt_in_source as source, e.name as product, c.created_at as date,
              c.follow_up_count, c.sale_won, c.status_name
       FROM contacts c 
       LEFT JOIN enquiry_fors e ON c.enquiry_for_id = e.id 
       WHERE c.business_id = ? \${dateFilter} 
       ORDER BY c.created_at DESC LIMIT 10\`,
      [businessId]
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
};`;

const regex = /const getEnquiriesReport[\s\S]+?^};/m;
if (regex.test(content)) {
  content = content.replace(regex, newFn);
  fs.writeFileSync(p, content, 'utf8');
  console.log('SUCCESS');
} else {
  console.log('FAILED: function not found');
}
