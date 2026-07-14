const pool = require('./src/db/pool');

async function test() {
  const [users] = await pool.query('SELECT * FROM users WHERE email="admin" OR role="admin" LIMIT 10');
  console.log("Users:", users);
  const [biz] = await pool.query('SELECT * FROM businesses LIMIT 10');
  console.log("Businesses:", biz);
  process.exit(0);
}
test();
