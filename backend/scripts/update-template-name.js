const pool = require('../src/db/pool');

async function update() {
  await pool.query("UPDATE templates SET name = ? WHERE id = 3", ["{{first_name}}, let's discuss your next career step!"]);
  console.log("Template name set to: {{first_name}}, let's discuss your next career step!");
  process.exit(0);
}

update();
