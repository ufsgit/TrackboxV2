function normalizePhone(phone) {
  if (!phone) return phone;
  const trimmed = String(phone).trim();
  if (/[a-zA-Z]/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.replace(/\D/g, '');
}

module.exports = { normalizePhone };
