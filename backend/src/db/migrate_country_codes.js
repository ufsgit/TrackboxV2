const pool = require('./pool');

const COUNTRIES = [
  // Top / Common destinations first (sort_order 1-20)
  { country_name: 'India', country_code: '+91', iso_code: 'IN', phone_length: 10, flag_emoji: '🇮🇳', is_default: 1, sort_order: 1 },
  { country_name: 'United States', country_code: '+1', iso_code: 'US', phone_length: 10, flag_emoji: '🇺🇸', is_default: 0, sort_order: 2 },
  { country_name: 'United Kingdom', country_code: '+44', iso_code: 'GB', phone_length: 10, flag_emoji: '🇬🇧', is_default: 0, sort_order: 3 },
  { country_name: 'Canada', country_code: '+1', iso_code: 'CA', phone_length: 10, flag_emoji: '🇨🇦', is_default: 0, sort_order: 4 },
  { country_name: 'Australia', country_code: '+61', iso_code: 'AU', phone_length: 9, flag_emoji: '🇦🇺', is_default: 0, sort_order: 5 },
  { country_name: 'New Zealand', country_code: '+64', iso_code: 'NZ', phone_length: 9, flag_emoji: '🇳🇿', is_default: 0, sort_order: 6 },
  { country_name: 'United Arab Emirates', country_code: '+971', iso_code: 'AE', phone_length: 9, flag_emoji: '🇦🇪', is_default: 0, sort_order: 7 },
  { country_name: 'Saudi Arabia', country_code: '+966', iso_code: 'SA', phone_length: 9, flag_emoji: '🇸🇦', is_default: 0, sort_order: 8 },
  { country_name: 'Singapore', country_code: '+65', iso_code: 'SG', phone_length: 8, flag_emoji: '🇸🇬', is_default: 0, sort_order: 9 },
  { country_name: 'Germany', country_code: '+49', iso_code: 'DE', phone_length: 10, flag_emoji: '🇩🇪', is_default: 0, sort_order: 10 },
  { country_name: 'Ireland', country_code: '+353', iso_code: 'IE', phone_length: 9, flag_emoji: '🇮🇪', is_default: 0, sort_order: 11 },
  { country_name: 'Malaysia', country_code: '+60', iso_code: 'MY', phone_length: 10, flag_emoji: '🇲🇾', is_default: 0, sort_order: 12 },
  { country_name: 'Qatar', country_code: '+974', iso_code: 'QA', phone_length: 8, flag_emoji: '🇶🇦', is_default: 0, sort_order: 13 },
  { country_name: 'Kuwait', country_code: '+965', iso_code: 'KW', phone_length: 8, flag_emoji: '🇰🇼', is_default: 0, sort_order: 14 },
  { country_name: 'Oman', country_code: '+968', iso_code: 'OM', phone_length: 8, flag_emoji: '🇴🇲', is_default: 0, sort_order: 15 },
  { country_name: 'Bahrain', country_code: '+973', iso_code: 'BH', phone_length: 8, flag_emoji: '🇧🇭', is_default: 0, sort_order: 16 },

  // All other countries (alphabetical, sort_order: 100)
  { country_name: 'Afghanistan', country_code: '+93', iso_code: 'AF', phone_length: 9, flag_emoji: '🇦🇫', is_default: 0, sort_order: 100 },
  { country_name: 'Albania', country_code: '+355', iso_code: 'AL', phone_length: 9, flag_emoji: '🇦🇱', is_default: 0, sort_order: 100 },
  { country_name: 'Algeria', country_code: '+213', iso_code: 'DZ', phone_length: 9, flag_emoji: '🇩🇿', is_default: 0, sort_order: 100 },
  { country_name: 'Andorra', country_code: '+376', iso_code: 'AD', phone_length: 6, flag_emoji: '🇦🇩', is_default: 0, sort_order: 100 },
  { country_name: 'Angola', country_code: '+244', iso_code: 'AO', phone_length: 9, flag_emoji: '🇦🇴', is_default: 0, sort_order: 100 },
  { country_name: 'Argentina', country_code: '+54', iso_code: 'AR', phone_length: 10, flag_emoji: '🇦🇷', is_default: 0, sort_order: 100 },
  { country_name: 'Armenia', country_code: '+374', iso_code: 'AM', phone_length: 8, flag_emoji: '🇦🇲', is_default: 0, sort_order: 100 },
  { country_name: 'Austria', country_code: '+43', iso_code: 'AT', phone_length: 10, flag_emoji: '🇦🇹', is_default: 0, sort_order: 100 },
  { country_name: 'Azerbaijan', country_code: '+994', iso_code: 'AZ', phone_length: 9, flag_emoji: '🇦🇿', is_default: 0, sort_order: 100 },
  { country_name: 'Bahamas', country_code: '+1-242', iso_code: 'BS', phone_length: 7, flag_emoji: '🇧🇸', is_default: 0, sort_order: 100 },
  { country_name: 'Bangladesh', country_code: '+880', iso_code: 'BD', phone_length: 10, flag_emoji: '🇧🇩', is_default: 0, sort_order: 100 },
  { country_name: 'Barbados', country_code: '+1-246', iso_code: 'BB', phone_length: 7, flag_emoji: '🇧🇧', is_default: 0, sort_order: 100 },
  { country_name: 'Belarus', country_code: '+375', iso_code: 'BY', phone_length: 9, flag_emoji: '🇧🇾', is_default: 0, sort_order: 100 },
  { country_name: 'Belgium', country_code: '+32', iso_code: 'BE', phone_length: 9, flag_emoji: '🇧🇪', is_default: 0, sort_order: 100 },
  { country_name: 'Belize', country_code: '+501', iso_code: 'BZ', phone_length: 7, flag_emoji: '🇧🇿', is_default: 0, sort_order: 100 },
  { country_name: 'Benin', country_code: '+229', iso_code: 'BJ', phone_length: 8, flag_emoji: '🇧🇯', is_default: 0, sort_order: 100 },
  { country_name: 'Bhutan', country_code: '+975', iso_code: 'BT', phone_length: 8, flag_emoji: '🇧🇹', is_default: 0, sort_order: 100 },
  { country_name: 'Bolivia', country_code: '+591', iso_code: 'BO', phone_length: 8, flag_emoji: '🇧🇴', is_default: 0, sort_order: 100 },
  { country_name: 'Bosnia and Herzegovina', country_code: '+387', iso_code: 'BA', phone_length: 8, flag_emoji: '🇧🇦', is_default: 0, sort_order: 100 },
  { country_name: 'Botswana', country_code: '+267', iso_code: 'BW', phone_length: 8, flag_emoji: '🇧🇼', is_default: 0, sort_order: 100 },
  { country_name: 'Brazil', country_code: '+55', iso_code: 'BR', phone_length: 11, flag_emoji: '🇧🇷', is_default: 0, sort_order: 100 },
  { country_name: 'Brunei', country_code: '+673', iso_code: 'BN', phone_length: 7, flag_emoji: '🇧🇳', is_default: 0, sort_order: 100 },
  { country_name: 'Bulgaria', country_code: '+359', iso_code: 'BG', phone_length: 9, flag_emoji: '🇧🇬', is_default: 0, sort_order: 100 },
  { country_name: 'Burkina Faso', country_code: '+226', iso_code: 'BF', phone_length: 8, flag_emoji: '🇧🇫', is_default: 0, sort_order: 100 },
  { country_name: 'Burundi', country_code: '+257', iso_code: 'BI', phone_length: 8, flag_emoji: '🇧🇮', is_default: 0, sort_order: 100 },
  { country_name: 'Cambodia', country_code: '+855', iso_code: 'KH', phone_length: 9, flag_emoji: '🇰🇭', is_default: 0, sort_order: 100 },
  { country_name: 'Cameroon', country_code: '+237', iso_code: 'CM', phone_length: 9, flag_emoji: '🇨🇲', is_default: 0, sort_order: 100 },
  { country_name: 'Chile', country_code: '+56', iso_code: 'CL', phone_length: 9, flag_emoji: '🇨🇱', is_default: 0, sort_order: 100 },
  { country_name: 'China', country_code: '+86', iso_code: 'CN', phone_length: 11, flag_emoji: '🇨🇳', is_default: 0, sort_order: 100 },
  { country_name: 'Colombia', country_code: '+57', iso_code: 'CO', phone_length: 10, flag_emoji: '🇨🇴', is_default: 0, sort_order: 100 },
  { country_name: 'Congo', country_code: '+242', iso_code: 'CG', phone_length: 9, flag_emoji: '🇨🇬', is_default: 0, sort_order: 100 },
  { country_name: 'Costa Rica', country_code: '+506', iso_code: 'CR', phone_length: 8, flag_emoji: '🇨🇷', is_default: 0, sort_order: 100 },
  { country_name: 'Croatia', country_code: '+385', iso_code: 'HR', phone_length: 9, flag_emoji: '🇭🇷', is_default: 0, sort_order: 100 },
  { country_name: 'Cuba', country_code: '+53', iso_code: 'CU', phone_length: 8, flag_emoji: '🇨🇺', is_default: 0, sort_order: 100 },
  { country_name: 'Cyprus', country_code: '+357', iso_code: 'CY', phone_length: 8, flag_emoji: '🇨🇾', is_default: 0, sort_order: 100 },
  { country_name: 'Czech Republic', country_code: '+420', iso_code: 'CZ', phone_length: 9, flag_emoji: '🇨🇿', is_default: 0, sort_order: 100 },
  { country_name: 'Denmark', country_code: '+45', iso_code: 'DK', phone_length: 8, flag_emoji: '🇩🇰', is_default: 0, sort_order: 100 },
  { country_name: 'Djibouti', country_code: '+253', iso_code: 'DJ', phone_length: 8, flag_emoji: '🇩🇯', is_default: 0, sort_order: 100 },
  { country_name: 'Ecuador', country_code: '+593', iso_code: 'EC', phone_length: 9, flag_emoji: '🇪🇨', is_default: 0, sort_order: 100 },
  { country_name: 'Egypt', country_code: '+20', iso_code: 'EG', phone_length: 10, flag_emoji: '🇪🇬', is_default: 0, sort_order: 100 },
  { country_name: 'El Salvador', country_code: '+503', iso_code: 'SV', phone_length: 8, flag_emoji: '🇸🇻', is_default: 0, sort_order: 100 },
  { country_name: 'Estonia', country_code: '+372', iso_code: 'EE', phone_length: 8, flag_emoji: '🇪🇪', is_default: 0, sort_order: 100 },
  { country_name: 'Ethiopia', country_code: '+251', iso_code: 'ET', phone_length: 9, flag_emoji: '🇪🇹', is_default: 0, sort_order: 100 },
  { country_name: 'Fiji', country_code: '+679', iso_code: 'FJ', phone_length: 7, flag_emoji: '🇫🇯', is_default: 0, sort_order: 100 },
  { country_name: 'Finland', country_code: '+358', iso_code: 'FI', phone_length: 9, flag_emoji: '🇫🇮', is_default: 0, sort_order: 100 },
  { country_name: 'France', country_code: '+33', iso_code: 'FR', phone_length: 9, flag_emoji: '🇫🇷', is_default: 0, sort_order: 100 },
  { country_name: 'Georgia', country_code: '+995', iso_code: 'GE', phone_length: 9, flag_emoji: '🇬🇪', is_default: 0, sort_order: 100 },
  { country_name: 'Ghana', country_code: '+233', iso_code: 'GH', phone_length: 9, flag_emoji: '🇬🇭', is_default: 0, sort_order: 100 },
  { country_name: 'Greece', country_code: '+30', iso_code: 'GR', phone_length: 10, flag_emoji: '🇬🇷', is_default: 0, sort_order: 100 },
  { country_name: 'Guatemala', country_code: '+502', iso_code: 'GT', phone_length: 8, flag_emoji: '🇬🇹', is_default: 0, sort_order: 100 },
  { country_name: 'Hong Kong', country_code: '+852', iso_code: 'HK', phone_length: 8, flag_emoji: '🇭🇰', is_default: 0, sort_order: 100 },
  { country_name: 'Hungary', country_code: '+36', iso_code: 'HU', phone_length: 9, flag_emoji: '🇭🇺', is_default: 0, sort_order: 100 },
  { country_name: 'Iceland', country_code: '+354', iso_code: 'IS', phone_length: 7, flag_emoji: '🇮🇸', is_default: 0, sort_order: 100 },
  { country_name: 'Indonesia', country_code: '+62', iso_code: 'ID', phone_length: 10, flag_emoji: '🇮🇩', is_default: 0, sort_order: 100 },
  { country_name: 'Iran', country_code: '+98', iso_code: 'IR', phone_length: 10, flag_emoji: '🇮🇷', is_default: 0, sort_order: 100 },
  { country_name: 'Iraq', country_code: '+964', iso_code: 'IQ', phone_length: 10, flag_emoji: '🇮🇶', is_default: 0, sort_order: 100 },
  { country_name: 'Israel', country_code: '+972', iso_code: 'IL', phone_length: 9, flag_emoji: '🇮🇱', is_default: 0, sort_order: 100 },
  { country_name: 'Italy', country_code: '+39', iso_code: 'IT', phone_length: 10, flag_emoji: '🇮🇹', is_default: 0, sort_order: 100 },
  { country_name: 'Jamaica', country_code: '+1-876', iso_code: 'JM', phone_length: 7, flag_emoji: '🇯🇲', is_default: 0, sort_order: 100 },
  { country_name: 'Japan', country_code: '+81', iso_code: 'JP', phone_length: 10, flag_emoji: '🇯🇵', is_default: 0, sort_order: 100 },
  { country_name: 'Jordan', country_code: '+962', iso_code: 'JO', phone_length: 9, flag_emoji: '🇯🇴', is_default: 0, sort_order: 100 },
  { country_name: 'Kazakhstan', country_code: '+7', iso_code: 'KZ', phone_length: 10, flag_emoji: '🇰🇿', is_default: 0, sort_order: 100 },
  { country_name: 'Kenya', country_code: '+254', iso_code: 'KE', phone_length: 9, flag_emoji: '🇰🇪', is_default: 0, sort_order: 100 },
  { country_name: 'Lebanon', country_code: '+961', iso_code: 'LB', phone_length: 8, flag_emoji: '🇱🇧', is_default: 0, sort_order: 100 },
  { country_name: 'Libya', country_code: '+218', iso_code: 'LY', phone_length: 9, flag_emoji: '🇱🇾', is_default: 0, sort_order: 100 },
  { country_name: 'Luxembourg', country_code: '+352', iso_code: 'LU', phone_length: 9, flag_emoji: '🇱🇺', is_default: 0, sort_order: 100 },
  { country_name: 'Maldives', country_code: '+960', iso_code: 'MV', phone_length: 7, flag_emoji: '🇲🇻', is_default: 0, sort_order: 100 },
  { country_name: 'Mauritius', country_code: '+230', iso_code: 'MU', phone_length: 8, flag_emoji: '🇲🇺', is_default: 0, sort_order: 100 },
  { country_name: 'Mexico', country_code: '+52', iso_code: 'MX', phone_length: 10, flag_emoji: '🇲🇽', is_default: 0, sort_order: 100 },
  { country_name: 'Monaco', country_code: '+377', iso_code: 'MC', phone_length: 8, flag_emoji: '🇲🇨', is_default: 0, sort_order: 100 },
  { country_name: 'Mongolia', country_code: '+976', iso_code: 'MN', phone_length: 8, flag_emoji: '🇲🇳', is_default: 0, sort_order: 100 },
  { country_name: 'Morocco', country_code: '+212', iso_code: 'MA', phone_length: 9, flag_emoji: '🇲🇦', is_default: 0, sort_order: 100 },
  { country_name: 'Myanmar', country_code: '+95', iso_code: 'MM', phone_length: 9, flag_emoji: '🇲🇲', is_default: 0, sort_order: 100 },
  { country_name: 'Nepal', country_code: '+977', iso_code: 'NP', phone_length: 10, flag_emoji: '🇳🇵', is_default: 0, sort_order: 100 },
  { country_name: 'Netherlands', country_code: '+31', iso_code: 'NL', phone_length: 9, flag_emoji: '🇳🇱', is_default: 0, sort_order: 100 },
  { country_name: 'Nigeria', country_code: '+234', iso_code: 'NG', phone_length: 10, flag_emoji: '🇳🇬', is_default: 0, sort_order: 100 },
  { country_name: 'Norway', country_code: '+47', iso_code: 'NO', phone_length: 8, flag_emoji: '🇳🇴', is_default: 0, sort_order: 100 },
  { country_name: 'Pakistan', country_code: '+92', iso_code: 'PK', phone_length: 10, flag_emoji: '🇵🇰', is_default: 0, sort_order: 100 },
  { country_name: 'Panama', country_code: '+507', iso_code: 'PA', phone_length: 8, flag_emoji: '🇵🇦', is_default: 0, sort_order: 100 },
  { country_name: 'Peru', country_code: '+51', iso_code: 'PE', phone_length: 9, flag_emoji: '🇵🇪', is_default: 0, sort_order: 100 },
  { country_name: 'Philippines', country_code: '+63', iso_code: 'PH', phone_length: 10, flag_emoji: '🇵🇭', is_default: 0, sort_order: 100 },
  { country_name: 'Poland', country_code: '+48', iso_code: 'PL', phone_length: 9, flag_emoji: '🇵🇱', is_default: 0, sort_order: 100 },
  { country_name: 'Portugal', country_code: '+351', iso_code: 'PT', phone_length: 9, flag_emoji: '🇵🇹', is_default: 0, sort_order: 100 },
  { country_name: 'Romania', country_code: '+40', iso_code: 'RO', phone_length: 10, flag_emoji: '🇷🇴', is_default: 0, sort_order: 100 },
  { country_name: 'Russia', country_code: '+7', iso_code: 'RU', phone_length: 10, flag_emoji: '🇷🇺', is_default: 0, sort_order: 100 },
  { country_name: 'Rwanda', country_code: '+250', iso_code: 'RW', phone_length: 9, flag_emoji: '🇷🇼', is_default: 0, sort_order: 100 },
  { country_name: 'Serbia', country_code: '+381', iso_code: 'RS', phone_length: 9, flag_emoji: '🇷🇸', is_default: 0, sort_order: 100 },
  { country_name: 'South Africa', country_code: '+27', iso_code: 'ZA', phone_length: 9, flag_emoji: '🇿🇦', is_default: 0, sort_order: 100 },
  { country_name: 'South Korea', country_code: '+82', iso_code: 'KR', phone_length: 10, flag_emoji: '🇰🇷', is_default: 0, sort_order: 100 },
  { country_name: 'Spain', country_code: '+34', iso_code: 'ES', phone_length: 9, flag_emoji: '🇪🇸', is_default: 0, sort_order: 100 },
  { country_name: 'Sri Lanka', country_code: '+94', iso_code: 'LK', phone_length: 9, flag_emoji: '🇱🇰', is_default: 0, sort_order: 100 },
  { country_name: 'Sweden', country_code: '+46', iso_code: 'SE', phone_length: 9, flag_emoji: '🇸🇪', is_default: 0, sort_order: 100 },
  { country_name: 'Switzerland', country_code: '+41', iso_code: 'CH', phone_length: 9, flag_emoji: '🇨🇭', is_default: 0, sort_order: 100 },
  { country_name: 'Taiwan', country_code: '+886', iso_code: 'TW', phone_length: 9, flag_emoji: '🇹🇼', is_default: 0, sort_order: 100 },
  { country_name: 'Tanzania', country_code: '+255', iso_code: 'TZ', phone_length: 9, flag_emoji: '🇹🇿', is_default: 0, sort_order: 100 },
  { country_name: 'Thailand', country_code: '+66', iso_code: 'TH', phone_length: 9, flag_emoji: '🇹🇭', is_default: 0, sort_order: 100 },
  { country_name: 'Turkey', country_code: '+90', iso_code: 'TR', phone_length: 10, flag_emoji: '🇹🇷', is_default: 0, sort_order: 100 },
  { country_name: 'Uganda', country_code: '+256', iso_code: 'UG', phone_length: 9, flag_emoji: '🇺🇬', is_default: 0, sort_order: 100 },
  { country_name: 'Ukraine', country_code: '+380', iso_code: 'UA', phone_length: 9, flag_emoji: '🇺🇦', is_default: 0, sort_order: 100 },
  { country_name: 'Uruguay', country_code: '+598', iso_code: 'UY', phone_length: 8, flag_emoji: '🇺🇾', is_default: 0, sort_order: 100 },
  { country_name: 'Uzbekistan', country_code: '+998', iso_code: 'UZ', phone_length: 9, flag_emoji: '🇺🇿', is_default: 0, sort_order: 100 },
  { country_name: 'Venezuela', country_code: '+58', iso_code: 'VE', phone_length: 10, flag_emoji: '🇻🇪', is_default: 0, sort_order: 100 },
  { country_name: 'Vietnam', country_code: '+84', iso_code: 'VN', phone_length: 10, flag_emoji: '🇻🇳', is_default: 0, sort_order: 100 },
  { country_name: 'Yemen', country_code: '+967', iso_code: 'YE', phone_length: 9, flag_emoji: '🇾🇪', is_default: 0, sort_order: 100 },
  { country_name: 'Zambia', country_code: '+260', iso_code: 'ZM', phone_length: 9, flag_emoji: '🇿🇲', is_default: 0, sort_order: 100 },
  { country_name: 'Zimbabwe', country_code: '+263', iso_code: 'ZW', phone_length: 9, flag_emoji: '🇿🇼', is_default: 0, sort_order: 100 }
];

