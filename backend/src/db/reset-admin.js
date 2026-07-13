const bcrypt = require('bcrypt');
const pool = require('./pool');

async function resetAdmin() {
  try {
    const hash = await bcrypt.hash('123', 10);

    // Delete any existing user with email 'admin'
    await pool.query("DELETE FROM users WHERE email = 'admin'");

    // Update the first user (id=1) to use email 'admin' and password '123'
    await pool.query(
      "UPDATE users SET email = ?, password_hash = ? WHERE id = 1",
      ['admin', hash]
    );

    console.log('✅ Admin user updated successfully!');
    console.log('   Email:    admin');
    console.log('   Password: 123');
    console.log('   (password is bcrypt hashed)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

resetAdmin();
