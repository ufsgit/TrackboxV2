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

module.exports = {
  normalizePhone,
  extractTenDigitPhone,
  getPhoneVariants
};

