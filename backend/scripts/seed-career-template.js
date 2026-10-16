const pool = require('../src/db/pool');

async function seed() {
  const name = "Career Counseling & Guidance";
  const body = `Hi {{first_name}},

We are excited to connect with you!

Whether you're looking to upskill, explore new certifications, or kickstart your career with our hands-on industry programs, our team is here to support you at every milestone.

We invite you to schedule a free 1-on-1 counseling session with one of our academic mentors this week to map out the best path forward for your goals.

If you're interested, simply reply to this email with "YES" or share your preferred call time.

Best regards,
Student Admissions & Relations
Trackbox CRM Team`;

  const [existing] = await pool.query('SELECT id FROM templates WHERE name = ?', [name]);
  if (existing.length === 0) {
    const [res] = await pool.query(
      `INSERT INTO templates (business_id, name, category, language, header_type, body, footer, status) 
       VALUES (1, ?, 'MARKETING', 'en', 'none', ?, 'Trackbox CRM', 'approved')`,
      [name, body]
    );
    console.log('Inserted template id:', res.insertId);
  } else {
    await pool.query('UPDATE templates SET body = ? WHERE id = ?', [body, existing[0].id]);
    console.log('Updated existing template id:', existing[0].id);
  }
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
