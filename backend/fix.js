const fs = require('fs');
const path = require('path');
const file = path.join('c:', 'Users', 'SALMAN', 'Desktop', 'TRACKBOXV2', 'TrackboxV2', 'backend', 'src', 'controllers', 'reports.controller.js');
let content = fs.readFileSync(file, 'utf8');

const regex = /teamFilter\s*=\s*`\s*AND\s*\(\s*c\.assigned_to\s*=\s*\?\s*OR\s*c\.assigned_to\s*IN\s*\(\s*SELECT\s*DISTINCT\s*tm2\.user_id\s*FROM\s*team_members\s*tm1\s*JOIN\s*team_members\s*tm2\s*ON\s*tm1\.team_id\s*=\s*tm2\.team_id\s*WHERE\s*tm1\.user_id\s*=\s*\?\s*\)\s*\)\s*`;\s*filterParams\.push\(userId,\s*userId\);/g;

const newStr = `teamFilter = \` AND c.assigned_to = ? \`;
      filterParams.push(userId);`;

const match = content.match(regex);
if (match) {
  content = content.replace(regex, newStr);
  fs.writeFileSync(file, content);
  console.log('Replaced ' + match.length + ' occurrences.');
} else {
  console.log('No matches found.');
}
