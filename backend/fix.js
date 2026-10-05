const fs = require('fs');
const path = require('path');
const p = path.resolve('src/controllers/reports.controller.js');
let content = fs.readFileSync(p, 'utf8');

const replacement = `    // Recent Activities
    const [recentActivities] = await pool.query(
      \`SELECT u.name as agent, c.name as lead, 
              COALESCE(c.status_name, 'Contacted') as action, c.created_at as time,
              'Completed' as status
       FROM contacts c
       JOIN users u ON c.assigned_to = u.id
       WHERE c.business_id = ? \${dateFilter} \${teamFilter}
       ORDER BY c.created_at DESC LIMIT 10\`,
      [businessId, ...filterParams]
    );

    // Activity Data (Trend over last 7 days)
    const [activityTrend] = await pool.query(
      \`SELECT DATE(c.created_at) as date, COUNT(*) as count
       FROM contacts c
       WHERE c.business_id = ? AND c.created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) \${teamFilter}
       GROUP BY DATE(c.created_at)
       ORDER BY date ASC\`,
      [businessId, ...filterParams]
    );

    const activityData = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = activityTrend.find(a => {
        const aDate = new Date(a.date);
        return aDate.toISOString().split('T')[0] === dateStr;
      });
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      labels.push(days[d.getDay()]);
      activityData.push(found ? found.count : 0);
    }

    res.json({`;

content = content.replace(/\s*\/\/\s*Recent Activities.*?res\.json\(\{/s, '\n' + replacement);

const replace2 = `        recentActivities,
        activityLabels: labels,
        activityData: activityData
      }
    });`;

content = content.replace(/\s*recentActivities\s*\}\s*\}\);/s, '\n' + replace2);

fs.writeFileSync(p, content, 'utf8');
console.log('Done with Regex');