async function migrate() {
  console.log('[Migration] Creating country_codes table...');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS country_codes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      country_name VARCHAR(100) NOT NULL,
      country_code VARCHAR(10) NOT NULL,
      iso_code VARCHAR(5) NOT NULL,
      phone_length INT DEFAULT 10,
      min_length INT DEFAULT 7,
      max_length INT DEFAULT 15,
      flag_emoji VARCHAR(10) DEFAULT '',
      is_default TINYINT(1) DEFAULT 0,
      sort_order INT DEFAULT 100,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_country_iso (country_name, iso_code),
      INDEX idx_code (country_code),
      INDEX idx_iso (iso_code),
      INDEX idx_sort (sort_order, country_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  console.log('[Migration] Checking country_code column in contacts table...');
  try {
    const [cols] = await pool.query("SHOW COLUMNS FROM contacts LIKE 'country_code'");
    if (cols.length === 0) {
      await pool.query("ALTER TABLE contacts ADD COLUMN country_code VARCHAR(10) DEFAULT '+91' AFTER phone");
      console.log('[Migration] Added country_code column to contacts table.');
    } else {
      console.log('[Migration] contacts.country_code already exists.');
    }
  } catch (err) {
    console.error('[Migration] Error checking contacts column:', err.message);
  }

  console.log('[Migration] Seeding country codes...');
  for (const c of COUNTRIES) {
    await pool.query(`
      INSERT INTO country_codes (country_name, country_code, iso_code, phone_length, flag_emoji, is_default, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        country_code = VALUES(country_code),
        phone_length = VALUES(phone_length),
        flag_emoji = VALUES(flag_emoji),
        is_default = VALUES(is_default),
        sort_order = VALUES(sort_order)
    `, [c.country_name, c.country_code, c.iso_code, c.phone_length, c.flag_emoji, c.is_default, c.sort_order]);
  }

  const [[count]] = await pool.query('SELECT COUNT(*) as total FROM country_codes');
  console.log(`[Migration] Completed successfully. Total country codes available: ${count.total}`);
  process.exit(0);
}

migrate().catch(err => {
  console.error('[Migration] Failed:', err);
  process.exit(1);
});

