/**
 * Normalizes a phone number by stripping spaces, symbols, leading + or 0,
 * and extracts the core digits for robust matching across countries (especially 10-digit formats).
 */
function normalizePhone(phone) {
  if (!phone) return '';
  // Convert to string and remove all non-digit characters
  let cleaned = String(phone).replace(/\D/g, '');
  
  // Remove leading zeros
  cleaned = cleaned.replace(/^0+/, '');
  
  return cleaned;
}

/**
 * Extracts standard 10-digit phone number (or clean international digits)
 */
function extractTenDigitPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  // If 12 digits starting with 91, return last 10 digits
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.substring(2);
  }
  // If more than 10 digits, grab last 10 digits
  if (digits.length > 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Generates matching variants (e.g., 10-digit, with 91, or full raw digits)
 * to guarantee an exact match against 10-digit user phone records.
 */
function getPhoneVariants(phone) {
  const cleaned = normalizePhone(phone);
  if (!cleaned) return [];

  const variants = new Set();
  const tenDigit = extractTenDigitPhone(cleaned);

  // Exact 10-digit number (primary match for users table)
  if (tenDigit) {
    variants.add(tenDigit);
    variants.add(`91${tenDigit}`);
    variants.add(`+91${tenDigit}`);
  }
  variants.add(cleaned);

  return Array.from(variants);
}

/**
 * Parses a phone number or WhatsApp JID to extract the 10-digit number and country code.
 */
function parsePhoneAndCountryCode(phone) {
  let cleaned = normalizePhone(phone);
  if (!cleaned) return { phone: '', countryCode: '+91' };

  let countryCode = '+91';
  let tenDigit = cleaned;

  // Handle standard India (+91)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    countryCode = '+91';
    tenDigit = cleaned.substring(2);
  } else if (cleaned.length > 10) {
    // If other country code (e.g. 1 for US, 44 for UK, 971 for UAE)
    tenDigit = cleaned.slice(-10);
    const prefix = cleaned.slice(0, cleaned.length - 10);
    countryCode = prefix ? `+${prefix}` : '+91';
  } else if (cleaned.length === 10) {
    countryCode = '+91';
    tenDigit = cleaned;
  }

  return {
    phone: tenDigit,
    countryCode
  };
}

module.exports = {
  normalizePhone,
  extractTenDigitPhone,
  getPhoneVariants,
  parsePhoneAndCountryCode
};

